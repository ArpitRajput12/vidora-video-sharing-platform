import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flame, Sparkles, TrendingUp, Compass, Film } from 'lucide-react';
import { videoApi } from '../api/videoApi.js';
import { VideoCard } from '../components/video/VideoCard.jsx';
import { VideoCardSkeleton } from '../components/common/Skeletons.jsx';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';

export const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery =
    searchParams.get('query') ||
    searchParams.get('search') ||
    searchParams.get('q') ||
    '';

  const [activeTab, setActiveTab] = useState('all');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterTabs = [
    { id: 'all', label: 'All Videos', icon: Compass },
    { id: 'trending', label: 'Trending', icon: Flame, sortBy: 'views', sortType: 'desc' },
    { id: 'latest', label: 'Recently Uploaded', icon: Sparkles, sortBy: 'createdAt', sortType: 'desc' },
    { id: 'popular', label: 'Most Popular', icon: TrendingUp, sortBy: 'views', sortType: 'desc' },
  ];

  const fetchVideos = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        if (targetPage === 1) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        const currentTabConfig = filterTabs.find((t) => t.id === activeTab);

        const params = {
          page: targetPage,
          limit: 12,
        };

        if (searchQuery.trim()) {
          params.query = searchQuery.trim();
        }

        if (currentTabConfig?.sortBy) {
          params.sortBy = currentTabConfig.sortBy;
          params.sortType = currentTabConfig.sortType || 'desc';
        }

        const res = await videoApi.getAllVideos(params);
        const data = res?.data;

        const docs = Array.isArray(data) ? data : data?.docs || [];
        setVideos((prev) => (append ? [...prev, ...docs] : docs));
        setHasMore(data?.hasNextPage || false);
        setPage(targetPage);
      } catch (err) {
        console.error('Failed to load videos:', err);
        setError(err.response?.data?.message || 'Failed to fetch videos. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, searchQuery]
  );

  useEffect(() => {
    fetchVideos(1, false);
  }, [fetchVideos]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchVideos(page + 1, true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category / Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-500'
                  : 'bg-[#162033] text-slate-300 hover:text-white hover:bg-[#1E293B] border border-[#1E293B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Filter Notification */}
      {searchQuery && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#162033]/80 border border-[#1E293B]">
          <span className="text-xs text-slate-300">
            Showing results for <span className="font-semibold text-blue-400">"{searchQuery}"</span>
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Videos Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load videos"
          message={error}
          onRetry={() => fetchVideos(1, false)}
        />
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Film}
          title={searchQuery ? `No videos found for "${searchQuery}"` : 'No videos published yet'}
          description={
            searchQuery
              ? `We couldn't find any videos matching "${searchQuery}". Try different keywords or check spelling.`
              : 'Be the first creator to upload a video to Vidora!'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Upload Video'}
          onAction={searchQuery ? () => setSearchParams({}) : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#162033] hover:bg-[#1E293B] text-slate-200 border border-[#1E293B] hover:border-slate-700 transition-all flex items-center gap-2"
              >
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Load More Videos</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
