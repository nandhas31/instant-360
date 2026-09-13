import type { Clip, Volume } from "@/domain/media";

export const SD_CARD_VOLUME: Volume = {
  id: "vol-sdcard-1",
  label: "Insta360 SD Card",
  kind: "sdCard",
  path: "/Volumes/INSTA360",
};

/**
 * Fixture clips exercising every branch the UI needs to render: both raw
 * `.insv` (kind "360") and camera-flattened `.mp4` (kind "flat") files, a
 * recording split across multiple 29:59 segments, and one file left without
 * a valid moov atom (status "needsRepair").
 *
 * `.lrv` low-res proxies and photos (`.insp`/`.jpg`/`.dng`) are deliberately
 * absent — they are not clips in this UI.
 */
export const CLIPS: ReadonlyArray<Clip> = [
  {
    id: "clip-1",
    kind: "360",
    fileName: "VID_20240610_093015_00_001.insv",
    path: "/Volumes/INSTA360/DCIM/Camera01/VID_20240610_093015_00_001.insv",
    capturedAt: "2024-06-10T09:30:15.000Z",
    durationSec: 184,
    width: 5760,
    height: 2880,
    fps: 30,
    sizeBytes: 1_240_000_000,
    camera: "X5",
    status: "ok",
    segments: [
      { fileName: "VID_20240610_093015_00_001.insv", sizeBytes: 1_240_000_000, durationSec: 184 },
    ],
  },
  {
    id: "clip-2",
    kind: "360",
    fileName: "VID_20240609_161200_00_001.insv",
    path: "/Volumes/INSTA360/DCIM/Camera01/VID_20240609_161200_00_001.insv",
    capturedAt: "2024-06-09T16:12:00.000Z",
    durationSec: 47,
    width: 4000,
    height: 2000,
    fps: 25,
    sizeBytes: 210_000_000,
    camera: "X4",
    status: "ok",
    segments: [
      { fileName: "VID_20240609_161200_00_001.insv", sizeBytes: 210_000_000, durationSec: 47 },
    ],
  },
  {
    id: "clip-3",
    kind: "360",
    fileName: "VID_20240608_074500_00_001.insv",
    path: "/Volumes/INSTA360/DCIM/Camera01/VID_20240608_074500_00_001.insv",
    capturedAt: "2024-06-08T07:45:00.000Z",
    durationSec: 612,
    width: 3840,
    height: 1920,
    fps: 24,
    sizeBytes: 980_000_000,
    camera: "X4 Air",
    status: "ok",
    segments: [
      { fileName: "VID_20240608_074500_00_001.insv", sizeBytes: 980_000_000, durationSec: 612 },
    ],
  },
  {
    id: "clip-4",
    kind: "360",
    fileName: "VID_20240607_110000_00_001.insv",
    path: "/Volumes/INSTA360/DCIM/Camera01/VID_20240607_110000_00_001.insv",
    capturedAt: "2024-06-07T11:00:00.000Z",
    // Three consecutive 29:59 segments plus a short tail.
    durationSec: 29 * 60 + 59 + (29 * 60 + 59) + (29 * 60 + 59) + 244,
    width: 5760,
    height: 2880,
    fps: 30,
    sizeBytes: 1_900_000_000 * 3 + 260_000_000,
    camera: "X5",
    status: "ok",
    segments: [
      {
        fileName: "VID_20240607_110000_00_001.insv",
        sizeBytes: 1_900_000_000,
        durationSec: 29 * 60 + 59,
      },
      {
        fileName: "VID_20240607_110000_00_002.insv",
        sizeBytes: 1_900_000_000,
        durationSec: 29 * 60 + 59,
      },
      {
        fileName: "VID_20240607_110000_00_003.insv",
        sizeBytes: 1_900_000_000,
        durationSec: 29 * 60 + 59,
      },
      {
        fileName: "VID_20240607_110000_00_004.insv",
        sizeBytes: 260_000_000,
        durationSec: 244,
      },
    ],
  },
  {
    id: "clip-5",
    kind: "flat",
    fileName: "VID_20240610_101200_10_001.mp4",
    path: "/Volumes/INSTA360/DCIM/Camera01/VID_20240610_101200_10_001.mp4",
    capturedAt: "2024-06-10T10:12:00.000Z",
    durationSec: 38,
    width: 2560,
    height: 1440,
    fps: 30,
    sizeBytes: 145_000_000,
    camera: "X5",
    status: "ok",
    segments: [
      { fileName: "VID_20240610_101200_10_001.mp4", sizeBytes: 145_000_000, durationSec: 38 },
    ],
  },
  {
    id: "clip-6",
    kind: "flat",
    fileName: "VID_20240609_180530_11_001.mp4",
    path: "/Volumes/INSTA360/DCIM/Camera01/VID_20240609_180530_11_001.mp4",
    capturedAt: "2024-06-09T18:05:30.000Z",
    durationSec: 22,
    width: 1920,
    height: 1080,
    fps: 25,
    sizeBytes: 64_000_000,
    camera: "X4",
    status: "ok",
    segments: [
      { fileName: "VID_20240609_180530_11_001.mp4", sizeBytes: 64_000_000, durationSec: 22 },
    ],
  },
  {
    id: "clip-7",
    kind: "360",
    fileName: "VID_20240605_193000_00_001.insv",
    path: "/Volumes/INSTA360/DCIM/Camera01/VID_20240605_193000_00_001.insv",
    capturedAt: "2024-06-05T19:30:00.000Z",
    durationSec: 91,
    width: 5760,
    height: 2880,
    fps: 30,
    sizeBytes: 640_000_000,
    camera: "unknown",
    // Power loss mid-recording: no valid moov atom.
    status: "needsRepair",
    segments: [
      { fileName: "VID_20240605_193000_00_001.insv", sizeBytes: 640_000_000, durationSec: 91 },
    ],
  },
];
