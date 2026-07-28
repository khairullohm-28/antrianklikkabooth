import React, { useState } from 'react';
import { useQueue } from '../../../context/QueueContext';
import { KeyRound, ShieldAlert, RotateCcw, Trash2, Settings } from 'lucide-react';

export const SystemSettingView: React.FC = () => {
  const { changeAdminPin, resetQueue, clearTodayLogs } = useQueue();

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [pinErr, setPinErr] = useState('');

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg('');
    setPinErr('');

    if (newPin.length < 4) {
      setPinErr('PIN minimal terdiri dari 4 digit angka/karakter.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinErr('Konfirmasi PIN tidak cocok!');
      return;
    }

    changeAdminPin(newPin);
    setPinMsg('PIN Admin berhasil diperbarui!');
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-red-500" />
            Setting Sistem
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Pengaturan PIN keamanan Admin & Aksi Reset Data Sistem
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GANTI PIN / PASSWORD ADMIN */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <KeyRound className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Ganti PIN / Password Admin</h2>
              <p className="text-xs text-slate-500 font-medium">Perbarui akses keamanan login studio</p>
            </div>
          </div>

          <form onSubmit={handleChangePinSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">PIN / Password Baru</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Masukkan PIN baru..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Konfirmasi PIN Baru</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ulangi PIN baru..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {pinMsg && <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">{pinMsg}</p>}
            {pinErr && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">{pinErr}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Simpan PIN Baru
            </button>
          </form>
        </div>

        {/* DANGER ZONE: RESET ANTRIAN & HAPUS LOGS */}
        <div className="bg-rose-50/60 p-6 rounded-3xl border border-rose-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-rose-200/80">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="font-extrabold text-rose-900 text-base">Aksi Bahaya / Data Reset</h2>
              <p className="text-xs text-rose-700 font-medium">Reset antrian studio & pembersihan riwayat</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-rose-200 space-y-2">
              <h3 className="font-extrabold text-rose-900 text-xs">Reset Antrian Hari Ini</h3>
              <p className="text-[11px] text-slate-600 font-medium">
                Mengosongkan seluruh antrian aktif dan mengembalikan counter tiket ke nomor 1.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('APAKAH ANDA YAKIN INGIN MERESET SELURUH ANTRIAN HARI INI? Data tiket aktif akan terhapus.')) {
                    resetQueue();
                    alert('Antrian berhasil direset!');
                  }
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Antrian Hari Ini</span>
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 space-y-2">
              <h3 className="font-extrabold text-rose-900 text-xs">Hapus Catatan Riwayat Activity Log</h3>
              <p className="text-[11px] text-slate-600 font-medium">
                Membersihkan seluruh catatan log aktivitas pemanggilan studio hari ini.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Hapus seluruh catatan log aktivitas hari ini?')) {
                    clearTodayLogs();
                    alert('Log aktivitas berhasil dibersihkan.');
                  }
                }}
                className="w-full py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus Riwayat Log</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
