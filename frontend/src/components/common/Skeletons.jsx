import React from 'react';

export const VideoCardSkeleton = () => {
  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden animate-pulse">
      {/* Thumbnail Aspect Ratio 16:9 Skeleton */}
      <div className="aspect-video bg-[#162033] w-full"></div>

      {/* Meta Skeleton */}
      <div className="p-4 flex gap-3">
        <div className="w-9 h-9 rounded-full bg-[#162033] shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#162033] rounded-md w-4/5"></div>
          <div className="h-3 bg-[#162033] rounded-md w-1/2"></div>
          <div className="flex gap-2 pt-1">
            <div className="h-2.5 bg-[#162033] rounded-md w-16"></div>
            <div className="h-2.5 bg-[#162033] rounded-md w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WatchPageSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      {/* Left/Main Column: Player, Meta, Comments */}
      <div className="lg:col-span-2 space-y-4">
        {/* Player Skeleton */}
        <div className="aspect-video bg-[#111827] border border-[#1E293B] rounded-2xl w-full"></div>

        {/* Title & Stats */}
        <div className="h-7 bg-[#111827] rounded-lg w-3/4"></div>
        <div className="flex items-center justify-between py-2 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#162033]"></div>
            <div className="space-y-1.5">
              <div className="h-4 bg-[#162033] rounded w-28"></div>
              <div className="h-3 bg-[#162033] rounded w-20"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-[#162033] rounded-xl"></div>
            <div className="h-9 w-20 bg-[#162033] rounded-xl"></div>
          </div>
        </div>

        {/* Description Box */}
        <div className="h-24 bg-[#111827] border border-[#1E293B] rounded-2xl p-4 space-y-2">
          <div className="h-3.5 bg-[#162033] rounded w-1/3"></div>
          <div className="h-3 bg-[#162033] rounded w-full"></div>
          <div className="h-3 bg-[#162033] rounded w-4/5"></div>
        </div>
      </div>

      {/* Right Rail: Recommendations Skeleton */}
      <div className="space-y-3">
        <div className="h-5 bg-[#111827] rounded w-32 mb-4"></div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-3 p-2 rounded-xl bg-[#111827]/40 border border-[#1E293B]/60">
            <div className="w-32 aspect-video bg-[#162033] rounded-lg shrink-0"></div>
            <div className="flex-1 space-y-1.5 py-1">
              <div className="h-3.5 bg-[#162033] rounded w-full"></div>
              <div className="h-3 bg-[#162033] rounded w-3/4"></div>
              <div className="h-2.5 bg-[#162033] rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CommentSkeleton = () => {
  return (
    <div className="flex gap-3 py-3 border-b border-[#1E293B]/60 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-[#162033] shrink-0"></div>
      <div className="flex-1 space-y-1.5">
        <div className="flex gap-2 items-center">
          <div className="h-3 bg-[#162033] rounded w-24"></div>
          <div className="h-2.5 bg-[#162033] rounded w-16"></div>
        </div>
        <div className="h-3 bg-[#162033] rounded w-full"></div>
        <div className="h-3 bg-[#162033] rounded w-4/5"></div>
      </div>
    </div>
  );
};
