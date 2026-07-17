import axios from "axios";

/**
 * Pre-configured Axios instance for all client-side API calls.
 *
 * - baseURL is set from NEXT_PUBLIC_API_URL env var (falls back to "" for same-origin calls).
 * - withCredentials ensures auth cookies/sessions are sent on every request.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  withCredentials: true,
});

export default api;
