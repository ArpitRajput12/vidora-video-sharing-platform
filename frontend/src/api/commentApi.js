import client from './client.js';

export const commentApi = {
  // Fetch paginated comments for a video
  getVideoComments: async (videoId, params = {}) => {
    return await client.get(`/comments/${videoId}`, { params });
  },

  // Add a new comment to a video
  addComment: async (videoId, content) => {
    return await client.post(`/comments/${videoId}`, { content });
  },

  // Update a comment (Note: backend expects payload property "newComment")
  updateComment: async (commentId, newComment) => {
    return await client.patch(`/comments/c/${commentId}`, { newComment });
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    return await client.delete(`/comments/c/${commentId}`);
  },
};
