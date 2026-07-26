import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { LayoutDashboard, Tv, UserCheck, Volume2, VolumeX, LogOut, Share2, Check } from 'lucide-react';
import { ActiveTab } from '../types';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    soundEnabled,
    setSoundEnabled,
    isAdminLoggedIn,
    logoutAdmin,
  } = useQueue();

  const [copiedUrl, setCopiedUrl] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'admin',
      label: 'Dashboard Admin',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'monitor',
      label: 'Dashboard Monitor TV',
      icon: <Tv className="w-4 h-4" />,
      badge: 'LIVE',
    },
    {
      id: 'customer',
      label: 'Dashboard Pengguna',
      icon: <UserCheck className="w-4 h-4" />,
    },
  ];

  const handleCopyDirectUrl = () => {
    if (typeof window === 'undefined') return;
    const directUrl = `${window.location.origin}${window.location.pathname}?view=${activeTab}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 text-white shadow-xl border-b border-red-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name (Red, Black & Blue Theme) */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-md border border-red-500/40">
              PB
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Photobooth Queue System
                <span className="text-[10px] uppercase tracking-widest bg-red-900/80 text-red-300 border border-red-700/60 px-2 py-0.5 rounded-full font-bold">
                  v2.0
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block font-medium">Sistem Antrian Photobooth Real-Time</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[9px] font-extrabold bg-red-500 text-white rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Controls & Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Copy Direct URL Button */}
            <button
              id="btn-copy-direct-url"
              onClick={handleCopyDirectUrl}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-xs font-bold transition-all"
              title="Salin Link Langsung Untuk Halaman Ini"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'URL Disalin!' : 'Salin Link URL'}</span>
            </button>

            {/* Sound Toggle Button */}
            <button
              id="btn-toggle-sound"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-2xl border transition-all ${
                soundEnabled
                  ? 'bg-white text-rose-600 border-white shadow-md hover:bg-rose-50'
                  : 'bg-white/20 text-rose-100 border-white/30 hover:text-white'
              }`}
              title={soundEnabled ? 'Suara Panggilan Aktif' : 'Suara Diheningkan'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-600" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Admin Logout Button (Only if Admin is Logged In & on Admin view) */}
            {isAdminLoggedIn && activeTab === 'admin' && (
              <button
                id="btn-nav-logout-admin"
                onClick={logoutAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold border border-slate-700/80 shadow-md transition-all active:scale-95"
                title="Keluar Admin"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar at bottom or secondary row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-white/20 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  isActive ? 'bg-white text-rose-600 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label.replace('Dashboard ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
