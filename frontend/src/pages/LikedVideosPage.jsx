import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, Trash2, Play, ExternalLink, Film, Loader2 } from 'lucide-react';
import { likeApi } from '../api/likeApi.js';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';
import { formatViews, formatDuration } from '../utils/formatters.js';

export const LikedVideosPage = () => {
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLikedVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await likeApi.getLikedVideos();
      const docs = res?.data || [];

      // Normalize items from aggregation
      const normalized = docs.map((doc, idx) => {
        // Fallback for avatar / username if missing in aggregation
        const avatar =
          doc.owner?.avatar && doc.owner.avatar !== 'ownerDetails.avatar'
            ? doc.owner.avatar
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
        const username =
          doc.owner?.username && doc.owner.username !== 'ownerDetails.username'
            ? doc.owner.username
            : 'creator';

        return {
          _id: doc.video || doc._id || `liked-${idx}`,
          likeId: doc._id,
          title: doc.title || 'Liked Video',
          thumbnail:
            doc.thumbnail ||
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
          duration: doc.duration,
          views: doc.views || 0,
          description: doc.description,
          owner: {
            username,
            avatar,
          },
        };
      });

      setLikedVideos(normalized);
    } catch (err) {
      console.error('Failed to load liked videos:', err);
      setError(err.response?.data?.message || 'Could not load your liked videos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLikedVideos();
  }, [fetchLikedVideos]);

  // Remove Like Handler
  const handleRemoveLike = async (item) => {
    try {
      await likeApi.toggleVideoLike(item._id);
      setLikedVideos((prev) => prev.filter((v) => v.likeId !== item.likeId));
    } catch (err) {
      console.error('Failed to remove like:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ThumbsUp className="w-6 h-6 text-purple-400" />
          <span>Liked Videos</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {likedVideos.length} {likedVideos.length === 1 ? 'video' : 'videos'} you have liked on Vidora
        </p>
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Loading liked videos...</span>
        </div>
      ) : error ? (
        <ErrorState title="Failed to load liked videos" message={error} onRetry={fetchLikedVideos} />
      ) : likedVideos.length === 0 ? (
        <EmptyState
          icon={ThumbsUp}
          title="No liked videos yet"
          description="Videos you give a thumbs up to will appear here so you can rewatch them anytime."
        />
      ) : (
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl divide-y divide-[#1E293B]">
          {likedVideos.map((video, idx) => (
            <div
              key={video.likeId}
              className="flex items-center justify-between p-3 sm:p-4 hover:bg-[#162033]/60 transition-colors group"
            >
              {/* Left Details */}
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                <span className="text-xs font-bold text-slate-500 w-4 sm:w-5 text-center shrink-0 hidden sm:inline-block">
                  {idx + 1}
                </span>

                {/* Thumbnail */}
                <Link
                  to={`/watch/${video._id}`}
                  className="relative w-24 sm:w-36 aspect-video rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-[#0F172A] border border-[#1E293B]"
                >
                  <img
                    src={video.thumbnail}
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

                {/* Meta */}
                <div className="min-w-0 space-y-1">
                  <Link
                    to={`/watch/${video._id}`}
                    className="text-sm font-semibold text-slate-200 hover:text-blue-400 line-clamp-1 transition-colors"
                  >
                    {video.title}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Link
                      to={`/c/${video.owner.username}`}
                      className="hover:text-slate-200 transition-colors"
                    >
                      @{video.owner.username}
                    </Link>
                    <span>•</span>
                    <span>{formatViews(video.views)}</span>
                  </div>
                </div>
              </div>

              {/* Right Action: Remove Like */}
              <div className="flex items-center gap-2 shrink-0 pl-4">
                <Link
                  to={`/watch/${video._id}`}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#162033] transition-colors"
                  title="Watch Video"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleRemoveLike(video)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove from Liked Videos"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
