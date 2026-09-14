import { useEffect, useState } from "react";

import type { AsyncState } from "@/lib/useAsync";

type Unsubscribe = () => void;

/**
 * Combines an initial async snapshot with a live push subscription — the
 * shape shared by `AuthApi` (getStatus + subscribe) and `MediaApi.
 * subscribeVolumes` (listVolumes + subscribeVolumes). Both `getSnapshot`
 * and `subscribe` must be stable (memoized) across renders, since they
 * drive the effect's dependency list.
 */
export function useSubscription<T>(
  getSnapshot: () => Promise<T>,
  subscribe: (listener: (value: T) => void) => Unsubscribe,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    let active = true;
    // A push update always wins over the pending initial fetch resolving
    // late, since it reflects a more recent state.
    let snapshotSuperseded = false;
    setState({ status: "loading" });

    getSnapshot().then(
      (data) => {
        if (active && !snapshotSuperseded) setState({ status: "success", data });
      },
      (error: unknown) => {
        if (active && !snapshotSuperseded) setState({ status: "error", error });
      },
    );

    const unsubscribe = subscribe((value) => {
      snapshotSuperseded = true;
      if (active) setState({ status: "success", data: value });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [getSnapshot, subscribe]);

  return state;
}
