import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Layers, Clock, ShieldCheck } from 'lucide-react';

export const SyncDebugCard: React.FC = () => {
  const {
    booths,
    rawFirestoreBooths,
    isFirestoreSynced,
    lastFirestoreUpdatedAt,
    isQuotaExceeded,
    forceSyncToFirestore,
  } = useQueue();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await forceSyncToFirestore();
      setSyncFeedback('Data berhasil dipaksa simpan ke Firestore!');
    } catch (err: any) {
      setSyncFeedback(`Gagal menyimpan: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Firestore Sync Debugger</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                photobooth/appState
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Monitoring sinkronisasi data booth antara Local State & Firestore Realtime
            </p>
          </div>
        </div>

        {/* STATUS BADGE */}
        <div className="flex items-center gap-2">
          {isFirestoreSynced ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Tersinkronisasi</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-extrabold animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>Mismatch / Pending Sync</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl border border-indigo-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyimpan...' : 'Paksa Simpan Firestore'}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* METADATA BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Firestore Document</span>
          <span className="font-mono font-bold text-slate-200">photobooth / appState</span>
        </div>
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Terakhir Disimpan di Cloud</span>
          <span className="font-mono font-bold text-indigo-300">
            {lastFirestoreUpdatedAt ? new Date(lastFirestoreUpdatedAt).toLocaleTimeString('id-ID') : 'Belum Ada'}
          </span>
        </div>
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Status Firestore Quota</span>
          <span className={`font-extrabold ${isQuotaExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isQuotaExceeded ? 'Quota Limit (Local Mode)' : 'Normal / Unlimited'}
          </span>
        </div>
      </div>

      {/* COMPARISON GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* LOCAL STATE */}
        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Local React State ({booths.length} Booth)
            </span>
            <span className="text-[10px] font-mono text-slate-500">QueueContext State</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {booths.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Tidak ada booth di local state.</p>
            ) : (
              booths.map((b) => (
                <div
                  key={b.id}
                  className="p-2 bg-slate-900 rounded-xl border border-slate-800/90 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-extrabold text-white">{b.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] rounded border border-indigo-500/30">
                      {b.code}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {b.avgTimePerSession || 5}m
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FIRESTORE STATE */}
        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Firestore Remote Document ({rawFirestoreBooths.length} Booth)
            </span>
            <span className="text-[10px] font-mono text-slate-500">photobooth/appState</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {rawFirestoreBooths.length === 0 ? (
              <p className="text-xs text-amber-400 italic">Belum ada booth terbaca dari snapshot Firestore.</p>
            ) : (
              rawFirestoreBooths.map((fb) => {
                const localMatch = booths.find((lb) => lb.id === fb.id);
                const isMismatch =
                  !localMatch || localMatch.name !== fb.name || localMatch.code !== fb.code || localMatch.avgTimePerSession !== fb.avgTimePerSession;

                return (
                  <div
                    key={fb.id}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      isMismatch
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900 border-slate-800/90 text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-white">{fb.name}</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded border border-emerald-500/30">
                        {fb.code}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {fb.avgTimePerSession || 5}m
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
