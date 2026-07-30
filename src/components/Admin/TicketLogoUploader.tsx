import React, { useState } from 'react';
import { processThermalLogoFile, processThermalLogoDataUrl } from '../../utils/thermalLogoProcessor';
import { Upload, Trash2, Image as ImageIcon, Sliders } from 'lucide-react';

interface TicketLogoUploaderProps {
  logoUrl?: string;
  showLogo?: boolean;
  logoWidth?: number;
  logoThreshold?: number;
  onUpdateLogo: (data: {
    logoUrl?: string;
    showLogo?: boolean;
    logoWidth?: number;
    logoThreshold?: number;
  }) => void;
}

export const TicketLogoUploader: React.FC<TicketLogoUploaderProps> = ({
  logoUrl = '',
  showLogo = true,
  logoWidth = 50,
  logoThreshold = 128,
  onUpdateLogo,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [threshold, setThreshold] = useState<number>(logoThreshold);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar valid (PNG, JPG, WEBP).');
      return;
    }

    setIsProcessing(true);
    try {
      const bwDataUrl = await processThermalLogoFile(file, {
        maxWidth: 250,
        maxHeight: 250,
        threshold,
      });

      onUpdateLogo({
        logoUrl: bwDataUrl,
        showLogo: true,
        logoThreshold: threshold,
        logoWidth: logoWidth || 50,
      });
    } catch (err: any) {
      alert('Gagal memproses gambar logo: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThresholdChange = async (newThreshold: number) => {
    setThreshold(newThreshold);
    if (!logoUrl) return;

    setIsProcessing(true);
    try {
      const bwDataUrl = await processThermalLogoDataUrl(logoUrl, {
        maxWidth: 250,
        maxHeight: 250,
        threshold: newThreshold,
      });

      onUpdateLogo({
        logoUrl: bwDataUrl,
        logoThreshold: newThreshold,
      });
    } catch {
      // Ignore conversion fallback
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-wide">
              Upload Logo Tiket (Thermal B/W 1-Bit)
            </h3>
            <p className="text-[11px] text-slate-400">
              HTML5 Canvas thresholding otomatis untuk konversi Hitam-Putih tajam tanpa gradasi.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold hover:bg-slate-700 shrink-0">
          <input
            type="checkbox"
            checked={showLogo}
            onChange={(e) => onUpdateLogo({ showLogo: e.target.checked })}
            className="accent-red-500 rounded"
          />
          <span>{showLogo ? 'Logo Tampil' : 'Logo Sembunyi'}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Upload & Controls */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Pilih Logo Baru (PNG / JPG / WEBP)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-md transition-all active:scale-95">
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses B/W...' : 'Upload File Logo'}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => onUpdateLogo({ logoUrl: '' })}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-rose-950/80 text-rose-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Logo</span>
                </button>
              )}
            </div>
          </div>

          {/* Sliders for B/W Threshold & Size */}
          {logoUrl && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-red-400" /> Threshold B/W
                  </span>
                  <span className="font-mono text-red-400">{threshold}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 mb-1">
                  <span>Ukuran Logo (px)</span>
                  <span className="font-mono text-red-400">{logoWidth}px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="120"
                  value={logoWidth}
                  onChange={(e) => onUpdateLogo({ logoWidth: Number(e.target.value) })}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Realtime B/W Canvas Preview */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[110px]">
          <span className="text-[10px] font-bold uppercase text-slate-400 mb-2">
            Preview Logo Header Monochrome
          </span>
          {showLogo && logoUrl ? (
            <div className="p-2.5 bg-white rounded-lg border border-slate-300 flex items-center justify-center shadow-inner">
              <img
                src={logoUrl}
                alt="Logo Header Preview"
                style={{ width: `${logoWidth}px`, maxHeight: '80px' }}
                className="object-contain"
              />
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium italic text-center">
              {!logoUrl ? 'Belum ada logo terpasang' : 'Logo tersembunyi'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
