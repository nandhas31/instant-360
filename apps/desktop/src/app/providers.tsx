import { useState, type ReactNode } from "react";

import { BackendProvider } from "@/backend/BackendProvider";
import { createBackend } from "@/backend/createBackend";
import type { Backend } from "@/backend/Backend";

export function AppProviders({ children }: { children: ReactNode }) {
  // Created once per app instance, not per render.
  const [backend] = useState<Backend>(() => createBackend());
  return <BackendProvider backend={backend}>{children}</BackendProvider>;
}
