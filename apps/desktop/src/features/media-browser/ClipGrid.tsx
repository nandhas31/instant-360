import { useCallback, useMemo, useRef, type KeyboardEvent, type MouseEvent } from "react";

import type { Clip } from "@/domain/media";
import { ClipTile } from "@/features/media-browser/ClipTile";

import styles from "./ClipGrid.module.css";

export interface ClipGridProps {
  readonly clips: ReadonlyArray<Clip>;
  readonly selectedIds: ReadonlySet<string>;
  readonly activeId: string | null;
  readonly onSelectionChange: (ids: ReadonlySet<string>) => void;
  readonly onActiveChange: (id: string) => void;
}

export function ClipGrid({
  clips,
  selectedIds,
  activeId,
  onSelectionChange,
  onActiveChange,
}: ClipGridProps) {
  const tileRefs = useRef(new Map<string, HTMLDivElement>());

  const activeIndex = useMemo(() => {
    if (!activeId) return 0;
    const index = clips.findIndex((clip) => clip.id === activeId);
    return index >= 0 ? index : 0;
  }, [clips, activeId]);

  const focusTile = useCallback((id: string) => {
    tileRefs.current.get(id)?.focus();
  }, []);

  const moveActive = useCallback(
    (delta: number) => {
      if (clips.length === 0) return;
      const nextIndex = Math.min(Math.max(activeIndex + delta, 0), clips.length - 1);
      const next = clips[nextIndex];
      if (!next) return;
      onActiveChange(next.id);
      focusTile(next.id);
    },
    [clips, activeIndex, onActiveChange, focusTile],
  );

  const toggleSelection = useCallback(
    (clip: Clip) => {
      onActiveChange(clip.id);
      if (clip.status === "needsRepair") return;

      const next = new Set(selectedIds);
      if (next.has(clip.id)) {
        next.delete(clip.id);
      } else {
        next.add(clip.id);
      }
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange, onActiveChange],
  );

  const selectSingle = useCallback(
    (clip: Clip) => {
      onActiveChange(clip.id);
      if (clip.status === "needsRepair") return;
      onSelectionChange(new Set([clip.id]));
    },
    [onSelectionChange, onActiveChange],
  );

  const selectRange = useCallback(
    (clip: Clip) => {
      const targetIndex = clips.findIndex((candidate) => candidate.id === clip.id);
      if (targetIndex < 0) return;
      const [start, end] =
        activeIndex <= targetIndex ? [activeIndex, targetIndex] : [targetIndex, activeIndex];
      const rangeIds = clips
        .slice(start, end + 1)
        .filter((candidate) => candidate.status !== "needsRepair")
        .map((candidate) => candidate.id);
      onSelectionChange(new Set(rangeIds));
      onActiveChange(clip.id);
    },
    [clips, activeIndex, onSelectionChange, onActiveChange],
  );

  const handleTileClick = useCallback(
    (clip: Clip, event: MouseEvent<HTMLDivElement>) => {
      if (event.shiftKey) {
        selectRange(clip);
      } else if (event.metaKey || event.ctrlKey) {
        toggleSelection(clip);
      } else {
        selectSingle(clip);
      }
    },
    [selectRange, toggleSelection, selectSingle],
  );

  // Keyboard movement is a flat roving tabindex — ArrowRight/Down advance one
  // tile, ArrowLeft/Up go back one — rather than measuring the CSS grid's
  // live column count. That keeps focus movement correct at every viewport
  // width and after every reflow without a ResizeObserver, at the cost of
  // not mimicking literal 2D up/down-a-row movement.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const clip = clips[activeIndex];
      if (!clip) return;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          moveActive(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          moveActive(-1);
          break;
        case " ":
        case "Enter":
          event.preventDefault();
          toggleSelection(clip);
          break;
        default:
          break;
      }
    },
    [clips, activeIndex, moveActive, toggleSelection],
  );

  if (clips.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No clips found on this source.</p>
      </div>
    );
  }

  return (
    <div
      className={styles.grid}
      role="listbox"
      aria-multiselectable="true"
      aria-label="Clips"
      onKeyDown={handleKeyDown}
    >
      {clips.map((clip, index) => (
        <ClipTile
          key={clip.id}
          clip={clip}
          selected={selectedIds.has(clip.id)}
          active={index === activeIndex}
          onClick={(event) => {
            handleTileClick(clip, event);
          }}
          registerRef={(el) => {
            if (el) {
              tileRefs.current.set(clip.id, el);
            } else {
              tileRefs.current.delete(clip.id);
            }
          }}
        />
      ))}
    </div>
  );
}
