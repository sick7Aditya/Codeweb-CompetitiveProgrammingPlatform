import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Remove token from storage
            localStorage.removeItem("token");
            // Dispatch a custom event so AuthContext can clear React state
            // without creating a circular dependency on useAuth() here
            window.dispatchEvent(new Event("auth:logout"));
            // Redirect to login page (correct route is "/", not "/login")
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;
