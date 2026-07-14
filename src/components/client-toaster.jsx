"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { loadToastSettings } from "@/src/lib/toast-settings";

export function ClientToaster() {
  const [settings, setSettings] = useState(loadToastSettings);

  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(loadToastSettings());
    };

    window.addEventListener("toast-settings-updated", handleSettingsChange);
    window.addEventListener("storage", handleSettingsChange);

    return () => {
      window.removeEventListener("toast-settings-updated", handleSettingsChange);
      window.removeEventListener("storage", handleSettingsChange);
    };
  }, []);

  return (
    <Toaster
      position={settings.position}
      richColors={settings.richColors}
      hideProgressBar={settings.hideProgressBar}
      closeOnClick={settings.closeOnClick}
      pauseWhenPageIsHidden={settings.pauseOnFocusLoss}
      draggable={settings.draggable}
      newestOnTop={settings.newestOnTop}
      pauseOnHover={settings.pauseOnHover}
      rtl={settings.rtl}
      closeButton={settings.closeButton}
      expand={settings.expand}
      visibleToasts={settings.visibleToasts}
      theme={settings.theme}
      duration={settings.disableAutoClose ? Number.POSITIVE_INFINITY : settings.duration}
      dir={settings.rtl ? "rtl" : "ltr"}
    />
  );
}
