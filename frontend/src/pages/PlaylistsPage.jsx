import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ListVideo,
  Plus,
  Play,
  Trash2,
  Edit3,
  Eye,
  Film,
  X,
  Loader2,
  FolderPlus,
  ExternalLink,
  Layers
} from 'lucide-react';
import { playlistApi } from '../api/playlistApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';
import { formatViews, formatDuration, formatTimeAgo } from '../utils/formatters.js';

export const PlaylistsPage = () => {
  const { user } = useAuth();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Playlist Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Playlist Modal State
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // View Playlist Detail Modal State
  const [activePlaylistDetail, setActivePlaylistDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch Playlists
  const fetchPlaylists = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await playlistApi.getUserPlaylists(user._id);
      setPlaylists(res?.data || []);
    } catch (err) {
      console.error('Failed to load playlists:', err);
      setError(err.response?.data?.message || 'Could not load your playlists.');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Create Playlist Handler
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreateLoading(true);
    try {
      const res = await playlistApi.createPlaylist({
        name: newName.trim(),
        description: newDescription.trim() || 'Curated playlist',
      });
      const created = res?.data;
      if (created) {
        setPlaylists((prev) => [
          {
            ...created,
            totalVideos: 0,
            totalViews: 0,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setNewName('');
        setNewDescription('');
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (p) => {
    setEditingPlaylist(p);
    setEditName(p.name);
    setEditDescription(p.description || '');
  };

  // Update Playlist Handler
  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingPlaylist) return;

    setEditLoading(true);
    try {
      await playlistApi.updatePlaylist(editingPlaylist._id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setPlaylists((prev) =>
        prev.map((p) =>
          p._id === editingPlaylist._id
            ? { ...p, name: editName.trim(), description: editDescription.trim() }
            : p
        )
      );
      setEditingPlaylist(null);
    } catch (err) {
      console.error('Failed to update playlist:', err);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Playlist Handler
  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await playlistApi.deletePlaylist(playlistId);
      setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
      if (activePlaylistDetail?._id === playlistId) {
        setActivePlaylistDetail(null);
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  // Open Detailed Playlist Modal
  const handleOpenDetail = async (playlistId) => {
    setDetailLoading(true);
    try {
      const res = await playlistApi.getPlaylistById(playlistId);
      setActivePlaylistDetail(res?.data);
    } catch (err) {
      console.error('Failed to get playlist detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Remove Video From Playlist
  const handleRemoveVideo = async (videoId) => {
    if (!activePlaylistDetail) return;
    try {
      await playlistApi.removeVideoFromPlaylist(videoId, activePlaylistDetail._id);
      setActivePlaylistDetail((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v._id !== videoId),
        totalVideos: Math.max(0, (prev.totalVideos || 1) - 1),
      }));
      setPlaylists((prev) =>
        prev.map((p) =>
          p._id === activePlaylistDetail._id
            ? { ...p, totalVideos: Math.max(0, (p.totalVideos || 1) - 1) }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to remove video from playlist:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ListVideo className="w-6 h-6 text-blue-500" />
            <span>Playlists</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize content into playlists for continuous watching and topic-focused discovery.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Playlist Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Loading your playlists...</span>
        </div>
      ) : error ? (
        <ErrorState title="Failed to load playlists" message={error} onRetry={fetchPlaylists} />
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title="No playlists created yet"
          description="Create your first curated playlist to organize videos and series."
          actionLabel="Create Playlist"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              onClick={() => handleOpenDetail(playlist._id)}
              className="group bg-[#111827] border border-[#1E293B] hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/40 transition-all cursor-pointer flex flex-col"
            >
              {/* Stacked Deck Thumbnail Header */}
              <div className="relative p-2.5 pb-0">
                {/* Visual deck backdrop effect */}
                <div className="h-2 mx-3 bg-[#1E293B]/70 rounded-t-xl"></div>
                <div className="h-1.5 mx-1.5 bg-[#162033] rounded-t-xl"></div>

                <div className="relative aspect-video w-full bg-gradient-to-tr from-slate-900 via-blue-950/40 to-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-[#1E293B]">
                  <Layers className="w-10 h-10 text-blue-500/40 group-hover:scale-110 transition-transform duration-300" />

                  {/* Play All Hover Badge */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Video Counter Badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1.5">
                    <ListVideo className="w-3 h-3 text-blue-400" />
                    <span>{playlist.totalVideos || 0} videos</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {playlist.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {playlist.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#1E293B]">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span>{formatViews(playlist.totalViews || 0)}</span>
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEdit(playlist)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="Edit Playlist"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlaylist(playlist._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Playlist"
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

      {/* ============================================================== */}
      {/* Create Playlist Modal                                          */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <span>Create New Playlist</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Playlist Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Masterclass Series 2026"
                  className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Briefly describe what videos are included..."
                  className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Playlist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* Edit Playlist Modal                                            */}
      {/* ============================================================== */}
      {editingPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Edit Playlist</span>
              </h3>
              <button
                onClick={() => setEditingPlaylist(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlaylist} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Playlist Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setEditingPlaylist(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !editName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* Detailed Playlist Videos Viewer Modal                          */}
      {/* ============================================================== */}
      {activePlaylistDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{activePlaylistDetail.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activePlaylistDetail.totalVideos || 0} videos • {formatViews(activePlaylistDetail.totalViews || 0)}
                </p>
              </div>
              <button
                onClick={() => setActivePlaylistDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {activePlaylistDetail.videos?.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  This playlist is empty. Add videos from any video watch page!
                </div>
              ) : (
                activePlaylistDetail.videos?.map((vid, idx) => (
                  <div
                    key={vid._id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#162033]/50 hover:bg-[#162033] border border-[#1E293B] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-500 w-4 text-center">
                        {idx + 1}
                      </span>
                      <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-[#0F172A]">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-full h-full object-cover"
                        />
                        {vid.duration !== undefined && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-semibold text-white">
                            {formatDuration(vid.duration)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/watch/${vid._id}`}
                          onClick={() => setActivePlaylistDetail(null)}
                          className="text-xs font-semibold text-slate-200 hover:text-blue-400 line-clamp-1 transition-colors"
                        >
                          {vid.title}
                        </Link>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {formatViews(vid.views)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        to={`/watch/${vid._id}`}
                        onClick={() => setActivePlaylistDetail(null)}
                        className="p-1.5 text-slate-400 hover:text-white"
                        title="Watch Video"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleRemoveVideo(vid._id)}
                        className="p-1.5 text-slate-400 hover:text-red-400"
                        title="Remove from playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Play All */}
            {activePlaylistDetail.videos?.length > 0 && (
              <div className="p-4 border-t border-[#1E293B] bg-[#0F172A]/50 flex justify-end">
                <Link
                  to={`/watch/${activePlaylistDetail.videos[0]._id}`}
                  onClick={() => setActivePlaylistDetail(null)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Play All</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
