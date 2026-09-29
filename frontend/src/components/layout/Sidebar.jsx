import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  MessageSquare,
  ListVideo,
  UserCheck,
  ThumbsUp,
  BarChart3,
  History,
  Settings,
  LogOut,
  PlaySquare,
  Tv
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navLinks = [
    { label: 'Explore & Home', path: '/', icon: PlaySquare },
    { label: 'Studio & Dashboard', path: '/studio', icon: LayoutDashboard },
    { label: 'My Videos', path: '/my-videos', icon: Video },
    { label: 'Community', path: '/community', icon: MessageSquare },
    { label: 'Playlists', path: '/playlists', icon: ListVideo },
    { label: 'Subscriptions', path: '/subscriptions', icon: UserCheck },
    { label: 'Liked Videos', path: '/liked-videos', icon: ThumbsUp },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Watch History', path: '/history', icon: History },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#111827] border-r border-[#1E293B] flex flex-col z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-[#1E293B]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <PlaySquare className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            Vidora
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Studio
            </span>
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Creator Studio
        </div>

        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 shadow-sm border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#162033]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          General
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#162033]'
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[#1E293B] bg-[#0F172A]/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#162033]/60 border border-[#1E293B]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user?.fullName || 'User'}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-blue-500/30"
            />
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {user?.fullName || 'Creator'}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                @{user?.username || 'user'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
