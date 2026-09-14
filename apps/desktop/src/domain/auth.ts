/**
 * Pure domain types for the YouTube account connection. No React, no I/O.
 */

export interface ConnectedAccount {
  readonly email: string;
  readonly displayName: string;
  /** URL of a profile avatar, when the provider returned one. */
  readonly avatarUrl?: string;
}

export type AuthStatus =
  | { readonly type: "signedOut" }
  | { readonly type: "connecting" }
  | { readonly type: "signedIn"; readonly account: ConnectedAccount }
  | { readonly type: "reauthRequired"; readonly account: ConnectedAccount }
  | { readonly type: "error"; readonly message: string };
