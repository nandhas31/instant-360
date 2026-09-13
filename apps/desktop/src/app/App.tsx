import { useMemo, useState } from "react";

import { YouTubeAccountControl } from "@/features/youtube-account/YouTubeAccountControl";
import { ClipGrid } from "@/features/media-browser/ClipGrid";
import { ClipPreviewPanel } from "@/features/media-browser/ClipPreviewPanel";
import { SourceSidebar } from "@/features/media-browser/SourceSidebar";
import { useClips } from "@/features/media-browser/useClips";
import { Button } from "@/ui/Button";

import styles from "./AppShell.module.css";

export function App() {
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const clipsState = useClips(selectedVolumeId);

  const clips = useMemo(
    () => (clipsState.status === "success" ? clipsState.data : []),
    [clipsState],
  );

  const activeClip = useMemo(
    () => clips.find((clip) => clip.id === activeId) ?? null,
    [clips, activeId],
  );

  function handleSelectVolume(volumeId: string): void {
    setSelectedVolumeId(volumeId);
    setSelectedIds(new Set());
    setActiveId(null);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.productName}>Instant 360</span>
        <YouTubeAccountControl />
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <SourceSidebar selectedVolumeId={selectedVolumeId} onSelectVolume={handleSelectVolume} />
        </aside>

        <main className={styles.grid}>
          <ClipGrid
            clips={clips}
            selectedIds={selectedIds}
            activeId={activeId}
            onSelectionChange={setSelectedIds}
            onActiveChange={setActiveId}
          />
        </main>

        <aside className={styles.preview}>
          <ClipPreviewPanel clip={activeClip} />
        </aside>
      </div>

      <footer className={styles.footer}>
        <span className={styles.selectionCount}>
          {selectedIds.size} clip{selectedIds.size === 1 ? "" : "s"} selected
        </span>
        <Button variant="primary" disabled title="Export is not available yet">
          Export (coming soon)
        </Button>
      </footer>
    </div>
  );
}
