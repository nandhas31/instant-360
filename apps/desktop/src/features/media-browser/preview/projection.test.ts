import { describe, expect, it } from "vitest";

import {
  directionToFisheyeUv,
  equirectToCompositeUv,
  equirectUvToDirection,
  fisheyeUvToCompositeUv,
  selectLens,
} from "@/features/media-browser/preview/projection";

describe("equirectUvToDirection", () => {
  it("maps the center pixel with no yaw/pitch to straight ahead (+Z)", () => {
    const direction = equirectUvToDirection(0.5, 0.5, 0, 0);
    expect(direction.x).toBeCloseTo(0);
    expect(direction.y).toBeCloseTo(0);
    expect(direction.z).toBeCloseTo(1);
  });

  it("maps straight up (v=0) to +Y regardless of yaw", () => {
    const direction = equirectUvToDirection(0.7, 0, Math.PI / 3, 0);
    expect(direction.x).toBeCloseTo(0);
    expect(direction.y).toBeCloseTo(1);
    expect(direction.z).toBeCloseTo(0);
  });

  it("clamps pitch so looking further up never wraps past straight up", () => {
    const direction = equirectUvToDirection(0.5, 0.5, 0, Math.PI);
    expect(direction.y).toBeCloseTo(1);
  });
});

describe("selectLens", () => {
  it("picks the front lens for forward-facing directions", () => {
    expect(selectLens({ x: 0, y: 0, z: 1 })).toBe("front");
  });

  it("picks the back lens for backward-facing directions", () => {
    expect(selectLens({ x: 0, y: 0, z: -1 })).toBe("back");
  });
});

describe("directionToFisheyeUv", () => {
  it("maps the front optical axis to the center of its frame", () => {
    const uv = directionToFisheyeUv({ x: 0, y: 0, z: 1 }, "front", 200);
    expect(uv).not.toBeNull();
    expect(uv?.u).toBeCloseTo(0.5);
    expect(uv?.v).toBeCloseTo(0.5);
  });

  it("maps a direction at half the FOV to the frame edge", () => {
    // 200deg FOV -> 100deg half-angle. A direction 100deg off the front
    // axis, in the +X direction, should land exactly on the right edge.
    const halfFovRad = (100 * Math.PI) / 180;
    const direction = { x: Math.sin(halfFovRad), y: 0, z: Math.cos(halfFovRad) };
    const uv = directionToFisheyeUv(direction, "front", 200);
    expect(uv?.u).toBeCloseTo(1);
    expect(uv?.v).toBeCloseTo(0.5);
  });

  it("returns null outside the lens's half-FOV cone", () => {
    // Directly sideways (90deg off axis) exceeds a narrow 60deg-FOV lens's 30deg half-angle.
    const uv = directionToFisheyeUv({ x: 1, y: 0, z: 0 }, "front", 60);
    expect(uv).toBeNull();
  });

  it("mirrors the local Y axis for the back lens", () => {
    const up = directionToFisheyeUv({ x: 0, y: 0.5, z: -0.5 }, "back", 200);
    const down = directionToFisheyeUv({ x: 0, y: -0.5, z: -0.5 }, "back", 200);
    expect(up).not.toBeNull();
    expect(down).not.toBeNull();
    // Same u (same azimuthal magnitude), v reflected across the center.
    expect(up?.u).toBeCloseTo(down?.u ?? NaN);
    expect((up?.v ?? 0) - 0.5).toBeCloseTo(0.5 - (down?.v ?? 0));
  });
});

describe("fisheyeUvToCompositeUv", () => {
  it("places the front lens in the left half of the composite", () => {
    const uv = fisheyeUvToCompositeUv({ u: 1, v: 0.5 }, "front");
    expect(uv.u).toBeCloseTo(0.5);
    expect(uv.v).toBeCloseTo(0.5);
  });

  it("places the back lens in the right half of the composite", () => {
    const uv = fisheyeUvToCompositeUv({ u: 0, v: 0.5 }, "back");
    expect(uv.u).toBeCloseTo(0.5);
    expect(uv.v).toBeCloseTo(0.5);
  });
});

describe("equirectToCompositeUv", () => {
  it("composes the full pipeline for the forward-looking center pixel", () => {
    const uv = equirectToCompositeUv(0.5, 0.5, 0, 0, 200);
    expect(uv).not.toBeNull();
    expect(uv?.u).toBeCloseTo(0.25);
    expect(uv?.v).toBeCloseTo(0.5);
  });
});
