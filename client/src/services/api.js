import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔍 Environment:', import.meta.env.MODE);

const instance = axios.create({ 
  baseURL: `${API_BASE_URL}/api`, 
  timeout: 30000,  // Increased timeout
  withCredentials: false
});
let token = null;

// Mark network errors so UI can show meaningful messages
instance.interceptors.response.use(
  res => res,
  err => {
    if (!err.response) {
      // network / CORS / backend down
      err.isNetworkError = true;
    }
    return Promise.reject(err);
  }
);

const setToken = (t) => {
  token = t;
  if (t) instance.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  else delete instance.defaults.headers.common['Authorization'];
};

// Request interceptor for debugging
instance.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', config.method?.toUpperCase(), config.url, 'Base:', config.baseURL);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

export default { instance, setToken };
