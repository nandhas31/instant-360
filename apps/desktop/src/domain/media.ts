/**
 * Pure domain types for media sources and clips. No React, no I/O.
 */

export interface Volume {
  readonly id: string;
  readonly label: string;
  readonly kind: "sdCard" | "folder";
  readonly path: string;
}

export type Camera = "X4" | "X4 Air" | "X5" | "unknown";

/**
 * `360` clips are raw `.insv` recordings (dual-fisheye, stitched later by the
 * SDK). `flat` clips are footage the camera has already flattened in-camera
 * (Single-Lens, FreeFrame, InstaFrame, low-fps Me Mode) and exported as a
 * regular `.mp4` — there is nothing to reproject.
 */
export type ClipKind = "360" | "flat";

/**
 * A recording cut off by power loss (or card removal) mid-write can be left
 * without a valid moov atom. Such clips are shown but cannot be queued for
 * export.
 */
export type ClipStatus = "ok" | "needsRepair";

/**
 * Insta360 cameras split long recordings into consecutive files every 29:59.
 * A `Clip` models the logical recording; `segments` lists its constituent
 * files in order.
 */
export interface ClipSegment {
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly durationSec: number;
}

export interface Clip {
  readonly id: string;
  readonly kind: ClipKind;
  /** Name of the first segment; used for display when a single name is needed. */
  readonly fileName: string;
  readonly path: string;
  readonly capturedAt: string; // ISO 8601
  /** Total duration across all segments, in seconds. */
  readonly durationSec: number;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  /** Total size across all segments, in bytes. */
  readonly sizeBytes: number;
  readonly camera: Camera;
  readonly status: ClipStatus;
  readonly segments: ReadonlyArray<ClipSegment>;
}

/**
 * How a thumbnail image should be interpreted for preview purposes. This
 * lives on the thumbnail (not the clip) because it describes the pixel
 * layout of the specific composite image the backend produced, including
 * the lens field-of-view assumption baked into it.
 */
export type ThumbnailProjection =
  | { readonly type: "dualFisheye"; readonly layout: "sideBySide"; readonly lensFovDeg: number }
  | { readonly type: "flat" };

export interface ClipThumbnail {
  readonly clipId: string;
  readonly dataUrl: string;
  readonly projection: ThumbnailProjection;
}

export function isMultiSegment(clip: Clip): boolean {
  return clip.segments.length > 1;
}
