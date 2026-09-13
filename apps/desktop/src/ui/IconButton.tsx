import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@/lib/cx";

import styles from "./IconButton.module.css";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly children: ReactNode;
}

/** A button containing only an icon. `label` is required and becomes the accessible name. */
export function IconButton({ label, children, className, ...rest }: IconButtonProps) {
  return (
    <button type="button" className={cx(styles.button, className)} aria-label={label} {...rest}>
      {children}
    </button>
  );
}
