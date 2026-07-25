import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { AdminLogin } from './AdminLogin';
import { SettingsModal } from './SettingsModal';
import { TicketPrintModal } from './TicketPrintModal';
import { AdminSidebar } from './AdminSidebar';
import { Booth } from '../../types';

// Views
import { BerandaView } from './views/BerandaView';
import { OperasionalView } from './views/OperasionalView';
import { ManajemenView } from './views/ManajemenView';
import { MediaDisplayView } from './views/MediaDisplayView';
import { SettingView } from './views/SettingView';
import { LaporanView } from './views/LaporanView';

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
  | 'laporan';

export const AdminDashboard: React.FC = () => {
  const { isAdminLoggedIn, logoutAdmin, printSettings } = useQueue();

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    try {
      const saved = localStorage.getItem('photobooth_admin_active_tab');
      if (
        saved &&
        ['beranda', 'operasional', 'manajemen', 'media_display', 'setting', 'laporan'].includes(saved)
      ) {
        return saved as AdminTab;
      }
    } catch (e) {
      console.error(e);
    }
    return 'operasional';
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('photobooth_admin_active_tab', activeTab);
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

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

