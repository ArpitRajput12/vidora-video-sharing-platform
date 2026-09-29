import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  MessageSquarePlus,
  Bell,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const TopNavbar = ({ onOpenUpload, onOpenNewTweet }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/my-videos?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#111827]/90 backdrop-blur-md border-b border-[#1E293B] px-6 flex items-center justify-between gap-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos, playlists, or analytics..."
          className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-10 pr-9 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Action Controls & Creator CTAs */}
      <div className="flex items-center gap-3">
        {/* Quick New Tweet CTA */}
        <button
          onClick={onOpenNewTweet || (() => navigate('/community'))}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#162033] hover:bg-[#1E293B] border border-[#1E293B] transition-all shadow-sm"
        >
          <MessageSquarePlus className="w-4 h-4 text-indigo-400" />
          <span>New Tweet</span>
        </button>

        {/* Upload Video Primary CTA */}
        <button
          onClick={onOpenUpload || (() => navigate('/upload'))}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Video</span>
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#162033] border border-transparent hover:border-[#1E293B] transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#111827]"></span>
        </button>

        {/* User Pill */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 pl-2 cursor-pointer group"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
            alt={user?.fullName || 'User'}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500/40 transition-all"
          />
        </div>
      </div>
    </header>
  );
};
