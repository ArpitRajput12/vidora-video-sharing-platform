import client from './client.js';

export const tweetApi = {
  // Create a new tweet/community post ({ content })
  createTweet: async (content) => {
    return await client.post('/tweets', { content });
  },

  // Fetch tweets by creator userId
  getUserTweets: async (userId) => {
    return await client.get(`/tweets/user/${userId}`);
  },

  // Update tweet (Note: backend expects "newcontent")
  updateTweet: async (tweetId, newcontent) => {
    return await client.patch(`/tweets/${tweetId}`, { newcontent });
  },

  // Delete tweet
  deleteTweet: async (tweetId) => {
    return await client.delete(`/tweets/${tweetId}`);
  },
};
