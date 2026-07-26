import React from 'react';
import {
  LayoutDashboard,
  PlaySquare,
  Layers,
  Tv,
  Settings,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminTab } from './AdminDashboard';
import { ConnectionStatusBadge } from '../ConnectionStatusBadge';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  logoutAdmin: () => void;
  logoUrl?: string;
}

export const navItems = [
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

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  logoutAdmin,
  logoUrl,
}) => {
  return (
    <>
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
        <div className={`p-3.5 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center relative' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-xl object-contain bg-white p-1 shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
                <Camera className="w-4 h-4" />
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="truncate space-y-0.5">
                <h2 className="font-black text-xs tracking-tight text-white leading-tight truncate">
                  Studio Admin
                </h2>
                <div className="pt-0.5">
                  <ConnectionStatusBadge showText={true} />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`hidden md:flex items-center justify-center rounded-lg transition-all text-slate-400 hover:text-white ${
              isSidebarCollapsed
                ? 'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 hover:bg-red-600 border border-slate-700 text-white rounded-full shadow-md z-10'
                : 'p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg'
            }`}
            title={isSidebarCollapsed ? "Buka Sidebar" : "Sembunyikan Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
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
    </>
  );
};
