import { useEffect, useState } from "react";

export type AsyncState<T> =
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly data: T }
  | { readonly status: "error"; readonly error: unknown };

/**
 * Runs an abortable async task and tracks its result. Re-runs whenever
 * `task` changes identity, so callers must pass a memoized function (e.g.
 * via `useCallback`) — that single dependency is what lets this hook's
 * effect list stay exhaustive without duplicating fetch/cancel logic at
 * every call site.
 */
export function useAsync<T>(task: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    task(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: "success", data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", error });
      },
    );

    return () => {
      controller.abort();
    };
  }, [task]);

  return state;
}
