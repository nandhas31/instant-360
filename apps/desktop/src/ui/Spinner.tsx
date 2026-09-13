import { cx } from "@/lib/cx";

import styles from "./Spinner.module.css";

export interface SpinnerProps {
  readonly size?: "sm" | "md";
  readonly className?: string;
  readonly label?: string;
}

export function Spinner({ size = "md", className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      className={cx(styles.spinner, styles[size], className)}
      role="status"
      aria-label={label}
    />
  );
}
