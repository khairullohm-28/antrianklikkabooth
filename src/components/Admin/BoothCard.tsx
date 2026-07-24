import React, { useState } from 'react';
import { Booth, Ticket } from '../../types';
import { useQueue } from '../../context/QueueContext';
import { Megaphone, Printer, RotateCcw, CheckCircle2, Users, Trash2, X, AlertTriangle, Clock } from 'lucide-react';

interface BoothCardProps {
  booth: Booth;
  onEditBooth: (booth: Booth) => void;
}

export const BoothCard: React.FC<BoothCardProps> = ({ booth }) => {
  const { tickets, callNext, printTicket, recallTicket, completeTicket, deleteTicket } = useQueue();
  const [selectedTicketToManage, setSelectedTicketToManage] = useState<Ticket | null>(null);

  // Find current active called ticket for this booth
  const currentTicket = tickets.find(
    (t) => t.boothId === booth.id && t.status === 'called'
  );

  // Find waiting queue for this booth
  const waitingTickets = tickets
    .filter((t) => t.boothId === booth.id && t.status === 'waiting')
    .sort((a, b) => a.sequence - b.sequence);

  return (
    <div
      id={`booth-card-${booth.id}`}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col overflow-hidden relative"
    >
      {/* Booth Header Banner (Clean Name without code prefix or edit button) */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-red-50/40 border-t-4 border-t-red-600">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-ping opacity-75" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
              {booth.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">Estimasi ~{booth.avgTimePerSession} mnt/sesi</p>
          </div>
        </div>
      </div>

      {/* Active Number Box */}
      <div className="p-5 bg-gradient-to-b from-red-50/50 to-white flex flex-col items-center justify-center border-b border-slate-100">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
          NOMOR AKTIF SAAT INI
        </span>
        <div
          onClick={() => currentTicket && setSelectedTicketToManage(currentTicket)}
          title={currentTicket ? 'Klik untuk kelola / hapus antrian ini' : undefined}
          className={`text-4xl sm:text-5xl font-black font-mono tracking-tight my-1 ${
            currentTicket ? 'text-red-700 cursor-pointer hover:scale-105 transition-transform' : 'text-slate-300'
          }`}
        >
          {currentTicket ? currentTicket.ticketNumber : '---'}
        </div>
        {currentTicket ? (
          <button
            onClick={() => setSelectedTicketToManage(currentTicket)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mt-1 shadow-sm hover:bg-emerald-200 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sedang Dipanggil
          </button>
        ) : (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 mt-1">
            Belum ada panggilan
          </div>
        )}
      </div>

      {/* Waiting List Preview */}
      <div className="p-4 bg-slate-50/50 flex-1 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-red-600" />
            Antrian Menunggu
          </span>
          <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-extrabold rounded-full text-[11px]">
            {waitingTickets.length} Antrian
          </span>
        </div>

        {waitingTickets.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {waitingTickets.map((ticket, idx) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicketToManage(ticket)}
                title="Klik untuk opsi / hapus antrian"
                className={`text-xs font-mono px-2.5 py-1 rounded-lg border font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 ${
                  idx === 0
                    ? 'bg-red-600 text-white border-red-600 shadow-sm hover:bg-red-700'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{ticket.ticketNumber}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2 text-center font-medium">
            Tidak ada antrian menunggu
          </p>
        )}
      </div>

      {/* Action Buttons: CALL NEXT & PRINT TICKET */}
      <div className="p-4 bg-white space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* CALL NEXT */}
          <button
            id={`btn-call-next-${booth.id}`}
            onClick={() => callNext(booth.id)}
            disabled={waitingTickets.length === 0}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md ${
              waitingTickets.length > 0
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>CALL NEXT</span>
          </button>

          {/* PRINT TICKET */}
          <button
            id={`btn-print-ticket-${booth.id}`}
            onClick={() => printTicket(booth.id)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs sm:text-sm transition-all shadow-md shadow-slate-900/10 active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 text-red-400" />
            <span>PRINT TICKET</span>
          </button>
        </div>

        {/* Secondary controls for active ticket: Recall & Complete */}
        {currentTicket && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              id={`btn-recall-${currentTicket.id}`}
              onClick={() => recallTicket(currentTicket.id)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Panggil Ulang
            </button>
            <button
              id={`btn-complete-${currentTicket.id}`}
              onClick={() => completeTicket(currentTicket.id)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Selesai Sesi
            </button>
          </div>
        )}
      </div>

      {/* TICKET MANAGEMENT & DELETE MODAL */}
      {selectedTicketToManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative">
            <button
              onClick={() => setSelectedTicketToManage(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">Kelola Tiket Antrian</h4>
                <p className="text-xs text-slate-500 font-medium">Opsi tindakan untuk nomor antrian</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">NOMOR TIKET</span>
              <div className="text-3xl font-black font-mono text-red-700 tracking-tight">
                {selectedTicketToManage.ticketNumber}
              </div>
              <p className="text-xs font-bold text-slate-700">{selectedTicketToManage.boothName}</p>
              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Cetak: {new Date(selectedTicketToManage.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="capitalize px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded-full text-[10px]">
                  {selectedTicketToManage.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                id="btn-delete-selected-ticket"
                onClick={() => {
                  if (confirm(`Apakah Anda yakin ingin menghapus antrian ${selectedTicketToManage.ticketNumber}?`)) {
                    deleteTicket(selectedTicketToManage.id);
                    setSelectedTicketToManage(null);
                  }
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Antrian Ini</span>
              </button>

              <button
                onClick={() => setSelectedTicketToManage(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
