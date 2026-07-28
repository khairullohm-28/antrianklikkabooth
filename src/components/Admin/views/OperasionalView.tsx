import React, { useState, useEffect } from 'react';
import { useQueue } from '../../../context/QueueContext';
import { BoothCard } from '../BoothCard';
import { OperationalMemberSearch } from '../OperationalMemberSearch';
import { Member, LoyaltySettings } from '../../../types';
import { subscribeMembers, subscribeLoyaltySettings, DEFAULT_LOYALTY_SETTINGS } from '../../../services/memberService';
import { Booth } from '../../../types';
import {
  Users,
  Megaphone,
  Printer,
  Sparkles,
  History,
  Clock,
  Sliders,
  PlaySquare,
  Plus,
} from 'lucide-react';

interface OperasionalViewProps {
  onOpenSettings: (tab: 'booths' | 'label' | 'script' | 'danger') => void;
  onEditBooth: (booth: Booth) => void;
}

export const OperasionalView: React.FC<OperasionalViewProps> = ({
  onOpenSettings,
  onEditBooth,
}) => {
  const { booths, tickets, logs, clearTodayLogs } = useQueue();

  // Realtime Members and Loyalty Settings
  const [members, setMembers] = useState<Member[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);

  useEffect(() => {
    const unsubMembers = subscribeMembers((list) => setMembers(list));
    const unsubSettings = subscribeLoyaltySettings((settings) => setLoyaltySettings(settings));
    return () => {
      unsubMembers();
      unsubSettings();
    };
  }, []);

  // Quick Stats
  const totalWaiting = tickets.filter((t) => t.status === 'waiting').length;
  const totalCalled = tickets.filter((t) => t.status === 'called' || t.status === 'completed').length;
  const totalPrinted = tickets.length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Panel Kontrol Operasional
          </h1>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Antrian Menunggu</p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5">{totalWaiting}</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Dipanggil / Selesai</p>
            <h4 className="text-2xl sm:text-3xl font-black text-red-600 font-mono mt-0.5">{totalCalled}</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Tiket Hari Ini</p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5">{totalPrinted}</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Printer className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Booth Aktif</p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5">{booths.length}</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* OPERATIONAL MEMBER LOYALTY SEARCH & ADD MEMBER (PLACED ABOVE BOOTH QUEUE COLUMNS) */}
      <OperationalMemberSearch
        members={members}
        loyaltySettings={loyaltySettings}
      />

      {/* BOOTH QUEUE COLUMNS GRID */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
            Kolom Antrian Photobooth
            <span className="text-xs bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full">
              {booths.length} Booth
            </span>
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block font-medium">
            Tekan <strong className="font-bold text-red-600">CALL NEXT</strong> untuk memanggil & <strong className="font-bold text-slate-900">PRINT TICKET</strong> untuk mencetak.
          </p>
        </div>

        {booths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {booths.map((booth) => (
              <BoothCard key={booth.id} booth={booth} onEditBooth={onEditBooth} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <p className="text-sm text-slate-500 font-medium">Belum ada kolom booth antrian.</p>
            <button
              onClick={() => onOpenSettings('booths')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Booth Pertama</span>
            </button>
          </div>
        )}
      </div>

      {/* RECENT ACTIVITY SECTION (HARI INI) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-red-600" />
            <h2 className="font-extrabold text-slate-900 text-sm">Recent Activity (Hari Ini)</h2>
            <span className="text-xs text-slate-400 font-bold">({logs.length} catatan)</span>
          </div>

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

        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log) => {
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (log.action === 'CALL_NEXT') badgeColor = 'bg-red-100 text-red-800 border-red-200';
              if (log.action === 'PRINT_TICKET') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              if (log.action === 'RECALL') badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
              if (log.action === 'COMPLETE') badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';

              return (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between">
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
    </div>
  );
};
