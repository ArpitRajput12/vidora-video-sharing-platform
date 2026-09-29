import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Check, Users, Tv, Compass, Loader2 } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';

export const SubscriptionsPage = () => {
  const { user } = useAuth();

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'channels', 'latest'
  const [togglingId, setTogglingId] = useState(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await subscriptionApi.getSubscribedChannels(user._id);
      const docs = res?.data || [];

      // Clean up projected channel details (handles backend projection nuances)
      const formatted = docs.map((doc) => {
        const username =
          doc.username && doc.username !== 'channelDetails.username'
            ? doc.username
            : 'creator';
        const avatar =
          doc.avatar && doc.avatar !== 'channelDetails.avatar'
            ? doc.avatar
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
        return {
          _id: doc.channel || doc._id,
          username,
          avatar,
          coverImage: doc.coverImage,
          isSubscribed: true,
        };
      });

      setChannels(formatted);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setError(err.response?.data?.message || 'Could not load your subscribed channels.');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleToggleSub = async (channelId) => {
    setTogglingId(channelId);
    try {
      const res = await subscriptionApi.toggleSubscription(channelId);
      const isSub = res?.data?.subscribed;
      setChannels((prev) =>
        prev.map((c) => (c._id === channelId ? { ...c, isSubscribed: isSub } : c))
      );
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <UserCheck className="w-6 h-6 text-blue-500" />
          <span>Subscriptions</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Channels you follow on Vidora. Keep up with your favorite creators and their uploads.
        </p>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: 'All Channels' },
          { id: 'channels', label: 'Verified Creators' },
          { id: 'latest', label: 'Recently Subscribed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-blue-500'
                : 'bg-[#162033] text-slate-300 hover:text-white hover:bg-[#1E293B] border border-[#1E293B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscriptions Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Loading your subscriptions...</span>
        </div>
      ) : error ? (
        <ErrorState title="Failed to load subscriptions" message={error} onRetry={fetchSubscriptions} />
      ) : channels.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No subscriptions yet"
          description="You haven't subscribed to any creators yet. Explore trending videos and channels!"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {channels.map((ch) => (
            <div
              key={ch._id}
              className="bg-[#111827] border border-[#1E293B] hover:border-slate-700/80 rounded-2xl p-5 flex flex-col items-center text-center transition-all shadow-sm group hover:-translate-y-1 hover:shadow-lg"
            >
              <Link to={`/c/${ch.username}`} className="relative mb-3">
                <img
                  src={ch.avatar}
                  alt={ch.username}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500/60 transition-all"
                />
              </Link>

              <Link
                to={`/c/${ch.username}`}
                className="text-sm font-bold text-white hover:text-blue-400 transition-colors truncate max-w-[180px]"
              >
                @{ch.username}
              </Link>

              <span className="text-[11px] text-slate-400 mt-0.5">Verified Channel</span>

              <button
                onClick={() => handleToggleSub(ch._id)}
                disabled={togglingId === ch._id}
                className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  ch.isSubscribed
                    ? 'bg-[#162033] hover:bg-[#1E293B] text-slate-300 border border-[#1E293B]'
                    : 'bg-white hover:bg-slate-200 text-slate-900 shadow-md'
                }`}
              >
                {togglingId === ch._id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : ch.isSubscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
