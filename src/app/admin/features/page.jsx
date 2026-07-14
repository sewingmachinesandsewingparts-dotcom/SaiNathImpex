"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/src/components/admin-shell";
import { toast } from "sonner";
import {
  DEFAULT_TOAST_SETTINGS,
  loadToastSettings,
  saveToastSettings,
} from "@/src/lib/toast-settings";

const POSITIONS = [
  "top-right",
  "top-left",
  "top-center",
  "bottom-right",
  "bottom-left",
  "bottom-center",
];
const THEMES = ["light", "dark", "system"];

export default function AdminFeaturesPage() {
  const [settings, setSettings] = useState(DEFAULT_TOAST_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(loadToastSettings());
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    saveToastSettings(settings);
    window.dispatchEvent(new Event("toast-settings-updated"));
    toast.success("Toast settings saved", {
      description: "Your new toast defaults are now applied across the site.",
    });
    window.setTimeout(() => setSaving(false), 500);
  };

  const handleReset = () => {
    setSettings(DEFAULT_TOAST_SETTINGS);
    saveToastSettings(DEFAULT_TOAST_SETTINGS);
    window.dispatchEvent(new Event("toast-settings-updated"));
    toast.success("Toast settings reset", {
      description: "The defaults have been restored.",
    });
  };

  const runPreview = (type) => {
    if (type === "normal") {
      toast("Normal toast", {
        description: "A simple notification for everyday updates.",
      });
      return;
    }

    if (type === "info") {
      toast("Info toast", { description: "Informational message." });
      return;
    }

    if (type === "success") {
      toast.success("Success toast", { description: "Operation completed successfully." });
      return;
    }

    if (type === "warning") {
      toast("Warning toast", { description: "This is a warning message." });
      return;
    }

    if (type === "error") {
      toast.error("Error toast", {
        description: "This shows how critical messages appear.",
      });
      return;
    }

    if (type === "default") {
      toast("Default toast", { description: "Default styling variant." });
      return;
    }

    if (type === "progress") {
      const loadingId = toast.loading("Processing update…", {
        description: "This simulates an in-progress action.",
      });
      window.setTimeout(() => {
        toast.success("Progress complete", {
          id: loadingId,
          description: "The progress toast has finished.",
        });
      }, 1400);
      return;
    }

    if (type === "promise") {
      const p = new Promise((resolve) => setTimeout(() => resolve("done"), 1400));
      toast.promise(p, {
        loading: "Working on promise...",
        success: "Promise resolved",
        error: "Promise failed",
      });
      return;
    }

    if (type === "update") {
      toast.success("Update available", {
        description: "This is a polished update-style notification.",
      });
      return;
    }

    if (type === "clear") {
      try {
        toast.clear();
      } catch (e) {
        // fallback: no-op
      }
      return;
    }
  };

  return (
    <AdminShell title="Features" subtitle="Control toast behavior and preview message types">
      <div className="max-w-4xl space-y-6">
        <section className="hairline bg-card p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="font-display text-xl">Admin shortcuts</div>
              <div className="text-sm text-muted-foreground">Quick links to main admin sections.</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/admin/products" className="h-10 w-40 flex items-center justify-center text-center rounded-md border border-border bg-background px-4 text-sm hover:border-copper">Products</a>
            <a href="/admin/orders" className="h-10 w-40 flex items-center justify-center text-center rounded-md border border-border bg-background px-4 text-sm hover:border-copper">Orders</a>
            <a href="/admin/users" className="h-10 w-40 flex items-center justify-center text-center rounded-md border border-border bg-background px-4 text-sm hover:border-copper">Users</a>
            <a href="/admin/sales" className="h-10 w-40 flex items-center justify-center text-center rounded-md border border-border bg-background px-4 text-sm hover:border-copper">Sales</a>
            <a href="/admin/issues" className="h-10 w-40 flex items-center justify-center text-center rounded-md border border-border bg-background px-4 text-sm hover:border-copper">Support</a>
            <a href="/admin/analytics" className="h-10 w-40 flex items-center justify-center text-center rounded-md border border-border bg-background px-4 text-sm hover:border-copper">Analytics</a>
            <a href="/admin/settings" className="h-10 w-40 flex items-center justify-center text-center rounded-md border border-border bg-background px-4 text-sm hover:border-copper">Settings</a>
          </div>
        </section>
        <div className="hairline bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Toast preview
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Try each message type before saving your defaults.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "normal",
                "info",
                "success",
                "warning",
                "error",
                "default",
                "progress",
                "promise",
                "update",
                "clear",
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => runPreview(type)}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm capitalize transition hover:border-copper"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted-foreground">Position</span>
                <select
                  value={settings.position}
                  onChange={(event) => updateSetting("position", event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm"
                >
                  {POSITIONS.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm text-muted-foreground">Theme</span>
                <select
                  value={settings.theme}
                  onChange={(event) => updateSetting("theme", event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm"
                >
                  {THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm text-muted-foreground">Visible toasts</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.visibleToasts}
                  onChange={(event) => updateSetting("visibleToasts", Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm text-muted-foreground">Duration (ms)</span>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={settings.duration}
                  onChange={(event) => updateSetting("duration", Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm"
                />
              </label>
            </div>

            <div className="space-y-4">
              {[
                ["Rich colors", "richColors"],
                ["Hide progress bar", "hideProgressBar"],
                ["Close on click", "closeOnClick"],
                ["Pause on focus loss", "pauseOnFocusLoss"],
                ["Draggable", "draggable"],
                ["Disable auto-close", "disableAutoClose"],
                ["Newest on top", "newestOnTop"],
                ["Pause on hover", "pauseOnHover"],
                ["RTL layout", "rtl"],
                ["Show close button", "closeButton"],
                ["Expand toast", "expand"],
              ].map(([label, key]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-3 text-sm"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings[key])}
                    onChange={(event) => updateSetting(key, event.target.checked)}
                    className="accent-copper"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="h-10 rounded-md border border-border bg-background px-5 text-sm transition hover:border-copper"
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-md bg-ink px-5 text-sm text-bone transition hover:bg-copper disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save toast settings"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
