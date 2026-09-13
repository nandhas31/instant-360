import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "info" | "warning" | "danger";

export interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return <span className={cx(styles.badge, styles[tone], className)}>{children}</span>;
}
