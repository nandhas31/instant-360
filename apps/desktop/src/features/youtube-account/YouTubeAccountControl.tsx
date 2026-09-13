import { useState } from "react";

import type { ConnectedAccount } from "@/domain/auth";
import { useYouTubeAccount } from "@/features/youtube-account/useYouTubeAccount";
import { Button } from "@/ui/Button";
import { IconWarningTriangle } from "@/ui/icons";
import { Popover } from "@/ui/Popover";
import { Spinner } from "@/ui/Spinner";

import styles from "./YouTubeAccountControl.module.css";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function AccountAvatar({ account }: { account: ConnectedAccount }) {
  if (account.avatarUrl) {
    return <img className={styles.avatar} src={account.avatarUrl} alt="" />;
  }
  return (
    <span className={styles.avatar} aria-hidden="true">
      {initials(account.displayName)}
    </span>
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled auth status: ${JSON.stringify(value)}`);
}

export function YouTubeAccountControl() {
  const { status, connect, cancel, disconnect } = useYouTubeAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  switch (status.type) {
    case "signedOut":
      return (
        <div className={styles.root}>
          <Button variant="secondary" size="sm" onClick={connect}>
            Connect YouTube account
          </Button>
        </div>
      );

    case "connecting":
      return (
        <div className={styles.root} aria-live="polite">
          <Spinner size="sm" />
          <span className={styles.status}>Waiting for browser…</span>
          <Button variant="ghost" size="sm" onClick={cancel}>
            Cancel
          </Button>
        </div>
      );

    case "signedIn":
      return (
        <div className={styles.root} aria-live="polite">
          <AccountAvatar account={status.account} />
          <span className={styles.email}>{status.account.email}</span>
          <div className={styles.popoverAnchor}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConfirmOpen(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={confirmOpen}
            >
              Disconnect
            </Button>
            <Popover
              open={confirmOpen}
              onClose={() => {
                setConfirmOpen(false);
              }}
            >
              <p className={styles.confirmText}>
                Disconnect {status.account.email}? You can reconnect anytime.
              </p>
              <div className={styles.confirmActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setConfirmOpen(false);
                  }}
                >
                  Keep connected
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setConfirmOpen(false);
                    disconnect();
                  }}
                >
                  Disconnect
                </Button>
              </div>
            </Popover>
          </div>
        </div>
      );

    case "reauthRequired":
      return (
        <div className={styles.root} aria-live="polite">
          <span className={styles.warningIcon}>
            <IconWarningTriangle />
          </span>
          <span
            className={styles.status}
            title="While the app is in Google's testing mode, sign-in tokens expire regularly and need to be renewed."
          >
            {status.account.email} needs reconnecting
          </span>
          <Button variant="secondary" size="sm" onClick={connect}>
            Reconnect
          </Button>
        </div>
      );

    case "error":
      return (
        <div className={styles.root} aria-live="polite">
          <span className={styles.errorText}>{status.message}</span>
          <Button variant="secondary" size="sm" onClick={connect}>
            Retry
          </Button>
        </div>
      );

    default:
      return assertNever(status);
  }
}
