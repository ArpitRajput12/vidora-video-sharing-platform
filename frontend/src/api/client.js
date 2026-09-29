import axios from 'axios';

// Centralized Axios Client
const client = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Crucial for sending & receiving HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach bearer token if available in storage (dual auth support)
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vidora_access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto token refresh on 401 Unauthorized
client.interceptors.response.use(
  (response) => {
    return response.data; // Return the backend ApiResponse envelope { statusCode, data, message, success }
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;

    // Do not attempt token refresh for login, register, or refresh-token calls
    const isAuthRoute =
      originalRequest.url.includes('/users/login') ||
      originalRequest.url.includes('/users/register') ||
      originalRequest.url.includes('/users/refresh-token');

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue pending requests while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('vidora_refresh_token');

        // Post to refresh token endpoint with cookie or payload
        const refreshResponse = await axios.post(
          '/api/v1/users/refresh-token',
          { refreshToken: storedRefreshToken || undefined },
          { withCredentials: true }
        );

        const newAccessToken =
          refreshResponse.data?.data?.accessToken;
        const newRefreshToken =
          refreshResponse.data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('vidora_access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('vidora_refresh_token', newRefreshToken);
          }

          client.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return client(originalRequest);
        } else {
          throw new Error('No access token returned from refresh');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('vidora_access_token');
        localStorage.removeItem('vidora_refresh_token');
        localStorage.removeItem('vidora_user');

        // Redirect to login if unauthenticated
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
