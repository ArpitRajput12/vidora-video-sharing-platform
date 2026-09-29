import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { RootLayout } from './components/layout/RootLayout.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { StudioPage } from './pages/StudioPage.jsx';
import { WatchPage } from './pages/WatchPage.jsx';
import { MyVideosPage } from './pages/MyVideosPage.jsx';
import { CommunityPage } from './pages/CommunityPage.jsx';
import { PlaylistsPage } from './pages/PlaylistsPage.jsx';
import { SubscriptionsPage } from './pages/SubscriptionsPage.jsx';
import { LikedVideosPage } from './pages/LikedVideosPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { UploadPage } from './pages/UploadPage.jsx';
import { ChannelPage } from './pages/ChannelPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Creator Studio & Application Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RootLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="watch/:videoId" element={<WatchPage />} />
            <Route path="my-videos" element={<MyVideosPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="playlists" element={<PlaylistsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="liked-videos" element={<LikedVideosPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="c/:username" element={<ChannelPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/studio" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
