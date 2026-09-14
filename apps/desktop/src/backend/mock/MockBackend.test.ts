import { describe, expect, it } from "vitest";

import { createMockBackend } from "@/backend/mock/MockBackend";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("MockBackend contract", () => {
  it("starts signed out", async () => {
    const backend = createMockBackend();
    await expect(backend.auth.getStatus()).resolves.toEqual({ type: "signedOut" });
  });

  it("starts with no volumes, then reports the SD card after the simulated insert", async () => {
    const backend = createMockBackend();
    await expect(backend.media.listVolumes()).resolves.toEqual([]);

    await wait(1000);

    const volumes = await backend.media.listVolumes();
    expect(volumes).toHaveLength(1);
    expect(volumes[0]?.kind).toBe("sdCard");
  });

  it("notifies volume subscribers when the SD card is inserted", async () => {
    const backend = createMockBackend();
    const seen: string[][] = [];
    const unsubscribe = backend.media.subscribeVolumes((volumes) => {
      seen.push(volumes.map((v) => v.id));
    });

    await wait(1000);

    expect(seen.length).toBeGreaterThan(0);
    expect(seen[seen.length - 1]).toHaveLength(1);
    unsubscribe();
  });

  it("scans the SD card volume and returns fixture clips covering every kind and status", async () => {
    const backend = createMockBackend();
    await wait(1000);
    const volumes = await backend.media.listVolumes();
    const sdCard = volumes[0];
    if (!sdCard) throw new Error("expected the simulated SD card volume to exist");

    const clips = await backend.media.scanVolume(sdCard.id);
    expect(clips.length).toBeGreaterThan(0);
    expect(clips.some((clip) => clip.kind === "360")).toBe(true);
    expect(clips.some((clip) => clip.kind === "flat")).toBe(true);
    expect(clips.some((clip) => clip.segments.length > 1)).toBe(true);
    expect(clips.some((clip) => clip.status === "needsRepair")).toBe(true);
  });

  it("returns an empty clip list for an unknown volume id", async () => {
    const backend = createMockBackend();
    await expect(backend.media.scanVolume("does-not-exist")).resolves.toEqual([]);
  });

  it("adds a folder volume and includes it in subsequent listVolumes calls", async () => {
    const backend = createMockBackend();
    const folder = await backend.media.addFolder();
    expect(folder?.kind).toBe("folder");

    const volumes = await backend.media.listVolumes();
    expect(volumes.some((v) => v.id === folder?.id)).toBe(true);
  });

  it("produces a thumbnail with a projection matching the clip's kind", async () => {
    const backend = createMockBackend();
    await wait(1000);
    const volumes = await backend.media.listVolumes();
    const sdCard = volumes[0];
    if (!sdCard) throw new Error("expected the simulated SD card volume to exist");
    const clips = await backend.media.scanVolume(sdCard.id);

    const rawClip = clips.find((clip) => clip.kind === "360");
    const flatClip = clips.find((clip) => clip.kind === "flat");
    if (!rawClip) throw new Error("expected a 360 fixture clip");
    if (!flatClip) throw new Error("expected a flat fixture clip");

    const rawThumb = await backend.media.getThumbnail(rawClip.id);
    expect(rawThumb.projection.type).toBe("dualFisheye");
    expect(rawThumb.dataUrl).toMatch(/^data:image\//);

    const flatThumb = await backend.media.getThumbnail(flatClip.id);
    expect(flatThumb.projection.type).toBe("flat");
  }, 10_000);

  it("signs in and out through the auth API", async () => {
    const backend = createMockBackend();
    const signInPromise = backend.auth.signIn(new AbortController().signal);
    expect((await backend.auth.getStatus()).type).toBe("connecting");

    await signInPromise;
    expect((await backend.auth.getStatus()).type).toBe("signedIn");

    await backend.auth.disconnect();
    expect((await backend.auth.getStatus()).type).toBe("signedOut");
  }, 10_000);

  it("returns to signedOut when sign-in is aborted", async () => {
    const backend = createMockBackend();
    const controller = new AbortController();
    const signInPromise = backend.auth.signIn(controller.signal);
    controller.abort();

    await expect(signInPromise).rejects.toThrow();
    expect((await backend.auth.getStatus()).type).toBe("signedOut");
  });
});
