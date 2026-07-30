import React from 'react';
import { SyncDebugCard } from './SyncDebugCard';

export const SyncDebugView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Validasi Real-Time Sync & Debug Firestore
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Membandingkan state lokal photobooth (booth & antrian) dengan dokumen Firestore di database.
        </p>
      </div>

      <SyncDebugCard />
    </div>
  );
};
