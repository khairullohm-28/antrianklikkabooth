import React, { useState } from 'react';
import { useQueue } from '../../../context/QueueContext';
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  Printer,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const BerandaView: React.FC = () => {
  const { tickets, booths } = useQueue();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-11
  const [chartMode, setChartMode] = useState<'yearly_months' | 'monthly_days'>('yearly_months');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  const yearOptions = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);

  // 1. CALCULATE STATS
  // Today
  const todayTickets = tickets.filter((t) => {
    const d = new Date(t.createdAt);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayTickets = tickets.filter((t) => {
    const d = new Date(t.createdAt);
    return (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    );
  });

  // This Week (last 7 days)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const thisWeekTickets = tickets.filter((t) => {
    const d = new Date(t.createdAt);
    return d >= sevenDaysAgo && d <= now;
  });

  // This Month
  const thisMonthTickets = tickets.filter((t) => {
    const d = new Date(t.createdAt);
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  // 2. CHART DATA PREPARATION
  // Yearly breakdown (12 Months for selectedYear)
  const monthlyDataForYear = Array.from({ length: 12 }, (_, monthIdx) => {
    const count = tickets.filter((t) => {
      const d = new Date(t.createdAt);
      return d.getFullYear() === selectedYear && d.getMonth() === monthIdx;
    }).length;

    const completed = tickets.filter((t) => {
      const d = new Date(t.createdAt);
      return d.getFullYear() === selectedYear && d.getMonth() === monthIdx && t.status === 'completed';
    }).length;

    return { monthIdx, name: shortMonthNames[monthIdx], fullName: monthNames[monthIdx], total: count, completed };
  });

  const maxYearlyValue = Math.max(...monthlyDataForYear.map((d) => d.total), 1);

  // Monthly breakdown (Days of selectedMonth in selectedYear)
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyDataForMonth = Array.from({ length: daysInSelectedMonth }, (_, dayIdx) => {
    const dayNum = dayIdx + 1;
    const count = tickets.filter((t) => {
      const d = new Date(t.createdAt);
      return (
        d.getFullYear() === selectedYear &&
        d.getMonth() === selectedMonth &&
        d.getDate() === dayNum
      );
    }).length;

    const completed = tickets.filter((t) => {
      const d = new Date(t.createdAt);
      return (
        d.getFullYear() === selectedYear &&
        d.getMonth() === selectedMonth &&
        d.getDate() === dayNum &&
        t.status === 'completed'
      );
    }).length;

    return { dayNum, total: count, completed };
  });

  const maxDailyValue = Math.max(...dailyDataForMonth.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Ringkasan Photobooth
          </h1>
        </div>

        <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-2xl border border-slate-700/80 text-right">
          <span className="text-sm font-black text-red-400 font-mono">
            {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* 4 CORE STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tiket Hari Ini */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-md flex items-center justify-between relative overflow-hidden group hover:border-red-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Tiket Hari Ini
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {todayTickets.length}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Selesai: {todayTickets.filter((t) => t.status === 'completed').length} tiket
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold shadow-inner shrink-0">
            <Printer className="w-6 h-6" />
          </div>
        </div>

        {/* Total Kemarin */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-md flex items-center justify-between relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Kemarin
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {yesterdayTickets.length}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {yesterday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Selesai: {yesterdayTickets.filter((t) => t.status === 'completed').length} tiket
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-inner shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Pekan Ini */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-md flex items-center justify-between relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Pekan Ini
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {thisWeekTickets.length}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">7 hari</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Selesai: {thisWeekTickets.filter((t) => t.status === 'completed').length} tiket
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-inner shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Bulan Ini */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-md flex items-center justify-between relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Bulan Ini
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {thisMonthTickets.length}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {monthNames[now.getMonth()]}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Selesai: {thisMonthTickets.filter((t) => t.status === 'completed').length} tiket
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-inner shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* GRAPHIC CHART: GRAFIK PERFORMA TRANSAKSI */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              Grafik Performa Transaksi
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setChartMode('yearly_months')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  chartMode === 'yearly_months'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                12 Bulan ({selectedYear})
              </button>
              <button
                onClick={() => setChartMode('monthly_days')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  chartMode === 'monthly_days'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Harian {monthNames[selectedMonth]}
              </button>
            </div>

            {/* Month Picker if monthly_days mode */}
            {chartMode === 'monthly_days' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-2xl text-xs font-extrabold text-slate-800 shadow-sm focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            {/* Year Picker */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-2xl text-xs font-extrabold text-slate-800 shadow-sm focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* VISUAL CHART BARS */}
        {chartMode === 'yearly_months' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-extrabold">
              <span>GRAFIK PER BULAN ({selectedYear})</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" /> Total Tiket
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Selesai Sesi
                </span>
              </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
              {monthlyDataForYear.map((item) => {
                const totalHeightPct = (item.total / maxYearlyValue) * 100;
                const completedHeightPct = item.total > 0 ? (item.completed / maxYearlyValue) * 100 : 0;

                return (
                  <div
                    key={item.monthIdx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative cursor-pointer"
                    onClick={() => {
                      setSelectedMonth(item.monthIdx);
                      setChartMode('monthly_days');
                    }}
                  >
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[11px] font-mono px-2.5 py-1 rounded-xl shadow-lg pointer-events-none whitespace-nowrap text-center">
                      <p className="font-extrabold text-red-400">{item.fullName}</p>
                      <p>{item.total} Tiket | {item.completed} Selesai</p>
                    </div>

                    {/* Bar graphic */}
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden relative flex items-end justify-center transition-all group-hover:bg-slate-200" style={{ height: '100%' }}>
                      {item.total > 0 && (
                        <div
                          className="w-full bg-red-500/30 rounded-t-xl transition-all duration-500 relative flex items-end justify-center"
                          style={{ height: `${Math.max(totalHeightPct, 6)}%` }}
                        >
                          <div
                            className="w-full bg-emerald-500 rounded-t-xl transition-all duration-500"
                            style={{ height: `${Math.max(completedHeightPct, item.completed > 0 ? 6 : 0)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Value Badge */}
                    <span className="text-[10px] font-extrabold font-mono text-slate-700">
                      {item.total}
                    </span>

                    {/* Month Label */}
                    <span className="text-xs font-bold text-slate-600 truncate max-w-full">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-extrabold">
              <span>GRAFIK HARIAN ({monthNames[selectedMonth]} {selectedYear})</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" /> Total Tiket
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Selesai Sesi
                </span>
              </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-1 pt-6 pb-2 px-1 border-b border-slate-200 overflow-x-auto">
              {dailyDataForMonth.map((item) => {
                const totalHeightPct = (item.total / maxDailyValue) * 100;
                const completedHeightPct = item.total > 0 ? (item.completed / maxDailyValue) * 100 : 0;

                return (
                  <div
                    key={item.dayNum}
                    className="flex-1 min-w-[20px] flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-xl shadow-lg pointer-events-none whitespace-nowrap text-center">
                      <p className="font-extrabold text-red-400">Tgl {item.dayNum} {monthNames[selectedMonth]}</p>
                      <p>{item.total} Tiket | {item.completed} Selesai</p>
                    </div>

                    {/* Bar graphic */}
                    <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden relative flex items-end justify-center transition-all group-hover:bg-slate-200" style={{ height: '100%' }}>
                      {item.total > 0 && (
                        <div
                          className="w-full bg-red-500/30 rounded-t-lg transition-all duration-500 flex items-end"
                          style={{ height: `${Math.max(totalHeightPct, 6)}%` }}
                        >
                          <div
                            className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500"
                            style={{ height: `${Math.max(completedHeightPct, item.completed > 0 ? 6 : 0)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Day Label */}
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {item.dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUMMARY STATS FOR SELECTED PERIOD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase block">Total Tiket Periode Ini</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
              {chartMode === 'yearly_months'
                ? monthlyDataForYear.reduce((acc, curr) => acc + curr.total, 0)
                : dailyDataForMonth.reduce((acc, curr) => acc + curr.total, 0)} Tiket
            </span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase block">Total Selesai Foto</span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
              {chartMode === 'yearly_months'
                ? monthlyDataForYear.reduce((acc, curr) => acc + curr.completed, 0)
                : dailyDataForMonth.reduce((acc, curr) => acc + curr.completed, 0)} Selesai
            </span>
          </div>

          <div className="p-4 bg-red-50/70 rounded-2xl border border-red-200">
            <span className="text-[11px] font-extrabold text-red-800 uppercase block">Jumlah Booth Aktif</span>
            <span className="text-2xl font-black text-red-700 font-mono mt-0.5 block">
              {booths.length} Booth Studio
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
