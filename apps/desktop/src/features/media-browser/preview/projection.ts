/**
 * Pure math for reprojecting a side-by-side dual-fisheye image to an
 * equirectangular view. Mirrors the logic in `shaders.ts`'s fragment shader
 * exactly (in JS, one function per shader step) so the shader's geometry can
 * be unit tested here without a WebGL context.
 *
 * Convention: the front lens looks down +Z, the back lens down -Z. "Yaw"
 * rotates the look direction around Y (left/right), "pitch" tilts it around
 * X (up/down) — both in radians.
 */

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Uv {
  readonly u: number;
  readonly v: number;
}

export type Lens = "front" | "back";

/**
 * Maps an equirectangular output pixel (u, v both in [0, 1], v=0 at the
 * top) plus a camera yaw/pitch offset to the 3D direction it represents on
 * the unit sphere.
 */
export function equirectUvToDirection(u: number, v: number, yaw: number, pitch: number): Vec3 {
  const longitude = (u - 0.5) * 2 * Math.PI + yaw;
  const latitude = (0.5 - v) * Math.PI + pitch;
  const clampedLatitude = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, latitude));

  return {
    x: Math.cos(clampedLatitude) * Math.sin(longitude),
    y: Math.sin(clampedLatitude),
    z: Math.cos(clampedLatitude) * Math.cos(longitude),
  };
}

/**
 * Picks which lens captured a given direction. Because each lens's FOV
 * exceeds 180°, every direction falls within *some* lens's cone under this
 * simple hemisphere split — there is no seam gap.
 */
export function selectLens(direction: Vec3): Lens {
  return direction.z >= 0 ? "front" : "back";
}

/**
 * Projects a direction into a single lens's own circular fisheye frame,
 * using an equidistant (linear) fisheye model: the angle from the lens's
 * optical axis maps linearly to radius, reaching the frame edge (r = 1) at
 * half the lens's nominal field of view. Returns `null` if the direction
 * falls outside that half-FOV cone (defensive — shouldn't happen for the
 * hemisphere-selected lens when `lensFovDeg` > 180).
 */
export function directionToFisheyeUv(
  direction: Vec3,
  lens: Lens,
  lensFovDeg: number,
): Uv | null {
  const axisZ = lens === "front" ? 1 : -1;
  const cosTheta = direction.z * axisZ;
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  const halfFov = (lensFovDeg * Math.PI) / 180 / 2;

  if (theta > halfFov) return null;

  const radius = theta / halfFov;
  // The local x-axis is shared by both lenses; the local y-axis flips for
  // the back lens because it looks the opposite way down Z.
  const localX = direction.x;
  const localY = lens === "front" ? direction.y : -direction.y;
  const azimuth = Math.atan2(localY, localX);

  return {
    u: 0.5 + radius * Math.cos(azimuth) * 0.5,
    v: 0.5 + radius * Math.sin(azimuth) * 0.5,
  };
}

/** Places a single lens's local [0,1]x[0,1] UV into its half of the side-by-side composite. */
export function fisheyeUvToCompositeUv(uv: Uv, lens: Lens): Uv {
  return lens === "front" ? { u: uv.u * 0.5, v: uv.v } : { u: 0.5 + uv.u * 0.5, v: uv.v };
}

/** Full pipeline: equirect output pixel -> composite dual-fisheye source UV. */
export function equirectToCompositeUv(
  u: number,
  v: number,
  yaw: number,
  pitch: number,
  lensFovDeg: number,
): Uv | null {
  const direction = equirectUvToDirection(u, v, yaw, pitch);
  const lens = selectLens(direction);
  const localUv = directionToFisheyeUv(direction, lens, lensFovDeg);
  return localUv ? fisheyeUvToCompositeUv(localUv, lens) : null;
}
