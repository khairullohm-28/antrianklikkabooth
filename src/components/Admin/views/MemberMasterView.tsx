import React, { useState } from 'react';
import { Member, MemberTier } from '../../../types';
import { updateMemberInFirestore } from '../../../services/memberService';
import { Search, UserCheck, Crown, Edit2, Lock, Sparkles, Filter, X, Check, ShieldCheck } from 'lucide-react';

interface MemberMasterViewProps {
  members: Member[];
}

export const MemberMasterView: React.FC<MemberMasterViewProps> = ({ members }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit Modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editPoints, setEditPoints] = useState(0);
  const [editStamps, setEditStamps] = useState(0);
  const [editTier, setEditTier] = useState<MemberTier>('Bronze');
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [saveLoading, setSaveLoading] = useState(false);

  // Reset PIN Modal
  const [resetPinMember, setResetPinMember] = useState<Member | null>(null);
  const [newPinInput, setNewPinInput] = useState('12345');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Filter Members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
    const matchesTier = tierFilter === 'ALL' || m.tier === tierFilter;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const handleOpenEdit = (m: Member) => {
    setSelectedMember(m);
    setEditName(m.name);
    setEditPhone(m.phone);
    setEditDob(m.dob || '');
    setEditPoints(m.points);
    setEditStamps(m.stamps);
    setEditTier(m.tier);
    setEditStatus(m.status || 'Aktif');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSaveLoading(true);

    try {
      await updateMemberInFirestore(selectedMember.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        dob: editDob,
        points: editPoints,
        stamps: editStamps,
        tier: editTier,
        status: editStatus,
      });
      setSaveLoading(false);
      setSelectedMember(null);
    } catch (err: any) {
      setSaveLoading(false);
      alert('Gagal menyimpan member: ' + err.message);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinMember) return;
    try {
      await updateMemberInFirestore(resetPinMember.id, { pin: newPinInput.trim() });
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setResetPinMember(null);
      }, 1500);
    } catch (err: any) {
      alert('Gagal me-reset PIN: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-red-500" />
            Master Data Member
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data seluruh member terdaftar, status keanggotaan, poin, stamp, dan PIN.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-xs font-bold text-slate-300">
          <span>Total Member: <strong className="text-white font-black font-mono text-sm">{members.length}</strong></span>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nama / No. Telepon..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-2xl text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="ALL">Semua Tier</option>
            <option value="Bronze">Bronze</option>
            <option value="Gold">Gold</option>
            <option value="Diamond">Diamond</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-2xl text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="ALL">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* MEMBERS DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Member Info</th>
                <th className="p-4">No. HP</th>
                <th className="p-4">Tgl Lahir</th>
                <th className="p-4">Tgl Daftar</th>
                <th className="p-4">Tier & Status</th>
                <th className="p-4 text-center">Poin / Stamp</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={m.avatarUrl}
                        alt={m.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                      />
                      <div>
                        <p className="font-extrabold text-slate-900">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {m.id}</p>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">{m.phone}</td>
                    <td className="p-4 text-slate-600">{m.dob || '-'}</td>
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(m.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          m.tier === 'Diamond'
                            ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                            : m.tier === 'Gold'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-stone-100 text-stone-800 border border-stone-300'
                        }`}>
                          <Crown className="w-3 h-3" />
                          {m.tier}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {m.status || 'Aktif'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono font-bold">
                      <span className="text-amber-600">{m.points} Pts</span> /{' '}
                      <span className="text-emerald-600">{m.stamps} Stamp</span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setResetPinMember(m)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Reset PIN</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Member tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT MEMBER */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-red-600" />
                Edit Member: {selectedMember.name}
              </h3>
              <button type="button" onClick={() => setSelectedMember(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Telepon HP</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Member</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-50"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah Poin</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah Stamp</label>
                <input
                  type="number"
                  value={editStamps}
                  onChange={(e) => setEditStamps(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Tingkatan Tier</label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value as MemberTier)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-slate-50"
                >
                  <option value="Bronze">Bronze Member</option>
                  <option value="Gold">Gold Member</option>
                  <option value="Diamond">Diamond VIP Member</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              {saveLoading ? 'Menyimpan...' : 'Simpan Perubahan Member'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL RESET PIN MEMBER */}
      {resetPinMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleResetPinSubmit} className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                Reset PIN: {resetPinMember.name}
              </h3>
              <button type="button" onClick={() => setResetPinMember(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>PIN berhasil di-reset!</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Set PIN Baru</label>
                <input
                  type="text"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Sampaikan PIN baru ini kepada member agar mereka dapat login kembali.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md"
            >
              Simpan PIN Baru
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
