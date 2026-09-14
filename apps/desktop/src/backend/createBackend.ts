import type { Backend } from "@/backend/Backend";
import { createMockBackend } from "@/backend/mock/MockBackend";
import { createTauriBackend } from "@/backend/tauri/TauriBackend";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

function isRunningInTauri(): boolean {
  return typeof window !== "undefined" && window.__TAURI_INTERNALS__ !== undefined;
}

/**
 * Selects the real Tauri-backed implementation when running inside the
 * desktop shell, and a realistic in-memory mock everywhere else (e.g.
 * `pnpm dev` in a plain browser, tests).
 */
export function createBackend(): Backend {
  return isRunningInTauri() ? createTauriBackend() : createMockBackend();
}
