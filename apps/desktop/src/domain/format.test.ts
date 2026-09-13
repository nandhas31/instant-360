import { describe, expect, it } from "vitest";

import { formatBytes, formatDuration, formatFps, formatResolution } from "@/domain/format";

describe("formatDuration", () => {
  it("formats seconds under a minute as m:ss", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(59)).toBe("0:59");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  it("formats hours, minutes and seconds", () => {
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("rounds and clamps negative input to zero", () => {
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(1.6)).toBe("0:02");
  });
});

describe("formatBytes", () => {
  it("formats zero and small byte counts", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes, megabytes and gigabytes with one decimal", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1_240_000_000)).toBe("1.2 GB");
  });
});

describe("formatResolution", () => {
  it("labels 5.7K and 8K Insta360 resolutions", () => {
    expect(formatResolution(5760, 2880)).toBe("5.7K");
    expect(formatResolution(7680, 3840)).toBe("8K");
  });

  it("labels 4K and 2.7K resolutions", () => {
    expect(formatResolution(3840, 1920)).toBe("4K");
    expect(formatResolution(2720, 1360)).toBe("2.7K");
  });

  it("falls back to a plain pixel label below 2.7K", () => {
    expect(formatResolution(1920, 1080)).toBe("1920p");
  });
});

describe("formatFps", () => {
  it("formats integer fps without decimals", () => {
    expect(formatFps(30)).toBe("30fps");
  });

  it("formats fractional fps with two decimals", () => {
    expect(formatFps(29.97)).toBe("29.97fps");
  });
});
