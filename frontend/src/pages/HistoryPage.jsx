import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { History, Play, Trash2, Film, Loader2 } from 'lucide-react';
import { authApi } from '../api/authApi.js';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';
import { formatViews, formatDuration, formatTimeAgo } from '../utils/formatters.js';

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.getWatchHistory();
      setHistory(res?.data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err.response?.data?.message || 'Could not load your watch history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <History className="w-6 h-6 text-blue-500" />
          <span>Watch History</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Videos you have recently watched across Vidora.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Loading watch history...</span>
        </div>
      ) : error ? (
        <ErrorState title="Failed to load history" message={error} onRetry={fetchHistory} />
      ) : history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No watch history yet"
          description="Videos you watch will appear here so you can easily find them later."
        />
      ) : (
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl divide-y divide-[#1E293B]">
          {history.map((video, idx) => (
            <div
              key={video._id || idx}
              className="flex items-center justify-between p-4 hover:bg-[#162033]/60 transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-xs font-bold text-slate-500 w-5 text-center shrink-0">
                  {idx + 1}
                </span>

                <Link
                  to={`/watch/${video._id}`}
                  className="relative w-36 aspect-video rounded-xl overflow-hidden shrink-0 bg-[#0F172A] border border-[#1E293B]"
                >
                  <img
                    src={
                      video.thumbnail ||
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {video.duration !== undefined && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-semibold text-white">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-5 h-5 fill-white text-white" />
                  </div>
                </Link>

                <div className="min-w-0 space-y-1">
                  <Link
                    to={`/watch/${video._id}`}
                    className="text-sm font-semibold text-slate-200 hover:text-blue-400 line-clamp-1 transition-colors"
                  >
                    {video.title}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{video.owner?.fullName || video.owner?.username || 'Creator'}</span>
                    <span>•</span>
                    <span>{formatViews(video.views)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
