import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Users, Megaphone, Maximize2, Minimize2, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export const MonitorDashboard: React.FC = () => {
  const { booths, tickets, lastCalledTicket, appsScriptConfig } = useQueue();

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
  const formattedDateStr = `${String(currentTime.getDate()).padStart(2, '0')}/${String(
    currentTime.getMonth() + 1
  ).padStart(2, '0')}/${currentTime.getFullYear()}`;

  const formattedTimeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // All waiting tickets across all booths sorted by time
  const allWaitingTickets = tickets
    .filter((t) => t.status === 'waiting')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-6 flex flex-col justify-between space-y-3 sm:space-y-4 select-none overflow-hidden">
      {/* TOP HEADER BAR (TV MONITOR) */}
      <div className="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-800/90 shadow-2xl flex items-center justify-between gap-4 shrink-0">
        {/* Center Marquee Announcement Banner */}
        <div className="flex flex-1 max-w-2xl bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800/90 overflow-hidden text-xs font-bold text-amber-400 items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-400 z-10 bg-slate-950" />
          <div className="w-full overflow-hidden relative">
            <div className="animate-marquee tracking-wide text-slate-200">
              ✨ Selamat Datang di Klikka Photobooth! Terima kasih telah berkunjung. Silakan bersantai & perhatikan panggilan nomor antrian Anda di layar. Selamat mengabadikan momen seru! 📸
            </div>
          </div>
        </div>

        {/* Clock & Fullscreen Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="bg-slate-950 px-4 py-1.5 rounded-2xl border border-slate-800 flex items-baseline gap-2 text-right">
            <span className="text-2xl sm:text-3xl font-black font-mono text-red-500 tracking-tight">
              {formattedTimeStr}
            </span>
            <span className="text-xs text-slate-400 font-bold font-mono hidden sm:inline">
              {formattedDateStr}
            </span>
          </div>

          {/* Fullscreen Toggle Button (Icon Only) */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-2xl border border-slate-700 transition-all flex items-center justify-center shadow-md"
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

      {/* MAIN CONTENT AREA (LANDSCAPE DOMINANT GRID) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 min-h-0">
        {/* LEFT / MAIN SECTION: BOOTHS DIPANGGIL (DOMINANT 9 COLS) */}
        <div className="lg:col-span-9 flex flex-col justify-between space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 shrink-0">
            <h3 className="font-black text-white text-base sm:text-xl tracking-wider flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-red-500 animate-pulse" />
              <span>SEDANG DIPANGGIL SAAT INI</span>
            </h3>
          </div>

          {/* Dominant Booth Cards Container */}
          <div
            className={`flex-1 grid gap-2.5 sm:gap-3.5 ${
              booths.length === 1
                ? 'grid-cols-1'
                : booths.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : booths.length === 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-2 lg:grid-cols-4 auto-rows-fr'
            }`}
          >
            {booths.map((booth) => {
              const activeTicket = tickets.find((t) => t.boothId === booth.id && t.status === 'called');
              const isJustCalled = lastCalledTicket && activeTicket && lastCalledTicket.id === activeTicket.id;

              return (
                <div
                  key={booth.id}
                  className={`bg-slate-900/95 rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 border transition-all flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden min-w-0 ${
                    isJustCalled
                      ? 'border-red-500 ring-4 ring-red-500/60 bg-gradient-to-b from-red-950/80 via-slate-900 to-slate-950 animate-pulse'
                      : activeTicket
                      ? 'border-red-600/70 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950'
                      : 'border-slate-800/90 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  {/* Booth Header Title */}
                  <div className="w-full pb-2 sm:pb-3 border-b border-slate-800 text-center min-w-0">
                    <span
                      className={`font-black uppercase tracking-wider text-white block truncate leading-tight ${
                        booths.length <= 2
                          ? 'text-2xl sm:text-3xl lg:text-4xl'
                          : booths.length === 3
                          ? 'text-xl sm:text-2xl lg:text-3xl'
                          : 'text-base sm:text-lg lg:text-2xl'
                      }`}
                      title={booth.name}
                    >
                      {booth.name}
                    </span>
                  </div>

                  {/* Flexible Calling Ticket Number */}
                  <div className="my-auto py-2 sm:py-4 w-full flex flex-col items-center justify-center min-w-0">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
                      NOMOR TIKET
                    </span>
                    <div
                      className={`font-black font-mono tracking-tight text-white drop-shadow-[0_0_35px_rgba(239,68,68,0.6)] transition-all leading-none min-w-0 max-w-full truncate ${
                        booths.length <= 2
                          ? 'text-6xl sm:text-7xl md:text-8xl lg:text-[8rem]'
                          : booths.length === 3
                          ? 'text-5xl sm:text-6xl lg:text-7xl'
                          : 'text-4xl sm:text-5xl lg:text-6xl'
                      }`}
                    >
                      {activeTicket ? activeTicket.ticketNumber : '---'}
                    </div>
                  </div>

                  {/* Call Status Badge */}
                  {activeTicket ? (
                    <div className="w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-red-600 text-white font-black text-xs sm:text-sm lg:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl shadow-red-600/50 min-w-0 px-2">
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white animate-ping shrink-0" />
                      <span className="truncate">SILAKAN MASUK BOOTH</span>
                    </div>
                  ) : (
                    <div className="w-full py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-800 text-[11px] sm:text-xs lg:text-sm font-extrabold tracking-wide uppercase min-w-0 px-2 truncate">
                      BOOTH MENUNGGU
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SECTION: DAFTAR MENUNGGU (COMPACT 3 COLS SIDEBAR) */}
        <div className="lg:col-span-3 bg-slate-900/95 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-3">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs font-black uppercase tracking-wider shrink-0">
              <span className="flex items-center gap-1.5 text-red-400 text-sm font-black">
                <Users className="w-4 h-4 text-red-500" />
                MENUNGGU
              </span>
              <span className="bg-red-600/20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/30 text-xs font-black">
                {allWaitingTickets.length}
              </span>
            </div>

            {/* Waiting List Cards (Slightly smaller & compact) */}
            {allWaitingTickets.length > 0 ? (
              <div className="mt-3 space-y-2 overflow-y-auto max-h-[480px] lg:max-h-full pr-1 flex-1">
                {allWaitingTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 shadow-md shadow-red-600/30 font-black'
                        : 'bg-slate-800/80 text-slate-200 border-slate-700/70 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                          index === 0 ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <span className="font-mono text-xl sm:text-2xl tracking-tight font-black">
                        {ticket.ticketNumber}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-lg ${
                        index === 0 ? 'bg-white text-red-700 shadow-sm' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {ticket.boothName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs italic font-medium flex-1 flex items-center justify-center">
                Belum ada antrian.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 text-center font-bold shrink-0">
            Perhatikan panggilan nomor di layar
          </div>
        </div>
      </div>
    </div>
  );
};
