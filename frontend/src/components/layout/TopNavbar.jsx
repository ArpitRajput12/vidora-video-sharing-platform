import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Upload,
  MessageSquarePlus,
  Bell,
  X,
  Menu,
  PlaySquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const TopNavbar = ({ onOpenUpload, onOpenNewTweet, onToggleMobileMenu }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentQuery =
    searchParams.get('query') ||
    searchParams.get('search') ||
    searchParams.get('q') ||
    '';

  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Sync input value whenever URL search parameters change
  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/?query=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/');
    }
    setMobileSearchOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    if (currentQuery) {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#111827]/90 backdrop-blur-md border-b border-[#1E293B] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none">
      {/* Mobile Search Overlay Bar */}
      {mobileSearchOpen ? (
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 animate-in fade-in duration-150">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos by title or topic..."
              className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="p-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          {/* Left section: Hamburger button & Mobile brand logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Hamburger menu button on tablet & mobile (< 1024px) */}
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#162033] border border-transparent hover:border-[#1E293B] transition-colors"
              title="Open Navigation"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Logo (< 1024px) */}
            <div
              onClick={() => navigate('/')}
              className="lg:hidden flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <PlaySquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-white hidden sm:inline-block">
                Vidora
              </span>
            </div>
          </div>

          {/* Center Search Input Bar (Visible on sm: and up) */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md relative mx-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos by title or topic..."
              className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-10 pr-9 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Right Action Controls & Creator CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mobile Search Toggle Icon (< 640px) */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#162033] transition-colors"
              title="Search"
              aria-label="Open search input"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick New Tweet CTA (Desktop & Tablet) */}
            <button
              onClick={onOpenNewTweet || (() => navigate('/community'))}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#162033] hover:bg-[#1E293B] border border-[#1E293B] transition-all shadow-sm shrink-0"
            >
              <MessageSquarePlus className="w-4 h-4 text-indigo-400" />
              <span>New Tweet</span>
            </button>

            {/* Upload Video Primary CTA */}
            <button
              onClick={onOpenUpload || (() => navigate('/upload'))}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </button>

            {/* Compact Upload Icon on Mobile */}
            <button
              onClick={onOpenUpload || (() => navigate('/upload'))}
              className="sm:hidden p-2 rounded-xl text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
              title="Upload Video"
              aria-label="Upload Video"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#162033] border border-transparent hover:border-[#1E293B] transition-all"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#111827]"></span>
            </button>

            {/* User Profile Pill */}
            <div
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 pl-1 cursor-pointer group shrink-0"
              title="Profile & Settings"
            >
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                }
                alt={user?.fullName || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500/40 transition-all"
              />
            </div>
          </div>
        </>
      )}
    </header>
  );
};
