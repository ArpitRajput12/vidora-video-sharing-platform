import client from './client.js';

export const videoApi = {
  // Fetch paginated videos with optional search query, sort, and userId filter
  getAllVideos: async (params = {}) => {
    return await client.get('/videos', { params });
  },

  // Fetch single video details and increment view count
  getVideoById: async (videoId) => {
    return await client.get(`/videos/${videoId}`);
  },

  // Upload and publish new video
  publishVideo: async (formData, onProgress) => {
    return await client.post('/videos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  // Update video title, description, or thumbnail
  updateVideo: async (videoId, formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return await client.patch(`/videos/${videoId}`, formDataOrJson, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  // Delete a video
  deleteVideo: async (videoId) => {
    return await client.delete(`/videos/${videoId}`);
  },

  // Toggle video isPublished status
  togglePublishStatus: async (videoId) => {
    return await client.patch(`/videos/toggle/publish/${videoId}`);
  },
};
