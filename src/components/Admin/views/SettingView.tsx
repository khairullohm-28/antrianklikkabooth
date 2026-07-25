import React, { useState } from 'react';
import { useQueue } from '../../../context/QueueContext';
import { PrintSettings } from '../../../types';
import { TICKET_TEMPLATES } from '../../../data/defaultData';
import { TicketReceiptView } from '../TicketReceiptView';
import {
  Printer,
  KeyRound,
  RotateCcw,
  Trash2,
  Save,
  Check,
  Upload,
  Eye,
  ShieldAlert,
  Sparkles,
  Lock,
} from 'lucide-react';

export const SettingView: React.FC = () => {
  const {
    printSettings,
    updatePrintSettings,
    adminPin,
    changeAdminPin,
    resetQueue,
    clearTodayLogs,
    booths,
    tickets,
  } = useQueue();

  const [localPrintSettings, setLocalPrintSettings] = useState<PrintSettings>(printSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password / PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [pinErr, setPinErr] = useState('');

  // Sample Ticket for Live Designer Preview
  const sampleBooth = booths[0] || { id: 'sample', name: 'Booth Vintage A', code: 'VIN', avgTimePerSession: 5 };
  const sampleTicket = {
    id: 'sample-001',
    boothId: sampleBooth.id,
    boothName: sampleBooth.name,
    ticketNumber: `${sampleBooth.code}001`,
    status: 'waiting' as const,
    createdAt: new Date().toISOString(),
  };

  const handleSavePrintSettings = () => {
    updatePrintSettings(localPrintSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran logo terlalu besar (maks 2MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLocalPrintSettings((prev) => ({
          ...prev,
          logoUrl: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Konfigurasi Sistem
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: DESAIN LABEL & LIVE PREVIEW (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-red-600" />
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">Custom Ticket Layout Designer</h2>
                  <p className="text-xs text-slate-500 font-medium">Ubah nama studio, teks header/footer, logo, dan lebar kertas printer</p>
                </div>
              </div>

              <button
                onClick={handleSavePrintSettings}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-600/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saveSuccess ? 'Tersimpan!' : 'Simpan Kustomisasi Label'}</span>
              </button>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Pilih Template Cepat</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TICKET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setLocalPrintSettings((prev) => ({ ...prev, ...tmpl.settings }))}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition-all active:scale-95 space-y-1"
                  >
                    <span className="font-extrabold text-slate-900 text-xs block">{tmpl.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium block">{tmpl.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Studio / Cabang</label>
                <input
                  type="text"
                  value={localPrintSettings.branchName || ''}
                  placeholder="Photobooth Studio - Cabang Utama"
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, branchName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Utama Struk</label>
                <input
                  type="text"
                  value={localPrintSettings.headerTitle || ''}
                  placeholder="NOMOR ANTRIAN"
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, headerTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sub-Judul Tiket (Sub Header)</label>
                <input
                  type="text"
                  value={localPrintSettings.subHeaderTitle || ''}
                  placeholder="STUDIO CELEBRATION TICKET"
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, subHeaderTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Petunjuk QR Code - Baris 1</label>
                <input
                  type="text"
                  value={localPrintSettings.qrSubText1 || ''}
                  placeholder="Scan QR di bawah untuk:"
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, qrSubText1: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Petunjuk QR Code - Baris 2</label>
                <input
                  type="text"
                  value={localPrintSettings.qrSubText2 || ''}
                  placeholder="Cek posisi antrian real-time"
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, qrSubText2: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Struk / Ketentuan Validitas</label>
                <input
                  type="text"
                  value={localPrintSettings.customNote || ''}
                  placeholder="Tiket berlaku hanya untuk hari ini"
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, customNote: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Pesan Footer Struk (Penutup)</label>
                <input
                  type="text"
                  value={localPrintSettings.footerText || ''}
                  placeholder="Harap menunggu sampai nomor dipanggil. Terima kasih!"
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, footerText: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ukuran / Lebar Kertas Printer</label>
                <select
                  value={localPrintSettings.paperWidth || '58mm'}
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, paperWidth: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="58mm">58mm (Roll Thermal Standar Kasir)</option>
                  <option value="80mm">80mm (Roll Thermal Lebar)</option>
                  <option value="50x30mm">50mm x 30mm (Label Stiker Kecil)</option>
                  <option value="50x40mm">50mm x 40mm (Label Stiker Medium)</option>
                  <option value="57x40mm">57mm x 40mm (Label Mini Roll)</option>
                  <option value="60x40mm">60mm x 40mm (Label Barcode Standard)</option>
                  <option value="70x20mm">70mm x 20mm (Label Strip Horizontal)</option>
                  <option value="76x100mm">76mm x 100mm (Label Stiker Besar)</option>
                  <option value="76x130mm">76mm x 130mm (Label Stiker Panjang)</option>
                  <option value="80x50mm">80mm x 50mm (Label Stiker Medium Plus)</option>
                  <option value="100x100mm">100mm x 100mm (Label Persegi)</option>
                  <option value="100x150mm">100mm x 150mm (Label A6 Shipping)</option>
                  <option value="100x180mm">100mm x 180mm (Label Ekstra Panjang)</option>
                  <option value="100x200mm">100mm x 200mm (Label Banner)</option>
                  <option value="210x300mm">210mm x 300mm (Kertas A4 / Document)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Orientasi Cetak Printer</label>
                <select
                  value={localPrintSettings.orientation || 'portrait'}
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, orientation: e.target.value as 'portrait' | 'landscape' })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="portrait">Portrait (Tegak / Standar)</option>
                  <option value="landscape">Landscape (Miring / Memanjang)</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2">
                  Elemen Tampilan Struk / Tiket Antrian
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={localPrintSettings.showEstimatedWait ?? true}
                      onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, showEstimatedWait: e.target.checked })}
                      className="accent-red-600 rounded"
                    />
                    <span>Estimasi Menunggu / Sesi</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={localPrintSettings.showTicketNumber ?? true}
                      onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, showTicketNumber: e.target.checked })}
                      className="accent-red-600 rounded"
                    />
                    <span>Nomor Tiket Antrian</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={localPrintSettings.showBoothName ?? true}
                      onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, showBoothName: e.target.checked })}
                      className="accent-red-600 rounded"
                    />
                    <span>Nama Booth / Sesi</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={localPrintSettings.showBranchName ?? true}
                      onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, showBranchName: e.target.checked })}
                      className="accent-red-600 rounded"
                    />
                    <span>Nama Studio / Cabang</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={localPrintSettings.showDateTime ?? true}
                      onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, showDateTime: e.target.checked })}
                      className="accent-red-600 rounded"
                    />
                    <span>Tanggal & Waktu</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={localPrintSettings.showQR ?? true}
                      onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, showQR: e.target.checked })}
                      className="accent-red-600 rounded"
                    />
                    <span>Tampilkan QR Code</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gaya Garis Pembatas (Divider)</label>
                <select
                  value={localPrintSettings.dividerStyle || 'dashed'}
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, dividerStyle: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="dashed">Putus-putus (-----)</option>
                  <option value="double">Garis Ganda (════)</option>
                  <option value="dotted">Titik-titik (.....)</option>
                  <option value="solid">Garis Solid (────)</option>
                  <option value="stars">Bintang-bintang (****)</option>
                  <option value="diamonds">Ornamen Berlian (◆◇◆◇)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gaya Tipografi Font</label>
                <select
                  value={localPrintSettings.fontFamily || 'monospace'}
                  onChange={(e) => setLocalPrintSettings({ ...localPrintSettings, fontFamily: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="monospace">Thermal Monospace (Khas POS)</option>
                  <option value="sans-serif">Sans-serif Modern Clean</option>
                  <option value="serif">Serif Vintage Photobooth</option>
                  <option value="display">Display Uppercase Bold</option>
                </select>
              </div>
            </div>

            {/* LIVE RECEIPT PREVIEW BOX */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-600 uppercase flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-red-600" /> Live Preview Struk Thermal
                </span>
                <span className="text-[10px] font-black uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded-md border border-red-200">
                  {localPrintSettings.paperWidth || '58mm'} ({localPrintSettings.orientation || 'portrait'})
                </span>
              </div>
              <div className="flex justify-center py-2 overflow-x-auto">
                <div className="bg-white p-4 shadow-lg rounded border border-slate-200 flex justify-center items-center">
                  <TicketReceiptView ticket={sampleTicket} booth={sampleBooth} settings={localPrintSettings} printSettings={localPrintSettings} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GANTI PIN, RESET & HAPUS LOGS (1 Col) */}
        <div className="space-y-6">
          {/* GANTI PIN / PASSWORD ADMIN */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-red-600" />
              <div>
                <h2 className="font-extrabold text-slate-900 text-sm">Ganti PIN / Password Admin</h2>
                <p className="text-xs text-slate-500 font-medium">Perbarui akses keamanan login studio</p>
              </div>
            </div>

            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">PIN Baru</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Masukkan PIN baru..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
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
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              {pinMsg && <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200">{pinMsg}</p>}
              {pinErr && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">{pinErr}</p>}

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all"
              >
                Simpan PIN Baru
              </button>
            </form>
          </div>

          {/* DANGER ZONE: RESET ANTRIAN & HAPUS LOGS */}
          <div className="bg-rose-50/60 p-6 rounded-3xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-rose-200/80">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h2 className="font-extrabold text-rose-900 text-sm">Aksi Bahaya / Data Reset</h2>
                <p className="text-xs text-rose-700 font-medium">Reset antrian & pembersihan riwayat</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <h3 className="font-extrabold text-rose-900 text-xs">Reset Antrian Hari Ini</h3>
                <p className="text-[11px] text-rose-700 font-medium mb-2">
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

              <div className="pt-2 border-t border-rose-200/80">
                <h3 className="font-extrabold text-rose-900 text-xs">Hapus Catatan Riwayat Activity</h3>
                <p className="text-[11px] text-rose-700 font-medium mb-2">
                  Membersihkan seluruh catatan log aktivitas pemanggilan studio.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Hapus seluruh catatan log aktivitas hari ini?')) {
                      clearTodayLogs();
                      alert('Log aktivitas berhasil dibersihkan.');
                    }
                  }}
                  className="w-full py-2.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Hapus Riwayat Log</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
