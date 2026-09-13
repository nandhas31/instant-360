import { useCallback } from "react";

import { useBackend } from "@/backend/BackendProvider";
import type { Volume } from "@/domain/media";
import type { AsyncState } from "@/lib/useAsync";
import { useSubscription } from "@/lib/useSubscription";

/** Detected SD cards and added folders, kept live via the backend's volume-change events. */
export function useVolumes(): AsyncState<ReadonlyArray<Volume>> {
  const backend = useBackend();

  const getSnapshot = useCallback(() => backend.media.listVolumes(), [backend]);
  const subscribe = useCallback(
    (listener: (volumes: ReadonlyArray<Volume>) => void) => backend.media.subscribeVolumes(listener),
    [backend],
  );

  return useSubscription(getSnapshot, subscribe);
}
