import { useCallback, useRef } from "react";

import { useBackend } from "@/backend/BackendProvider";
import type { AuthStatus } from "@/domain/auth";
import { useSubscription } from "@/lib/useSubscription";

export interface YouTubeAccountController {
  readonly status: AuthStatus;
  readonly connect: () => void;
  readonly cancel: () => void;
  readonly disconnect: () => void;
}

/** Subscribes to the backend's auth status and exposes connect/cancel/disconnect intents. */
export function useYouTubeAccount(): YouTubeAccountController {
  const backend = useBackend();

  const getSnapshot = useCallback(() => backend.auth.getStatus(), [backend]);
  const subscribe = useCallback(
    (listener: (status: AuthStatus) => void) => backend.auth.subscribe(listener),
    [backend],
  );
  const state = useSubscription(getSnapshot, subscribe);

  const pendingSignIn = useRef<AbortController | null>(null);

  const connect = useCallback(() => {
    const controller = new AbortController();
    pendingSignIn.current = controller;
    backend.auth.signIn(controller.signal).catch(() => {
      // A cancelled or failed sign-in is reflected back through the auth
      // status stream (signedOut / error) — nothing further to do here.
    });
  }, [backend]);

  const cancel = useCallback(() => {
    pendingSignIn.current?.abort();
  }, []);

  const disconnect = useCallback(() => {
    backend.auth.disconnect().catch(() => {
      // Disconnect failures surface through the status stream too.
    });
  }, [backend]);

  const status: AuthStatus =
    state.status === "success"
      ? state.data
      : state.status === "error"
        ? { type: "error", message: "Could not load account status." }
        : { type: "signedOut" };

  return { status, connect, cancel, disconnect };
}
