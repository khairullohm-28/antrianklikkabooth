import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PlaySquare,
  Layers,
  Tv,
  Printer,
  FileSpreadsheet,
  Settings,
  UserCheck,
  History,
  FileText,
  Sliders,
  LogOut,
  Camera,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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

export interface NavGroup {
  id: string;
  groupTitle?: string;
  dotColor?: string;
  collapsible?: boolean;
  items: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const navGroups: NavGroup[] = [
  {
    id: 'utama',
    groupTitle: 'UTAMA',
    dotColor: 'bg-slate-400',
    collapsible: false,
    items: [
      {
        id: 'beranda' as AdminTab,
        label: 'BERANDA',
        icon: LayoutDashboard,
      },
      {
        id: 'operasional' as AdminTab,
        label: 'MEMBER LOYALTY',
        icon: PlaySquare,
      },
    ],
  },
  {
    id: 'operasional_antrian',
    groupTitle: 'OPERASIONAL & ANTRIAN',
    dotColor: 'bg-emerald-500',
    collapsible: true,
    items: [
      {
        id: 'manajemen' as AdminTab,
        label: 'MANAJEMEN BOOTH',
        icon: Layers,
      },
      {
        id: 'media_display' as AdminTab,
        label: 'MEDIA DISPLAY',
        icon: Tv,
      },
      {
        id: 'setting' as AdminTab,
        label: 'CUSTOM TICKET',
        icon: Printer,
      },
      {
        id: 'laporan' as AdminTab,
        label: 'LAPORAN TRANSAKSI',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    id: 'member_loyalitas',
    groupTitle: 'MEMBER LOYALTY',
    dotColor: 'bg-amber-400',
    collapsible: true,
    items: [
      {
        id: 'master_member' as AdminTab,
        label: 'MEMBER LOYALTY',
        icon: UserCheck,
      },
      {
        id: 'master_transaksi' as AdminTab,
        label: 'TRANSAKSI MEMBER',
        icon: History,
      },
      {
        id: 'master_laporan' as AdminTab,
        label: 'LAPORAN MEMBER',
        icon: FileText,
      },
      {
        id: 'master_setting' as AdminTab,
        label: 'SETTING MEMBER',
        icon: Sliders,
      },
    ],
  },
  {
    id: 'sistem',
    groupTitle: 'SISTEM',
    dotColor: 'bg-red-500',
    collapsible: false,
    items: [
      {
        id: 'system_setting' as AdminTab,
        label: 'SETTING SISTEM',
        icon: Settings,
      },
    ],
  },
];

export const navItems = navGroups.flatMap((g) => g.items);

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    utama: true,
    operasional_antrian: true,
    member_loyalitas: true,
    sistem: true,
  });

  useEffect(() => {
    const activeGroup = navGroups.find((g) => g.items.some((item) => item.id === activeTab));
    if (activeGroup && !openGroups[activeGroup.id]) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [activeTab]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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
                className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
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

        {/* SIDEBAR MENU GROUPS */}
        <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
          {navGroups.map((group) => {
            const isGroupOpen = openGroups[group.id] ?? true;
            const hasActiveChild = group.items.some((item) => item.id === activeTab);

            return (
              <div key={group.id} className="space-y-1">
                {!isSidebarCollapsed && group.groupTitle && (
                  <div>
                    {group.collapsible ? (
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full flex items-center justify-between px-3 pt-2 pb-1 rounded-xl transition-all group/header ${
                          hasActiveChild ? 'text-white font-extrabold' : 'text-slate-400 hover:text-white font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={`w-2 h-2 rounded-full ${group.dotColor || 'bg-slate-500'} shrink-0`} />
                          <span className="text-[10px] font-black uppercase tracking-wider block truncate text-slate-300 group-hover/header:text-white">
                            {group.groupTitle}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 group-hover/header:text-white transition-transform duration-200 shrink-0 ${
                            isGroupOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                        <span className={`w-2 h-2 rounded-full ${group.dotColor || 'bg-slate-500'} shrink-0`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">
                          {group.groupTitle}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isSidebarCollapsed && (
                  <div className="my-1 border-t border-slate-800/80 mx-2" />
                )}

                {(isGroupOpen || isSidebarCollapsed || !group.collapsible) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
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
                            <span className="text-xs font-black tracking-wide truncate uppercase">{item.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
