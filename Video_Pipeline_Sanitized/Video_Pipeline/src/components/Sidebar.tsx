'use client';

import React from 'react';

interface SidebarProps {
  onAskMaps: () => void;
  onSaved: () => void;
  onRecents: () => void;
  onBengaluru: () => void;
  onUdupi: () => void;
  onWeather: () => void;
  onGetApp: () => void;
}

export default function Sidebar({
  onAskMaps,
  onSaved,
  onRecents,
  onBengaluru,
  onUdupi,
  onWeather,
  onGetApp,
}: SidebarProps) {
  return (
    <nav className="hidden md:flex fixed left-0 top-0 z-50 h-screen w-[72px] flex-col items-center justify-between border-r border-gray-200 bg-white py-4 font-sans dark:border-gray-800 dark:bg-[#13151a] dark:text-[#e8eaed]">
      {/* Top Section */}
      <div className="flex w-full flex-col items-center gap-6">

        {/* Ask Maps */}
        <button onClick={onAskMaps} className="group flex w-full cursor-pointer flex-col items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
          </div>
          <span className="text-center text-[10px] font-medium leading-tight text-gray-800 dark:text-gray-300">Ask Maps</span>
        </button>

        {/* Saved */}
        <button onClick={onSaved} className="group mt-2 flex w-full cursor-pointer flex-col items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <span className="text-center text-[10px] font-medium">Saved</span>
        </button>

        {/* Recents */}
        <button onClick={onRecents} className="group flex w-full cursor-pointer flex-col items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span className="text-center text-[10px] font-medium">Recents</span>
        </button>

        {/* Divider */}
        <div className="my-1 h-[1px] w-8 bg-gray-200 dark:bg-gray-700"></div>

        {/* Quick Location Links */}
        <div className="flex w-full flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
          <button onClick={onBengaluru} className="group flex cursor-pointer flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-600 transition-colors group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:group-hover:bg-gray-700">
              BLR
            </div>
            <span className="text-center text-[10px]">Bengaluru</span>
          </button>

          <button onClick={onUdupi} className="group flex cursor-pointer flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-600 transition-colors group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:group-hover:bg-gray-700">
              UD
            </div>
            <span className="text-center text-[10px]">Udupi</span>
          </button>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="flex w-full flex-col items-center gap-4 text-gray-500 dark:text-gray-400">

        {/* Weather */}
        <button onClick={onWeather} aria-label="Weather" className="group flex flex-col items-center cursor-pointer hover:text-gray-900 dark:hover:text-white">
          <div className="rounded-full p-2 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2"></path>
              <path d="M12 20v2"></path>
              <path d="M5 5l1.5 1.5"></path>
              <path d="M17.5 17.5L19 19"></path>
              <path d="M2 12h2"></path>
              <path d="M20 12h2"></path>
              <path d="M5 19l1.5-1.5"></path>
              <path d="M17.5 6.5L19 5"></path>
            </svg>
          </div>
        </button>

        {/* Get App */}
        <button onClick={onGetApp} className="group flex cursor-pointer flex-col items-center gap-1 hover:text-gray-900 dark:hover:text-white">
          <div className="rounded-full p-2 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          <span className="text-[10px]">Get app</span>
        </button>

      </div>
    </nav>
  );
}
