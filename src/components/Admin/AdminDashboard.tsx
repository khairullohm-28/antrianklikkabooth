import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { AdminLogin } from './AdminLogin';
import { SettingsModal } from './SettingsModal';
import { TicketPrintModal } from './TicketPrintModal';
import { Booth } from '../../types';

// Views
import { BerandaView } from './views/BerandaView';
import { OperasionalView } from './views/OperasionalView';
import { ManajemenView } from './views/ManajemenView';
import { MediaDisplayView } from './views/MediaDisplayView';
import { SettingView } from './views/SettingView';
import { LaporanView } from './views/LaporanView';

import {
  LayoutDashboard,
  PlaySquare,
  Layers,
  Tv,
  Settings,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type AdminTab =
  | 'beranda'
  | 'operasional'
  | 'manajemen'
  | 'media_display'
  | 'setting'
  | 'laporan';

export const AdminDashboard: React.FC = () => {
  const { isAdminLoggedIn, logoutAdmin, printSettings } = useQueue();

  const [activeTab, setActiveTab] = useState<AdminTab>('beranda');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Settings modal bridge if requested by BoothCard edit button
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<'booths' | 'label' | 'script' | 'danger'>('booths');

  // If not logged in as Admin, show Admin Login Card
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  const handleOpenSettingsModal = (tab: 'booths' | 'label' | 'script' | 'danger' = 'booths') => {
    setSettingsModalTab(tab);
    setIsSettingsOpen(true);
  };

  const handleEditBoothFromCard = (booth: Booth) => {
    setActiveTab('manajemen');
  };

  const navItems = [
    {
      id: 'beranda' as AdminTab,
      label: 'BERANDA',
      icon: LayoutDashboard,
    },
    {
      id: 'operasional' as AdminTab,
      label: 'OPERASIONAL',
      icon: PlaySquare,
    },
    {
      id: 'manajemen' as AdminTab,
      label: 'MANAJEMEN',
      icon: Layers,
    },
    {
      id: 'media_display' as AdminTab,
      label: 'MEDIA DISPLAY',
      icon: Tv,
    },
    {
      id: 'setting' as AdminTab,
      label: 'SETTING',
      icon: Settings,
    },
    {
      id: 'laporan' as AdminTab,
      label: 'LAPORAN & ANALISIS',
      icon: FileSpreadsheet,
    },
  ];

  const logoUrl = printSettings?.monitorLogoUrl;

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col md:flex-row font-sans -m-4 sm:-m-6">
      {/* MOBILE TOP BAR WITH HAMBURGER */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-xl object-contain bg-white p-0.5" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
          )}
          <div>
            <h1 className="font-black text-sm text-white tracking-tight">Admin Studio</h1>
            <p className="text-[10px] text-red-400 font-extrabold uppercase">Photobooth System</p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE BACKDROP DRAWER */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`bg-slate-900 text-white flex-col justify-between z-50 shrink-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileSidebarOpen
            ? 'fixed inset-y-0 left-0 flex shadow-2xl w-64'
            : 'hidden md:flex sticky top-0 h-screen'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white p-1 shrink-0 shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-600/30">
                <Camera className="w-5 h-5" />
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="truncate">
                <h2 className="font-black text-sm tracking-tight text-white leading-tight truncate">
                  Studio Admin
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Online
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors shrink-0"
            title={isSidebarCollapsed ? "Sembunyikan / Munculkan Sidebar" : "Kecilkan Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* SIDEBAR MENU ITEMS */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-1.5 block">
              Menu Utama
            </span>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full p-2.5 rounded-2xl text-left transition-all flex items-center gap-3 group active:scale-95 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-red-600 text-white font-black shadow-lg shadow-red-600/25 border border-red-500/50'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-bold'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-red-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-xs font-black tracking-wide truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* SIDEBAR FOOTER & LOGOUT BUTTON */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <button
            id="btn-admin-logout"
            onClick={logoutAdmin}
            title={isSidebarCollapsed ? "LOG OUT" : undefined}
            className={`w-full py-2.5 px-3 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-200 rounded-2xl text-xs font-black border border-slate-700/80 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            {!isSidebarCollapsed && <span>LOG OUT</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden max-w-7xl mx-auto w-full">
        {activeTab === 'beranda' && <BerandaView />}
        {activeTab === 'operasional' && (
          <OperasionalView
            onOpenSettings={handleOpenSettingsModal}
            onEditBooth={handleEditBoothFromCard}
          />
        )}
        {activeTab === 'manajemen' && <ManajemenView />}
        {activeTab === 'media_display' && <MediaDisplayView />}
        {activeTab === 'setting' && <SettingView />}
        {activeTab === 'laporan' && <LaporanView />}
      </main>

      {/* Legacy Settings Modal Bridge if needed */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsModalTab}
      />

      {/* Ticket Thermal Print Preview Modal */}
      <TicketPrintModal />
    </div>
  );
};
