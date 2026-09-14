import { useCallback } from "react";

import { useBackend } from "@/backend/BackendProvider";
import type { Clip } from "@/domain/media";
import type { AsyncState } from "@/lib/useAsync";
import { useAsync } from "@/lib/useAsync";

/** Clips found on the selected volume. `null` volumeId resolves to an empty list. */
export function useClips(volumeId: string | null): AsyncState<ReadonlyArray<Clip>> {
  const backend = useBackend();

  const task = useCallback(
    async (): Promise<ReadonlyArray<Clip>> => (volumeId ? backend.media.scanVolume(volumeId) : []),
    [backend, volumeId],
  );

  return useAsync(task);
}
