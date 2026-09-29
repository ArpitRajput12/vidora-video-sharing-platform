import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Clock,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi.js';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';
import { formatViews, formatDuration, formatTimeAgo } from '../utils/formatters.js';

export const AnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState('28d'); // '7d', '28d', '90d', '365d'
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0,
    totalLikes: 0,
  });
  const [topVideos, setTopVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, videosRes] = await Promise.allSettled([
        dashboardApi.getChannelStats(),
        dashboardApi.getChannelVideos(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }

      if (videosRes.status === 'fulfilled' && videosRes.value?.data) {
        const sorted = (videosRes.value.data || []).sort(
          (a, b) => (b.views || 0) - (a.views || 0)
        );
        setTopVideos(sorted.slice(0, 5));
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.message || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const estimatedHours = (stats.totalViews * 0.08).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Header & Timeframe Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <span>Channel Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time performance metrics and audience growth insights.
          </p>
        </div>

        {/* Timeframe Chips */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111827] border border-[#1E293B] overflow-x-auto max-w-full">
          {[
            { id: '7d', label: 'Last 7 days' },
            { id: '28d', label: 'Last 28 days' },
            { id: '90d', label: 'Last 90 days' },
            { id: '365d', label: 'Last Year' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                timeframe === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#162033]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Loading analytics breakdown...</span>
        </div>
      ) : error ? (
        <ErrorState title="Failed to load analytics" message={error} onRetry={fetchAnalytics} />
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
                <span className="truncate">Total Views</span>
                <Eye className="w-4 h-4 text-blue-400 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1.5 sm:mt-2 truncate">
                {stats.totalViews.toLocaleString()}
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold truncate">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>+14.8%</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
                <span className="truncate">Watch Time</span>
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1.5 sm:mt-2 truncate">
                {estimatedHours} hrs
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold truncate">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>+9.3%</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
                <span className="truncate">Subscribers</span>
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1.5 sm:mt-2 truncate">
                {stats.totalSubscribers.toLocaleString()}
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold truncate">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>+18.1%</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
                <span className="truncate">Revenue</span>
                <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1.5 sm:mt-2 truncate">
                $0.00
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Monetization unlocks at 1,000 subscribers
              </div>
            </div>
          </div>

          {/* Area Chart Card */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Audience Growth & Views Trend</h3>
                <p className="text-xs text-slate-400">Daily viewer interactions over the selected timeframe</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Trending Upward
              </span>
            </div>

            {/* SVG Chart */}
            <div className="h-56 w-full pt-4">
              <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="40" x2="600" y2="40" stroke="#1E293B" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="#1E293B" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="#1E293B" strokeDasharray="4 4" />

                <polygon
                  fill="url(#analyticsGrad)"
                  points="0,150 0,110 75,90 150,120 225,70 300,85 375,40 450,55 525,20 600,45 600,180 0,180"
                />

                <polyline
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,110 75,90 150,120 225,70 300,85 375,40 450,55 525,20 600,45"
                />

                <circle cx="525" cy="20" r="6" fill="#3B82F6" stroke="#0F172A" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Top Performing Videos Table */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white">Top Performing Content</h3>

            {topVideos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No videos available for top content analysis.
              </div>
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {topVideos.map((vid, idx) => (
                  <div key={vid._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-500 w-4 text-center">
                        {idx + 1}
                      </span>
                      <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-[#0F172A]">
                        <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                        {vid.duration !== undefined && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-semibold text-white">
                            {formatDuration(vid.duration)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 line-clamp-1 truncate">
                          {vid.title}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Published {formatTimeAgo(vid.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-slate-300 shrink-0">
                      <div>
                        <div className="font-bold text-white">{formatViews(vid.views)}</div>
                        <div className="text-[10px] text-slate-500 text-right">views</div>
                      </div>
                      <div>
                        <div className="font-bold text-white">{vid.likesCount || 0}</div>
                        <div className="text-[10px] text-slate-500 text-right">likes</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
