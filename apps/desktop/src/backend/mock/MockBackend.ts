import type { AuthApi, Backend, MediaApi, Unsubscribe } from "@/backend/Backend";
import { CLIPS, SD_CARD_VOLUME } from "@/backend/mock/fixtures";
import {
  generateDualFisheyePlaceholder,
  generateFlatPlaceholder,
} from "@/backend/mock/fisheyePlaceholder";
import type { AuthStatus, ConnectedAccount } from "@/domain/auth";
import type { Clip, ClipThumbnail, Volume } from "@/domain/media";

const SIGN_IN_LATENCY_MS = 1100;
const NETWORK_LATENCY_MS = 220;
const SD_CARD_INSERT_DELAY_MS = 900;
// Google's OAuth testing-mode consent screen issues tokens that expire after
// a short window until the app is verified. Simulated here on a much
// shorter timer so the "Reconnect" state is reachable in a demo/test run.
const REAUTH_DEMO_DELAY_MS = 45_000;

const MOCK_ACCOUNT: ConnectedAccount = {
  email: "creator@example.com",
  displayName: "Alex Rivera",
};

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function createMockAuthApi(): AuthApi {
  let status: AuthStatus = { type: "signedOut" };
  const listeners = new Set<(status: AuthStatus) => void>();
  let reauthTimer: ReturnType<typeof setTimeout> | null = null;

  function clearReauthTimer(): void {
    if (reauthTimer !== null) {
      clearTimeout(reauthTimer);
      reauthTimer = null;
    }
  }

  function setStatus(next: AuthStatus): void {
    status = next;
    for (const listener of listeners) listener(status);
  }

  return {
    getStatus: () => Promise.resolve(status),

    signIn: async (signal) => {
      setStatus({ type: "connecting" });
      try {
        await delay(SIGN_IN_LATENCY_MS, signal);
        setStatus({ type: "signedIn", account: MOCK_ACCOUNT });
        clearReauthTimer();
        reauthTimer = setTimeout(() => {
          setStatus({ type: "reauthRequired", account: MOCK_ACCOUNT });
        }, REAUTH_DEMO_DELAY_MS);
      } catch (error) {
        setStatus({ type: "signedOut" });
        throw error;
      }
    },

    disconnect: async () => {
      clearReauthTimer();
      await delay(NETWORK_LATENCY_MS);
      setStatus({ type: "signedOut" });
    },

    subscribe: (listener): Unsubscribe => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function createMockMediaApi(): MediaApi {
  let volumes: ReadonlyArray<Volume> = [];
  const volumeListeners = new Set<(volumes: ReadonlyArray<Volume>) => void>();
  const clipsByVolume = new Map<string, ReadonlyArray<Clip>>([[SD_CARD_VOLUME.id, CLIPS]]);
  const thumbnailCache = new Map<string, ClipThumbnail>();

  function setVolumes(next: ReadonlyArray<Volume>): void {
    volumes = next;
    for (const listener of volumeListeners) listener(volumes);
  }

  // Simulates a user inserting an SD card shortly after the app starts, so
  // the sidebar's "Insert an SD card" empty state is visible briefly first.
  setTimeout(() => {
    setVolumes([...volumes, SD_CARD_VOLUME]);
  }, SD_CARD_INSERT_DELAY_MS);

  return {
    listVolumes: async () => {
      await delay(NETWORK_LATENCY_MS);
      return volumes;
    },

    subscribeVolumes: (listener): Unsubscribe => {
      volumeListeners.add(listener);
      return () => {
        volumeListeners.delete(listener);
      };
    },

    scanVolume: async (volumeId) => {
      await delay(NETWORK_LATENCY_MS * 2);
      return clipsByVolume.get(volumeId) ?? [];
    },

    addFolder: async () => {
      await delay(NETWORK_LATENCY_MS);
      const folder: Volume = {
        id: `vol-folder-${(volumes.length + 1).toString()}`,
        label: "Imported Footage",
        kind: "folder",
        path: "/Users/creator/Movies/Insta360 Imports",
      };
      clipsByVolume.set(folder.id, []);
      setVolumes([...volumes, folder]);
      return folder;
    },

    getThumbnail: async (clipId) => {
      const cached = thumbnailCache.get(clipId);
      if (cached) return cached;

      await delay(NETWORK_LATENCY_MS);

      const clip = CLIPS.find((candidate) => candidate.id === clipId);
      if (!clip) {
        throw new Error(`Unknown clip: ${clipId}`);
      }

      const thumbnail: ClipThumbnail =
        clip.kind === "360"
          ? {
              clipId,
              dataUrl: await generateDualFisheyePlaceholder(clipId),
              projection: { type: "dualFisheye", layout: "sideBySide", lensFovDeg: 200 },
            }
          : {
              clipId,
              dataUrl: await generateFlatPlaceholder(clipId),
              projection: { type: "flat" },
            };

      thumbnailCache.set(clipId, thumbnail);
      return thumbnail;
    },
  };
}

export function createMockBackend(): Backend {
  return {
    auth: createMockAuthApi(),
    media: createMockMediaApi(),
  };
}
