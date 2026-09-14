import { useState } from "react";

import { formatBytes, formatDuration, formatFps, formatResolution } from "@/domain/format";
import type { Clip } from "@/domain/media";
import { useThumbnail } from "@/features/media-browser/useThumbnail";
import { EquirectPreview } from "@/features/media-browser/preview/EquirectPreview";
import { cx } from "@/lib/cx";
import { Badge } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";
import { IconGlobe, IconWarningTriangle } from "@/ui/icons";
import { Spinner } from "@/ui/Spinner";

import styles from "./ClipPreviewPanel.module.css";

export interface ClipPreviewPanelProps {
  readonly clip: Clip | null;
}

type ProjectionView = "fisheye" | "equirect";

export function ClipPreviewPanel({ clip }: ClipPreviewPanelProps) {
  const thumbnail = useThumbnail(clip?.id ?? null);
  const [view, setView] = useState<ProjectionView>("equirect");

  if (!clip) {
    return (
      <div className={styles.root}>
        <EmptyState title="No clip selected" description="Select a clip to preview it here." />
      </div>
    );
  }

  const captured = new Date(clip.capturedAt);
  const capturedLabel = Number.isNaN(captured.getTime())
    ? clip.capturedAt
    : captured.toLocaleString();

  return (
    <div className={styles.root}>
      <div className={styles.previewArea}>
        {thumbnail.status === "success" && thumbnail.data ? (
          clip.kind === "360" && thumbnail.data.projection.type === "dualFisheye" ? (
            view === "equirect" ? (
              <EquirectPreview
                imageSrc={thumbnail.data.dataUrl}
                lensFovDeg={thumbnail.data.projection.lensFovDeg}
                className={styles.preview}
              />
            ) : (
              <img className={styles.preview} src={thumbnail.data.dataUrl} alt="Dual-fisheye source frame" />
            )
          ) : (
            <img className={styles.preview} src={thumbnail.data.dataUrl} alt="Clip preview frame" />
          )
        ) : (
          <div className={styles.previewLoading}>
            <Spinner />
          </div>
        )}
      </div>

      {clip.kind === "360" && (
        <div className={styles.projectionToggle} role="group" aria-label="Preview projection">
          <button
            type="button"
            className={cx(styles.toggleButton, view === "fisheye" && styles.toggleActive)}
            aria-pressed={view === "fisheye"}
            onClick={() => {
              setView("fisheye");
            }}
          >
            Fisheye
          </button>
          <button
            type="button"
            className={cx(styles.toggleButton, view === "equirect" && styles.toggleActive)}
            aria-pressed={view === "equirect"}
            onClick={() => {
              setView("equirect");
            }}
          >
            360 preview
          </button>
        </div>
      )}

      <p className={styles.disclaimer}>
        <IconGlobe /> Approximate preview. Final export is stitched by the SDK.
      </p>

      {clip.status === "needsRepair" && (
        <p className={styles.repairNotice}>
          <IconWarningTriangle /> This recording is missing its index and can&apos;t be exported
          until it&apos;s repaired.
        </p>
      )}

      <dl className={styles.metaList}>
        <div className={styles.metaRow}>
          <dt>File</dt>
          <dd className={styles.metaMono}>{clip.fileName}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Camera</dt>
          <dd>
            <Badge tone="neutral">{clip.camera}</Badge>
          </dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Type</dt>
          <dd>{clip.kind === "360" ? "360 (dual-fisheye)" : "Flat"}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Duration</dt>
          <dd>{formatDuration(clip.durationSec)}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Resolution</dt>
          <dd>
            {formatResolution(clip.width, clip.height)} · {formatFps(clip.fps)}
          </dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Size</dt>
          <dd>{formatBytes(clip.sizeBytes)}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Captured</dt>
          <dd>{capturedLabel}</dd>
        </div>
        {clip.segments.length > 1 && (
          <div className={styles.metaRow}>
            <dt>Segments</dt>
            <dd>{clip.segments.length} parts (split every 29:59)</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
