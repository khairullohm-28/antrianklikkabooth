import React, { useState, useEffect } from 'react';
import { Member, LoyaltySettings } from '../../types';
import { createMember, processMemberPurchase } from '../../services/memberService';
import { Search, Plus, UserCheck, Crown, Sparkles, Check, AlertCircle, ShoppingBag, X, Phone } from 'lucide-react';

interface OperationalMemberSearchProps {
  members: Member[];
  loyaltySettings: LoyaltySettings;
}

export const OperationalMemberSearch: React.FC<OperationalMemberSearchProps> = ({
  members,
  loyaltySettings,
}) => {
  const [searchPhone, setSearchPhone] = useState('');
  const [activeMember, setActiveMember] = useState<Member | null>(null);

  // Transaction amount input
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [transactionNote, setTransactionNote] = useState<string>('Paket Photobooth');
  const [processing, setProcessing] = useState(false);
  const [txSuccessMsg, setTxSuccessMsg] = useState<string | null>(null);

  // Modal Add New Member
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Auto search when user types phone number
  useEffect(() => {
    const cleanSearch = searchPhone.trim().replace(/\s+/g, '');
    if (cleanSearch.length >= 3) {
      const found = members.find((m) =>
        m.phone.trim().replace(/\s+/g, '').includes(cleanSearch) ||
        m.name.toLowerCase().includes(cleanSearch.toLowerCase())
      );
      if (found) {
        setActiveMember(found);
      } else {
        setActiveMember(null);
      }
    } else {
      setActiveMember(null);
    }
  }, [searchPhone, members]);

  // Keep activeMember updated when `members` array updates
  useEffect(() => {
    if (activeMember) {
      const updated = members.find((m) => m.id === activeMember.id);
      if (updated) {
        setActiveMember(updated);
      }
    }
  }, [members]);

  // Calculate preview of points & stamps for current input amount
  const parsedAmount = parseInt(transactionAmount.replace(/\D/g, ''), 10) || 0;
  const previewPoints = Math.floor(parsedAmount / (loyaltySettings.spendPerPoint || 10000));
  const previewStamps = Math.floor(parsedAmount / (loyaltySettings.spendPerStamp || 50000));

  // Handle Process Transaction
  const handleProcessTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember) return;
    if (parsedAmount <= 0) {
      alert('Masukkan harga paket / jumlah pembelanjaan yang valid (lebih dari Rp 0).');
      return;
    }

    setProcessing(true);
    setTxSuccessMsg(null);

    try {
      const result = await processMemberPurchase(
        activeMember,
        parsedAmount,
        transactionNote || `Pembelian paket Photobooth Rp ${parsedAmount.toLocaleString('id-ID')}`,
        loyaltySettings
      );

      setProcessing(false);
      setTxSuccessMsg(
        `Sukses! +${result.addedPoints} Poin & +${result.addedStamps} Stamp ditambahkan ke ${activeMember.name}. Status: ${result.newTier}`
      );
      setTransactionAmount('');

      setTimeout(() => {
        setTxSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      setProcessing(false);
      alert('Gagal memproses transaksi member: ' + err.message);
    }
  };

  // Handle Create Quick Member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    const cleanName = newName.trim();
    const cleanPhone = newPhone.trim().replace(/\s+/g, '');

    if (!cleanName || !cleanPhone) {
      setAddError('Nama Lengkap dan Nomor Telepon wajib diisi.');
      return;
    }

    const exists = members.some((m) => m.phone.trim().replace(/\s+/g, '') === cleanPhone);
    if (exists) {
      setAddError('Nomor telepon ini sudah terdaftar sebagai Member.');
      return;
    }

    setAddLoading(true);

    try {
      const created = await createMember(cleanName, cleanPhone, '12345');
      setAddLoading(false);
      setIsAddModalOpen(false);
      setNewName('');
      setNewPhone('');

      // Auto select newly created member
      setSearchPhone(cleanPhone);
      setActiveMember(created);
    } catch (err: any) {
      setAddLoading(false);
      setAddError('Gagal menambah member: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-md space-y-4">
      {/* SECTION TITLE & MEMBER SEARCH BAR WITH '+' BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-red-600" />
            Integrasi Member Loyalitas (POS Kasir)
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Cari member untuk memproses poin, stamp, dan otomatisasi tier belanja.
          </p>
        </div>

        {/* SEARCH INPUT + '+' COMPACT BUTTON */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Cari No. HP / Nama Member..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
            {searchPhone && (
              <button
                onClick={() => {
                  setSearchPhone('');
                  setActiveMember(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* '+' TAMBAH MEMBER BARU BUTTON */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black shadow-md shadow-red-600/20 transition-all flex items-center gap-1 shrink-0 active:scale-95"
            title="Tambah Member Cepat (+)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Member Baru</span>
          </button>
        </div>
      </div>

      {/* ACTIVE MEMBER CARD & TRANSACTION INPUT PANEL */}
      {activeMember ? (
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-3">
              <img
                src={activeMember.avatarUrl}
                alt={activeMember.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-red-500 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white">{activeMember.name}</h3>
                  <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3 h-3 text-slate-950" />
                    {activeMember.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono font-bold flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-red-400" />
                  {activeMember.phone}
                </p>
              </div>
            </div>

            {/* BALANCE STATS */}
            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-700">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Poin Saat Ini</p>
                <p className="text-lg font-black font-mono text-amber-300">{activeMember.points} <span className="text-xs text-slate-300 font-sans">Pts</span></p>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Stamp Saat Ini</p>
                <p className="text-lg font-black font-mono text-emerald-300">{activeMember.stamps} <span className="text-xs text-slate-300 font-sans">Stamps</span></p>
              </div>
            </div>
          </div>

          {/* TRANSACTION FORM */}
          <form onSubmit={handleProcessTransaction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Harga Paket / Jumlah Pembelanjaan (Rp)
                </label>
                <input
                  type="number"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  required
                  min="1000"
                  step="1000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Catatan Paket / Transaksi
                </label>
                <input
                  type="text"
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  placeholder="Paket Vintage Strip"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={processing || parsedAmount <= 0}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{processing ? 'Memproses...' : 'Proses & Tambah Poin'}</span>
                </button>
              </div>
            </div>

            {/* PREVIEW ADDED REWARDS */}
            {parsedAmount > 0 && (
              <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs flex items-center justify-between text-red-200">
                <span className="font-semibold">Perhitungan Otomatis Pembelanjaan Rp {parsedAmount.toLocaleString('id-ID')}:</span>
                <div className="font-mono font-black space-x-3">
                  <span className="text-amber-300">+{previewPoints} Poin</span>
                  <span className="text-emerald-300">+{previewStamps} Stamp</span>
                </div>
              </div>
            )}

            {txSuccessMsg && (
              <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{txSuccessMsg}</span>
              </div>
            )}
          </form>
        </div>
      ) : searchPhone.length >= 3 ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
          <p className="text-xs text-slate-500 font-medium">
            Member dengan No. HP / Nama "<strong className="text-slate-800">{searchPhone}</strong>" tidak ditemukan.
          </p>
          <button
            onClick={() => {
              setNewPhone(searchPhone);
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Daftarkan "{searchPhone}" Sebagai Member Baru</span>
          </button>
        </div>
      ) : null}

      {/* MODAL TAMBAH MEMBER CEPAT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateMember} className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-red-600" />
                Tambah Member Baru Cepat
              </h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Member *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Anita Wijaya"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp *</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-800 font-medium">
                <strong>PIN Default Otomatis:</strong> <span className="font-mono font-bold text-red-900">12345</span>.
                Member akan diminta mengganti PIN & memasukkan tanggal lahir saat pertama kali login.
              </div>
            </div>

            <button
              type="submit"
              disabled={addLoading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {addLoading ? 'Menyimpan...' : 'Simpan Member Baru'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
