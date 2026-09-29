import React, { useState, useEffect } from 'react';
import { X, Check, Plus, FolderPlus, Loader2 } from 'lucide-react';
import { playlistApi } from '../../api/playlistApi.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const PlaylistSaveModal = ({ videoId, isOpen, onClose }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // New playlist form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?._id) return;

    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const res = await playlistApi.getUserPlaylists(user._id);
        setPlaylists(res?.data || []);
      } catch (err) {
        console.error('Failed to load playlists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [isOpen, user?._id]);

  if (!isOpen) return null;

  const handleToggle = async (playlist) => {
    const isAdded = playlist.videos?.includes(videoId);
    setActionLoading(playlist._id);
    try {
      if (isAdded) {
        await playlistApi.removeVideoFromPlaylist(videoId, playlist._id);
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id
              ? { ...p, videos: p.videos.filter((id) => id !== videoId) }
              : p
          )
        );
      } else {
        await playlistApi.addVideoToPlaylist(videoId, playlist._id);
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id
              ? { ...p, videos: [...(p.videos || []), videoId] }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Error toggling playlist video:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreateLoading(true);
    try {
      const res = await playlistApi.createPlaylist({
        name: name.trim(),
        description: description.trim() || 'My curated playlist',
      });
      const newPlaylist = res?.data;
      if (newPlaylist?._id) {
        await playlistApi.addVideoToPlaylist(videoId, newPlaylist._id);
        newPlaylist.videos = [videoId];
        setPlaylists((prev) => [newPlaylist, ...prev]);
        setName('');
        setDescription('');
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span>Save video to...</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#162033] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto space-y-1">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-xs text-slate-400">Loading playlists...</span>
            </div>
          ) : playlists.length === 0 && !showCreateForm ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No playlists found. Create one below!
            </div>
          ) : (
            playlists.map((p) => {
              const isAdded = p.videos?.includes(videoId);
              const isToggling = actionLoading === p._id;
              return (
                <div
                  key={p._id}
                  onClick={() => !isToggling && handleToggle(p)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#162033] cursor-pointer transition-colors"
                >
                  <span className="text-xs font-medium text-slate-200 truncate pr-2">
                    {p.name}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isAdded
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-[#334155] bg-[#162033]'
                    }`}
                  >
                    {isToggling ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : isAdded ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Playlist Accordion Form */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0F172A]/40">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#162033] hover:bg-[#1E293B] border border-[#1E293B] transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Create New Playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Playlist name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !name.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Create & Save</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
