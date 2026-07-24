import React, { useState } from 'react';
import { useQueue } from '../../../context/QueueContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  BarChart3,
  Trash2,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const LaporanView: React.FC = () => {
  const { tickets, booths, deleteTicket } = useQueue();

  const now = new Date();
  const [rekapPeriod, setRekapPeriod] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const yearOptions = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);

  // Filter completed & overall tickets based on period
  const filteredTickets = tickets.filter((ticket) => {
    const ticketDate = new Date(ticket.createdAt);
    if (isNaN(ticketDate.getTime())) return true;

    if (rekapPeriod === 'daily') {
      return (
        ticketDate.getDate() === now.getDate() &&
        ticketDate.getMonth() === now.getMonth() &&
        ticketDate.getFullYear() === now.getFullYear()
      );
    } else if (rekapPeriod === 'monthly') {
      return (
        ticketDate.getMonth() === selectedMonth &&
        ticketDate.getFullYear() === selectedYear
      );
    } else if (rekapPeriod === 'yearly') {
      return ticketDate.getFullYear() === selectedYear;
    } else {
      return true; // 'all'
    }
  });

  const completedTickets = filteredTickets.filter((t) => t.status === 'completed');

  // Export data to Excel CSV format
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      alert('Belum ada data transaksi antrian untuk diekspor.');
      return;
    }

    const headers = ['ID Tiket', 'Tanggal', 'Waktu Dibuat', 'Waktu Dipanggil', 'Waktu Selesai', 'Booth', 'Kode Tiket', 'Status'];
    const rows = filteredTickets.map((t) => [
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
    const filename = `Laporan_Antrian_Photobooth_${rekapPeriod.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Laporan & Analisis Transaksi
          </h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Data (.CSV)</span>
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
            <Filter className="w-4 h-4 text-red-600" />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setRekapPeriod('daily')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                rekapPeriod === 'daily' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setRekapPeriod('monthly')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                rekapPeriod === 'monthly' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setRekapPeriod('yearly')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                rekapPeriod === 'yearly' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahunan
            </button>
            <button
              onClick={() => setRekapPeriod('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                rekapPeriod === 'all' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {rekapPeriod === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {(rekapPeriod === 'monthly' || rekapPeriod === 'yearly') && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* BREAKDOWN PER BOOTH CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {booths.map((booth) => {
          const boothTickets = filteredTickets.filter((t) => t.boothId === booth.id);
          const boothCompleted = boothTickets.filter((t) => t.status === 'completed').length;

          return (
            <div key={booth.id} className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-black text-slate-900 text-sm">{booth.name}</span>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                  {booth.code}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Selesai Sesi</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">{boothCompleted}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Tiket</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{boothTickets.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-600" />
            <h2 className="font-extrabold text-slate-900 text-sm">
              Daftar Rincian Transaksi (
              {rekapPeriod === 'daily'
                ? 'Hari Ini'
                : rekapPeriod === 'monthly'
                ? `${monthNames[selectedMonth]} ${selectedYear}`
                : rekapPeriod === 'yearly'
                ? `Tahun ${selectedYear}`
                : 'Semua Transaksi'}
              )
            </h2>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Total: <strong className="text-emerald-600 font-extrabold">{completedTickets.length} Selesai</strong> dari {filteredTickets.length} Tiket
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                <th className="p-3.5">Nomor Tiket</th>
                <th className="p-3.5">Booth Studio</th>
                <th className="p-3.5">Waktu Cetak</th>
                <th className="p-3.5">Waktu Dipanggil</th>
                <th className="p-3.5">Waktu Selesai</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-red-600">
                      {t.ticketNumber}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{t.boothName}</td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {t.calledAt ? new Date(t.calledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {t.completedAt ? new Date(t.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
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
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus transaksi tiket ${t.ticketNumber}?`)) {
                            deleteTicket(t.id);
                          }
                        }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                        title="Hapus Tiket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Belum ada data transaksi untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
