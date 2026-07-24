import React, { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Bell, Volume2, Clock, Search, QrCode, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playChimeSound } from '../../utils/audio';

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

  // Unlock Web Audio context on user interaction
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

  // Parse ticket parameter from URL or hash on load & when tickets update
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
        const matchedBooth = booths.find((b) => b.code.toUpperCase() === boothCode) || booths[0];
        const virtualTicket = {
          id: `virtual-${cleanNo}`,
          boothId: matchedBooth ? matchedBooth.id : 'b1',
          boothName: matchedBooth ? matchedBooth.name : 'Photobooth',
          boothCode: matchedBooth ? matchedBooth.code : boothCode,
          ticketNumber: cleanNo,
          sequence: 999,
          status: 'waiting' as const,
          createdAt: new Date().toISOString(),
        };
        setSelectedTicketForCustomer(virtualTicket);
      }
    }
  }, [tickets, booths, selectedTicketForCustomer, setSelectedTicketForCustomer]);

  // Synchronize live customer ticket from live tickets array so status changes (e.g. 'called') are instantly reactive
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
  const targetBooth = currentCustomerTicket
    ? booths.find((b) => b.id === currentCustomerTicket.boothId)
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
  const estimatedWaitMinutes = targetBooth
    ? Math.max(0, ticketsAhead * targetBooth.avgTimePerSession)
    : 0;

  // Check if customer ticket is CALLED right now!
  const isMyTurn = currentCustomerTicket && currentCustomerTicket.status === 'called';

  // Trigger celebration & chime audio whenever my ticket is called by Admin (or recalled)!
  useEffect(() => {
    if (!currentCustomerTicket) return;

    // Direct check if my ticket status is 'called'
    if (isMyTurn && !hasCelebrated) {
      setHasCelebrated(true);
      playChimeSound();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log(err);
      }
    }
  }, [isMyTurn, currentCustomerTicket, hasCelebrated]);

  // React directly when Admin calls next
  useEffect(() => {
    if (!lastCalledTicket || !currentCustomerTicket) return;

    const isMatch =
      lastCalledTicket.id === currentCustomerTicket.id ||
      lastCalledTicket.ticketNumber.trim().toUpperCase() === currentCustomerTicket.ticketNumber.trim().toUpperCase();

    if (isMatch) {
      playChimeSound();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log(err);
      }
    }
  }, [lastCalledTicket, currentCustomerTicket]);

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
      playChimeSound();
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Search / Lookup Form - Always available or collapsible when ticket selected */}
      {!currentCustomerTicket ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-sm">
            <QrCode className="w-7 h-7" />
          </div>

          <div>
            <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl">Cek Status Antrian Kamu</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Masukkan nomor tiket kamu atau scan QR Code pada struk fisik antrian.
            </p>
          </div>

          <form onSubmit={handleSearchTicket} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={inputTicket}
                onChange={(e) => setInputTicket(e.target.value)}
                placeholder="Contoh: VIN002..."
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-black uppercase focus:ring-2 focus:ring-red-600 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Cek Tiket</span>
            </button>
          </form>
        </div>
      ) : (
        /* CUSTOMER TICKET STATUS CARD */
        <div className="space-y-4">
          {/* Main Status Display */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border transition-all text-center relative overflow-hidden shadow-xl ${
              isMyTurn
                ? 'bg-gradient-to-b from-emerald-50 via-emerald-100 to-emerald-50 border-emerald-400 text-emerald-950 ring-4 ring-emerald-500/30 animate-pulse'
                : currentCustomerTicket.status === 'completed'
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-gradient-to-b from-red-50/60 to-white border-red-200 text-slate-900'
            }`}
          >
            {/* Status Tag */}
            <div className="inline-block mb-3">
              {isMyTurn ? (
                <span className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-black bg-emerald-600 text-white uppercase tracking-wider shadow-lg animate-bounce inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  GILIRAN KAMU TIBA! SILAKAN MASUK BOOTH!
                </span>
              ) : currentCustomerTicket.status === 'completed' ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                  SESI PHOTOBOOTH SELESAI
                </span>
              ) : (
                <span className="px-4 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300 shadow-sm">
                  MENUNGGU GILIRAN
                </span>
              )}
            </div>

            {/* Ticket Big Number */}
            <div className="my-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">
                NOMOR TIKET KAMU
              </span>
              <span className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-red-700 my-1 block">
                {currentCustomerTicket.ticketNumber}
              </span>
              <span className="text-xs font-extrabold uppercase text-slate-900 bg-white px-4 py-1 rounded-full border border-slate-200 inline-block shadow-sm">
                {currentCustomerTicket.boothName}
              </span>
            </div>

            {/* Current Called Ticket & Queue Position */}
            {currentCustomerTicket.status === 'completed' ? (
              <div className="mt-6 pt-4 border-t border-slate-200 bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200 text-center space-y-1">
                <p className="font-black text-emerald-900 text-sm">Sesi Foto Anda Telah Selesai</p>
                <p className="text-xs text-emerald-700 font-medium">
                  Terima kasih telah mengabadikan momen seru bersama kami!
                </p>
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3 text-left bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase block">
                    SEDANG DIPANGGIL
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                    {currentCalledTicketInBooth ? currentCalledTicketInBooth.ticketNumber : '---'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase block">
                    ANTRIAN DI DEPAN KAMU
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-red-600 flex items-center gap-1">
                    {isMyTurn ? '0' : `${ticketsAhead} Orang`}
                  </span>
                </div>
              </div>
            )}

            {/* Estimated Wait Time */}
            {!isMyTurn && currentCustomerTicket.status === 'waiting' && (
              <div className="mt-4 p-3.5 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold text-red-800">
                <Clock className="w-4 h-4 text-red-600" />
                <span>
                  Estimasi waktu tunggu:{' '}
                  {estimatedWaitMinutes > 0 ? `~${estimatedWaitMinutes} menit` : 'Sebentar lagi dipanggil!'}
                </span>
              </div>
            )}
          </div>

          {/* Audio Notification Toggle Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Notifikasi Suara Panggilan</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {soundEnabled
                    ? 'Notifikasi suara AKTIF. Browser akan membunyikan bel saat nomor dipanggil.'
                    : 'Aktifkan agar browser membunyikan bel saat nomor dipanggil.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="btn-customer-toggle-notify"
                onClick={handleToggleNotify}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  soundEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{soundEnabled ? 'Suara Aktif' : 'Aktifkan Suara'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary of All Booth Queues */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
            Ringkasan Antrian Semua Booth
          </h4>
          <span className="text-[11px] font-bold text-slate-400">Status Live Studio</span>
        </div>

        {tickets.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-1">
            <p className="font-extrabold text-slate-700 text-sm">Belum Ada Antrian Aktif</p>
            <p className="text-xs text-slate-500">Seluruh antrian sedang kosong atau belum ada tiket baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {booths.map((b) => {
              const activeT = tickets.find((t) => t.boothId === b.id && t.status === 'called');
              const waitCount = tickets.filter((t) => t.boothId === b.id && t.status === 'waiting').length;

              return (
                <div key={b.id} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 block truncate">{b.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Booth Aktif" />
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

