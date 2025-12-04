import axios from "axios";

const API = axios.create({
    baseURL: 'https://shoppingcartb.duckdns.org',
    headers: {
        'Content-Type': 'application/json'
    }
});


API.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;   
    },
    error => {
        return Promise.reject(error);
    }
);

API.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {

            const isAuthEndpoint = error.config?.url?.includes('/auth/');

            if (!isAuthEndpoint) {
                localStorage.removeItem('token');
                window.location.href = '/';
            }   
        }
        return Promise.reject(error);
    }
);

export default API;
