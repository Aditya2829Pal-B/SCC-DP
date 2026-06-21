import axios from 'axios';

/**
 * Axios API instance pre-configured for the SCC&DP backend
 * Falls back to mock mode if backend is unavailable
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('scc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('scc_token');
      localStorage.removeItem('scc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
