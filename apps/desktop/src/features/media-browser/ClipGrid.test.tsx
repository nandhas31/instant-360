import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { BackendProvider } from "@/backend/BackendProvider";
import { createMockBackend } from "@/backend/mock/MockBackend";
import type { Clip } from "@/domain/media";
import { ClipGrid } from "@/features/media-browser/ClipGrid";

const clips: ReadonlyArray<Clip> = [
  {
    id: "a",
    kind: "360",
    fileName: "VID_20240101_090000_00_001.insv",
    path: "/a",
    capturedAt: "2024-01-01T09:00:00.000Z",
    durationSec: 30,
    width: 5760,
    height: 2880,
    fps: 30,
    sizeBytes: 100,
    camera: "X5",
    status: "ok",
    segments: [{ fileName: "VID_20240101_090000_00_001.insv", sizeBytes: 100, durationSec: 30 }],
  },
  {
    id: "b",
    kind: "360",
    fileName: "VID_20240102_090000_00_001.insv",
    path: "/b",
    capturedAt: "2024-01-02T09:00:00.000Z",
    durationSec: 3600,
    width: 5760,
    height: 2880,
    fps: 30,
    sizeBytes: 300,
    camera: "X4",
    status: "ok",
    segments: [
      { fileName: "VID_20240102_090000_00_001.insv", sizeBytes: 150, durationSec: 1800 },
      { fileName: "VID_20240102_090000_00_002.insv", sizeBytes: 150, durationSec: 1800 },
    ],
  },
  {
    id: "c",
    kind: "flat",
    fileName: "VID_20240103_090000_10_001.mp4",
    path: "/c",
    capturedAt: "2024-01-03T09:00:00.000Z",
    durationSec: 60,
    width: 1920,
    height: 1080,
    fps: 30,
    sizeBytes: 200,
    camera: "unknown",
    status: "needsRepair",
    segments: [{ fileName: "VID_20240103_090000_10_001.mp4", sizeBytes: 200, durationSec: 60 }],
  },
];

function Harness() {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  return (
    <ClipGrid
      clips={clips}
      selectedIds={selectedIds}
      activeId={activeId}
      onSelectionChange={setSelectedIds}
      onActiveChange={setActiveId}
    />
  );
}

function renderGrid() {
  const backend = createMockBackend();
  return render(
    <BackendProvider backend={backend}>
      <Harness />
    </BackendProvider>,
  );
}

describe("ClipGrid keyboard selection", () => {
  it("renders one option per clip with the first tile focusable by default", () => {
    renderGrid();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveAttribute("tabindex", "0");
    expect(options[1]).toHaveAttribute("tabindex", "-1");
  });

  it("selects the focused tile on space and reflects it via aria-selected", async () => {
    const user = userEvent.setup();
    renderGrid();

    const options = screen.getAllByRole("option");
    options[0]?.focus();
    await user.keyboard(" ");

    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("moves the roving tabindex with arrow keys", async () => {
    const user = userEvent.setup();
    renderGrid();

    const options = screen.getAllByRole("option");
    options[0]?.focus();
    await user.keyboard("{ArrowRight}");

    expect(options[1]).toHaveFocus();
    expect(options[0]).toHaveAttribute("tabindex", "-1");
    expect(options[1]).toHaveAttribute("tabindex", "0");

    await user.keyboard("{ArrowLeft}");
    expect(options[0]).toHaveFocus();
  });

  it("does not select a needsRepair clip and marks it aria-disabled", async () => {
    const user = userEvent.setup();
    renderGrid();

    const options = screen.getAllByRole("option");
    const repairTile = options[2];
    expect(repairTile).toHaveAttribute("aria-disabled", "true");

    // Navigate via arrow keys (rather than calling .focus() directly) so the
    // component's roving-tabindex state and actual DOM focus stay in sync.
    options[0]?.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(repairTile).toHaveFocus();

    await user.keyboard(" ");

    expect(repairTile).toHaveAttribute("aria-selected", "false");
  });

  it("shows a parts badge for a multi-segment clip", () => {
    renderGrid();
    expect(screen.getByText("2 parts")).toBeInTheDocument();
  });

  it("shows a needs-repair badge for a clip missing its index", () => {
    renderGrid();
    expect(screen.getByText("Needs repair")).toBeInTheDocument();
  });
});
