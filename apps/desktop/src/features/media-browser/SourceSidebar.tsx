import { useCallback, useState } from "react";

import { useBackend } from "@/backend/BackendProvider";
import { useVolumes } from "@/features/media-browser/useVolumes";
import { cx } from "@/lib/cx";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { IconFolderPlus, IconSdCard } from "@/ui/icons";
import { Spinner } from "@/ui/Spinner";

import styles from "./SourceSidebar.module.css";

export interface SourceSidebarProps {
  readonly selectedVolumeId: string | null;
  readonly onSelectVolume: (volumeId: string) => void;
}

export function SourceSidebar({ selectedVolumeId, onSelectVolume }: SourceSidebarProps) {
  const backend = useBackend();
  const volumesState = useVolumes();
  const [addingFolder, setAddingFolder] = useState(false);

  const handleAddFolder = useCallback(() => {
    setAddingFolder(true);
    void backend.media
      .addFolder()
      .then((folder) => {
        if (folder) onSelectVolume(folder.id);
      })
      .catch(() => {
        // Folder picker cancellation/failure: no volume to select.
      })
      .finally(() => {
        setAddingFolder(false);
      });
  }, [backend, onSelectVolume]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Sources</h2>
        <Button variant="ghost" size="sm" onClick={handleAddFolder} loading={addingFolder}>
          <IconFolderPlus /> Add folder…
        </Button>
      </div>

      {volumesState.status === "loading" && (
        <div className={styles.loading}>
          <Spinner size="sm" />
        </div>
      )}

      {volumesState.status === "success" && volumesState.data.length === 0 && (
        <EmptyState
          icon={<IconSdCard width={28} height={28} />}
          title="Insert an SD card"
          description="Connect your Insta360 X4 or X5 SD card, or add a folder of footage."
        />
      )}

      {volumesState.status === "success" && volumesState.data.length > 0 && (
        <ul className={styles.list}>
          {volumesState.data.map((volume) => (
            <li key={volume.id}>
              <button
                type="button"
                className={cx(styles.item, volume.id === selectedVolumeId && styles.itemActive)}
                aria-current={volume.id === selectedVolumeId || undefined}
                onClick={() => {
                  onSelectVolume(volume.id);
                }}
              >
                <IconSdCard />
                <span className={styles.itemLabel}>{volume.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
