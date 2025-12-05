import axios from 'axios';

// Create axios instance with custom config
const instance = axios.create({
  baseURL: 'https://pharmalink-website.onrender.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect for authentication endpoints or if we're already on login pages
      const currentPath = window.location.pathname;
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      const isOnLoginPage = currentPath === '/login' || currentPath === '/admin/login';
      
      if (!isAuthEndpoint && !isOnLoginPage) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance; 
