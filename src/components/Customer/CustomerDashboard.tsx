import React, { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Bell, Volume2, Clock, Search, QrCode, Sparkles, CheckCircle2, RefreshCw, Users, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playDoubleChimeSound } from '../../utils/audio';

export const CustomerDashboard: React.FC = () => {
  const {
    tickets,
    booths,
    lastCalledTicket,
    selectedTicketForCustomer,
    setSelectedTicketForCustomer,
    soundEnabled,
    setSoundEnabled,
  } = useQueue();

  const [inputTicket, setInputTicket] = useState('');
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Unlock Web Audio & Speech synthesis context on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.resume();
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Parse ticket parameter from URL or hash on load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
      const ticketNo =
        searchParams.get('ticket') ||
        searchParams.get('t') ||
        searchParams.get('ticketNumber') ||
        searchParams.get('no') ||
        hashParams.get('ticket') ||
        hashParams.get('t');

      if (ticketNo) {
        const cleanNo = ticketNo.trim().toUpperCase();
        setInputTicket(cleanNo);
        const found = tickets.find((t) => t.ticketNumber.trim().toUpperCase() === cleanNo);
        if (found) {
          setSelectedTicketForCustomer(found);
        } else if (!selectedTicketForCustomer || selectedTicketForCustomer.ticketNumber !== cleanNo) {
          const boothCode = cleanNo.replace(/[^A-Z]/g, '').substring(0, 3) || 'BOOTH';
          const matchedBooth = booths.find((b) => b.code.toUpperCase() === boothCode) || (booths.length > 0 ? booths[0] : null);
          // For completed, deleted or unknown ticket links, set completed status so it doesn't cause broken calculations or server errors
          const expiredTicket = {
            id: `expired-${cleanNo}`,
            boothId: matchedBooth ? matchedBooth.id : 'b1',
            boothName: matchedBooth ? matchedBooth.name : 'Photobooth',
            boothCode: matchedBooth ? matchedBooth.code : boothCode,
            ticketNumber: cleanNo,
            sequence: 0,
            status: 'completed' as const,
            createdAt: new Date().toISOString(),
          };
          setSelectedTicketForCustomer(expiredTicket);
        }
      }
    } catch (err) {
      console.warn('URL ticket parsing error:', err);
    }
  }, [tickets, booths, selectedTicketForCustomer, setSelectedTicketForCustomer]);

  // Synchronize live customer ticket from live tickets array
  const currentCustomerTicket = useMemo(() => {
    if (!selectedTicketForCustomer) return null;
    return (
      tickets.find(
        (t) =>
          t.id === selectedTicketForCustomer.id ||
          t.ticketNumber.trim().toUpperCase() === selectedTicketForCustomer.ticketNumber.trim().toUpperCase()
      ) || selectedTicketForCustomer
    );
  }, [tickets, selectedTicketForCustomer]);

  // Find booth details for customer ticket
  const targetBooth = currentCustomerTicket && booths.length > 0
    ? booths.find((b) => b.id === currentCustomerTicket.boothId) || booths[0]
    : null;

  // Find current active called ticket for this booth
  const currentCalledTicketInBooth = currentCustomerTicket
    ? tickets.find((t) => t.boothId === currentCustomerTicket.boothId && t.status === 'called')
    : null;

  // Calculate waiting sequence count
  const ticketsAhead = currentCustomerTicket
    ? tickets.filter(
        (t) =>
          t.boothId === currentCustomerTicket.boothId &&
          t.status === 'waiting' &&
          t.sequence < currentCustomerTicket.sequence
      ).length
    : 0;

  // Estimated wait time in minutes
  const avgTime = targetBooth?.avgTimePerSession && !isNaN(Number(targetBooth.avgTimePerSession))
    ? Number(targetBooth.avgTimePerSession)
    : 5;
  const estimatedWaitMinutes = Math.max(0, ticketsAhead * avgTime);

  // Check if customer ticket is CALLED right now!
  const isMyTurn = currentCustomerTicket && currentCustomerTicket.status === 'called';

  // Trigger celebration & pleasant chime whenever ticket is called
  useEffect(() => {
    if (!currentCustomerTicket) return;

    const isMatchWithLastCalled =
      lastCalledTicket &&
      (lastCalledTicket.id === currentCustomerTicket.id ||
        lastCalledTicket.ticketNumber.trim().toUpperCase() === currentCustomerTicket.ticketNumber.trim().toUpperCase());

    if ((isMyTurn || isMatchWithLastCalled) && !hasCelebrated) {
      setHasCelebrated(true);
      try {
        if (soundEnabled) {
          playDoubleChimeSound();
        }
      } catch (audioErr) {
        console.warn('Customer chime playback warning:', audioErr);
      }

      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  }, [isMyTurn, currentCustomerTicket, lastCalledTicket, hasCelebrated, soundEnabled]);

  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTicket.trim()) return;

    const cleanInput = inputTicket.trim().toUpperCase();
    const found = tickets.find(
      (t) => t.ticketNumber.trim().toUpperCase() === cleanInput
    );

    if (found) {
      setSelectedTicketForCustomer(found);
      setHasCelebrated(false);
      try {
        localStorage.setItem('photobooth_customer_last_ticket_num', found.ticketNumber);
      } catch (err) {
        console.error(err);
      }
    } else {
      alert(`Nomor antrian "${cleanInput}" tidak ditemukan dalam sistem.`);
    }
  };

  const handleToggleNotify = () => {
    if (!soundEnabled) {
      playDoubleChimeSound();
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  const handleResetTicket = () => {
    setSelectedTicketForCustomer(null);
    setInputTicket('');
    setHasCelebrated(false);
    try {
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-12 font-sans">
      {/* SEARCH / LOOKUP TICKET CARD */}
      {!currentCustomerTicket ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
            <QrCode className="w-7 h-7" />
          </div>

          <div>
            <h2 className="font-black text-slate-900 text-2xl tracking-tight">Cek Antrian Anda</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Ketik nomor tiket di bawah ini untuk melihat estimasi waktu & panggilan giliran.
            </p>
          </div>

          <form onSubmit={handleSearchTicket} className="space-y-3 pt-1">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={inputTicket}
                onChange={(e) => setInputTicket(e.target.value)}
                placeholder="Masukkan Nomor (contoh: VIN001)..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-mono font-black uppercase focus:ring-2 focus:ring-red-600 focus:bg-white transition-all shadow-inner text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-red-600/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Lihat Status Antrian</span>
            </button>
          </form>
        </div>
      ) : (
        /* MINIMALIST CUSTOMER TICKET DISPLAY CARD */
        <div className="space-y-4">
          {/* Main Status Display */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border transition-all text-center relative overflow-hidden shadow-2xl ${
              isMyTurn
                ? 'bg-gradient-to-b from-emerald-50 via-emerald-100 to-emerald-50 border-emerald-500 text-emerald-950 ring-4 ring-emerald-500/30'
                : currentCustomerTicket.status === 'completed'
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Status Badge Top Header */}
            <div className="inline-block mb-3">
              {isMyTurn ? (
                <span className="px-5 py-2 rounded-full text-xs sm:text-sm font-black bg-emerald-600 text-white uppercase tracking-wider shadow-lg animate-bounce inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  GILIRAN ANDA TIBA! SILAKAN MASUK BOOTH
                </span>
              ) : currentCustomerTicket.status === 'completed' ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-black bg-slate-200 text-slate-700 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  SESI PHOTOBOOTH SELESAI
                </span>
              ) : (
                <span className="px-4 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300 shadow-sm inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-600" />
                  MENUNGGU GILIRAN
                </span>
              )}
            </div>

            {/* Ticket Number Big Focal Display */}
            <div className="my-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">
                NOMOR TIKET ANDA
              </span>
              <span className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-red-600 my-1 block drop-shadow-sm">
                {currentCustomerTicket.ticketNumber}
              </span>
              <span className="text-xs font-extrabold uppercase text-slate-800 bg-slate-100 px-4 py-1 rounded-full border border-slate-200 inline-block shadow-sm">
                {currentCustomerTicket.boothName}
              </span>
            </div>

            {/* Status Statistics */}
            {currentCustomerTicket.status === 'completed' || currentCustomerTicket.status === 'cancelled' ? (
              <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div>
                  <p className="font-black text-emerald-900 text-sm">Sesi Foto / Tiket Ini Telah Selesai</p>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    Terima kasih telah mengabadikan momen bersama kami!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetTicket}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                  <span>Cari / Scan Tiket Lain</span>
                </button>
              </div>
            ) : (
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    DIPANGGIL SAAT INI
                  </span>
                  <span className="text-2xl font-black font-mono text-slate-900">
                    {currentCalledTicketInBooth ? currentCalledTicketInBooth.ticketNumber : '---'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    ANTRIAN DI DEPAN
                  </span>
                  <span className="text-2xl font-black text-red-600">
                    {isMyTurn ? '0 Orang' : `${ticketsAhead} Orang`}
                  </span>
                </div>
              </div>
            )}

            {/* Estimated Wait Time Banner */}
            {!isMyTurn && currentCustomerTicket.status === 'waiting' && (
              <div className="mt-3 p-3 bg-red-50/80 rounded-2xl border border-red-100 text-center text-xs font-extrabold text-red-800 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  Estimasi tunggu:{' '}
                  {estimatedWaitMinutes > 0 ? `~${estimatedWaitMinutes} menit` : 'Sebentar lagi dipanggil!'}
                </span>
              </div>
            )}
          </div>

          {/* Sound Notification Toggle Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">Notifikasi Suara HP</h3>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {soundEnabled
                    ? 'Suara lonceng aktif saat giliran dipanggil.'
                    : 'Aktifkan agar HP berbunyi saat giliran tiba.'}
                </p>
              </div>
            </div>

            <button
              id="btn-customer-toggle-notify"
              onClick={handleToggleNotify}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0 ${
                soundEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{soundEnabled ? 'Suara Aktif' : 'Aktifkan Suara Lonceng'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Ringkasan Antrian Semua Booth */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-red-600" />
            Ringkasan Antrian Semua Booth
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Live Update</span>
        </div>

        {tickets.length === 0 ? (
          <div className="py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
            Belum ada antrian aktif saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {booths.map((b) => {
              const activeT = tickets.find((t) => t.boothId === b.id && t.status === 'called');
              const waitCount = tickets.filter((t) => t.boothId === b.id && t.status === 'waiting').length;

              return (
                <div key={b.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 block truncate">{b.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Dipanggil</span>
                      <span className="text-sm font-black font-mono text-red-600">
                        {activeT ? activeT.ticketNumber : '---'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Menunggu</span>
                      <span className="text-xs font-extrabold text-amber-600">{waitCount} orang</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


