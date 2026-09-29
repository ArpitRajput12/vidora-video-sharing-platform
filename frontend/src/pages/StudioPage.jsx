import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Eye,
  ThumbsUp,
  Clock,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  MessageSquare,
  Image as ImageIcon,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Globe,
  Lock,
  BarChart2
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi.js';
import { authApi } from '../api/authApi.js';
import { tweetApi } from '../api/tweetApi.js';
import { videoApi } from '../api/videoApi.js';
import { commentApi } from '../api/commentApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EditVideoModal } from '../components/video/EditVideoModal.jsx';
import { formatViews, formatDuration, formatTimeAgo } from '../utils/formatters.js';

export const StudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Studio Data States
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0,
    totalLikes: 0,
  });
  const [videos, setVideos] = useState([]);
  const [profile, setProfile] = useState(null);
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Video Management Tabs
  const [videoFilterTab, setVideoFilterTab] = useState('all'); // 'all', 'published', 'drafts'
  const [selectedVideoToEdit, setSelectedVideoToEdit] = useState(null);

  // Quick Tweet Composer State
  const [tweetContent, setTweetContent] = useState('');
  const [postingTweet, setPostingTweet] = useState(false);
  const [tweetSuccess, setTweetSuccess] = useState(false);

  // Load Studio & Dashboard Data
  const loadStudioData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch channel stats & creator videos concurrently
      const [statsRes, videosRes] = await Promise.allSettled([
        dashboardApi.getChannelStats(),
        dashboardApi.getChannelVideos(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }

      let fetchedVideos = [];
      if (videosRes.status === 'fulfilled' && videosRes.value?.data) {
        fetchedVideos = videosRes.value.data || [];
        setVideos(fetchedVideos);
      }

      // 2. Fetch Channel profile for subscriber count & coverImage
      if (user?.username) {
        try {
          const profileRes = await authApi.getUserProfile(user.username);
          if (profileRes?.data) {
            setProfile(profileRes.data);
          }
        } catch (pErr) {
          console.warn('Channel profile fetch warning:', pErr);
        }
      }

      // 3. Load latest comments from the creator's latest video if available
      if (fetchedVideos.length > 0) {
        try {
          const firstVideoId = fetchedVideos[0]._id;
          const commentsRes = await commentApi.getVideoComments(firstVideoId, { limit: 5 });
          setRecentComments(commentsRes?.data?.docs || []);
        } catch (cErr) {
          console.warn('Recent comments load warning:', cErr);
        }
      }
    } catch (err) {
      console.error('Failed to load studio data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadStudioData();
  }, [loadStudioData]);

  // Quick Post / Tweet Submit
  const handlePostTweet = async (e) => {
    e.preventDefault();
    if (!tweetContent.trim() || postingTweet) return;

    setPostingTweet(true);
    try {
      await tweetApi.createTweet(tweetContent.trim());
      setTweetContent('');
      setTweetSuccess(true);
      setTimeout(() => setTweetSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create tweet:', err);
    } finally {
      setPostingTweet(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (videoId) => {
    try {
      const res = await videoApi.togglePublishStatus(videoId);
      const updated = res?.data;
      setVideos((prev) =>
        prev.map((v) => (v._id === videoId ? { ...v, isPublished: updated?.isPublished } : v))
      );
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  // Delete Video
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to permanently delete this video?')) return;

    try {
      await videoApi.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      setStats((prev) => ({
        ...prev,
        totalVideos: Math.max(0, prev.totalVideos - 1),
      }));
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  // Filtered Videos List
  const filteredVideos = videos.filter((v) => {
    if (videoFilterTab === 'published') return v.isPublished;
    if (videoFilterTab === 'drafts') return !v.isPublished;
    return true;
  });

  // Calculate estimated watch hours from views
  const estimatedWatchHours = (stats.totalViews * 0.08).toFixed(1);

  return (
    <div className="space-y-7">
      {/* ============================================================== */}
      {/* 1. Creator Profile Header Bar                                  */}
      {/* ============================================================== */}
      <div className="relative bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
        {/* Subtle decorative cover banner */}
        <div className="h-28 w-full bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border-b border-[#1E293B] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        </div>

        <div className="px-6 pb-6 pt-0 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-10">
          <div className="flex items-end gap-4">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt={user?.fullName || 'Creator'}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#111827] shadow-xl shrink-0"
            />
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {user?.fullName || 'Channel Studio'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Creator Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                @{user?.username || 'handle'} •{' '}
                <span className="text-slate-300 font-medium">
                  {profile?.subscribersCount ?? stats.totalSubscribers} Subscribers
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mb-1">
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#162033] hover:bg-[#1E293B] text-slate-200 border border-[#1E293B] transition-all"
            >
              Edit Channel
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. Four Analytics Stat Cards (Subscribers, Views, Likes, Hours)*/}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subscribers Card */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Subscribers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2.5 tracking-tight">
            {loading ? '--' : stats.totalSubscribers.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1.5">
            <span className="font-semibold">+12.4%</span>
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>

        {/* Total Views Card */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Views</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2.5 tracking-tight">
            {loading ? '--' : stats.totalViews.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1.5">
            <span className="font-semibold">+8.2%</span>
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>

        {/* Total Likes Card */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Likes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2.5 tracking-tight">
            {loading ? '--' : stats.totalLikes.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1.5">
            <span className="font-semibold">+5.1%</span>
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>

        {/* Watch Time Card */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Watch Time (Hours)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2.5 tracking-tight">
            {loading ? '--' : `${estimatedWatchHours} hrs`}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1.5">
            <span className="font-semibold">+14.0%</span>
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. 7-Day Mini Analytics Chart + Recent Comments Rail           */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trajectory Area Chart (Col span 2) */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <span>Views Overview (Last 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Channel engagement has grown by 18% this week
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#162033] text-blue-400 border border-[#1E293B]">
              +4,820 Views
            </span>
          </div>

          {/* SVG Sparkline Area Chart */}
          <div className="relative w-full h-44 mt-2">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#1E293B" strokeDasharray="3 3" />

              {/* Area Fill */}
              <polygon
                fill="url(#chartGradient)"
                points="0,120 0,90 80,65 160,85 240,40 320,60 400,25 480,45 500,50 500,150 0,150"
              />

              {/* Curved Line */}
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,90 80,65 160,85 240,40 320,60 400,25 480,45 500,50"
              />

              {/* Highlight Dot on Peak */}
              <circle cx="400" cy="25" r="5" fill="#3B82F6" stroke="#0F172A" strokeWidth="2" />
            </svg>
          </div>

          {/* Days Label Row */}
          <div className="flex justify-between text-[11px] text-slate-500 pt-3 border-t border-[#1E293B]">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Recent Comments Rail (Col span 1) */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Latest Comments</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Channel wide</span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-56">
            {recentComments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent comments yet.
              </div>
            ) : (
              recentComments.map((comment) => (
                <div
                  key={comment._id}
                  className="flex gap-2.5 p-2 rounded-xl bg-[#162033]/40 border border-[#1E293B]/60"
                >
                  <img
                    src={
                      comment.ownerDetails?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                    }
                    alt="User"
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-200 truncate">
                        @{comment.ownerDetails?.username || 'viewer'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. Quick Community Post / Tweet Composer                       */}
      {/* ============================================================== */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Share an update with your audience...</span>
          </span>
          {tweetSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Post published!</span>
            </span>
          )}
        </div>

        <form onSubmit={handlePostTweet} className="space-y-3">
          <div className="flex gap-3 items-start">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt="You"
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-blue-500/30"
            />
            <textarea
              rows={2}
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
              placeholder="What's on your mind? Share news, upcoming video teasers, or announcements..."
              className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-500 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 pl-12 text-slate-400 text-xs">
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-[#162033] transition-colors"
                title="Add Media / Poll in Community Studio"
              >
                <ImageIcon className="w-4 h-4 text-blue-400" />
              </button>
              <span className="text-[11px] text-slate-500">Supports text & announcements</span>
            </div>

            <button
              type="submit"
              disabled={postingTweet || !tweetContent.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              {postingTweet ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post Update</span>
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================== */}
      {/* 5. "Your Videos" Management Section                           */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Your Videos</h2>
            <p className="text-xs text-slate-400">
              Manage video visibility, view metrics, and edit metadata
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111827] border border-[#1E293B]">
            {['all', 'published', 'drafts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setVideoFilterTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  videoFilterTab === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#162033]'
                }`}
              >
                {tab === 'drafts' ? 'Unpublished' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Video Cards Grid */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#162033] flex items-center justify-center text-slate-400 mx-auto">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No videos in this category</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't uploaded any videos yet or none match the selected filter.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md"
            >
              Upload First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.map((item) => (
              <div
                key={item._id}
                className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden flex flex-col group hover:border-slate-700 transition-all shadow-sm"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-[#162033] w-full overflow-hidden">
                  <img
                    src={
                      item.thumbnail ||
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {item.duration !== undefined && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-[10px] font-semibold text-white">
                      {formatDuration(item.duration)}
                    </span>
                  )}

                  {/* Status Pill on Thumbnail */}
                  <span
                    className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 backdrop-blur-md ${
                      item.isPublished
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.isPublished ? (
                      <>
                        <Globe className="w-3 h-3" />
                        <span>Published</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Draft</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {item.description || 'No description.'}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 py-1.5 border-y border-[#1E293B]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>{formatViews(item.views)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.likesCount || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{item.commentsCount || 0}</span>
                    </span>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Toggle Publish Switch */}
                    <button
                      onClick={() => handleTogglePublish(item._id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                        item.isPublished
                          ? 'border-[#1E293B] text-slate-300 hover:text-amber-400 hover:border-amber-500/30'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {item.isPublished ? 'Unpublish' : 'Publish'}
                    </button>

                    <div className="flex items-center gap-1">
                      <Link
                        to={`/watch/${item._id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#162033] transition-colors"
                        title="Watch on Vidora"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => setSelectedVideoToEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Edit Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteVideo(item._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Video Modal */}
      {selectedVideoToEdit && (
        <EditVideoModal
          video={selectedVideoToEdit}
          isOpen={!!selectedVideoToEdit}
          onClose={() => setSelectedVideoToEdit(null)}
          onSuccess={(updated) => {
            setVideos((prev) =>
              prev.map((v) => (v._id === updated._id ? { ...v, ...updated } : v))
            );
          }}
        />
      )}
    </div>
  );
};
