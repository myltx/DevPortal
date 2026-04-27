import axios from "axios";
import { message } from "antd";

const service = axios.create({
  baseURL: "/api", // Next.js API Routes
  timeout: 10000,
});

service.interceptors.request.use(
  (config) => {
    // Add token if exists (mock)
    // In real app, get from cookie or localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : "";
    if (token) {
        config.headers["Authorization"] = token;
    }
    
    // Audit Log Header
    if (typeof window !== 'undefined') {
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser) {
            config.headers["x-user-name"] = encodeURIComponent(currentUser);
        }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // Assuming backend standard response: { code: 200, success: true, data: ... }
    if (res.code !== 200 && res.success !== true) {
        // Handle errors
        message.error(res.msg || "Error");
        return Promise.reject(new Error(res.msg || "Error"));
    }
    return res;
  },
  (error) => {
    message.error(error.message || "Request Error");
    return Promise.reject(error);
  }
);

import { AxiosRequestConfig } from "axios";

// ... (interceptors)

const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  // @ts-ignore
  return service(config) as Promise<T>;
};

export default request;
