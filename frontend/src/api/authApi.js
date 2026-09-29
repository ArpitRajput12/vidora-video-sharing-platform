import client from './client.js';

export const authApi = {
  // Login with email or username and password
  login: async (credentials) => {
    return await client.post('/users/login', credentials);
  },

  // Register with multipart form data (fullName, email, username, password, avatar, coverImage)
  register: async (formData) => {
    return await client.post('/users/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Logout current session
  logout: async () => {
    return await client.post('/users/logout');
  },

  // Fetch current authenticated user
  getCurrentUser: async () => {
    return await client.get('/users/current-user');
  },

  // Update account details (fullName, email)
  updateAccount: async (data) => {
    return await client.patch('/users/update-account', data);
  },

  // Update avatar file
  updateAvatar: async (formData) => {
    return await client.patch('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update cover image file
  updateCoverImage: async (formData) => {
    return await client.patch('/users/cover-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Change password
  changePassword: async (data) => {
    return await client.post('/users/change-password', data);
  },

  // Get public channel profile by username
  getUserProfile: async (username) => {
    return await client.get(`/users/c/${username}`);
  },

  // Get user's watch history
  getWatchHistory: async () => {
    return await client.get('/users/history');
  },
};
