import React, { useState, useEffect } from 'react';
import { backgroundSync, SyncStatus } from '../services/backgroundSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Database, Info } from 'lucide-react';

interface ConnectionStatusBadgeProps {
  className?: string;
  showText?: boolean;
  minimal?: boolean;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  className = '',
  showText = false,
  minimal = false,
}) => {
  const [status, setStatus] = useState<SyncStatus>(() => backgroundSync.getStatus());
  const [showModal, setShowModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = backgroundSync.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsRetrying(true);
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && !navigator.onLine) {
        alert('Perangkat Anda saat ini offline. Silakan hubungkan internet terlebih dahulu.');
        setIsRetrying(false);
        return;
      }
      // Trigger background sync notify
      backgroundSync.updateFirestoreStatus(false, false, false);
      setTimeout(() => {
        setIsRetrying(false);
      }, 600);
    } catch (e) {
      setIsRetrying(false);
    }
  };

  const isConnected = status.connectionState === 'connected';
  const isSyncing = status.connectionState === 'syncing' || isRetrying;

  const isCompact = minimal || !showText;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 transition-all cursor-pointer ${
          isCompact
            ? 'p-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 opacity-80 hover:opacity-100'
            : `px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                  : isSyncing
                  ? 'bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
              }`
        } ${className}`}
        title={
          isConnected
            ? 'Status: Online (Firestore Cloud Synced)'
            : isSyncing
            ? 'Status: Menyinkronkan...'
            : 'Status: Offline (Local Persistence)'
        }
      >
        {/* Glowing Indicator Dot */}
        {isConnected ? (
          <span className="relative flex h-2.5 w-2.5 shrink-0" title="Online (Connected)">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        ) : isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500 shrink-0" />
        ) : (
          <span className="relative flex h-2.5 w-2.5 shrink-0" title="Offline (IndexedDB)">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        )}

        {showText && !minimal && (
          <span className="tracking-tight text-[11px]">
            {isConnected ? 'Connected' : isSyncing ? 'Syncing...' : 'Offline (IndexedDB)'}
          </span>
        )}
      </button>

      {/* CONNECTION STATUS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-red-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  Firestore Connection & Sync Status
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" /> Network Connection
                </span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    status.isOnline
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                  }`}
                >
                  {status.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Firestore Status
                </span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}
                >
                  {isConnected ? 'Cloud Synced' : 'Offline Persistence'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Background Retry Engine
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {status.hasPendingWrites ? 'Retrying pending writes...' : 'IndexedDB Auto-Sync'}
                </span>
              </div>

              <div className="p-3 bg-slate-100/70 dark:bg-slate-800/80 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Firestore offline persistence (IndexedDB) secara otomatis menyimpan setiap aksi saat offline dan mengunggahnya secara latar belakang begitu jaringan kembali terhubung.
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={handleManualSync}
                disabled={isRetrying}
                className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Memeriksa Sinkronisasi...' : 'Cek Status Connection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
