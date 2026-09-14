/**
 * Names of the planned Rust `#[tauri::command]`s and emitted events. Kept as
 * a single source of truth so the Rust side (built later) and this adapter
 * stay in sync.
 */
export const Commands = {
  authStatus: "auth_status",
  authSignIn: "auth_sign_in",
  authDisconnect: "auth_disconnect",
  mediaListVolumes: "media_list_volumes",
  mediaScanVolume: "media_scan_volume",
  mediaAddFolder: "media_add_folder",
  mediaThumbnail: "media_thumbnail",
} as const;

export const Events = {
  authChanged: "auth://changed",
  volumesChanged: "media://volumes-changed",
} as const;
