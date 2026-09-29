import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Image as ImageIcon,
  Lock,
  Moon,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload
} from 'lucide-react';
import { authApi } from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('account'); // 'account', 'media', 'security', 'preferences'

  // Account details form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountError, setAccountError] = useState('');

  // Media upload form
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || '');
  const [coverLoading, setCoverLoading] = useState(false);
  const [mediaSuccess, setMediaSuccess] = useState('');

  // Password change form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setAvatarPreview(user.avatar || '');
      setCoverPreview(user.coverImage || '');
    }
  }, [user]);

  // Update Account Details
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setAccountError('Both Full Name and Email are required.');
      return;
    }

    setAccountLoading(true);
    setAccountError('');
    setAccountSuccess('');

    try {
      const res = await authApi.updateAccount({
        fullName: fullName.trim(),
        email: email.trim(),
      });
      const updatedUser = res?.data;
      if (updatedUser) {
        updateUser(updatedUser);
        setAccountSuccess('Account profile updated successfully!');
        setTimeout(() => setAccountSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Update account error:', err);
      setAccountError(err.response?.data?.message || 'Failed to update account details.');
    } finally {
      setAccountLoading(false);
    }
  };

  // Upload Avatar
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setAvatarLoading(true);
    setMediaSuccess('');
    try {
      const data = new FormData();
      data.append('avatar', avatarFile);
      const res = await authApi.updateAvatar(data);
      const updated = res?.data;
      if (updated) {
        updateUser(updated);
        setAvatarFile(null);
        setMediaSuccess('Channel avatar updated successfully!');
        setTimeout(() => setMediaSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Avatar update error:', err);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Upload Cover Image
  const handleUploadCover = async () => {
    if (!coverFile) return;
    setCoverLoading(true);
    setMediaSuccess('');
    try {
      const data = new FormData();
      data.append('coverImage', coverFile);
      const res = await authApi.updateCoverImage(data);
      const updated = res?.data;
      if (updated) {
        updateUser(updated);
        setCoverFile(null);
        setMediaSuccess('Cover image updated successfully!');
        setTimeout(() => setMediaSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Cover update error:', err);
    } finally {
      setCoverLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPasswordError('Please fill in both current and new passwords.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const navItems = [
    { id: 'account', label: 'Account Details', icon: User },
    { id: 'media', label: 'Channel Media', icon: ImageIcon },
    { id: 'security', label: 'Security & Password', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Moon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-500" />
          <span>Channel & Account Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal account, channel branding, security preferences, and session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tab Navigation */}
        <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap text-left transition-all shrink-0 md:shrink md:w-full ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-[#162033]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-0 md:pt-4 border-l md:border-l-0 md:border-t border-[#1E293B] pl-1 md:pl-0 shrink-0 md:shrink">
            <button
              onClick={logout}
              className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap text-red-400 hover:bg-red-500/10 transition-colors md:w-full"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Content Box (Col span 3) */}
        <div className="md:col-span-3 bg-[#111827] border border-[#1E293B] rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
          {/* ============================================================== */}
          {/* 1. Account Details Tab                                         */}
          {/* ============================================================== */}
          {activeTab === 'account' && (
            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Profile Information</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your display name and email address.
                </p>
              </div>

              {accountSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{accountSuccess}</span>
                </div>
              )}

              {accountError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{accountError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username (Channel Handle)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`@${user?.username || ''}`}
                    className="w-full bg-[#162033]/50 border border-[#1E293B] text-slate-400 text-xs rounded-xl px-4 py-2.5 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Channel handles are permanent and indexed for searches.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={accountLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  {accountLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* 2. Channel Media Tab (Avatar & Cover)                         */}
          {/* ============================================================== */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Channel Branding</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your profile avatar and banner image stored securely on Cloudinary.
                </p>
              </div>

              {mediaSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mediaSuccess}</span>
                </div>
              )}

              {/* Avatar Section */}
              <div className="p-4 rounded-xl bg-[#162033] border border-[#1E293B] space-y-3">
                <label className="block text-xs font-bold text-slate-200">Profile Avatar</label>
                <div className="flex items-center gap-4">
                  <img
                    src={avatarPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
                  />
                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 cursor-pointer"
                    />
                    {avatarFile && (
                      <button
                        onClick={handleUploadAvatar}
                        disabled={avatarLoading}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                      >
                        {avatarLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload New Avatar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Image Section */}
              <div className="p-4 rounded-xl bg-[#162033] border border-[#1E293B] space-y-3">
                <label className="block text-xs font-bold text-slate-200">Channel Cover Banner</label>
                <div className="aspect-[4/1] w-full rounded-xl bg-[#0F172A] border border-[#1E293B] overflow-hidden">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      No cover image set
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setCoverFile(file);
                        setCoverPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 cursor-pointer"
                  />
                  {coverFile && (
                    <button
                      onClick={handleUploadCover}
                      disabled={coverLoading}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      {coverLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload Banner</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. Security & Password Tab                                    */}
          {/* ============================================================== */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Change Password</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your authentication credentials to secure your channel.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#162033] border border-[#1E293B] text-slate-100 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* 4. Preferences Tab                                            */}
          {/* ============================================================== */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">App Preferences</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure visual appearance and session management.
                </p>
              </div>

              {/* Theme Block */}
              <div className="p-4 rounded-xl bg-[#162033] border border-[#1E293B] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Visual Theme</div>
                  <div className="text-[11px] text-slate-400">
                    Vidora Dark Mode (#0F172A Slate Navy) is enabled by default.
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Dark Navy Active
                </span>
              </div>

              {/* Session Termination Block */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-400">Sign Out Everywhere</div>
                  <div className="text-[11px] text-slate-400">
                    Terminates your current access & refresh tokens on the server.
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-md"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
