
import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});


api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_BASE_URL}/Login/RefreshToken`, { refreshToken });
                    localStorage.setItem("accessToken", data.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error("Token refresh failed:", refreshError);
                    localStorage.clear();
                    window.location.href = "/sign-in";
                }
            } else {
                localStorage.clear();
                window.location.href = "/sign-in";
            }
        }
        return Promise.reject(error);
    }
);
