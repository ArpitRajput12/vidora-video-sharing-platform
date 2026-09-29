import client from './client.js';

export const subscriptionApi = {
  // Toggle subscription to a channel
  toggleSubscription: async (channelId) => {
    return await client.post(`/subscriptions/c/${channelId}`);
  },

  // Get subscriber list of a channel
  getChannelSubscribers: async (channelId) => {
    return await client.get(`/subscriptions/c/${channelId}`);
  },

  // Get list of channels a user has subscribed to
  getSubscribedChannels: async (subscriberId) => {
    return await client.get(`/subscriptions/u/${subscriberId}`);
  },
};
