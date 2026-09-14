import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BackendProvider } from "@/backend/BackendProvider";
import { createMockBackend } from "@/backend/mock/MockBackend";
import { useYouTubeAccount } from "@/features/youtube-account/useYouTubeAccount";

function renderWithBackend() {
  const backend = createMockBackend();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BackendProvider backend={backend}>{children}</BackendProvider>
  );
  return renderHook(() => useYouTubeAccount(), { wrapper });
}

// The initial auth status resolves via a microtask (not a timer), so with
// fake timers active we flush it directly rather than polling with
// `waitFor` (which relies on real timers and would hang).
async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useYouTubeAccount", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts signed out", async () => {
    const { result } = renderWithBackend();
    await flushMicrotasks();
    expect(result.current.status).toEqual({ type: "signedOut" });
  });

  it("transitions connecting -> signedIn on connect", async () => {
    const { result } = renderWithBackend();
    await flushMicrotasks();
    expect(result.current.status.type).toBe("signedOut");

    act(() => {
      result.current.connect();
    });
    expect(result.current.status.type).toBe("connecting");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(result.current.status).toEqual({
      type: "signedIn",
      account: { email: "creator@example.com", displayName: "Alex Rivera" },
    });
  });

  it("returns to signedOut when a pending sign-in is cancelled", async () => {
    const { result } = renderWithBackend();
    await flushMicrotasks();
    expect(result.current.status.type).toBe("signedOut");

    act(() => {
      result.current.connect();
    });
    expect(result.current.status.type).toBe("connecting");

    act(() => {
      result.current.cancel();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(result.current.status).toEqual({ type: "signedOut" });
  });

  it("disconnects a signed-in account", async () => {
    const { result } = renderWithBackend();
    await flushMicrotasks();
    expect(result.current.status.type).toBe("signedOut");

    act(() => {
      result.current.connect();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(result.current.status.type).toBe("signedIn");

    act(() => {
      result.current.disconnect();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.status).toEqual({ type: "signedOut" });
  });

  it("moves to reauthRequired after the simulated token expiry", async () => {
    const { result } = renderWithBackend();
    await flushMicrotasks();
    expect(result.current.status.type).toBe("signedOut");

    act(() => {
      result.current.connect();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(result.current.status.type).toBe("signedIn");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });

    expect(result.current.status).toEqual({
      type: "reauthRequired",
      account: { email: "creator@example.com", displayName: "Alex Rivera" },
    });
  });
});
