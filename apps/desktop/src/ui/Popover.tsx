import { useEffect, useRef, type ReactNode } from "react";

import { cx } from "@/lib/cx";

import styles from "./Popover.module.css";

export interface PopoverProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * A minimal accessible popover. Render it inside a `position: relative`
 * wrapper next to its trigger — it positions itself with CSS, not a portal.
 * Closes on Escape or a click/tap outside, and moves focus into itself
 * while open.
 */
export function Popover({ open, onClose, children, className }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    function handlePointerDown(event: PointerEvent): void {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div ref={panelRef} role="dialog" tabIndex={-1} className={cx(styles.popover, className)}>
      {children}
    </div>
  );
}
