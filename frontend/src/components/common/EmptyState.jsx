import React from 'react';
import { Film, RefreshCw } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Film,
  title = 'No videos found',
  description = 'Try adjusting your search or explore other topics.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-[#162033] border border-[#1E293B] flex items-center justify-center text-blue-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-slate-400 mt-1.5 max-w-xs">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading this content.',
  onRetry,
}) => {
  return (
    <div className="bg-[#111827] border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
        <RefreshCw className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-[#162033] hover:bg-[#1E293B] border border-[#1E293B] transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
