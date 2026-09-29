import client from './client.js';

export const playlistApi = {
  // Create playlist ({ name, description })
  createPlaylist: async (data) => {
    return await client.post('/playlist', data);
  },

  // Get user's playlists
  getUserPlaylists: async (userId) => {
    return await client.get(`/playlist/user/${userId}`);
  },

  // Get detailed playlist with populated videos
  getPlaylistById: async (playlistId) => {
    return await client.get(`/playlist/${playlistId}`);
  },

  // Add video to playlist
  addVideoToPlaylist: async (videoId, playlistId) => {
    return await client.patch(`/playlist/add/${videoId}/${playlistId}`);
  },

  // Remove video from playlist
  removeVideoFromPlaylist: async (videoId, playlistId) => {
    return await client.patch(`/playlist/remove/${videoId}/${playlistId}`);
  },

  // Update playlist
  updatePlaylist: async (playlistId, data) => {
    return await client.patch(`/playlist/${playlistId}`, data);
  },

  // Delete playlist
  deletePlaylist: async (playlistId) => {
    return await client.delete(`/playlist/${playlistId}`);
  },
};
