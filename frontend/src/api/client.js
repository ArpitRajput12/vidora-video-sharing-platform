import axios from 'axios';

// Centralized API Base URL with production fallback
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://vidora-video-sharing-platform.onrender.com/api/v1';

// Centralized Axios Client
const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for HTTP-only cookies
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

// Request Interceptor
// Attach access token if available in localStorage
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

// Response Interceptor
// Automatically refresh access token when API returns 401
client.interceptors.response.use(
  (response) => {
    // Backend ApiResponse envelope:
    // { statusCode, data, message, success }
    return response.data;
  },

  async (error) => {
    const originalRequest = error.config;

    // Network error / no response
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;

    // Do not refresh token for authentication routes
    const isAuthRoute =
      originalRequest.url?.includes('/users/login') ||
      originalRequest.url?.includes('/users/register') ||
      originalRequest.url?.includes('/users/refresh-token');

    // Handle 401 Unauthorized
    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      // If another request is already refreshing token,
      // wait for that request to finish.
      if (isRefreshing) {
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
        const storedRefreshToken =
          localStorage.getItem('vidora_refresh_token');

        // IMPORTANT:
        // Use VITE_API_URL so production requests go to Render,
        // not to the Vercel frontend.
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {
            refreshToken: storedRefreshToken || undefined,
          },
          {
            withCredentials: true,
          }
        );

        const newAccessToken =
          refreshResponse.data?.data?.accessToken;

        const newRefreshToken =
          refreshResponse.data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem(
            'vidora_access_token',
            newAccessToken
          );

          if (newRefreshToken) {
            localStorage.setItem(
              'vidora_refresh_token',
              newRefreshToken
            );
          }

          // Update default Authorization header
          client.defaults.headers.common.Authorization =
            `Bearer ${newAccessToken}`;

          // Update original failed request
          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

          // Resolve queued requests
          processQueue(null, newAccessToken);

          // Retry original request
          return client(originalRequest);
        }

        throw new Error(
          'No access token returned from refresh'
        );
      } catch (refreshError) {
        processQueue(refreshError, null);

        localStorage.removeItem('vidora_access_token');
        localStorage.removeItem('vidora_refresh_token');
        localStorage.removeItem('vidora_user');

        // Redirect to login
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login')
        ) {
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