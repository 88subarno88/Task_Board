import axios from 'axios';

// base axios instance - all API calls go through this
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // needed for cookies (JWT)
});

// attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// handle token expiry automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;