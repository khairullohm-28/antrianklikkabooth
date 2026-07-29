import React, { useState } from 'react';
import { useQueue } from '../../../context/QueueContext';
import { Booth } from '../../../types';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  Sparkles,
  QrCode,
  Sliders,
  RotateCcw,
  Clock,
  ShieldAlert,
  Save,
} from 'lucide-react';

export const ManajemenView: React.FC = () => {
  const { booths, addBooth, editBooth, deleteBooth, tickets, resetQueue } = useQueue();

  // New Booth Form
  const [newBoothName, setNewBoothName] = useState('');
  const [newBoothCode, setNewBoothCode] = useState('');
  const [newBoothAvg, setNewBoothAvg] = useState(5);

  // Edit Booth State
  const [editingBoothId, setEditingBoothId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAvg, setEditAvg] = useState(5);

  const handleAddBooth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoothName.trim() || !newBoothCode.trim()) return;
    addBooth({
      name: newBoothName.trim(),
      code: newBoothCode.trim().toUpperCase(),
      avgTimePerSession: Number(newBoothAvg) || 5,
    });
    setNewBoothName('');
    setNewBoothCode('');
    setNewBoothAvg(5);
  };

  const handleStartEditBooth = (booth: Booth) => {
    setEditingBoothId(booth.id);
    setEditName(booth.name);
    setEditCode(booth.code);
    setEditAvg(booth.avgTimePerSession || 5);
  };

  const handleSaveEditBooth = (boothId: string) => {
    if (!editName.trim() || !editCode.trim()) return;
    editBooth(boothId, {
      name: editName.trim(),
      code: editCode.trim().toUpperCase(),
      avgTimePerSession: Number(editAvg) || 5,
    });
    setEditingBoothId(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Kelola Struktur Booth
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: TAMBAH BOOTH BARU (1 Col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-5 h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm">Tambah Kolom Booth Baru</h2>
              <p className="text-[11px] text-slate-500 font-medium">Buat jalur antrian baru di studio</p>
            </div>
          </div>

          <form onSubmit={handleAddBooth} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Booth / Ruang Studio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newBoothName}
                onChange={(e) => setNewBoothName(e.target.value)}
                placeholder="Contoh: Booth Vintage A, Studio B..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kode Prefix Unik Tiket <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newBoothCode}
                onChange={(e) => setNewBoothCode(e.target.value.toUpperCase())}
                placeholder="Contoh: VIN, BTH, S1..."
                maxLength={6}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-black uppercase focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                required
              />
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Tiket akan tercetak dengan format: <strong className="font-mono text-red-600">{newBoothCode || 'VIN'}001</strong>
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Estimasi Durasi Per Sesi (Menit)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={newBoothAvg}
                onChange={(e) => setNewBoothAvg(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: KELOLA KOLOM BOOTH & PREFIX UNIK (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Kelola Kolom Antrian */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Daftar Kolom Antrian Booth ({booths.length})</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Ubah nama booth, estimasi durasi, dan prefix kode unik antrian.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {booths.map((booth) => {
                const isEditing = editingBoothId === booth.id;
                const totalTicketsForBooth = tickets.filter((t) => t.boothId === booth.id).length;
                const waitingForBooth = tickets.filter((t) => t.boothId === booth.id && t.status === 'waiting').length;

                return (
                  <div
                    key={booth.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-3"
                  >
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Booth</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Kode Prefix</label>
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-black uppercase"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Durasi Sesi (Mnt)</label>
                          <input
                            type="number"
                            value={editAvg}
                            onChange={(e) => setEditAvg(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEditBooth(booth.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan Perubahan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBoothId(null)}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Batal</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm sm:text-base">{booth.name}</span>
                            <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-mono font-black text-xs rounded-lg border border-red-200">
                              Prefix: {booth.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Estimasi: {booth.avgTimePerSession || 5} mnt/sesi
                            </span>
                            <span>•</span>
                            <span>Menunggu: <strong className="text-red-600 font-bold">{waitingForBooth}</strong> orang</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditBooth(booth)}
                            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors"
                            title="Edit Booth"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {booths.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus booth ${booth.name}? Tiket terkait akan tetap aman.`)) {
                                  deleteBooth(booth.id);
                                }
                              }}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors"
                              title="Hapus Booth"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Ringkasan Prefix Kode Antrian */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <QrCode className="w-5 h-5 text-red-600" />
              <div>
                <h2 className="font-extrabold text-slate-900 text-sm">Kelola Kode Unique Booth (Prefix Antrian)</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Prefix digunakan pada pencetakan struk dan tampilan layar TV agar pelanggan mudah mengenali booth tujuan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {booths.map((b) => (
                <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{b.name}</span>
                    <span className="text-2xl font-black font-mono text-red-600">{b.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Contoh Tiket</span>
                    <span className="text-sm font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      {b.code}001
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
