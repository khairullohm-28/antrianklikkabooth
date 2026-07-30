import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { AdminLogin } from './AdminLogin';
import { SettingsModal } from './SettingsModal';
import { TicketPrintModal } from './TicketPrintModal';
import { AdminSidebar } from './AdminSidebar';
import { ConnectionStatusBadge } from '../ConnectionStatusBadge';
import { Booth, Member, LoyaltySettings } from '../../types';
import { subscribeMembers, subscribeLoyaltySettings, DEFAULT_LOYALTY_SETTINGS } from '../../services/memberService';

// Views
import { BerandaView } from './views/BerandaView';
import { OperasionalView } from './views/OperasionalView';
import { ManajemenView } from './views/ManajemenView';
import { MediaDisplayView } from './views/MediaDisplayView';
import { SettingView } from './views/SettingView';
import { LaporanView } from './views/LaporanView';
import { SystemSettingView } from './views/SystemSettingView';

// Master Data Views
import { MemberMasterView } from './views/MemberMasterView';
import { TransaksiMasterView } from './views/TransaksiMasterView';
import { LaporanMasterView } from './views/LaporanMasterView';
import { SettingMasterView } from './views/SettingMasterView';

import {
  Menu,
  X,
  Camera,
} from 'lucide-react';

export type AdminTab =
  | 'beranda'
  | 'operasional'
  | 'manajemen'
  | 'media_display'
  | 'setting'
  | 'laporan'
  | 'master_member'
  | 'master_transaksi'
  | 'master_laporan'
  | 'master_setting'
  | 'system_setting';

export const AdminDashboard: React.FC = () => {
  const { isAdminLoggedIn, logoutAdmin, printSettings } = useQueue();

  // Realtime Members & Loyalty Settings State for Master Views
  const [members, setMembers] = useState<Member[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);

  useEffect(() => {
    const unsubMembers = subscribeMembers((list) => {
      setMembers((prev) => (JSON.stringify(prev) === JSON.stringify(list) ? prev : list));
    });
    const unsubSettings = subscribeLoyaltySettings((s) => {
      setLoyaltySettings((prev) => (JSON.stringify(prev) === JSON.stringify(s) ? prev : s));
    });
    return () => {
      unsubMembers();
      unsubSettings();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        // 1. Check URL query string e.g. ?tab=operasional
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (
          urlTab &&
          ['beranda', 'operasional', 'manajemen', 'media_display', 'setting', 'laporan', 'master_member', 'master_transaksi', 'master_laporan', 'master_setting', 'system_setting'].includes(urlTab)
        ) {
          return urlTab as AdminTab;
        }

        // 2. Fallback to sessionStorage / localStorage
        const saved =
          sessionStorage.getItem('photobooth_admin_active_tab') ||
          localStorage.getItem('photobooth_admin_active_tab');
        if (
          saved &&
          ['beranda', 'operasional', 'manajemen', 'media_display', 'setting', 'laporan', 'master_member', 'master_transaksi', 'master_laporan', 'master_setting', 'system_setting'].includes(saved)
        ) {
          return saved as AdminTab;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 'operasional';
  });

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('photobooth_admin_active_tab', activeTab);
        localStorage.setItem('photobooth_admin_active_tab', activeTab);

        const url = new URL(window.location.href);
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Settings modal bridge if requested by BoothCard edit button
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<'booths' | 'label' | 'password' | 'danger'>('booths');

  // If not logged in as Admin, show Admin Login Card
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  const handleOpenSettingsModal = (tab: 'booths' | 'label' | 'password' | 'danger' = 'booths') => {
    setSettingsModalTab(tab);
    setIsSettingsOpen(true);
  };

  const handleEditBoothFromCard = (booth: Booth) => {
    setActiveTab('manajemen');
  };

  const logoUrl = printSettings?.monitorLogoUrl;

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col md:flex-row font-sans w-full">
      {/* MOBILE TOP BAR WITH HAMBURGER */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
          )}
          <div>
            <h1 className="font-black text-sm text-white tracking-tight">Admin Studio</h1>
            <p className="text-[10px] text-red-400 font-extrabold uppercase">Photobooth System</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatusBadge showText={true} />
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE SIDEBAR COMPONENT */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        logoutAdmin={logoutAdmin}
        logoUrl={logoUrl}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto w-full max-w-full min-w-0">
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

        {/* MASTER DATA LOYALTY VIEWS */}
        {activeTab === 'master_member' && <MemberMasterView members={members} />}
        {activeTab === 'master_transaksi' && <TransaksiMasterView />}
        {activeTab === 'master_laporan' && <LaporanMasterView members={members} />}
        {activeTab === 'master_setting' && <SettingMasterView members={members} loyaltySettings={loyaltySettings} />}

        {/* SYSTEM SETTINGS VIEW */}
        {activeTab === 'system_setting' && <SystemSettingView />}
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

