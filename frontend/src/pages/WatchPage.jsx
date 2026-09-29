import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  BookmarkPlus,
  Bell,
  Check,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Radio,
  Loader2
} from 'lucide-react';
import { videoApi } from '../api/videoApi.js';
import { commentApi } from '../api/commentApi.js';
import { likeApi } from '../api/likeApi.js';
import { subscriptionApi } from '../api/subscriptionApi.js';
import { authApi } from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { VideoPlayer } from '../components/video/VideoPlayer.jsx';
import { PlaylistSaveModal } from '../components/video/PlaylistSaveModal.jsx';
import { WatchPageSkeleton, CommentSkeleton } from '../components/common/Skeletons.jsx';
import { ErrorState } from '../components/common/EmptyState.jsx';
import { formatViews, formatDuration, formatTimeAgo } from '../utils/formatters.js';

export const WatchPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Video State
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState(false);

  // Channel & Subscription State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [subscribing, setSubscribing] = useState(false);

  // Like & Dislike State
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Share & Save Modal
  const [copied, setCopied] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Recommendations State
  const [upNextVideos, setUpNextVideos] = useState([]);
  const [autoplay, setAutoplay] = useState(true);

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

  // Load Main Video Data
  const loadVideo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await videoApi.getVideoById(videoId);
      const videoData = res?.data;

      if (!videoData) {
        throw new Error('Video data not found');
      }

      setVideo(videoData);

      // Fetch Channel Profile for subscriber count & isSubscribed status
      if (videoData.owner?.username) {
        try {
          const profileRes = await authApi.getUserProfile(videoData.owner.username);
          const channel = profileRes?.data;
          if (channel) {
            setIsSubscribed(channel.isSubscribed || false);
            setSubscribersCount(channel.subscribersCount || 0);
          }
        } catch (subErr) {
          console.warn('Channel profile fetch warning:', subErr);
        }
      }
    } catch (err) {
      console.error('Failed to load video:', err);
      setError(err.response?.data?.message || 'Video could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  // Load Recommendations
  const loadRecommendations = useCallback(async () => {
    try {
      const res = await videoApi.getAllVideos({ limit: 12, sortBy: 'views', sortType: 'desc' });
      const docs = res?.data?.docs || [];
      setUpNextVideos(docs.filter((v) => v._id !== videoId));
    } catch (err) {
      console.warn('Could not load recommendations:', err);
    }
  }, [videoId]);

  // Load Comments
  const loadComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const res = await commentApi.getVideoComments(videoId, { limit: 20 });
      const data = res?.data;
      setComments(data?.docs || []);
      setTotalComments(data?.totalDocs || (data?.docs || []).length);
    } catch (err) {
      console.warn('Could not load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadVideo();
    loadRecommendations();
    loadComments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadVideo, loadRecommendations, loadComments]);

  // Handle Like Toggle
  const handleToggleLike = async () => {
    try {
      const res = await likeApi.toggleVideoLike(videoId);
      const likedState = res?.data?.liked;
      setIsLiked(likedState);
      if (likedState) {
        setLikesCount((prev) => prev + 1);
        setIsDisliked(false);
      } else {
        setLikesCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  const handleToggleDislike = () => {
    setIsDisliked(!isDisliked);
    if (!isDisliked && isLiked) {
      handleToggleLike();
    }
  };

  // Handle Channel Subscription Toggle
  const handleToggleSubscribe = async () => {
    if (!video?.owner?._id || video?.owner?._id === user?._id) return;
    setSubscribing(true);
    try {
      const res = await subscriptionApi.toggleSubscription(video.owner._id);
      const nextSubState = res?.data?.subscribed;
      setIsSubscribed(nextSubState);
      setSubscribersCount((prev) => (nextSubState ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error('Subscription toggle error:', err);
    } finally {
      setSubscribing(false);
    }
  };

  // Handle Share / Copy Link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await commentApi.addComment(videoId, newComment.trim());
      const added = res?.data;
      if (added) {
        // Normalize comment structure for display
        const normalized = {
          _id: added._id,
          content: added.content,
          createdAt: added.createdAt || new Date().toISOString(),
          likesCount: 0,
          isLiked: false,
          ownerDetails: {
            username: user?.username || added.owner?.username || 'You',
            avatar: user?.avatar || added.owner?.avatar,
          },
        };
        setComments((prev) => [normalized, ...prev]);
        setTotalComments((prev) => prev + 1);
        setNewComment('');
      }
    } catch (err) {
      console.error('Add comment failed:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      await commentApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setTotalComments((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete comment failed:', err);
    }
  };

  // Autoplay next video on end
  const handleVideoEnded = () => {
    if (autoplay && upNextVideos.length > 0) {
      navigate(`/watch/${upNextVideos[0]._id}`);
    }
  };

  if (loading) {
    return <WatchPageSkeleton />;
  }

  if (error || !video) {
    return (
      <ErrorState
        title="Video Not Found"
        message={error || 'The requested video does not exist or has been removed.'}
        onRetry={loadVideo}
      />
    );
  }

  const isOwner = user?._id === video.owner?._id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ============================================================== */}
      {/* Main Video & Details Rail (Col Span 2)                          */}
      {/* ============================================================== */}
      <div className="lg:col-span-2 space-y-5">
        {/* Custom Video Player */}
        <VideoPlayer
          src={video.videoFile}
          poster={video.thumbnail}
          title={video.title}
          onEnded={handleVideoEnded}
        />

        {/* Video Title */}
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-snug">
          {video.title}
        </h1>

        {/* Creator Channel Bar & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#1E293B]">
          {/* Channel Info & Subscribe Button */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <Link to={`/c/${video.owner?.username}`}>
                <img
                  src={video.owner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={video.owner?.fullName || 'Creator'}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-blue-500/20 hover:ring-blue-500/60 transition-all shrink-0"
                />
              </Link>

              <div className="flex flex-col min-w-0">
                <Link
                  to={`/c/${video.owner?.username}`}
                  className="text-sm font-bold text-white hover:text-blue-400 transition-colors truncate"
                >
                  {video.owner?.fullName || video.owner?.username}
                </Link>
                <span className="text-xs text-slate-400">
                  {subscribersCount} {subscribersCount === 1 ? 'subscriber' : 'subscribers'}
                </span>
              </div>
            </div>

            {!isOwner && (
              <button
                onClick={handleToggleSubscribe}
                disabled={subscribing}
                className={`ml-auto sm:ml-3 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
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

          {/* Action CTAs (Like/Dislike, Share, Save) */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {/* Segmented Like & Dislike Pill */}
            <div className="flex items-center rounded-xl bg-[#162033] border border-[#1E293B] p-0.5 shrink-0">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isLiked
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-blue-400' : ''}`} />
                <span>{likesCount > 0 ? likesCount : 'Like'}</span>
              </button>

              <div className="w-[1px] h-4 bg-[#1E293B] mx-0.5"></div>

              <button
                onClick={handleToggleDislike}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDisliked
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-[#1E293B]'
                }`}
                title="Dislike"
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${isDisliked ? 'fill-blue-400' : ''}`} />
              </button>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#162033] hover:bg-[#1E293B] text-slate-300 hover:text-white border border-[#1E293B] transition-all shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Save to Playlist */}
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#162033] hover:bg-[#1E293B] text-slate-300 hover:text-white border border-[#1E293B] transition-all shrink-0"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Video Description Box */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 transition-all">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
            <span>{formatViews(video.views)}</span>
            <span>•</span>
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>

          <p
            className={`text-xs text-slate-300 whitespace-pre-wrap leading-relaxed ${
              expandedDesc ? '' : 'line-clamp-3'
            }`}
          >
            {video.description || 'No description provided.'}
          </p>

          {video.description?.length > 150 && (
            <button
              onClick={() => setExpandedDesc(!expandedDesc)}
              className="mt-2 text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>{expandedDesc ? 'Show less' : 'Show more'}</span>
              {expandedDesc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* Comments Section                                               */}
        {/* ============================================================== */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
            </h3>
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-3 items-start">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt="You"
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-blue-500/30"
            />
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Add a comment on this video..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-500 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              {newComment.trim() && (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewComment('')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Comment</span>
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Comments Feed */}
          {commentsLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <CommentSkeleton key={i} />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No comments yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {comments.map((comment) => {
                const canDelete =
                  user?.username === comment.ownerDetails?.username ||
                  user?._id === comment.owner?._id ||
                  isOwner;

                return (
                  <div
                    key={comment._id}
                    className="group flex gap-3 p-3 rounded-xl bg-[#111827]/40 hover:bg-[#111827] border border-transparent hover:border-[#1E293B] transition-all"
                  >
                    <img
                      src={
                        comment.ownerDetails?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={comment.ownerDetails?.username || 'User'}
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">
                            @{comment.ownerDetails?.username || 'user'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* Right Column: "Up Next" Recommendations Rail                    */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* Rail Header with Autoplay Toggle */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Up Next</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Autoplay</span>
            <button
              onClick={() => setAutoplay(!autoplay)}
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                autoplay ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoplay ? 'translate-x-4' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Up Next Video List */}
        <div className="space-y-3">
          {upNextVideos.map((item) => (
            <div
              key={item._id}
              onClick={() => navigate(`/watch/${item._id}`)}
              className="flex gap-3 p-2 rounded-xl bg-[#111827] hover:bg-[#162033] border border-[#1E293B] hover:border-slate-700/60 transition-all cursor-pointer group"
            >
              {/* Mini Thumbnail */}
              <div className="relative w-36 aspect-video bg-[#162033] rounded-lg overflow-hidden shrink-0">
                <img
                  src={
                    item.thumbnail ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                {item.duration !== undefined && (
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[10px] font-semibold text-white">
                    {formatDuration(item.duration)}
                  </span>
                )}
              </div>

              {/* Mini Meta */}
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 line-clamp-2 leading-snug transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-1">
                  {item.owner?.fullName || item.owner?.username}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                  <span>{formatViews(item.views)}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(item.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save to Playlist Modal */}
      <PlaylistSaveModal
        videoId={videoId}
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
      />
    </div>
  );
};
