import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  PlaySquare,
  MessageSquare,
  Plus,
  UserCheck,
  LayoutDashboard
} from 'lucide-react';

export const BottomNavbar = ({ onOpenUpload }) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#111827]/95 backdrop-blur-lg border-t border-[#1E293B] px-3 py-2 select-none safe-area-pb"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home / Explore */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <PlaySquare className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">Home</span>
            </>
          )}
        </NavLink>

        {/* Community */}
        <NavLink
          to="/community"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <MessageSquare className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">Community</span>
            </>
          )}
        </NavLink>

        {/* Center Upload CTA Button */}
        <NavLink
          to="/upload"
          className="relative -top-2 flex flex-col items-center group"
          onClick={onOpenUpload}
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-active:scale-95 transition-transform border-2 border-[#111827]">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-medium text-slate-300 -mt-0.5">Upload</span>
        </NavLink>

        {/* Subscriptions */}
        <NavLink
          to="/subscriptions"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <UserCheck className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">Subs</span>
            </>
          )}
        </NavLink>

        {/* Studio / Library */}
        <NavLink
          to="/studio"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">Studio</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
