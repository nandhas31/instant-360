import { useCallback } from "react";

import { useBackend } from "@/backend/BackendProvider";
import type { ClipThumbnail } from "@/domain/media";
import type { AsyncState } from "@/lib/useAsync";
import { useAsync } from "@/lib/useAsync";

/** The thumbnail for the selected clip. `null` clipId resolves to no thumbnail. */
export function useThumbnail(clipId: string | null): AsyncState<ClipThumbnail | null> {
  const backend = useBackend();

  const task = useCallback(
    async (): Promise<ClipThumbnail | null> =>
      clipId ? backend.media.getThumbnail(clipId) : null,
    [backend, clipId],
  );

  return useAsync(task);
}
