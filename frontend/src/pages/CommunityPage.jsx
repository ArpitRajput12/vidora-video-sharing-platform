import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  BarChart2,
  Smile,
  Send,
  Heart,
  Share2,
  Bookmark,
  Trash2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Check,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { tweetApi } from '../api/tweetApi.js';
import { likeApi } from '../api/likeApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState } from '../components/common/EmptyState.jsx';
import { formatTimeAgo } from '../utils/formatters.js';

export const CommunityPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('forYou'); // 'forYou', 'myPosts'
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Composer State
  const [content, setContent] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['Option 1', 'Option 2']);
  const [posting, setPosting] = useState(false);

  // Liked Posts Local Tracker
  const [likedTweetIds, setLikedTweetIds] = useState(new Set());
  const [tweetLikesCount, setTweetLikesCount] = useState({});

  // Fetch Tweets
  const fetchTweets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user tweets
      if (user?._id) {
        try {
          const res = await tweetApi.getUserTweets(user._id);
          const userTweets = res?.data || [];
          setTweets(userTweets);
        } catch (err) {
          // If 404 (No tweets found for this user), handle as empty list
          if (err.response?.status === 404) {
            setTweets([]);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load community tweets:', err);
      setError(err.response?.data?.message || 'Could not load community feed.');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  // Handle Create Tweet
  const handleCreateTweet = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting) return;

    setPosting(true);
    try {
      let finalContent = content.trim();
      if (showPoll) {
        finalContent += `\n\n📊 Poll: ${pollOptions.filter((o) => o.trim()).join(' | ')}`;
      }

      const res = await tweetApi.createTweet(finalContent);
      const newTweetData = res?.data?.tweet;

      if (newTweetData) {
        const fullTweet = {
          _id: newTweetData._id,
          content: newTweetData.content,
          createdAt: newTweetData.createdAt || new Date().toISOString(),
          owner: {
            _id: user?._id,
            username: user?.username || 'you',
            avatar: user?.avatar,
          },
        };
        setTweets((prev) => [fullTweet, ...prev]);
        setContent('');
        setShowPoll(false);
        setPollOptions(['Option 1', 'Option 2']);
      }
    } catch (err) {
      console.error('Error posting tweet:', err);
    } finally {
      setPosting(false);
    }
  };

  // Handle Delete Tweet
  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm('Delete this community post?')) return;
    try {
      await tweetApi.deleteTweet(tweetId);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
    } catch (err) {
      console.error('Delete tweet failed:', err);
    }
  };

  // Toggle Tweet Like
  const handleToggleLike = async (tweetId) => {
    try {
      const res = await likeApi.toggleTweetLike(tweetId);
      const liked = res?.data?.liked;

      setLikedTweetIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(tweetId);
        else next.delete(tweetId);
        return next;
      });

      setTweetLikesCount((prev) => ({
        ...prev,
        [tweetId]: (prev[tweetId] || 0) + (liked ? 1 : -1),
      }));
    } catch (err) {
      console.error('Tweet like error:', err);
    }
  };

  const trendingTopics = [
    { tag: '#VidoraCreators', count: '14.2K posts' },
    { tag: '#WebDevelopment', count: '8.5K posts' },
    { tag: '#GamingMoments', count: '6.1K posts' },
    { tag: '#AIRevolution', count: '5.9K posts' },
    { tag: '#SetupInspiration', count: '3.4K posts' },
  ];

  const suggestedCreators = [
    { name: 'Sarah Lin', handle: 'sarahcode', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
    { name: 'Alex Rivera', handle: 'alexmotion', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
    { name: 'Elena Rostova', handle: 'elenagame', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ============================================================== */}
      {/* Main Feed Column (Col span 2)                                  */}
      {/* ============================================================== */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header & Feed Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              <span>Community Feed</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect with your subscribers through updates, discussions, and polls.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111827] border border-[#1E293B] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('forYou')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'forYou'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('myPosts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'myPosts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Posts
            </button>
          </div>
        </div>

        {/* Post Composer Card */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex gap-3 items-start">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt="You"
              className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-blue-500/20"
            />
            <div className="flex-1 space-y-3">
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening in your community? Share an update or ask a question..."
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 placeholder-slate-500 text-xs rounded-xl p-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none transition-all"
              />

              {/* Poll Interface */}
              {showPoll && (
                <div className="p-3.5 rounded-xl bg-[#162033] border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>Create a Poll</span>
                    <button
                      type="button"
                      onClick={() => setShowPoll(false)}
                      className="text-slate-400 hover:text-red-400 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const copy = [...pollOptions];
                        copy[idx] = e.target.value;
                        setPollOptions(copy);
                      }}
                      placeholder={`Choice ${idx + 1}...`}
                      className="w-full bg-[#111827] border border-[#1E293B] text-slate-100 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])}
                      className="text-[11px] font-semibold text-blue-400 hover:underline"
                    >
                      + Add choice
                    </button>
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-1 border-t border-[#1E293B]">
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowPoll(!showPoll)}
                    className={`p-2 rounded-lg hover:text-white hover:bg-[#162033] transition-colors ${
                      showPoll ? 'text-blue-400 bg-blue-500/10' : ''
                    }`}
                    title="Add Poll"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:text-white hover:bg-[#162033] transition-colors"
                    title="Attach Image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:text-white hover:bg-[#162033] transition-colors"
                    title="Emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCreateTweet}
                  disabled={posting || !content.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
                >
                  {posting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post Update</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Community Posts Feed */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading community updates...</span>
          </div>
        ) : error ? (
          <ErrorState title="Feed unavailable" message={error} onRetry={fetchTweets} />
        ) : tweets.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No community posts yet"
            description="Be the first to share an announcement, question, or discussion point with your viewers!"
          />
        ) : (
          <div className="space-y-4">
            {tweets.map((tweet) => {
              const isLiked = likedTweetIds.has(tweet._id);
              const likes = (tweetLikesCount[tweet._id] || 0) + (isLiked ? 1 : 0);
              const isAuthor = tweet.owner?._id === user?._id || tweet.owner?.username === user?.username;

              return (
                <div
                  key={tweet._id}
                  className="bg-[#111827] border border-[#1E293B] hover:border-slate-700/70 rounded-2xl p-5 shadow-sm space-y-3.5 transition-all"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          tweet.owner?.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                        }
                        alt={tweet.owner?.username || 'User'}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-blue-500/20"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {tweet.owner?.fullName || tweet.owner?.username || 'Creator'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            @{tweet.owner?.username || 'user'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {formatTimeAgo(tweet.createdAt)}
                        </span>
                      </div>
                    </div>

                    {isAuthor && (
                      <button
                        onClick={() => handleDeleteTweet(tweet._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed pl-0 sm:pl-12">
                    {tweet.content}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-slate-400 text-xs">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <button
                        onClick={() => handleToggleLike(tweet._id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          isLiked ? 'text-red-400' : 'hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-400' : ''}`} />
                        <span>{likes > 0 ? likes : ''}</span>
                      </button>

                      <button className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>Reply</span>
                      </button>

                      <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button className="hover:text-indigo-400 transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Right Rail: Who to Follow & Trending Topics                     */}
      {/* ============================================================== */}
      <div className="space-y-6">
        {/* Trending Topics Panel */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Trending Topics</span>
          </h3>

          <div className="space-y-3">
            {trendingTopics.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#162033] cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200 hover:text-blue-400">
                    {item.tag}
                  </div>
                  <div className="text-[10px] text-slate-500">{item.count}</div>
                </div>
                <span className="text-[10px] text-blue-400/80 font-semibold px-2 py-0.5 rounded bg-blue-500/10">
                  Trending
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Who to Follow Panel */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-purple-400" />
            <span>Who to follow</span>
          </h3>

          <div className="space-y-3">
            {suggestedCreators.map((creator, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {creator.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">@{creator.handle}</div>
                  </div>
                </div>
                <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#162033] hover:bg-[#1E293B] text-slate-200 border border-[#1E293B] transition-colors shrink-0">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
