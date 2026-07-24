import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { BoothCard } from './BoothCard';
import { SettingsModal } from './SettingsModal';
import { TicketPrintModal } from './TicketPrintModal';
import { AdminLogin } from './AdminLogin';
import { Booth, Ticket } from '../../types';
import {
  Sliders,
  Plus,
  History,
  Clock,
  Users,
  Megaphone,
  Printer,
  Sparkles,
  Download,
  Calendar,
  BarChart3,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Share2,
  Trash2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    booths,
    tickets,
    logs,
    clearTodayLogs,
    isAdminLoggedIn,
    logoutAdmin,
    deleteTicket,
  } = useQueue();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'booths' | 'label' | 'script' | 'danger'>('booths');
  const [selectedBoothForEdit, setSelectedBoothForEdit] = useState<Booth | null>(null);
  // Time filter for Rekapan Selesai
  const [rekapPeriod, setRekapPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  // If not logged in as Admin, show Admin Login Card
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  // Quick Stats
  const totalWaiting = tickets.filter((t) => t.status === 'waiting').length;
  const totalCalled = tickets.filter((t) => t.status === 'called' || t.status === 'completed').length;
  const totalPrinted = tickets.length;

  const handleEditBoothFromCard = (booth: Booth) => {
    setSelectedBoothForEdit(booth);
    setSettingsTab('booths');
    setIsSettingsOpen(true);
  };

  const handleOpenSettings = (tab: 'booths' | 'label' | 'script' | 'danger' = 'booths') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // Filter completed tickets based on period (Daily, Monthly, Yearly)
  const now = new Date();
  const currentDayStr = now.toLocaleDateString('id-ID'); // e.g. "23/07/2026"
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  const filteredTicketsForRekap = tickets.filter((ticket) => {
    const ticketDate = new Date(ticket.createdAt);
    if (isNaN(ticketDate.getTime())) return true; // fallback if bad date

    if (rekapPeriod === 'daily') {
      return (
        ticketDate.getDate() === now.getDate() &&
        ticketDate.getMonth() === currentMonth &&
        ticketDate.getFullYear() === currentYear
      );
    } else if (rekapPeriod === 'monthly') {
      return ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear;
    } else {
      // yearly
      return ticketDate.getFullYear() === currentYear;
    }
  });

  const completedTicketsInRekap = filteredTicketsForRekap.filter((t) => t.status === 'completed');

  // Export data to Excel CSV format
  const handleExportExcelCSV = () => {
    if (filteredTicketsForRekap.length === 0) {
      alert('Belum ada data transaksi antrian untuk diekspor.');
      return;
    }

    const headers = ['ID Tiket', 'Tanggal', 'Waktu Dibuat', 'Waktu Dipanggil', 'Waktu Selesai', 'Booth', 'Kode Tiket', 'Status'];
    const rows = filteredTicketsForRekap.map((t) => [
      t.id,
      new Date(t.createdAt).toLocaleDateString('id-ID'),
      new Date(t.createdAt).toLocaleTimeString('id-ID'),
      t.calledAt ? new Date(t.calledAt).toLocaleTimeString('id-ID') : '-',
      t.completedAt ? new Date(t.completedAt).toLocaleTimeString('id-ID') : '-',
      `"${t.boothName}"`,
      t.ticketNumber,
      t.status.toUpperCase(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `Rekap_Antrian_Photobooth_${rekapPeriod.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Controls (Dark Red & Blue Monitor High-Tech Theme) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 p-6 rounded-3xl text-white shadow-2xl border border-red-900/60 relative overflow-hidden">
        {/* Glowing Background Accent */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -top-8 w-44 h-44 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 text-red-300 text-xs font-extrabold border border-red-700/60">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              Control Center Operator
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black shadow-sm">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Logged In
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
            Dashboard Admin Photobooth
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium leading-relaxed">
            Kelola pendaftaran antrian, panggil pengunjung per-booth, cetak label thermal, dan atur kustomisasi sistem.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            id="btn-admin-add-booth"
            onClick={() => handleOpenSettings('booths')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95 border border-red-500/50"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Booth</span>
          </button>

          <button
            id="btn-admin-settings-label"
            onClick={() => handleOpenSettings('label')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-blue-300 backdrop-blur-md border border-blue-500/40 font-bold text-xs transition-all"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Desain Label</span>
          </button>

          <button
            id="btn-admin-settings"
            onClick={() => handleOpenSettings('booths')}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all"
            title="Pengaturan Lengkap"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Logout Admin Button */}
          <button
            id="btn-admin-logout"
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs shadow-md border border-slate-700/80 transition-all active:scale-95 ml-1"
            title="Keluar dari Dashboard Admin"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Antrian Menunggu</p>
            <h4 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{totalWaiting}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Dipanggil / Selesai</p>
            <h4 className="text-2xl font-black text-red-600 font-mono mt-0.5">{totalCalled}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Tiket Hari Ini</p>
            <h4 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{totalPrinted}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Printer className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Booth Aktif</p>
            <h4 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{booths.length}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Queue Columns per Booth */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            Kolom Antrian Photobooth
            <span className="text-xs bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full">
              {booths.length} Booth
            </span>
          </h3>
          <p className="text-xs text-slate-500 hidden sm:block font-medium">
            Tekan <strong className="font-bold text-red-600">CALL NEXT</strong> untuk memanggil & <strong className="font-bold text-slate-900">PRINT TICKET</strong> untuk mencetak.
          </p>
        </div>

        {booths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {booths.map((booth) => (
              <BoothCard key={booth.id} booth={booth} onEditBooth={handleEditBoothFromCard} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500 font-medium">Belum ada kolom booth antrian.</p>
            <button
              onClick={() => handleOpenSettings('booths')}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
            >
              Tambah Booth Pertama
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity Section ("Hari ini") */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity (Hari Ini)</h3>
            <span className="text-xs text-slate-400">({logs.length} catatan)</span>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                id="btn-clear-logs"
                onClick={clearTodayLogs}
                className="text-xs text-slate-400 hover:text-rose-600 font-bold transition-colors"
              >
                Bersihkan Log
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log) => {
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (log.action === 'CALL_NEXT') badgeColor = 'bg-red-100 text-red-800 border-red-200';
              if (log.action === 'PRINT_TICKET') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              if (log.action === 'RECALL') badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
              if (log.action === 'COMPLETE') badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';

              return (
                <div key={log.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {log.timestamp}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-medium text-slate-800">
                      {log.details}
                    </span>
                  </div>

                  {log.boothName && (
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg hidden sm:inline-block">
                      {log.boothName}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              Belum ada aktivitas hari ini
            </div>
          )}
        </div>
      </div>

      {/* NEW FEATURE: REKAPAN SELESAI (HARI INI, BULANAN, TAHUNAN) + EKSPOR EXCEL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-extrabold mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Laporan Rekapitulasi Sesi
            </div>
            <h3 className="text-lg font-black text-slate-900">Rekapan Selesai Photobooth</h3>
            <p className="text-xs text-slate-500 font-medium">
              Catatan jumlah pengunjung selesai per hari, bulan, dan tahun dengan fasilitas ekspor file Excel.
            </p>
          </div>

          {/* Period Filter Tabs & Excel Export Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setRekapPeriod('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rekapPeriod === 'daily'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setRekapPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rekapPeriod === 'monthly'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Per Bulan
              </button>
              <button
                onClick={() => setRekapPeriod('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rekapPeriod === 'yearly'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Per Tahun
              </button>
            </div>

            <button
              id="btn-export-excel"
              onClick={handleExportExcelCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Breakdown Per Booth Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {booths.map((booth) => {
            const boothTicketsInRekap = filteredTicketsForRekap.filter((t) => t.boothId === booth.id);
            const boothCompleted = boothTicketsInRekap.filter((t) => t.status === 'completed').length;
            const boothWaiting = boothTicketsInRekap.filter((t) => t.status === 'waiting').length;

            return (
              <div key={booth.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{booth.name}</span>
                  <span className="text-xs font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {booth.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Selesai Sesi</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">{boothCompleted}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Tiket</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{boothTicketsInRekap.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Table of Transactions */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-100/70 p-3 text-xs font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-red-600" />
              Daftar Transaksi ({rekapPeriod === 'daily' ? 'Hari Ini' : rekapPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})
            </span>
            <span className="text-slate-500 font-normal">
              Total: {completedTicketsInRekap.length} Selesai dari {filteredTicketsForRekap.length} Tiket
            </span>
          </div>

          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                  <th className="p-3">Nomor Tiket</th>
                  <th className="p-3">Booth</th>
                  <th className="p-3">Waktu Cetak</th>
                  <th className="p-3">Waktu Dipanggil</th>
                  <th className="p-3">Waktu Selesai</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredTicketsForRekap.length > 0 ? (
                  filteredTicketsForRekap.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-red-700 hover:underline cursor-pointer" onClick={() => {
                        if (confirm(`Hapus antrian ${t.ticketNumber}?`)) {
                          deleteTicket(t.id);
                        }
                      }}>
                        {t.ticketNumber}
                      </td>
                      <td className="p-3 font-semibold">{t.boothName}</td>
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {t.calledAt ? new Date(t.calledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {t.completedAt ? new Date(t.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            t.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'called'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus antrian ${t.ticketNumber}?`)) {
                              deleteTicket(t.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                          title="Hapus Antrian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      Belum ada transaksi tiket tercatat pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settings Modal Component */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />

      {/* Ticket Thermal Print Preview Modal */}
      <TicketPrintModal />
    </div>
  );
};
