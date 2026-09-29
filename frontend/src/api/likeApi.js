import client from './client.js';

export const likeApi = {
  // Toggle like on a video
  toggleVideoLike: async (videoId) => {
    return await client.post(`/likes/toggle/v/${videoId}`);
  },

  // Toggle like on a comment
  toggleCommentLike: async (commentId) => {
    return await client.post(`/likes/toggle/c/${commentId}`);
  },

  // Toggle like on a tweet
  toggleTweetLike: async (tweetId) => {
    return await client.post(`/likes/toggle/t/${tweetId}`);
  },

  // Fetch liked videos
  getLikedVideos: async () => {
    return await client.get('/likes/videos');
  },
};
