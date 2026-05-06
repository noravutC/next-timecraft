import axios from "axios";
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

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized - Redirect to login");
      // Optional: Add logic to handle unauthorized requests
    }
    return Promise.reject(error);
  },
);

export default apiClient;
