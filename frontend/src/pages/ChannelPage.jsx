import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Film,
  MessageSquare,
  Check,
  Loader2,
  Globe,
  Sparkles
} from 'lucide-react';
import { authApi } from '../api/authApi.js';
import { videoApi } from '../api/videoApi.js';
import { tweetApi } from '../api/tweetApi.js';
import { subscriptionApi } from '../api/subscriptionApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { VideoCard } from '../components/video/VideoCard.jsx';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';
import { formatTimeAgo } from '../utils/formatters.js';

export const ChannelPage = () => {
  const { username } = useParams();
  const { user } = useAuth();

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('videos'); // 'videos', 'community'
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [subscribing, setSubscribing] = useState(false);

  const loadChannelData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Channel Profile
      const profileRes = await authApi.getUserProfile(username);
      const ch = profileRes?.data;
      if (!ch) throw new Error('Channel not found');

      setChannel(ch);
      setIsSubscribed(ch.isSubscribed || false);
      setSubscribersCount(ch.subscribersCount || 0);

      // 2. Fetch Channel Videos
      try {
        const videosRes = await videoApi.getAllVideos({ userId: ch._id });
        setVideos(videosRes?.data?.docs || []);
      } catch (vErr) {
        console.warn('Channel videos fetch warning:', vErr);
      }

      // 3. Fetch Channel Tweets
      try {
        const tweetsRes = await tweetApi.getUserTweets(ch._id);
        setTweets(tweetsRes?.data || []);
      } catch (tErr) {
        setTweets([]);
      }
    } catch (err) {
      console.error('Failed to load channel:', err);
      setError(err.response?.data?.message || 'Channel does not exist.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadChannelData();
  }, [loadChannelData]);

  const handleToggleSub = async () => {
    if (!channel?._id || channel._id === user?._id) return;
    setSubscribing(true);
    try {
      const res = await subscriptionApi.toggleSubscription(channel._id);
      const isSub = res?.data?.subscribed;
      setIsSubscribed(isSub);
      setSubscribersCount((prev) => (isSub ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs text-slate-400">Loading channel profile...</span>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <ErrorState title="Channel Not Found" message={error} onRetry={loadChannelData} />
    );
  }

  const isOwner = user?._id === channel._id;

  return (
    <div className="space-y-6">
      {/* Channel Banner & Header */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
        {/* Cover Banner */}
        <div className="h-28 sm:h-36 w-full bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 overflow-hidden relative">
          {channel.coverImage && (
            <img
              src={channel.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-0 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-10 sm:-mt-12">
          <div className="flex items-end gap-3 sm:gap-4">
            <img
              src={channel.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={channel.fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover ring-4 ring-[#111827] shadow-xl shrink-0"
            />
            <div className="mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white">{channel.fullName}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Creator
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                @{channel.username} •{' '}
                <span className="text-slate-300 font-semibold">{subscribersCount} subscribers</span>
              </p>
            </div>
          </div>

          {!isOwner && (
            <button
              onClick={handleToggleSub}
              disabled={subscribing}
              className={`mb-1 w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isSubscribed
                  ? 'bg-[#162033] hover:bg-[#1E293B] text-slate-300 border border-[#1E293B]'
                  : 'bg-white hover:bg-slate-200 text-slate-900 shadow-md'
              }`}
            >
              {subscribing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isSubscribed ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Subscribed</span>
                </>
              ) : (
                <span>Subscribe</span>
              )}
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 flex gap-6 border-t border-[#1E293B] text-xs font-bold">
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'videos'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Videos ({videos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'community'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Community ({tweets.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'videos' ? (
        videos.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No videos uploaded yet"
            description="This creator has not published any videos yet."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((vid) => (
              <VideoCard key={vid._id} video={vid} />
            ))}
          </div>
        )
      ) : tweets.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No community posts"
          description="This channel hasn't shared any community posts yet."
        />
      ) : (
        <div className="space-y-4 max-w-2xl">
          {tweets.map((tweet) => (
            <div
              key={tweet._id}
              className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={channel.avatar}
                  alt={channel.username}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-white">{channel.fullName}</div>
                  <div className="text-[10px] text-slate-500">{formatTimeAgo(tweet.createdAt)}</div>
                </div>
              </div>
              <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {tweet.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
