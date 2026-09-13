import type { AuthStatus } from "@/domain/auth";
import type { Clip, ClipThumbnail, Volume } from "@/domain/media";

export type Unsubscribe = () => void;

/**
 * The YouTube account connection. The UI never sees tokens or scopes — only
 * a status it renders and intents it can send.
 */
export interface AuthApi {
  getStatus: () => Promise<AuthStatus>;
  /**
   * Starts the OAuth flow. Resolves once signed in (or rejects/aborts).
   * `signal` lets the caller cancel a pending sign-in.
   */
  signIn: (signal: AbortSignal) => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (listener: (status: AuthStatus) => void) => Unsubscribe;
}

/**
 * Media discovery and inspection. The UI never touches the filesystem
 * directly — it lists volumes and clips through this port.
 */
export interface MediaApi {
  listVolumes: () => Promise<ReadonlyArray<Volume>>;
  subscribeVolumes: (listener: (volumes: ReadonlyArray<Volume>) => void) => Unsubscribe;
  scanVolume: (volumeId: string) => Promise<ReadonlyArray<Clip>>;
  /** Opens a native folder picker and returns the resulting volume, if any. */
  addFolder: () => Promise<Volume | null>;
  getThumbnail: (clipId: string) => Promise<ClipThumbnail>;
}

/**
 * The single port the UI depends on. Concrete adapters (mock, Tauri) live
 * under `backend/mock` and `backend/tauri`.
 */
export interface Backend {
  readonly auth: AuthApi;
  readonly media: MediaApi;
}
