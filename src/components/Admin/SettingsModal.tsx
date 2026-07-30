import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { getPaperDimensionSpec } from '../../utils/paperDimensions';
import { processThermalLogoFile } from '../../utils/thermalLogoProcessor';
import { TicketLogoUploader } from './TicketLogoUploader';
import {
  Booth,
  PrintSettings,
  Ticket,
  TicketDateFormat,
  TicketDividerStyle,
  TicketLabelShape,
  TicketFontFamily,
  TicketPaperWidth,
} from '../../types';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Sliders,
  Save,
  Check,
  RefreshCw,
  Eye,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layout,
  Type,
  QrCode,
  Ruler,
  FileText,
  RotateCcw,
  KeyRound,
  ShieldCheck,
  Lock,
  EyeOff,
  Volume2,
} from 'lucide-react';
import { TICKET_TEMPLATES, TicketLayoutTemplate } from '../../data/defaultData';
import { TicketReceiptView } from './TicketReceiptView';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'booths' | 'label' | 'password' | 'danger';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialTab = 'booths' }) => {
  const {
    booths,
    addBooth,
    editBooth,
    deleteBooth,
    printSettings,
    updatePrintSettings,
    resetQueue,
    clearTodayLogs,
    adminPin,
    changeAdminPin,
    soundEnabled,
    setSoundEnabled,
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'booths' | 'label' | 'password' | 'danger'>(initialTab);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinChangeMsg, setPinChangeMsg] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  // New Booth Form
  const [newBoothName, setNewBoothName] = useState('');
  const [newBoothCode, setNewBoothCode] = useState('');
  const [newBoothAvg, setNewBoothAvg] = useState(5);

  // Edit Booth State
  const [editingBoothId, setEditingBoothId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  // Local state for Print Settings form
  const [localPrintSettings, setLocalPrintSettings] = useState<PrintSettings>(printSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sample Booth & Ticket for Live Preview Designer
  const [selectedPreviewBoothId, setSelectedPreviewBoothId] = useState<string>(booths[0]?.id || 'sample');

  React.useEffect(() => {
    if (isOpen) {
      setLocalPrintSettings(printSettings);
    }
  }, [isOpen, printSettings]);

  if (!isOpen) return null;

  const handleAddBooth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoothName.trim() || !newBoothCode.trim()) return;
    const payload = {
      name: newBoothName.trim(),
      code: newBoothCode.trim().toUpperCase(),
      avgTimePerSession: Number(newBoothAvg) || 5,
    };
    addBooth(payload);
    setNewBoothName('');
    setNewBoothCode('');
    setNewBoothAvg(5);
  };

  const handleStartEditBooth = (booth: Booth) => {
    setEditingBoothId(booth.id);
    setEditName(booth.name);
    setEditCode(booth.code);
  };

  const handleSaveEditBooth = (boothId: string) => {
    if (!editName.trim() || !editCode.trim()) return;
    const payload = {
      name: editName.trim(),
      code: editCode.trim().toUpperCase(),
    };
    editBooth(boothId, payload);
    setEditingBoothId(null);
  };

  const handleSavePrintSettings = () => {
    updatePrintSettings(localPrintSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleApplyTemplate = (template: TicketLayoutTemplate) => {
    setLocalPrintSettings((prev) => ({
      ...prev,
      ...template.settings,
    }));
  };

  // Handle Logo Upload File (Convert to Base64)
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (PNG/JPG/WEBP).');
      return;
    }

    try {
      const bwDataUrl = await processThermalLogoFile(file, {
        maxWidth: 250,
        maxHeight: 250,
        threshold: localPrintSettings.logoThreshold || 128,
      });

      setLocalPrintSettings((prev) => ({
        ...prev,
        logoUrl: bwDataUrl,
        showLogo: true,
      }));
    } catch (err: any) {
      alert('Gagal memproses gambar logo: ' + (err?.message || err));
    }
  };

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
        setLocalPrintSettings((prev) => ({
          ...prev,
          monitorLogoUrl: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Build Sample Ticket for Designer Live Preview
  const selectedBooth = booths.find((b) => b.id === selectedPreviewBoothId) || booths[0] || {
    id: 'booth-vintage',
    name: 'Vintage Booth',
    code: 'VIN',
    avgTimePerSession: 5,
  };

  const sampleTicket: Ticket = {
    id: 'sample-ticket-001',
    boothId: selectedBooth.id,
    boothName: selectedBooth.name,
    boothCode: selectedBooth.code,
    ticketNumber: `${selectedBooth.code}007`,
    sequence: 7,
    status: 'waiting',
    createdAt: new Date().toISOString(),
  };

  const handleTriggerTestPrint = () => {
    const printElement = document.getElementById('designer-preview-ticket');
    if (!printElement) return;

    const spec = getPaperDimensionSpec(localPrintSettings.paperWidth, localPrintSettings.orientation || 'portrait');

    const windowPrint = window.open('', '', 'width=500,height=700');
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html>
        <head>
          <title>Test Print Label Tiket</title>
          <style>
            @page {
              size: ${spec.pageSizeCss};
              margin: 0;
            }
            body { margin: 0; padding: 0; font-family: monospace; display: flex; justify-content: center; background: white; }
            @media print { body { padding: 0; margin: 0; } }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${printElement.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-500" />
            <h3 className="font-extrabold text-base">Pengaturan & Desainer Label Antrian</h3>
          </div>
          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Settings Sidebar Tabs */}
          <div className="w-full md:w-60 bg-slate-50 border-r border-slate-200 p-3 flex md:flex-col gap-1 overflow-x-auto shrink-0">
            <button
              id="settings-tab-booths"
              onClick={() => setActiveTab('booths')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-extrabold text-left transition-all ${
                activeTab === 'booths'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Plus className="w-4 h-4" />
              Kelola Booth & Kode
            </button>

            <button
              id="settings-tab-label"
              onClick={() => setActiveTab('label')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-extrabold text-left transition-all ${
                activeTab === 'label'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Printer className="w-4 h-4" />
              Desain Label Cetak
            </button>

            <button
              id="settings-tab-password"
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-extrabold text-left transition-all ${
                activeTab === 'password'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              Password & Suara Panggilan
            </button>

            <button
              id="settings-tab-danger"
              onClick={() => setActiveTab('danger')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-semibold text-left transition-all ${
                activeTab === 'danger'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Reset & Logs
            </button>
          </div>

          {/* Settings Content Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white">
            {/* TAB 1: BOOTH MANAGEMENT */}
            {activeTab === 'booths' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-base mb-1">
                    Kelola Kolom Antrian & Kode Unique Booth
                  </h4>
                  <p className="text-xs text-slate-500">
                    Atur nama photobooth dan awalan kode nomor antrian (misal: "Vintage Booth" = "VIN").
                  </p>
                </div>

                {/* Existing Booth List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daftar Booth Saat Ini ({booths.length})
                  </span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {booths.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        {editingBoothId === b.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nama Booth"
                              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium w-1/2 focus:ring-2 focus:ring-red-500"
                            />
                            <input
                              type="text"
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              placeholder="Kode (e.g. VIN)"
                              maxLength={5}
                              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold w-1/4 uppercase focus:ring-2 focus:ring-red-500"
                            />
                            <button
                              onClick={() => handleSaveEditBooth(b.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingBoothId(null)}
                              className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: b.themeColor || '#8B5CF6' }}
                              />
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  {b.name}
                                  <span className="text-xs font-mono bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                                    {b.code}
                                  </span>
                                </h5>
                                <p className="text-[11px] text-slate-500">
                                  Total tiket hari ini: {b.totalTickets} | Estimasi: {b.avgTimePerSession} mnt/sesi
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEditBooth(b)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-200/60 rounded-lg"
                                title="Edit Booth"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {booths.length > 1 && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Yakin hapus booth "${b.name}"?`)) {
                                      deleteBooth(b.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Hapus Booth"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Booth Form */}
                <form onSubmit={handleAddBooth} className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-3">
                  <h5 className="font-bold text-red-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-red-600" />
                    Tambah Kolom Antrian Booth Baru
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Nama Booth
                      </label>
                      <input
                        type="text"
                        value={newBoothName}
                        onChange={(e) => setNewBoothName(e.target.value)}
                        placeholder="Contoh: Wide Angle Booth"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Kode Unik Prefix (Max 4 karakter)
                      </label>
                      <input
                        type="text"
                        value={newBoothCode}
                        onChange={(e) => setNewBoothCode(e.target.value)}
                        placeholder="Contoh: WID"
                        maxLength={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-red-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Estimasi Sesi (Menit)
                      </label>
                      <input
                        type="number"
                        value={newBoothAvg}
                        onChange={(e) => setNewBoothAvg(Number(e.target.value))}
                        min={1}
                        max={30}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Booth Baru
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: ADVANCED LABEL DESIGNER */}
            {activeTab === 'label' && (
              <div className="space-y-6">
                {/* Header & Template Preset Bar */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold mb-1">
                        <Sparkles className="w-3 h-3" />
                        Custom Ticket Layout Designer
                      </div>
                      <h4 className="font-black text-slate-900 text-lg">Desain Custom Label Cetak Tiket</h4>
                      <p className="text-xs text-slate-500">
                        Atur logo, teks statis, field dinamis, garis pembatas, format tanggal, dan QR Code secara live.
                      </p>
                    </div>

                    <button
                      id="btn-save-print-settings-top"
                      onClick={handleSavePrintSettings}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                      <span>{saveSuccess ? 'Layout Tersimpan!' : 'Simpan Desain Layout'}</span>
                    </button>
                  </div>

                  {/* Preset Template Selectors */}
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Layout className="w-3.5 h-3.5 text-red-600" />
                      Pilih Template Cepat (Preset Layout):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TICKET_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="p-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-xl text-left transition-all group"
                        >
                          <span className="font-extrabold text-xs text-slate-800 group-hover:text-red-700 block">
                            {tmpl.name}
                          </span>
                          <span className="text-[10px] text-slate-500 line-clamp-1 block mt-0.5">
                            {tmpl.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Designer Split View: Controls Left, Live Preview Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT CONTROLS PANEL (7 Cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* 1. TICKET LOGO UPLOADER (THERMAL OPTIMIZED B/W) */}
                    <TicketLogoUploader
                      logoUrl={localPrintSettings.logoUrl}
                      showLogo={localPrintSettings.showLogo ?? true}
                      logoWidth={localPrintSettings.logoWidth || 50}
                      logoThreshold={localPrintSettings.logoThreshold || 128}
                      onUpdateLogo={(updates) => setLocalPrintSettings((prev) => ({ ...prev, ...updates }))}
                    />

                    {/* 2. STATIC TEXT FIELDS */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Type className="w-4 h-4 text-red-600" />
                        2. Teks Statis Label
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Header Judul Utama
                          </label>
                          <input
                            type="text"
                            value={localPrintSettings.headerTitle}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, headerTitle: e.target.value })
                            }
                            placeholder="NOMOR ANTRIAN"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Sub-Header / Tagline
                          </label>
                          <input
                            type="text"
                            value={localPrintSettings.subHeaderTitle || ''}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, subHeaderTitle: e.target.value })
                            }
                            placeholder="PHOTOBOOTH QUEUE TICKET"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Nama Cabang / Studio
                          </label>
                          <input
                            type="text"
                            value={localPrintSettings.branchName}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, branchName: e.target.value })
                            }
                            placeholder="Photobooth Studio Jakarta"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Catatan Khusus Operator
                          </label>
                          <input
                            type="text"
                            value={localPrintSettings.customNote || ''}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, customNote: e.target.value })
                            }
                            placeholder="Simpan tiket fisik ini..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 text-xs block mb-1">
                          Pesan Footer (Terima Kasih / Penutup)
                        </label>
                        <textarea
                          rows={2}
                          value={localPrintSettings.footerText}
                          onChange={(e) =>
                            setLocalPrintSettings({ ...localPrintSettings, footerText: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>

                    {/* 3. DYNAMIC FIELDS TOGGLES */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-red-600" />
                        3. Field Dinamis (Tampilkan / Sembunyikan)
                      </h5>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localPrintSettings.showTicketNumber ?? true}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, showTicketNumber: e.target.checked })
                            }
                            className="accent-red-600 rounded"
                          />
                          <span className="font-bold text-slate-800">Nomor Antrian</span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localPrintSettings.showBoothName ?? true}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, showBoothName: e.target.checked })
                            }
                            className="accent-red-600 rounded"
                          />
                          <span className="font-bold text-slate-800">Nama Booth</span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localPrintSettings.showBranchName ?? true}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, showBranchName: e.target.checked })
                            }
                            className="accent-red-600 rounded"
                          />
                          <span className="font-bold text-slate-800">Nama Cabang</span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localPrintSettings.showDateTime ?? true}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, showDateTime: e.target.checked })
                            }
                            className="accent-red-600 rounded"
                          />
                          <span className="font-bold text-slate-800">Tanggal & Waktu</span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localPrintSettings.showEstimatedWait ?? true}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, showEstimatedWait: e.target.checked })
                            }
                            className="accent-red-600 rounded"
                          />
                          <span className="font-bold text-slate-800">Estimasi Menunggu</span>
                        </label>
                      </div>
                    </div>

                    {/* 4. DATE AND TIME FORMAT & DECORATIVE LINES */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-red-600" />
                        4. Format Tanggal, Pembatas & Bentuk Label
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Format Date & Time */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Format Tanggal & Waktu
                          </label>
                          <select
                            value={localPrintSettings.dateTimeFormat || 'DD/MM/YYYY, HH:mm'}
                            onChange={(e) =>
                              setLocalPrintSettings({
                                ...localPrintSettings,
                                dateTimeFormat: e.target.value as TicketDateFormat,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-red-500"
                          >
                            <option value="DD/MM/YYYY, HH:mm">23/07/2026, 14:25 (Default)</option>
                            <option value="YYYY-MM-DD HH:mm">2026-07-23 14:25 (ISO Format)</option>
                            <option value="DD MMM YYYY, HH:mm">23 Jul 2026, 14:25 (Formal)</option>
                            <option value="MM/DD/YYYY hh:mm A">07/23/2026 02:25 PM (US)</option>
                            <option value="HH:mm (Time Only)">14:25 WIB (Waktu Saja)</option>
                          </select>
                        </div>

                        {/* Divider Style */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Gaya Garis Pembatas
                          </label>
                          <select
                            value={localPrintSettings.dividerStyle || 'dashed'}
                            onChange={(e) =>
                              setLocalPrintSettings({
                                ...localPrintSettings,
                                dividerStyle: e.target.value as TicketDividerStyle,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-red-500"
                          >
                            <option value="dashed">Putus-putus (-----)</option>
                            <option value="double">Garis Ganda (════)</option>
                            <option value="dotted">Titik-titik (.....)</option>
                            <option value="solid">Garis Solid (────)</option>
                            <option value="stars">Bintang-bintang (****)</option>
                            <option value="diamonds">Ornamen Berlian (◆◇◆◇)</option>
                          </select>
                        </div>

                        {/* Shape */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Bentuk Bingkai Label
                          </label>
                          <select
                            value={localPrintSettings.labelShape || 'rounded'}
                            onChange={(e) =>
                              setLocalPrintSettings({
                                ...localPrintSettings,
                                labelShape: e.target.value as TicketLabelShape,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                          >
                            <option value="none">Tanpa Bingkai (Borderless - Rekomendasi Thermal)</option>
                            <option value="rounded">Kartu Membulat (Rounded Card)</option>
                            <option value="standard">Persegi Panjang Standard</option>
                            <option value="tear-off">Tepi Gerigi Sobek (Sawtooth Receipt)</option>
                            <option value="bordered">Frame Border Ganda (Double Line)</option>
                          </select>
                        </div>

                        {/* Font Family */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Gaya Karakter Tipografi
                          </label>
                          <select
                            value={localPrintSettings.fontFamily || 'monospace'}
                            onChange={(e) =>
                              setLocalPrintSettings({
                                ...localPrintSettings,
                                fontFamily: e.target.value as TicketFontFamily,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                          >
                            <option value="monospace">Thermal Monospace (Khas POS)</option>
                            <option value="sans-serif">Sans-serif Modern Clean</option>
                            <option value="serif">Serif Vintage Photobooth</option>
                            <option value="display">Display Uppercase Bold</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 5. PAPER SIZE & QR CODE CONFIG */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-red-600" />
                        5. Ukuran Cetak & Pengaturan QR Code
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Paper Width */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Ukuran Kertas POS Thermal
                          </label>
                          <select
                            value={localPrintSettings.paperWidth}
                            onChange={(e) =>
                              setLocalPrintSettings({
                                ...localPrintSettings,
                                paperWidth: e.target.value as TicketPaperWidth,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-red-500 mb-2"
                          >
                            <optgroup label="Roll Continuous Thermal POS">
                              <option value="58mm">58mm (Roll Thermal Kasir Standard)</option>
                              <option value="80mm">80mm (Roll Thermal POS Lebar)</option>
                            </optgroup>
                            <optgroup label="Label Thermal Kompak / Stiker Ringkas">
                              <option value="70x20mm">70 x 20 mm (Micro Label 70x20mm)</option>
                              <option value="50x30mm">50 x 30 mm (Label Stiker 50x30mm)</option>
                              <option value="50x40mm">50 x 40 mm (Label Stiker 50x40mm)</option>
                              <option value="57x40mm">57 x 40 mm (Label Stiker 57x40mm)</option>
                              <option value="60x40mm">60 x 40 mm (Label Stiker 60x40mm)</option>
                              <option value="80x50mm">80 x 50 mm (Label Stiker 80x50mm)</option>
                            </optgroup>
                            <optgroup label="Label Thermal Sedang & Sedang-Tinggi">
                              <option value="76x100mm">76 x 100 mm (Label Thermal 76x100mm)</option>
                              <option value="76x130mm">76 x 130 mm (Label Thermal 76x130mm)</option>
                              <option value="100x100mm">100 x 100 mm (Label Square 100x100mm)</option>
                            </optgroup>
                            <optgroup label="Label Thermal Besar & Format A4">
                              <option value="100x150mm">100 x 150 mm (Label Resi / Shipping 100x150mm)</option>
                              <option value="100x180mm">100 x 180 mm (Label Thermal 100x180mm)</option>
                              <option value="100x200mm">100 x 200 mm (Label Thermal 100x200mm)</option>
                              <option value="210x300mm">210 x 300 mm (Format Kertas A4 / Poster)</option>
                            </optgroup>
                          </select>

                          {/* Orientasi Cetak */}
                          <div className="mt-2.5 mb-2">
                            <label className="font-semibold text-slate-700 block mb-1">
                              Orientasi Cetak (Portrait / Landscape)
                            </label>
                            <select
                              value={localPrintSettings.orientation || 'portrait'}
                              onChange={(e) =>
                                setLocalPrintSettings({
                                  ...localPrintSettings,
                                  orientation: e.target.value as 'portrait' | 'landscape',
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-red-500"
                            >
                              <option value="portrait">Portrait (Tegak)</option>
                              <option value="landscape">Landscape (Miring / Memanjang)</option>
                            </select>
                          </div>

                          {/* Live Dimension Details Info Badge */}
                          {(() => {
                            const spec = getPaperDimensionSpec(localPrintSettings.paperWidth, localPrintSettings.orientation || 'portrait');
                            return (
                              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 space-y-1">
                                <div className="flex items-center justify-between font-extrabold text-slate-900 border-b border-slate-200 pb-1">
                                  <span>Detail Dimensi Kertas:</span>
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] uppercase font-black">
                                    {spec.widthMm}mm x {spec.heightMm ? `${spec.heightMm}mm` : 'Auto (Roll)'} ({spec.orientation})
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 pt-0.5 font-medium">
                                  <div>
                                    <span className="text-slate-400">Lebar:</span> <strong className="text-slate-800">{spec.widthMm} mm</strong> ({spec.widthPx})
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Tinggi:</span> <strong className="text-slate-800">{spec.heightMm ? `${spec.heightMm} mm` : 'Auto (Roll)'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Tipe Kertas:</span> <strong className="text-slate-800">{spec.heightMm ? 'Stiker Label' : 'Gulungan Thermal'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Ukuran QR:</span> <strong className="text-slate-800">{spec.qrSizePx}px</strong>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* QR Code Toggle */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            QR Code Customer Dashboard
                          </label>
                          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl cursor-pointer">
                            <input
                              type="checkbox"
                              checked={localPrintSettings.showQR}
                              onChange={(e) =>
                                setLocalPrintSettings({ ...localPrintSettings, showQR: e.target.checked })
                              }
                              className="accent-red-600 rounded"
                            />
                            <span className="font-bold text-slate-800">Cetak QR Code Pada Tiket</span>
                          </label>
                        </div>

                        {localPrintSettings.showQR && (
                          <>
                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">
                                Teks Sebelum QR Baris 1
                              </label>
                              <input
                                type="text"
                                value={localPrintSettings.qrSubText1}
                                onChange={(e) =>
                                  setLocalPrintSettings({ ...localPrintSettings, qrSubText1: e.target.value })
                                }
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500"
                              />
                            </div>

                            <div>
                              <label className="font-semibold text-slate-700 block mb-1">
                                Teks Sebelum QR Baris 2
                              </label>
                              <input
                                type="text"
                                value={localPrintSettings.qrSubText2}
                                onChange={(e) =>
                                  setLocalPrintSettings({ ...localPrintSettings, qrSubText2: e.target.value })
                                }
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 6. PENGATURAN TAMPILAN TV / MONITOR */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-red-600" />
                        6. Tampilan TV Monitor Studio
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Logo Monitor */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Logo Perusahaan di TV Monitor
                          </label>
                          <div className="flex gap-2 mb-1.5">
                            <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:border-red-500 cursor-pointer transition-colors">
                              <Upload className="w-3.5 h-3.5 text-red-600" />
                              <span>Upload Logo TV</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleMonitorLogoUpload}
                                className="hidden"
                              />
                            </label>
                            {localPrintSettings.monitorLogoUrl && (
                              <button
                                type="button"
                                onClick={() => setLocalPrintSettings({ ...localPrintSettings, monitorLogoUrl: '' })}
                                className="px-2 py-1 bg-red-100 text-red-700 font-bold rounded-xl text-[11px]"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={localPrintSettings.monitorLogoUrl || ''}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, monitorLogoUrl: e.target.value })
                            }
                            placeholder="Atau tempel URL gambar logo..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        {/* Judul Brand Monitor */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Judul Header Monitor TV
                          </label>
                          <input
                            type="text"
                            value={localPrintSettings.monitorBrandTitle || ''}
                            onChange={(e) =>
                              setLocalPrintSettings({ ...localPrintSettings, monitorBrandTitle: e.target.value })
                            }
                            placeholder="LAYAR ANTRIAN PHOTOBOOTH"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 text-xs block mb-1">
                          Teks Running / Running Announcement (Selamat Datang)
                        </label>
                        <textarea
                          rows={2}
                          value={localPrintSettings.monitorWelcomeText || ''}
                          onChange={(e) =>
                            setLocalPrintSettings({ ...localPrintSettings, monitorWelcomeText: e.target.value })
                          }
                          placeholder="📸 Selamat datang di Photobooth! Silakan bersantai & perhatikan nomor antrian..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT LIVE PREVIEW & TEST ACTIONS PANEL (5 Cols) */}
                  <div className="lg:col-span-5 bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-between space-y-4">
                    <div className="w-full text-center space-y-2">
                      <div className="inline-flex items-center justify-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        <Eye className="w-4 h-4 text-red-600" />
                        Live Preview Struk Thermal
                      </div>

                      {/* Booth Switcher for Testing */}
                      <div className="flex items-center justify-center gap-2 text-xs pt-1">
                        <span className="text-slate-500 font-medium">Uji Booth:</span>
                        <select
                          value={selectedPreviewBoothId}
                          onChange={(e) => setSelectedPreviewBoothId(e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                        >
                          {booths.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* LIVE RENDER OF TICKET RECEIPT */}
                    <div className="py-2 flex justify-center items-center w-full overflow-x-auto">
                      <TicketReceiptView
                        ticket={sampleTicket}
                        settings={localPrintSettings}
                        estimatedWaitMinutes={15}
                        id="designer-preview-ticket"
                      />
                    </div>

                    {/* BOTTOM ACTIONS: TEST PRINT & SAVE */}
                    <div className="w-full space-y-2 pt-2 border-t border-slate-200">
                      <button
                        id="btn-test-print-designer"
                        onClick={handleTriggerTestPrint}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Printer className="w-4 h-4 text-red-400" />
                        <span>Test Cetak Ke Printer Thermal</span>
                      </button>

                      <button
                        id="btn-save-print-settings-bottom"
                        onClick={handleSavePrintSettings}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                        <span>{saveSuccess ? 'Berhasil Disimpan!' : 'Simpan Pengaturan Desain Label'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PASSWORD ADMIN & SUARA PANGGILAN */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-red-600" />
                    Pengaturan Suara Panggilan & Password Admin
                  </h4>
                  <p className="text-xs text-slate-500">
                    Atur status suara panggilan antrian otomatis serta ubah password/PIN operator.
                  </p>
                </div>

                {/* Integrated Sound Control */}
                <div className="p-5 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <h5 className="font-extrabold text-white text-sm">Suara Panggilan Antrian (AI Voice & Chime)</h5>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                      Suara panggilan nama & nomor tiket hanya diatur secara terpusat melalui Dashboard Admin ini.
                    </p>
                  </div>

                  <button
                    id="btn-settings-toggle-sound-pass"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-5 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-95 shrink-0 ${
                      soundEnabled
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border border-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {soundEnabled ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
                        <span>SUARA PANGGILAN: AKTIF</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>SUARA PANGGILAN: MATI (MUTE)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Current Password Info Card */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Password Admin Saat Ini
                      </p>
                      <p className="font-mono text-lg font-black text-amber-400 tracking-wider">
                        {adminPin}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold rounded-full">
                    Sistem Terproteksi
                  </span>
                </div>

                {/* Form Ganti Password */}
                <div className="p-5 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-4">
                  <h5 className="font-extrabold text-purple-900 text-sm flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    Formulir Ganti Password Baru
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">
                        Password / PIN Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showPinInput ? 'text' : 'password'}
                          value={newPinInput}
                          onChange={(e) => {
                            setNewPinInput(e.target.value.trim());
                            setPinErrorMsg('');
                          }}
                          placeholder="Masukkan password baru"
                          className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-purple-500 font-bold pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPinInput(!showPinInput)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-purple-700"
                        >
                          {showPinInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type={showPinInput ? 'text' : 'password'}
                        value={confirmPinInput}
                        onChange={(e) => {
                          setConfirmPinInput(e.target.value.trim());
                          setPinErrorMsg('');
                        }}
                        placeholder="Ketik ulang password baru"
                        className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-purple-500 font-bold"
                      />
                    </div>
                  </div>

                  {pinErrorMsg && (
                    <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-extrabold">
                      ⚠️ {pinErrorMsg}
                    </div>
                  )}

                  {pinChangeMsg && (
                    <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{pinChangeMsg}</span>
                    </div>
                  )}

                  <button
                    id="btn-save-new-pin-dedicated"
                    onClick={() => {
                      if (!newPinInput) {
                        setPinErrorMsg('Password baru tidak boleh kosong!');
                        return;
                      }
                      if (newPinInput.length < 3) {
                        setPinErrorMsg('Password minimal 3 karakter!');
                        return;
                      }
                      if (confirmPinInput && newPinInput !== confirmPinInput) {
                        setPinErrorMsg('Konfirmasi password tidak cocok dengan password baru!');
                        return;
                      }
                      changeAdminPin(newPinInput);
                      setPinChangeMsg('Password Admin berhasil diubah!');
                      setPinErrorMsg('');
                      setNewPinInput('');
                      setConfirmPinInput('');
                      setTimeout(() => setPinChangeMsg(''), 4000);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Password Baru
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: RESET & DANGER ZONE */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-base mb-1">
                    Reset Antrian & Log Aktivitas
                  </h4>
                  <p className="text-xs text-slate-500">
                    Gunakan tindakan ini untuk memulai hari operasional baru.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Integrated Sound Control */}
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-blue-900 text-sm">Suara Panggilan Antrian (Terintegrasi Monitor TV)</h5>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Mengaktifkan atau mematikan suara panggilan AI & Chime yang terhubung langsung ke TV Monitor & Admin.
                      </p>
                    </div>

                    <button
                      id="btn-settings-toggle-sound"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm ${
                        soundEnabled
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {soundEnabled ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Suara: AKTIF</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>Suara: MATI (MUTE)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* PIN Management */}
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3">
                    <div>
                      <h5 className="font-bold text-purple-900 text-sm">Ganti PIN Password Admin</h5>
                      <p className="text-xs text-purple-700">
                        PIN saat ini: <strong className="font-mono font-bold">{adminPin}</strong>. Digunakan untuk masuk Dashboard Operator.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value.trim())}
                        placeholder="Masukkan PIN Baru (misal: 8888)"
                        maxLength={8}
                        className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 font-bold"
                      />
                      <button
                        id="btn-save-new-pin"
                        onClick={() => {
                          if (!newPinInput) {
                            alert('Masukkan PIN baru!');
                            return;
                          }
                          changeAdminPin(newPinInput);
                          setPinChangeMsg('PIN Admin berhasil diperbarui!');
                          setNewPinInput('');
                          setTimeout(() => setPinChangeMsg(''), 3000);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
                      >
                        Simpan PIN
                      </button>
                    </div>

                    {pinChangeMsg && (
                      <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{pinChangeMsg}</span>
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-rose-900 text-sm">Reset Antrian Hari Ini</h5>
                      <p className="text-xs text-rose-700">
                        Mengembalikan nomor antrian semua booth ke 0 dan menghapus antrian aktif.
                      </p>
                    </div>
                    <button
                      id="btn-confirm-reset-queue"
                      onClick={() => {
                        if (confirm('Yakin ingin mereset seluruh antrian hari ini ke 0?')) {
                          resetQueue();
                          alert('Antrian berhasil direset!');
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all"
                    >
                      Reset Antrian
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Hapus Catatan Riwayat Activity</h5>
                      <p className="text-xs text-slate-500">
                        Membersihkan log aktivitas "Hari ini" yang ada di Dashboard Admin.
                      </p>
                    </div>
                    <button
                      id="btn-confirm-clear-logs"
                      onClick={() => {
                        if (confirm('Bersihkan catatan aktivitas hari ini?')) {
                          clearTodayLogs();
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      Hapus Log
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
