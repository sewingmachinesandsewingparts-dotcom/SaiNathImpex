const TAB_ID_KEY = "mw_tab_id";

export function getTabId() {
  if (typeof window === "undefined") {
    return null;
  }

  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  return tabId;
}
