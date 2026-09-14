# instant-360

A desktop app that reads Insta360 X4/X5 raw 360 footage from an SD card, exports equirectangular 360 videos, and uploads them to a video platform via account sign-in.

## Getting started

This repo is a pnpm workspace. The Rust/Tauri shell (`apps/desktop/src-tauri`) hasn't been built yet, so right now the UI runs standalone in a browser against a mock backend.

```sh
pnpm install
pnpm dev
```

Other useful scripts (proxied from the workspace root to `apps/desktop`):

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Frontend architecture

The UI (`apps/desktop/src`) is a feature-sliced React + TypeScript app that treats the backend as untrusted-adjacent: it never touches the filesystem, network, OAuth tokens, or Docker directly. Instead it depends on a single typed port, `Backend` (`src/backend/Backend.ts`), exposing an `AuthApi` and a `MediaApi`. Two adapters implement that port: `backend/tauri/TauriBackend.ts`, which will call into Rust `#[tauri::command]`s (names centralized in `backend/tauri/commands.ts`) once the Tauri shell exists, and `backend/mock/MockBackend.ts`, an in-memory implementation with realistic fixtures, simulated latency, and a simulated SD card insert — used for `pnpm dev` and all tests today. `backend/createBackend.ts` picks between them at runtime by checking for the Tauri injected global, and `BackendProvider`/`useBackend` make the chosen backend available via React context, so components and hooks never import an adapter directly. Features (`youtube-account`, `media-browser`) hold their own hooks and presentational components; pure domain types and formatting logic live under `src/domain` with no React or I/O dependencies.
