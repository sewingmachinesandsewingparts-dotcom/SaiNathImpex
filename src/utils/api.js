import axios from "axios";
import { getTabId } from "@/src/utils/tab-id";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const tabId = getTabId();
  if (tabId) {
    config.headers = config.headers || {};
    config.headers["x-mw-tab-id"] = tabId;
  }
  return config;
});

export default api;
