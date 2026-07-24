import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Users, Megaphone, Maximize2, Minimize2, Sparkles, Camera } from 'lucide-react';

export const MonitorDashboard: React.FC = () => {
  const { booths, tickets, printSettings } = useQueue();

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
              className="w-12 h-12 rounded-2xl object-contain bg-white/10 p-1 border border-slate-700 shadow-lg shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-black shadow-lg shadow-red-600/30 shrink-0">
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
              {welcomeMessage}
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
              const activeTicket = tickets.find((t) => t.boothId === booth.id && t.status === 'called');
              const isJustCalled = lastCalledTicket && activeTicket && lastCalledTicket.id === activeTicket.id;

              return (
                <div
                  key={booth.id}
                  className={`rounded-3xl p-4 sm:p-6 lg:p-7 border-2 transition-all flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden min-w-0 ${
                    isJustCalled
                      ? 'border-red-500 ring-8 ring-red-500/40 bg-gradient-to-b from-red-950 via-slate-900 to-slate-950 animate-pulse'
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
                  <div className="w-full pb-3 border-b border-slate-800/80 text-center min-w-0 relative z-10">
                    <span
                      className={`font-black uppercase tracking-wider text-white block truncate leading-tight ${
                        booths.length <= 2
                          ? 'text-3xl sm:text-4xl lg:text-5xl'
                          : booths.length === 3
                          ? 'text-2xl sm:text-3xl lg:text-4xl'
                          : 'text-xl sm:text-2xl lg:text-3xl'
                      }`}
                      title={booth.name}
                    >
                      {booth.name}
                    </span>
                  </div>

                  {/* Flexible Calling Ticket Number - Extra Large for Distant TV Viewing */}
                  <div className="my-auto py-3 sm:py-6 w-full flex flex-col items-center justify-center min-w-0 relative z-10">
                    <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest block mb-1">
                      NOMOR TIKET
                    </span>
                    <div
                      className={`font-black font-mono tracking-tight text-white drop-shadow-[0_0_40px_rgba(239,68,68,0.75)] transition-all leading-none min-w-0 max-w-full truncate ${
                        booths.length <= 2
                          ? 'text-7xl sm:text-8xl md:text-9xl xl:text-[10rem]'
                          : booths.length === 3
                          ? 'text-6xl sm:text-7xl lg:text-8xl'
                          : 'text-5xl sm:text-6xl lg:text-7xl'
                      }`}
                    >
                      {activeTicket ? activeTicket.ticketNumber : '---'}
                    </div>
                    {activeTicket && activeTicket.customerName && (
                      <span className="mt-2 text-sm sm:text-base font-extrabold text-amber-300 max-w-full truncate bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20">
                        {activeTicket.customerName}
                      </span>
                    )}
                  </div>

                  {/* Call Status Badge */}
                  {activeTicket ? (
                    <div className="w-full py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-red-600/50 min-w-0 px-3 relative z-10 border border-red-400">
                      <span className="w-3 h-3 rounded-full bg-white animate-ping shrink-0" />
                      <span className="truncate">SILAKAN MASUK BOOTH</span>
                    </div>
                  ) : (
                    <div className="w-full py-2.5 sm:py-3 rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-700/80 text-xs sm:text-sm font-extrabold tracking-wider uppercase min-w-0 px-3 truncate relative z-10">
                      BOOTH MENUNGGU
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SECTION: DAFTAR MENUNGGU (COMPACT HIGH-CONTRAST SIDEBAR) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-slate-900/95 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-3">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-black uppercase tracking-wider shrink-0">
              <span className="flex items-center gap-2 text-red-400 text-base font-black">
                <Users className="w-5 h-5 text-red-500" />
                ANTRIAN MENUNGGU
              </span>
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-md shadow-red-600/30">
                {allWaitingTickets.length}
              </span>
            </div>

            {/* Waiting List Cards - High Legibility */}
            {allWaitingTickets.length > 0 ? (
              <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[480px] lg:max-h-full pr-1 flex-1">
                {allWaitingTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-400 shadow-lg shadow-red-600/40 ring-2 ring-red-400/50'
                        : 'bg-slate-800/90 text-slate-100 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono font-black ${
                          index === 0 ? 'bg-white text-red-700 shadow-sm' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-2xl sm:text-3xl tracking-tight font-black leading-none">
                          {ticket.ticketNumber}
                        </span>
                        {ticket.customerName && (
                          <span className="text-[11px] font-bold text-slate-300 truncate max-w-[120px] mt-0.5">
                            {ticket.customerName}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-xs uppercase font-black px-2.5 py-1 rounded-xl shrink-0 ${
                        index === 0 ? 'bg-white text-red-800 font-extrabold shadow-sm' : 'bg-slate-700 text-slate-300'
                      }`}
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

