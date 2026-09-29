import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { formatViews, formatDuration, formatTimeAgo } from '../../utils/formatters.js';

export const VideoCard = ({ video }) => {
  const navigate = useNavigate();

  if (!video) return null;

  const {
    _id,
    title,
    thumbnail,
    duration,
    views = 0,
    createdAt,
    owner,
  } = video;

  return (
    <div
      onClick={() => navigate(`/watch/${_id}`)}
      className="group bg-[#111827] border border-[#1E293B] hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 flex flex-col cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-[#162033] overflow-hidden">
        <img
          src={thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>

        {/* Video Duration Badge */}
        {duration !== undefined && duration !== null && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-white tracking-wider">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Video Metadata & Creator Row */}
      <div className="p-4 flex gap-3 flex-1">
        <Link
          to={`/c/${owner?.username || 'creator'}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <img
            src={owner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
            alt={owner?.fullName || 'Creator'}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-blue-500/20 hover:ring-blue-500/60 transition-all"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
            {title}
          </h3>

          <Link
            to={`/c/${owner?.username || 'creator'}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors block mt-1 truncate"
          >
            {owner?.fullName || owner?.username || 'Creator'}
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>{formatViews(views)}</span>
            <span>•</span>
            <span>{formatTimeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
