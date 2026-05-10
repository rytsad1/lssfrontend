// axios.js
import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

instance.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = 'application/json';
    return config;
});

// Atsakymo interceptor — auto logout, jei tokenas pasibaigė
instance.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            // jei norėsi auto-redirect: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;