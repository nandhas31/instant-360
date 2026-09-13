import type { MouseEvent } from "react";

import { formatDuration, formatFps, formatResolution } from "@/domain/format";
import { isMultiSegment, type Clip } from "@/domain/media";
import { useThumbnail } from "@/features/media-browser/useThumbnail";
import { cx } from "@/lib/cx";
import { Badge } from "@/ui/Badge";
import { IconLayers, IconWarningTriangle } from "@/ui/icons";

import styles from "./ClipTile.module.css";

export interface ClipTileProps {
  readonly clip: Clip;
  readonly selected: boolean;
  readonly active: boolean;
  readonly onClick: (event: MouseEvent<HTMLDivElement>) => void;
  readonly registerRef: (el: HTMLDivElement | null) => void;
}

const REPAIR_EXPLANATION =
  "This recording was cut off before it finished writing and is missing its index. It can't be exported until it's repaired.";

export function ClipTile({ clip, selected, active, onClick, registerRef }: ClipTileProps) {
  const thumbnail = useThumbnail(clip.id);
  const needsRepair = clip.status === "needsRepair";
  const repairDescriptionId = `clip-${clip.id}-repair`;

  return (
    <div
      ref={registerRef}
      role="option"
      aria-selected={selected}
      aria-disabled={needsRepair || undefined}
      aria-describedby={needsRepair ? repairDescriptionId : undefined}
      tabIndex={active ? 0 : -1}
      className={cx(styles.tile, selected && styles.selected, needsRepair && styles.disabled)}
      onClick={onClick}
      title={needsRepair ? REPAIR_EXPLANATION : undefined}
    >
      <div className={styles.thumbnail}>
        {thumbnail.status === "success" && thumbnail.data ? (
          <img className={styles.thumbnailImg} src={thumbnail.data.dataUrl} alt="" />
        ) : (
          <div className={styles.thumbnailSkeleton} />
        )}
        <span className={styles.cameraBadge}>
          <Badge tone="neutral">{clip.camera}</Badge>
        </span>
        {isMultiSegment(clip) && (
          <span className={styles.partsBadge}>
            <Badge tone="info">
              <IconLayers /> {clip.segments.length} parts
            </Badge>
          </span>
        )}
        {needsRepair && (
          <span className={styles.repairBadge}>
            <Badge tone="danger">
              <IconWarningTriangle /> Needs repair
            </Badge>
          </span>
        )}
      </div>
      <div className={styles.meta}>
        <p className={styles.fileName}>{clip.fileName}</p>
        <p className={styles.details}>
          {formatDuration(clip.durationSec)} · {formatResolution(clip.width, clip.height)} ·{" "}
          {formatFps(clip.fps)}
        </p>
      </div>
      {needsRepair && (
        <span id={repairDescriptionId} className={styles.visuallyHidden}>
          {REPAIR_EXPLANATION}
        </span>
      )}
    </div>
  );
}
