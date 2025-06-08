// app/workspaces/StoreInitializer.tsx
"use client";

import { useRef, useEffect } from "react";
import useWorkspaceStore, { ActiveWorkspace } from "./store";

function StoreInitializer({ workspace }: { workspace: ActiveWorkspace | null }) {
  const initialized = useRef(false);
  
  // این useEffect فقط یک بار در اولین رندر اجرا می‌شود
  // و مقدار اولیه Zustand را از داده‌های سرور تنظیم می‌کند.
  useEffect(() => {
    if (!initialized.current) {
      useWorkspaceStore.setState({ activeWorkspace: workspace });
      initialized.current = true;
    }
  }, [workspace]);

  return null; // این کامپوننت هیچ چیزی رندر نمی‌کند
}

export default StoreInitializer;
