import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { TopNavbar } from './TopNavbar.jsx';
import { BottomNavbar } from './BottomNavbar.jsx';

export const RootLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex overflow-x-hidden w-full">
      {/* Sidebar: Fixed on desktop (lg:), Drawer on mobile/tablet (<lg:) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Sticky Top Navbar with hamburger toggle & responsive controls */}
        <TopNavbar
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Content Area with responsive padding & bottom clearance for mobile nav */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 pb-24 lg:pb-8 overflow-y-auto w-full max-w-full">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (< 1024px) */}
        <BottomNavbar />
      </div>
    </div>
  );
};
