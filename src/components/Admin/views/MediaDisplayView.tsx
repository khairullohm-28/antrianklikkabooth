import React, { useState, useEffect } from 'react';
import { useQueue } from '../../../context/QueueContext';
import { PrintSettings } from '../../../types';
import { announceQueueVoice, playChimeSound } from '../../../utils/audio';
import {
  Tv,
  Sparkles,
  Upload,
  Volume2,
  Megaphone,
  Check,
  Save,
  ImageIcon,
  Type,
  FileText,
  Play,
} from 'lucide-react';

export const MediaDisplayView: React.FC = () => {
  const { printSettings, updatePrintSettings, soundEnabled, setSoundEnabled } = useQueue();

  const [localSettings, setLocalSettings] = useState<PrintSettings>(printSettings);
  const [saveDisplaySuccess, setSaveDisplaySuccess] = useState(false);
  const [saveAudioSuccess, setSaveAudioSuccess] = useState(false);

  useEffect(() => {
    setLocalSettings(printSettings);
  }, [printSettings]);

  const handleMonitorLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Harap gunakan gambar di bawah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLocalSettings((prev) => ({
          ...prev,
          monitorLogoUrl: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDisplay = () => {
    const synced = {
      ...localSettings,
      logoUrl: localSettings.monitorLogoUrl || localSettings.logoUrl || '',
    };
    updatePrintSettings(synced);
    setSaveDisplaySuccess(true);
    setTimeout(() => setSaveDisplaySuccess(false), 2500);
  };

  const handleSaveAudio = () => {
    updatePrintSettings(localSettings);
    setSaveAudioSuccess(true);
    setTimeout(() => setSaveAudioSuccess(false), 2500);
  };

  const handleTestVoiceCall = () => {
    playChimeSound();
    setTimeout(() => {
      announceQueueVoice('VIN001', 'Booth 1 Vintage');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            Pengaturan Monitor TV
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. PENGATURAN DASHBOARD MONITOR TV */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base uppercase">TAMPILAN MONITOR</h2>
                <p className="text-xs text-slate-500 font-medium">Pengaturan visual pada layar TV studio</p>
              </div>
            </div>

            <button
              onClick={handleSaveDisplay}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-600/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              {saveDisplaySuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveDisplaySuccess ? 'Tersimpan!' : 'Simpan'}</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Logo Perusahaan */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Logo Perusahaan di TV Monitor
              </label>
              <div className="flex gap-2 mb-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:border-red-500 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-red-600" />
                  <span>Upload File Logo TV</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMonitorLogoUpload}
                    className="hidden"
                  />
                </label>
                {localSettings.monitorLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, monitorLogoUrl: '' })}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Hapus Logo
                  </button>
                )}
              </div>
              <input
                type="text"
                value={localSettings.monitorLogoUrl || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, monitorLogoUrl: e.target.value })}
                placeholder="Atau tempel URL gambar logo..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
              {localSettings.monitorLogoUrl && (
                <div className="mt-2 p-2 bg-slate-100 rounded-xl w-fit flex items-center gap-2">
                  <img
                    src={localSettings.monitorLogoUrl}
                    alt="Logo Monitor TV Preview"
                    className="w-12 h-12 object-cover rounded-full shadow-md"
                  />
                  <span className="text-[10px] text-slate-500 font-bold">Pratinjau Logo Bulat</span>
                </div>
              )}
            </div>

            {/* Judul Header Monitor TV */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Judul Header Monitor TV
              </label>
              <input
                type="text"
                value={localSettings.monitorBrandTitle || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, monitorBrandTitle: e.target.value })}
                placeholder="LAYAR ANTRIAN PHOTOBOOTH"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Judul utama di atas layar TV antrian.
              </span>
            </div>

            {/* Teks Running Announcement */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Teks Running / Announcement (Pengumuman Berjalan)
              </label>
              <textarea
                rows={3}
                value={localSettings.monitorWelcomeText || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, monitorWelcomeText: e.target.value })}
                placeholder="📸 Selamat datang di Photobooth! Silakan bersantai & perhatikan nomor antrian..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Teks pengumuman berjalan di bagian bawah monitor TV antrian.
              </span>
            </div>
          </div>
        </div>

        {/* 2. PENGATURAN AUDIO / SUARA PANGGILAN ANTRIAN */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Pengaturan Audio & Suara Panggilan</h2>
              <p className="text-xs text-slate-500 font-medium">Bel nada chime & Text-to-Speech bahasa Indonesia</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Master Toggle Sound */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">Notifikasi Suara Bel & Panggilan</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Mengaktifkan suara bel chime & panggilan nama nomor antrian
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all active:scale-95 ${
                  soundEnabled
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {soundEnabled ? 'Suara AKTIF' : 'Suara NONAKTIF'}
              </button>
            </div>

            {/* Test Audio Controls */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs">Uji Coba Panggilan Suara Studio</h3>
              <p className="text-xs text-slate-500 font-medium">
                Tekan tombol di bawah ini untuk menguji speaker TV / komputer studio:
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => playChimeSound()}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Volume2 className="w-4 h-4 text-red-600" />
                  <span>Test Bel Chime</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestVoiceCall}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  <span>Test Panggilan Lengkap ("VIN001...")</span>
                </button>
              </div>
            </div>

            {/* Save Button for Audio */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveAudio}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {saveAudioSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{saveAudioSuccess ? 'Berhasil Disimpan!' : 'Simpan Pengaturan Audio'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
