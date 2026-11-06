import axios from "axios";
import { getSession } from "next-auth/react";
import { getPusherSocketId } from "@/lib/pusher-client";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Or use cookies if SSR
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const socketId = getPusherSocketId();
    if (socketId) {
      config.headers["X-Socket-Id"] = socketId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// A 401 means the session may have run out: re-read it, so the app shows
// "Your session expired" (once, however many requests failed together)
let sessionCheck: Promise<unknown> | null = null;
const recheckSession = () => {
  sessionCheck ??= getSession().finally(() => {
    sessionCheck = null;
  });
};

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) recheckSession();
    return Promise.reject(error);
  },
);

export default apiClient;
