export const DEFAULT_TOAST_SETTINGS = {
  position: "top-right",
  richColors: true,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  draggable: true,
  disableAutoClose: false,
  newestOnTop: true,
  pauseOnHover: true,
  rtl: false,
  closeButton: true,
  expand: true,
  duration: 4000,
  visibleToasts: 4,
  theme: "light",
};

const STORAGE_KEY = "app-toast-settings";

export function loadToastSettings() {
  if (typeof window === "undefined") {
    return { ...DEFAULT_TOAST_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_TOAST_SETTINGS };
    }

    return { ...DEFAULT_TOAST_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.error("Unable to load toast settings", error);
    return { ...DEFAULT_TOAST_SETTINGS };
  }
}

export function saveToastSettings(settings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Unable to save toast settings", error);
  }
}
