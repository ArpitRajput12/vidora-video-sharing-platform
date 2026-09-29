import client from './client.js';

export const dashboardApi = {
  // Fetch channel high-level statistics (totalVideos, totalViews, totalSubscribers, totalLikes)
  getChannelStats: async () => {
    return await client.get('/dashboard/stats');
  },

  // Fetch all creator videos (published and unpublished) with likesCount and commentsCount
  getChannelVideos: async () => {
    return await client.get('/dashboard/videos');
  },
};
