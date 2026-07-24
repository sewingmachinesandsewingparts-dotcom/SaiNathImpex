import axios from "axios";
import { ensureTabSession, buildTabAuthHeaders, persistTabSession, clearTabSession, getTabSession } from "@/src/lib/tab-session";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const session = ensureTabSession();
  const headers = buildTabAuthHeaders(session, config.headers || {});

  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const payload = response?.data;
    if (payload && payload.accessToken && payload.refreshToken) {
      persistTabSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        tabId: payload.tabId || getTabSession()?.tabId,
      });
    }

    if (response?.status === 401 && payload?.message) {
      clearTabSession();
    }

    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      clearTabSession();
    }
    return Promise.reject(error);
  },
);

export default api;
