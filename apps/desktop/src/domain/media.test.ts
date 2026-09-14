import { describe, expect, it } from "vitest";

import { isMultiSegment, type Clip } from "@/domain/media";

function makeClip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: "clip-1",
    kind: "360",
    fileName: "VID_20240101_120000_00_001.insv",
    path: "/Volumes/INSTA360/VID_20240101_120000_00_001.insv",
    capturedAt: "2024-01-01T12:00:00.000Z",
    durationSec: 60,
    width: 5760,
    height: 2880,
    fps: 30,
    sizeBytes: 100_000,
    camera: "X5",
    status: "ok",
    segments: [
      { fileName: "VID_20240101_120000_00_001.insv", sizeBytes: 100_000, durationSec: 60 },
    ],
    ...overrides,
  };
}

describe("isMultiSegment", () => {
  it("is false for a single-segment clip", () => {
    expect(isMultiSegment(makeClip())).toBe(false);
  });

  it("is true when a recording spans multiple 29:59 segments", () => {
    const clip = makeClip({
      segments: [
        { fileName: "VID_001.insv", sizeBytes: 1, durationSec: 1799 },
        { fileName: "VID_002.insv", sizeBytes: 1, durationSec: 1799 },
      ],
    });
    expect(isMultiSegment(clip)).toBe(true);
  });
});

describe("Clip kind", () => {
  it("distinguishes 360 (.insv) clips from flat (.mp4) clips", () => {
    const raw = makeClip({ kind: "360" });
    const flat = makeClip({ kind: "flat", fileName: "VID_20240101_130000_10_001.mp4" });

    expect(raw.kind).toBe("360");
    expect(flat.kind).toBe("flat");
  });
});

describe("Clip status", () => {
  it("marks a clip cut off by power loss as needing repair", () => {
    const clip = makeClip({ status: "needsRepair" });
    expect(clip.status).toBe("needsRepair");
  });

  it("defaults fixtures built here to ok", () => {
    expect(makeClip().status).toBe("ok");
  });
});

describe("Camera union", () => {
  it("accepts every known camera model plus unknown", () => {
    const cameras: ReadonlyArray<Clip["camera"]> = ["X4", "X4 Air", "X5", "unknown"];
    for (const camera of cameras) {
      expect(makeClip({ camera }).camera).toBe(camera);
    }
  });
});
