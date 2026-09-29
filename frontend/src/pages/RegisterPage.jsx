import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlaySquare, Mail, Lock, User, Image, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const RegisterPage = () => {
  const { register, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      setError('Channel avatar image is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('fullName', formData.fullName.trim());
      data.append('email', formData.email.trim().toLowerCase());
      data.append('username', formData.username.trim().toLowerCase());
      data.append('password', formData.password);
      data.append('avatar', avatarFile);
      if (coverImageFile) {
        data.append('coverImage', coverImageFile);
      }

      await register(data);

      // Auto-login upon registration
      try {
        await login({
          email: formData.email.trim().toLowerCase(),
          username: formData.username.trim().toLowerCase(),
          password: formData.password,
        });
        navigate('/');
      } catch {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-2xl p-5 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
            <PlaySquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Create Vidora Channel</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Start broadcasting and uploading videos</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username (Handle)</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="creator@vidora.com"
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Avatar <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setAvatarFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImageFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 mt-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create Channel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-[#1E293B] text-center text-xs text-slate-400">
          Already have a channel?{' '}
          <Link to="/login" className="font-medium text-blue-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
