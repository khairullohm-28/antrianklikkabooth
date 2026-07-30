import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Users, Megaphone, Maximize2, Minimize2, Sparkles, Camera } from 'lucide-react';
import { ConnectionStatusBadge } from '../ConnectionStatusBadge';

export const MonitorDashboard: React.FC = () => {
  const { booths, tickets, lastCalledTicket, printSettings } = useQueue();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  // Format Date dd/mm/yyyy hh:mm:ss
  const formattedDateStr = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTimeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // All waiting tickets across all booths sorted by time
  const allWaitingTickets = tickets
    .filter((t) => t.status === 'waiting')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const welcomeMessage =
    printSettings.monitorWelcomeText ||
    '📸 Selamat datang di Photobooth! Silakan bersantai & perhatikan nomor antrian Anda di layar. Persiapkan pose terbaik Anda! ✨';

  const brandTitle = printSettings.monitorBrandTitle || printSettings.branchName || 'LAYAR ANTRIAN PHOTOBOOTH';

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-6 flex flex-col justify-between space-y-3 sm:space-y-4 select-none overflow-hidden font-sans">
      {/* TOP HEADER BAR (TV DISPLAY MONITOR) */}
      <div className="bg-slate-900/95 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        {/* Brand / Custom Logo + Marquee Announcement */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          {printSettings.monitorLogoUrl ? (
            <img
              src={printSettings.monitorLogoUrl}
              alt="Logo Perusahaan"
              className="w-12 h-12 rounded-full object-cover shadow-lg shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-black shadow-lg shadow-red-600/30 shrink-0">
              <Camera className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {brandTitle}
            </h1>
            <p className="text-xs text-slate-400 font-semibold">{formattedDateStr}</p>
          </div>
        </div>

        {/* Center Running Text / Announcement */}
        <div className="hidden lg:flex flex-1 max-w-xl bg-slate-950/90 px-4 py-2.5 rounded-2xl border border-slate-800/90 overflow-hidden text-sm font-extrabold text-amber-300 items-center gap-2 shadow-inner">
          <Sparkles className="w-5 h-5 shrink-0 text-amber-400 z-10 bg-slate-950" />
          <div className="w-full overflow-hidden relative">
            <div className="animate-marquee tracking-wide whitespace-nowrap text-slate-200">
              <span className="pr-16">{welcomeMessage}</span>
              <span className="pr-16">{welcomeMessage}</span>
            </div>
          </div>
        </div>

        {/* Right Controls: Clock & Action Buttons */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0">
          <div className="bg-slate-950 px-5 py-2 rounded-2xl border border-slate-800 shadow-inner flex items-baseline gap-2 text-right">
            <span className="text-3xl sm:text-4xl font-black font-mono text-red-500 tracking-tight drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              {formattedTimeStr}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ConnectionStatusBadge showText={false} minimal={true} />
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-2xl border border-slate-700 transition-all flex items-center justify-center shadow-md"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Tampilkan Layar Penuh (TV)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-amber-400" />
              ) : (
                <Maximize2 className="w-5 h-5 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 min-h-0">
        {/* LEFT / MAIN SECTION: BOOTHS DIPANGGIL (DOMINANT 8 or 9 COLS) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 shrink-0">
            <h2 className="font-black text-white text-lg sm:text-2xl tracking-wider flex items-center gap-2.5">
              <Megaphone className="w-7 h-7 text-red-500 animate-pulse" />
              <span>SEDANG DIPANGGIL</span>
            </h2>
          </div>

          {/* Dominant Booth Cards Grid */}
          <div
            className={`flex-1 grid gap-3 sm:gap-4 ${
              booths.length === 1
                ? 'grid-cols-1'
                : booths.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : booths.length === 3
                ? 'grid-cols-1 md:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            }`}
          >
            {booths.map((booth) => {
              const activeTicket =
                tickets.find((t) => t.boothId === booth.id && (t.status === 'called' || (t.status as string) === 'serving')) ||
                (lastCalledTicket && lastCalledTicket.boothId === booth.id && (lastCalledTicket.status === 'called' || (lastCalledTicket.status as string) === 'serving') ? lastCalledTicket : null);
              const isJustCalled = lastCalledTicket && activeTicket && lastCalledTicket.id === activeTicket.id;

              return (
                <div
                  key={booth.id}
                  className={`rounded-3xl p-3.5 sm:p-5 lg:p-6 border-2 transition-all flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden min-w-0 ${
                    isJustCalled
                      ? 'border-red-500 ring-4 sm:ring-8 ring-red-500/40 bg-gradient-to-b from-red-950 via-slate-900 to-slate-950 animate-pulse'
                      : activeTicket
                      ? 'border-red-600 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-red-950/50'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  {/* Glowing Backdrop Accent when Active */}
                  {activeTicket && (
                    <div className="absolute inset-0 bg-red-600/10 pointer-events-none blur-2xl" />
                  )}

                  {/* Booth Header Title */}
                  <div className="w-full pb-2.5 sm:pb-3 border-b border-slate-800/80 text-center min-w-0 relative z-10 shrink-0">
                    <span
                      className={`font-black uppercase tracking-wide text-white block truncate leading-snug px-1 ${
                        booths.length <= 2
                          ? 'text-2xl sm:text-3xl lg:text-4xl'
                          : booths.length === 3
                          ? 'text-xl sm:text-2xl lg:text-3xl'
                          : 'text-lg sm:text-xl lg:text-2xl'
                      }`}
                      title={booth.name}
                    >
                      {booth.name}
                    </span>
                  </div>

                  {/* Flexible Calling Ticket Number - Scaled for 22"-24"+ TV Screens */}
                  <div className="my-auto py-2 sm:py-4 w-full flex flex-col items-center justify-center min-w-0 relative z-10">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                      NOMOR TIKET
                    </span>
                    <div
                      className={`font-black font-mono tracking-tight text-white drop-shadow-[0_0_30px_rgba(239,68,68,0.7)] transition-all leading-tight min-w-0 max-w-full truncate px-1 my-1 ${
                        booths.length <= 2
                          ? 'text-5xl sm:text-7xl lg:text-8xl xl:text-9xl'
                          : booths.length === 3
                          ? 'text-4xl sm:text-6xl lg:text-7xl'
                          : 'text-3xl sm:text-5xl lg:text-6xl'
                      }`}
                    >
                      {activeTicket ? activeTicket.ticketNumber : '---'}
                    </div>
                    {activeTicket && activeTicket.customerName && (
                      <span className="mt-1 text-xs sm:text-sm font-extrabold text-amber-300 max-w-full truncate bg-amber-400/10 px-2.5 py-0.5 rounded-xl border border-amber-400/20">
                        {activeTicket.customerName}
                      </span>
                    )}
                  </div>

                  {/* Call Status Badge */}
                  {activeTicket ? (
                    <div className="w-full py-2.5 sm:py-3.5 px-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-black text-xs sm:text-sm lg:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 min-w-0 shrink-0 border border-red-400 relative z-10">
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
                      <span className="truncate">SILAKAN MASUK BOOTH</span>
                    </div>
                  ) : (
                    <div className="w-full py-2 sm:py-2.5 px-3 rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-700/80 text-[11px] sm:text-xs font-extrabold tracking-wider uppercase min-w-0 truncate relative z-10 shrink-0">
                      BOOTH MENUNGGU
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SECTION: DAFTAR MENUNGGU (COMPACT HIGH-CONTRAST SIDEBAR) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-slate-900/95 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex flex-col h-full min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-black uppercase tracking-wider shrink-0">
              <span className="flex items-center gap-2 text-red-400 text-sm sm:text-base font-black">
                <Users className="w-5 h-5 text-red-500 shrink-0" />
                <span className="truncate">ANTRIAN MENUNGGU</span>
              </span>
              <span className="bg-red-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black shadow-md shadow-red-600/30 shrink-0">
                {allWaitingTickets.length}
              </span>
            </div>

            {/* Waiting List Cards - High Legibility */}
            {allWaitingTickets.length > 0 ? (
              <div className="mt-3 space-y-2 overflow-y-auto max-h-[480px] lg:max-h-full pr-1 flex-1 min-w-0">
                {allWaitingTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all min-w-0 ${
                      index === 0
                        ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-400 shadow-lg shadow-red-600/40 ring-2 ring-red-400/50'
                        : 'bg-slate-800/90 text-slate-100 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-lg font-mono font-black shrink-0 ${
                          index === 0 ? 'bg-white text-red-700 shadow-sm' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-xl sm:text-2xl tracking-tight font-black leading-none truncate">
                          {ticket.ticketNumber}
                        </span>
                        {ticket.customerName && (
                          <span className="text-[10px] font-bold text-slate-300 truncate max-w-[100px] mt-0.5">
                            {ticket.customerName}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] uppercase font-black px-2 py-0.5 rounded-xl shrink-0 max-w-[110px] truncate text-center ${
                        index === 0 ? 'bg-white text-red-800 font-extrabold shadow-sm' : 'bg-slate-700 text-slate-300'
                      }`}
                      title={ticket.boothName}
                    >
                      {ticket.boothName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm italic font-medium flex-1 flex items-center justify-center">
                Belum ada antrian menunggu.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 text-center font-bold shrink-0">
            🔔 Mohon persiapkan tiket Anda
          </div>
        </div>
      </div>
    </div>
  );
};

