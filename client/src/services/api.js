import axios from 'axios';

const instance = axios.create({ baseURL: '/api', timeout: 15000 });
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
    // Log upload requests
    if (config.url?.includes('upload') || config.url?.includes('profile-picture')) {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
      console.log('Headers:', {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers['Authorization'] ? 'Present' : 'Missing'
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default { instance, setToken };
