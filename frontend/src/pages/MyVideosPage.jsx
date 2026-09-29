import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Film,
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  Lock,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Loader2,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi.js';
import { videoApi } from '../api/videoApi.js';
import { EditVideoModal } from '../components/video/EditVideoModal.jsx';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';
import { formatViews, formatDuration, formatTimeAgo } from '../utils/formatters.js';

export const MyVideosPage = () => {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'drafts', 'scheduled'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'views', 'likes'
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid'

  // Modal
  const [selectedVideoToEdit, setSelectedVideoToEdit] = useState(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getChannelVideos();
      setVideos(res?.data || []);
    } catch (err) {
      console.error('Failed to load channel videos:', err);
      setError(err.response?.data?.message || 'Could not load your videos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Toggle Publish
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
    if (!window.confirm('Are you sure you want to delete this video permanently?')) return;
    try {
      await videoApi.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  // Filter & Sort Logic
  const filteredVideos = videos
    .filter((v) => {
      // Status filter
      if (statusFilter === 'published' && !v.isPublished) return false;
      if (statusFilter === 'drafts' && v.isPublished) return false;
      if (statusFilter === 'scheduled') return false; // Not scheduled

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = v.title?.toLowerCase().includes(q);
        const matchDesc = v.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'likes') return (b.likesCount || 0) - (a.likesCount || 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Film className="w-6 h-6 text-blue-500" />
            <span>Channel Content</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your videos, track view counts, toggle visibility, and update metadata.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Video</span>
        </button>
      </div>

      {/* Filter Tabs & Search / Sort Controls Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#162033] border border-[#1E293B] overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All Videos' },
              { id: 'published', label: 'Published' },
              { id: 'drafts', label: 'Drafts' },
              { id: 'scheduled', label: 'Scheduled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle Mode */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#162033] border border-[#1E293B]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#1E293B]">
          <div className="w-full sm:max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title..."
              className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#162033] border border-[#1E293B] text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer flex-1 sm:flex-initial"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Videos List Container */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Loading your videos...</span>
        </div>
      ) : error ? (
        <ErrorState title="Failed to load videos" message={error} onRetry={fetchVideos} />
      ) : filteredVideos.length === 0 ? (
        <EmptyState
          icon={Film}
          title={searchQuery ? 'No matching videos' : 'No videos found'}
          description={
            searchQuery
              ? `No videos match "${searchQuery}".`
              : 'You have not uploaded any videos under this filter.'
          }
          actionLabel="Upload Video"
          onAction={() => navigate('/upload')}
        />
      ) : viewMode === 'table' ? (
        /* ============================================================== */
        /* Table View                                                     */
        /* ============================================================== */
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#162033]/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Video</th>
                  <th className="px-4 py-3.5 font-semibold">Visibility</th>
                  <th className="px-4 py-3.5 font-semibold">Date</th>
                  <th className="px-4 py-3.5 font-semibold">Views</th>
                  <th className="px-4 py-3.5 font-semibold">Likes</th>
                  <th className="px-4 py-3.5 font-semibold">Comments</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredVideos.map((video) => (
                  <tr
                    key={video._id}
                    className="hover:bg-[#162033]/40 transition-colors group"
                  >
                    {/* Video Column */}
                    <td className="px-5 py-3.5 min-w-[280px]">
                      <div className="flex gap-3">
                        <div className="relative w-28 aspect-video rounded-xl bg-[#162033] overflow-hidden shrink-0 border border-[#1E293B]">
                          <img
                            src={
                              video.thumbnail ||
                              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
                            }
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          {video.duration !== undefined && (
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-semibold text-white">
                              {formatDuration(video.duration)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 py-0.5">
                          <Link
                            to={`/watch/${video._id}`}
                            className="text-xs font-semibold text-slate-100 hover:text-blue-400 line-clamp-1 transition-colors"
                          >
                            {video.title}
                          </Link>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {video.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Visibility Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(video._id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          video.isPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {video.isPublished ? (
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
                      </button>
                    </td>

                    {/* Date Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                      {formatTimeAgo(video.createdAt)}
                    </td>

                    {/* Views Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-200">
                      {formatViews(video.views)}
                    </td>

                    {/* Likes Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                      {video.likesCount || 0}
                    </td>

                    {/* Comments Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                      {video.commentsCount || 0}
                    </td>

                    {/* Actions Column */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/watch/${video._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#162033] transition-colors"
                          title="Watch Video"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setSelectedVideoToEdit(video)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* Grid View                                                      */
        /* ============================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video._id}
              className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden flex flex-col group hover:border-slate-700 transition-all shadow-sm"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-[#162033] w-full overflow-hidden">
                <img
                  src={
                    video.thumbnail ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                {video.duration !== undefined && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-[10px] font-semibold text-white">
                    {formatDuration(video.duration)}
                  </span>
                )}
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 backdrop-blur-md ${
                    video.isPublished
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {video.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>{formatViews(video.views)}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(video.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
                  <button
                    onClick={() => handleTogglePublish(video._id)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white"
                  >
                    {video.isPublished ? 'Unpublish' : 'Publish'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedVideoToEdit(video)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
