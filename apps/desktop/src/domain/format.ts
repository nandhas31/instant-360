/**
 * Pure formatting helpers for displaying clip metadata. No React, no I/O.
 */

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const mm = minutes.toString().padStart(hours > 0 ? 2 : 1, "0");
  const ss = secs.toString().padStart(2, "0");

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const unit = BYTE_UNITS[exponent] ?? "B";
  const precision = exponent === 0 ? 0 : 1;

  return `${value.toFixed(precision)} ${unit}`;
}

/**
 * Insta360 marketing resolutions are conventionally labelled by the taller
 * of the two source dimensions rounded to the nearest "K" tier, not by the
 * literal pixel count.
 */
export function formatResolution(width: number, height: number): string {
  const longest = Math.max(width, height);

  if (longest >= 7600) return "8K";
  if (longest >= 5400) return "5.7K";
  if (longest >= 3800) return "4K";
  if (longest >= 2700) return "2.7K";
  return `${longest}p`;
}

export function formatFps(fps: number): string {
  return Number.isInteger(fps) ? `${fps}fps` : `${fps.toFixed(2)}fps`;
}
