import React from 'react';
import { QueueProvider, useQueue } from './context/QueueContext';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { CustomerDashboard } from './components/Customer/CustomerDashboard';
import { MonitorDashboard } from './components/Monitor/MonitorDashboard';
import { LayoutDashboard, Tv, UserCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, isAdminLoggedIn } = useQueue();

  const isPublicDashboard = activeTab === 'customer' || activeTab === 'monitor';
  const isMonitorMode = activeTab === 'monitor';

  if (isMonitorMode) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white relative flex flex-col">
        <MonitorDashboard />

        {/* Return Button for Logged In Admin Only */}
        {isAdminLoggedIn && (
          <div className="fixed bottom-3 right-3 z-50 print:hidden opacity-40 hover:opacity-100 transition-opacity">
            <button
              onClick={() => setActiveTab('admin')}
              className="bg-slate-900/90 hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-2xl border border-slate-700/80 flex items-center gap-1.5 transition-all"
              title="Kembali ke Dashboard Admin"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-red-400" />
              <span>Ke Admin</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50/30 text-slate-900 font-sans flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      <div>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {activeTab === 'admin' && <AdminDashboard />}
          {activeTab === 'customer' && <CustomerDashboard />}
        </main>
      </div>

      {/* Return Button for Logged In Admin Only on Customer View */}
      {isPublicDashboard && isAdminLoggedIn && (
        <div className="fixed bottom-3 right-3 z-40 print:hidden">
          <button
            onClick={() => setActiveTab('admin')}
            className="bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border border-slate-700/60 flex items-center gap-1.5 transition-all opacity-40 hover:opacity-100"
            title="Kembali ke Dashboard Admin"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-red-400" />
            <span>Ke Admin</span>
          </button>
        </div>
      )}

      {/* Footer Nav Bar (Only visible in Admin) */}
      {!isPublicDashboard && (
        <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200 py-4 mt-8 text-center text-xs text-slate-500 print:hidden">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-medium text-slate-500">© 2026 Photobooth Studio. Dedicated Photobooth Queue System.</p>

            <div className="flex items-center gap-3 font-bold text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveTab('admin')}
                className={`hover:text-red-600 px-2 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-red-600 text-white font-extrabold shadow-sm' : ''
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => setActiveTab('customer')}
                className={`hover:text-red-600 px-2 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'customer' ? 'bg-red-600 text-white font-extrabold shadow-sm' : ''
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pengguna</span>
              </button>
              <button
                onClick={() => setActiveTab('monitor')}
                className={`hover:text-red-600 px-2 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'monitor' ? 'bg-red-600 text-white font-extrabold shadow-sm' : ''
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Monitor TV</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <QueueProvider>
      <MainContent />
    </QueueProvider>
  );
}
