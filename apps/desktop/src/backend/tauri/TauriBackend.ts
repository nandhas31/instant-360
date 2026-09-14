import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import type { AuthApi, Backend, MediaApi, Unsubscribe } from "@/backend/Backend";
import { Commands, Events } from "@/backend/tauri/commands";
import type { AuthStatus } from "@/domain/auth";
import type { Clip, ClipThumbnail, Volume } from "@/domain/media";

function createTauriAuthApi(): AuthApi {
  return {
    getStatus: () => invoke<AuthStatus>(Commands.authStatus),

    signIn: (signal) =>
      new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
          reject(new DOMException("Sign-in cancelled", "AbortError"));
          return;
        }

        // The Rust side does not yet expose a cancel command; aborting here
        // only stops the UI from waiting on the result. The OAuth flow may
        // still complete in the background and will surface via the
        // auth://changed event.
        signal.addEventListener(
          "abort",
          () => {
            reject(new DOMException("Sign-in cancelled", "AbortError"));
          },
          { once: true },
        );

        invoke(Commands.authSignIn).then(() => {
          resolve();
        }, reject);
      }),

    disconnect: async () => {
      await invoke(Commands.authDisconnect);
    },

    subscribe: (listener): Unsubscribe => {
      const unlistenPromise = listen<AuthStatus>(Events.authChanged, (event) => {
        listener(event.payload);
      });
      return () => {
        void unlistenPromise.then((unlisten) => {
          unlisten();
        });
      };
    },
  };
}

function createTauriMediaApi(): MediaApi {
  return {
    listVolumes: () => invoke<ReadonlyArray<Volume>>(Commands.mediaListVolumes),

    subscribeVolumes: (listener): Unsubscribe => {
      const unlistenPromise = listen<ReadonlyArray<Volume>>(Events.volumesChanged, (event) => {
        listener(event.payload);
      });
      return () => {
        void unlistenPromise.then((unlisten) => {
          unlisten();
        });
      };
    },

    scanVolume: (volumeId) =>
      invoke<ReadonlyArray<Clip>>(Commands.mediaScanVolume, { volumeId }),

    addFolder: () => invoke<Volume | null>(Commands.mediaAddFolder),

    getThumbnail: (clipId) => invoke<ClipThumbnail>(Commands.mediaThumbnail, { clipId }),
  };
}

export function createTauriBackend(): Backend {
  return {
    auth: createTauriAuthApi(),
    media: createTauriMediaApi(),
  };
}
