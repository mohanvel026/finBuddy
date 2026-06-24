import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    // h-screen + overflow-hidden: locks layout to viewport, body never scrolls
    // This ensures mouse wheel always hits the inner scroll container, not the body
    <div className="flex h-screen overflow-hidden text-[var(--text-primary)] bg-[#08080f]">
      <Sidebar />
      {/* 
        This inner div is THE scroll container for all authenticated pages.
        overflow-y-auto + flex-1 means:
          - Takes all remaining width after sidebar
          - Scrolls vertically when content overflows
          - Mouse wheel works anywhere in this area
        pb-20 on mobile leaves space for the bottom nav bar
      */}
      <div className="flex-1 min-w-0 flex flex-col bg-[var(--bg-primary)] overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
