import React, { useState, useEffect } from 'react';
import { Member, Promo, LoyaltySettings } from '../../../types';
import { compressImage } from '../../../utils/imageCompressor';
import {
  updateLoyaltySettingsInFirestore,
  subscribePromos,
  savePromoInFirestore,
  deletePromoInFirestore,
  resetMemberPinWithVerification
} from '../../../services/memberService';
import {
  Settings,
  Crown,
  Image,
  KeyRound,
  Calculator,
  Plus,
  Trash2,
  Check,
  Edit2,
  X,
  AlertCircle,
  Save,
  Tag,
  ShieldAlert,
  Upload
} from 'lucide-react';

interface SettingMasterViewProps {
  members: Member[];
  loyaltySettings: LoyaltySettings;
}

export const SettingMasterView: React.FC<SettingMasterViewProps> = ({
  members,
  loyaltySettings,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'TIER' | 'PROMOS' | 'RESET_PIN' | 'EARNING_RATES' | 'PACKAGES'>('TIER');

  // Loyalty Settings Form State
  const [tierForm, setTierForm] = useState<LoyaltySettings>(loyaltySettings);
  const [saveTierLoading, setSaveTierLoading] = useState(false);
  const [tierSuccess, setTierSuccess] = useState(false);

  // Promos List & Form State
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Partial<Promo> | null>(null);
  const [savePromoLoading, setSavePromoLoading] = useState(false);

  // Reset PIN Form State (Match Name, Phone, DOB & Catatan Transaksi)
  const [verifyName, setVerifyName] = useState('');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyDob, setVerifyDob] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('CUSTOM');
  const [txPackageName, setTxPackageName] = useState('Paket Photobooth Verification');
  const [txPackagePrice, setTxPackagePrice] = useState<number>(0);
  const [resetMsg, setResetMsg] = useState<{ success: boolean; text: string } | null>(null);

  // New Preset Package Form
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState<number>(50000);

  // New Custom Tier Form State
  const [newTierName, setNewTierName] = useState('');
  const [newTierReq, setNewTierReq] = useState('');
  const [newTierBenefit, setNewTierBenefit] = useState('');
  const [newTierColor, setNewTierColor] = useState('purple');

  useEffect(() => {
    setTierForm(loyaltySettings);
  }, [loyaltySettings]);

  useEffect(() => {
    const unsub = subscribePromos((list) => setPromos(list));
    return () => unsub();
  }, []);

  // Preset package selection change in Reset PIN
  const handlePresetSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    if (id === 'NONE') {
      setTxPackageName('');
      setTxPackagePrice(0);
    } else if (id === 'CUSTOM') {
      setTxPackageName('Paket Photobooth Verification');
      setTxPackagePrice(50000);
    } else {
      const found = (tierForm.presetPackages || []).find((p) => p.id === id);
      if (found) {
        setTxPackageName(found.name);
        setTxPackagePrice(found.price);
      }
    }
  };

  // Save Tier Rules & Earning Rates
  const handleSaveTierSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveTierLoading(true);
    try {
      await updateLoyaltySettingsInFirestore(tierForm);
      setSaveTierLoading(false);
      setTierSuccess(true);
      setTimeout(() => setTierSuccess(false), 2500);
    } catch (err: any) {
      setSaveTierLoading(false);
      alert('Gagal menyimpan pengaturan tier: ' + err.message);
    }
  };

  // Save Promo (Add / Edit)
  const handleSavePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromo) return;
    setSavePromoLoading(true);
    try {
      await savePromoInFirestore(selectedPromo);
      setSavePromoLoading(false);
      setSelectedPromo(null);
    } catch (err: any) {
      setSavePromoLoading(false);
      alert('Gagal menyimpan promo: ' + err.message);
    }
  };

  // Delete Promo
  const handleDeletePromo = async (promoId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner promo ini?')) return;
    try {
      await deletePromoInFirestore(promoId);
    } catch (err: any) {
      alert('Gagal menghapus promo: ' + err.message);
    }
  };

  // Handle Verify & Reset PIN
  const handleVerifyResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);

    if (!verifyName || !verifyPhone || !verifyDob || !newPinInput) {
      setResetMsg({ success: false, text: 'Harap lengkapi semua field (Nama, No. HP, Tanggal Lahir, dan PIN Baru).' });
      return;
    }

    const txPackage =
      txPackagePrice > 0 ? { name: txPackageName || 'Paket Reset PIN', price: txPackagePrice } : undefined;

    const res = await resetMemberPinWithVerification(
      verifyName,
      verifyPhone,
      verifyDob,
      newPinInput,
      members,
      txPackage,
      loyaltySettings
    );

    setResetMsg({ success: res.success, text: res.message });
    if (res.success) {
      setVerifyName('');
      setVerifyPhone('');
      setVerifyDob('');
      setNewPinInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-500" />
            Pengaturan Master Member & Rewards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Atur aturan poin, stamp, tier keanggotaan, katalog promo, dan pencocokan reset PIN member.
          </p>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
        <button
          onClick={() => setActiveSubTab('TIER')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'TIER' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Keuntungan & Syarat Tier</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PROMOS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'PROMOS' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Katalog & Gambar Promo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('EARNING_RATES')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'EARNING_RATES' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Aturan Poin & Stamp per Paket</span>
        </button>

        <button
          onClick={() => setActiveSubTab('RESET_PIN')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'RESET_PIN' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Reset PIN via Verifikasi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PACKAGES')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'PACKAGES' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Daftar Paket Transaksi</span>
        </button>
      </div>

      {/* TAB 1: KEUNTUNGAN & SYARAT TIER */}
      {activeSubTab === 'TIER' && (
        <form onSubmit={handleSaveTierSettings} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Pengaturan Teks Keuntungan & Syarat Ketentuan Level Member
            </h3>
            {tierSuccess && (
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Berhasil Disimpan
              </span>
            )}
          </div>

          <div className="space-y-6">
            {/* BRONZE */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-800" />
                  <span>BRONZE MEMBER</span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setTierForm({
                      ...tierForm,
                      tierBenefits: { ...tierForm.tierBenefits, bronzeMin: '', bronze: '' },
                    })
                  }
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  title="Hapus / Kosongkan Level Bronze Member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Level</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Syarat Level Bronze</label>
                  <input
                    type="text"
                    value={tierForm.tierBenefits.bronzeMin}
                    onChange={(e) =>
                      setTierForm({
                        ...tierForm,
                        tierBenefits: { ...tierForm.tierBenefits, bronzeMin: e.target.value },
                      })
                    }
                    placeholder="(Kosong = Tidak Aktif / Dihapus)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi Keuntungan Bronze</label>
                  <input
                    type="text"
                    value={tierForm.tierBenefits.bronze}
                    onChange={(e) =>
                      setTierForm({
                        ...tierForm,
                        tierBenefits: { ...tierForm.tierBenefits, bronze: e.target.value },
                      })
                    }
                    placeholder="(Kosong = Tidak Aktif / Dihapus)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>

            {/* GOLD */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>GOLD MEMBER</span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setTierForm({
                      ...tierForm,
                      tierBenefits: { ...tierForm.tierBenefits, goldMin: '', gold: '' },
                    })
                  }
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  title="Hapus / Kosongkan Level Gold Member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Level</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Syarat Level Gold</label>
                  <input
                    type="text"
                    value={tierForm.tierBenefits.goldMin}
                    onChange={(e) =>
                      setTierForm({
                        ...tierForm,
                        tierBenefits: { ...tierForm.tierBenefits, goldMin: e.target.value },
                      })
                    }
                    placeholder="(Kosong = Tidak Aktif / Dihapus)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi Keuntungan Gold</label>
                  <input
                    type="text"
                    value={tierForm.tierBenefits.gold}
                    onChange={(e) =>
                      setTierForm({
                        ...tierForm,
                        tierBenefits: { ...tierForm.tierBenefits, gold: e.target.value },
                      })
                    }
                    placeholder="(Kosong = Tidak Aktif / Dihapus)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>

            {/* DIAMOND */}
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-cyan-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-cyan-600" />
                  <span>DIAMOND VIP MEMBER</span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setTierForm({
                      ...tierForm,
                      tierBenefits: { ...tierForm.tierBenefits, diamondMin: '', diamond: '' },
                    })
                  }
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  title="Hapus / Kosongkan Level Diamond VIP Member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Level</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Syarat Level Diamond VIP</label>
                  <input
                    type="text"
                    value={tierForm.tierBenefits.diamondMin}
                    onChange={(e) =>
                      setTierForm({
                        ...tierForm,
                        tierBenefits: { ...tierForm.tierBenefits, diamondMin: e.target.value },
                      })
                    }
                    placeholder="(Kosong = Tidak Aktif / Dihapus)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi Keuntungan Diamond</label>
                  <input
                    type="text"
                    value={tierForm.tierBenefits.diamond}
                    onChange={(e) =>
                      setTierForm({
                        ...tierForm,
                        tierBenefits: { ...tierForm.tierBenefits, diamond: e.target.value },
                      })
                    }
                    placeholder="(Kosong = Tidak Aktif / Dihapus)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC CUSTOM TIERS ADDED BY ADMIN */}
            {(tierForm.customTiers || []).map((ct, idx) => (
              <div key={ct.id || idx} className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-purple-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-purple-600" />
                    <span>{ct.name || `CUSTOM LEVEL #${idx + 1}`}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = (tierForm.customTiers || []).filter((_, i) => i !== idx);
                      setTierForm({ ...tierForm, customTiers: filtered });
                    }}
                    className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Level</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Level Member</label>
                    <input
                      type="text"
                      value={ct.name}
                      onChange={(e) => {
                        const list = [...(tierForm.customTiers || [])];
                        list[idx].name = e.target.value;
                        setTierForm({ ...tierForm, customTiers: list });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Syarat Minimal Level</label>
                    <input
                      type="text"
                      value={ct.minPointsRequirement}
                      onChange={(e) => {
                        const list = [...(tierForm.customTiers || [])];
                        list[idx].minPointsRequirement = e.target.value;
                        setTierForm({ ...tierForm, customTiers: list });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Deskripsi Keuntungan Member</label>
                    <input
                      type="text"
                      value={ct.benefitDescription}
                      onChange={(e) => {
                        const list = [...(tierForm.customTiers || [])];
                        list[idx].benefitDescription = e.target.value;
                        setTierForm({ ...tierForm, customTiers: list });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* TAMBAH LEVEL MEMBER BARU FORM */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md border border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Tambah Level Member Baru
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama Level Member</label>
                  <input
                    type="text"
                    value={newTierName}
                    onChange={(e) => setNewTierName(e.target.value)}
                    placeholder="Contoh: PLATINUM MEMBER"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl font-extrabold focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Syarat Level</label>
                  <input
                    type="text"
                    value={newTierReq}
                    onChange={(e) => setNewTierReq(e.target.value)}
                    placeholder="Contoh: Akumulasi Minimal 1000 Poin"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl font-medium focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Deskripsi Keuntungan</label>
                  <input
                    type="text"
                    value={newTierBenefit}
                    onChange={(e) => setNewTierBenefit(e.target.value)}
                    placeholder="Contoh: Diskon 25% Semua Paket & Akses VIP Lounge"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl font-medium focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!newTierName.trim()) {
                    alert('Harap isi Nama Level Member.');
                    return;
                  }
                  const newCustom = {
                    id: `tier-${Date.now()}`,
                    name: newTierName.trim().toUpperCase(),
                    minPointsRequirement: newTierReq.trim() || 'Poin Khusus',
                    benefitDescription: newTierBenefit.trim() || 'Akses Keuntungan Spesial Member',
                    colorTheme: newTierColor,
                  };
                  setTierForm({
                    ...tierForm,
                    customTiers: [...(tierForm.customTiers || []), newCustom],
                  });
                  setNewTierName('');
                  setNewTierReq('');
                  setNewTierBenefit('');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambahkan Level Member Baru</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saveTierLoading}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saveTierLoading ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: GAMBAR & KATALOG PROMO */}
      {activeSubTab === 'PROMOS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base">Kelola Banner & Gambar Promo Member</h3>
              <p className="text-xs text-slate-500 font-medium">Tambah/edit gambar promo potongan harga, produk stamp, dan event khusus.</p>
            </div>

            <button
              onClick={() => setSelectedPromo({ title: '', description: '', bannerUrl: '', type: 'POINT_DISCOUNT', costPoints: 10, costStamps: 0, isActive: true, targetTier: 'Semua Tier', maxRedeemPerMember: 0 })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Banner Promo</span>
            </button>
          </div>

          {/* PROMO CARDS LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <img src={p.bannerUrl} alt={p.title} className="w-full h-36 object-cover" />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-black rounded uppercase tracking-wider">
                        {p.type.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-black rounded uppercase">
                        {p.targetTier || 'Semua Tier'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {p.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs leading-snug">{p.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{p.description}</p>
                    <div className="text-[11px] font-mono font-bold text-slate-700 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>Biaya: {p.costPoints > 0 && <span className="text-amber-600 font-extrabold">{p.costPoints} Pts </span>}{p.costStamps > 0 && <span className="text-emerald-600 font-extrabold">{p.costStamps} Stamp</span>}</span>
                      <span className="text-slate-500 font-sans text-[10px]">Max: {p.maxRedeemPerMember && p.maxRedeemPerMember > 0 ? `${p.maxRedeemPerMember}x / Member` : 'Bebas'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedPromo(p)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeletePromo(p.id)}
                    className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* MODAL PROMO FORM */}
          {selectedPromo && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
              <form onSubmit={handleSavePromoSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {selectedPromo.id ? 'Edit Banner Promo' : 'Tambah Promo Baru'}
                  </h3>
                  <button type="button" onClick={() => setSelectedPromo(null)} className="p-1 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Judul Promo *</label>
                    <input
                      type="text"
                      value={selectedPromo.title || ''}
                      onChange={(e) => setSelectedPromo({ ...selectedPromo, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gambar Banner Promo *</label>
                    <div className="space-y-2">
                      {selectedPromo.bannerUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
                          <img
                            src={selectedPromo.bannerUrl}
                            alt="Preview Promo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <label className="cursor-pointer px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const compressed = await compressImage(file, 800, 800, 0.75);
                                setSelectedPromo({ ...selectedPromo, bannerUrl: compressed });
                              } catch (err) {
                                alert('Gagal mengompres gambar: ' + err);
                              }
                            }}
                          />
                        </label>

                        <input
                          type="text"
                          value={selectedPromo.bannerUrl || ''}
                          onChange={(e) => setSelectedPromo({ ...selectedPromo, bannerUrl: e.target.value })}
                          placeholder="Atau tempel URL gambar..."
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-[11px]"
                        />
                      </div>

                      <p className="text-[10px] text-amber-700 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                        *Catatan: Upload file gambar promo (Maksimal rekomendasi 300KB, format JPG/PNG/WEBP) agar hasil tetap tajam dan tidak memberatkan database Firestore.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tipe Promo</label>
                      <select
                        value={selectedPromo.type || 'POINT_DISCOUNT'}
                        onChange={(e) => setSelectedPromo({ ...selectedPromo, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-slate-50"
                      >
                        <option value="POINT_DISCOUNT">POINT_DISCOUNT (Potongan Poin)</option>
                        <option value="STAMP_PRODUCT">STAMP_PRODUCT (Gratis Produk via Stamp)</option>
                        <option value="EVENT">EVENT (Promo Spesial Event)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pilihan Tier Promo</label>
                      <select
                        value={selectedPromo.targetTier || 'Semua Tier'}
                        onChange={(e) => setSelectedPromo({ ...selectedPromo, targetTier: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-amber-50 text-amber-900 border-amber-300"
                      >
                        <option value="Semua Tier">Semua Tier Member</option>
                        <option value="Bronze">Khusus Bronze Member</option>
                        <option value="Gold">Khusus Gold Member</option>
                        <option value="Diamond">Khusus Diamond VIP Member</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Biaya Poin</label>
                      <input
                        type="number"
                        value={selectedPromo.costPoints || 0}
                        onChange={(e) => setSelectedPromo({ ...selectedPromo, costPoints: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Biaya Stamp</label>
                      <input
                        type="number"
                        value={selectedPromo.costStamps || 0}
                        onChange={(e) => setSelectedPromo({ ...selectedPromo, costStamps: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Batas Redeem/Tukar</label>
                      <input
                        type="number"
                        value={selectedPromo.maxRedeemPerMember !== undefined ? selectedPromo.maxRedeemPerMember : 0}
                        onChange={(e) => setSelectedPromo({ ...selectedPromo, maxRedeemPerMember: parseInt(e.target.value, 10) || 0 })}
                        placeholder="0 = Tanpa Batas"
                        min={0}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Deskripsi Lengkap Promo</label>
                    <textarea
                      value={selectedPromo.description || ''}
                      onChange={(e) => setSelectedPromo({ ...selectedPromo, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savePromoLoading}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  {savePromoLoading ? 'Menyimpan...' : 'Simpan Promo'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATURAN PERHITUNGAN POIN & STAMP */}
      {activeSubTab === 'EARNING_RATES' && (
        <form onSubmit={handleSaveTierSettings} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Calculator className="w-5 h-5 text-red-600" />
              Aturan Konversi Pembelanjaan ke Poin, Stamp, dan Ambang Tier
            </h3>
            {tierSuccess && (
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Berhasil Disimpan
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="block font-extrabold text-slate-900">Nominal Pembelanjaan per 1 POIN (Rp)</label>
              <input
                type="number"
                value={tierForm.spendPerPoint}
                onChange={(e) => setTierForm({ ...tierForm, spendPerPoint: parseInt(e.target.value, 10) || 10000 })}
                step="1000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-sm bg-white"
              />
              <p className="text-[11px] text-slate-500">Contoh: Rp 10.000 &rarr; Setiap pembelanjaan Rp 10.000 member mendapat 1 Poin.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="block font-extrabold text-slate-900">Nominal Pembelanjaan per 1 STAMP (Rp)</label>
              <input
                type="number"
                value={tierForm.spendPerStamp}
                onChange={(e) => setTierForm({ ...tierForm, spendPerStamp: parseInt(e.target.value, 10) || 50000 })}
                step="1000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-sm bg-white"
              />
              <p className="text-[11px] text-slate-500">Contoh: Rp 50.000 &rarr; Setiap pembelanjaan Rp 50.000 member mendapat 1 Stamp.</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <label className="block font-extrabold text-amber-950">Ambang Poin Level GOLD</label>
              <input
                type="number"
                value={tierForm.goldThresholdPoints}
                onChange={(e) => setTierForm({ ...tierForm, goldThresholdPoints: parseInt(e.target.value, 10) || 100 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-sm bg-white"
              />
              <p className="text-[11px] text-amber-800">Total poin yang harus dikumpulkan untuk otomatis naik ke level Gold.</p>
            </div>

            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl space-y-2">
              <label className="block font-extrabold text-cyan-950">Ambang Poin Level DIAMOND VIP</label>
              <input
                type="number"
                value={tierForm.diamondThresholdPoints}
                onChange={(e) => setTierForm({ ...tierForm, diamondThresholdPoints: parseInt(e.target.value, 10) || 500 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-sm bg-white"
              />
              <p className="text-[11px] text-cyan-800">Total poin yang harus dikumpulkan untuk otomatis naik ke level Diamond VIP.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saveTierLoading}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan</span>
          </button>
        </form>
      )}

      {/* TAB 4: RESET PIN DENGAN COCOK NAMA, NO. HP, TGL LAHIR */}
      {activeSubTab === 'RESET_PIN' && (
        <form onSubmit={handleVerifyResetPin} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-5 max-w-lg">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-red-600" />
              Reset PIN Member via Verifikasi 3 Data
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Masukkan Nama Lengkap, Nomor Telepon, dan Tanggal Lahir member untuk memverifikasi kecocokan sebelum mengganti PIN.
            </p>
          </div>

          {resetMsg && (
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              resetMsg.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{resetMsg.text}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. Nama Lengkap Member *</label>
              <input
                type="text"
                value={verifyName}
                onChange={(e) => setVerifyName(e.target.value)}
                placeholder="Sesuaikan dengan nama terdaftar"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. Nomor Telepon HP Member *</label>
              <input
                type="tel"
                value={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. Tanggal Lahir Member *</label>
              <input
                type="date"
                value={verifyDob}
                onChange={(e) => setVerifyDob(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-extrabold text-slate-900 mb-1">Set PIN Baru Untuk Member *</label>
              <input
                type="text"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="Default: 12345"
                required
                maxLength={10}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-sm bg-amber-50/50 focus:bg-white"
              />
            </div>

            {/* CATATAN PAKET / TRANSAKSI SEBELUM RESET PIN VIA VERIFIKASI */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5 bg-slate-50 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="block font-extrabold text-slate-900 text-xs">
                  Catatan Paket / Transaksi Member (Opsional)
                </label>
                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  Integrasi Member
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Paket Transaksi Pre-set</label>
                <select
                  value={selectedPresetId}
                  onChange={handlePresetSelectChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                >
                  <option value="NONE">-- Tanpa Catatan Transaksi --</option>
                  <option value="CUSTOM">-- Custom Manual Tulis Nama & Harga --</option>
                  {(tierForm.presetPackages || []).map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - Rp {pkg.price.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPresetId !== 'NONE' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nama Transaksi / Paket</label>
                    <input
                      type="text"
                      value={txPackageName}
                      onChange={(e) => setTxPackageName(e.target.value)}
                      placeholder="Contoh: Paket Vintage Strip"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Harga Paket (Rp)</label>
                    <input
                      type="number"
                      value={txPackagePrice}
                      onChange={(e) => setTxPackagePrice(parseInt(e.target.value, 10) || 0)}
                      placeholder="50000"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Verifikasi Data & Reset PIN Member</span>
          </button>
        </form>
      )}

      {/* TAB 5: DAFTAR PAKET TRANSAKSI PRE-SET */}
      {activeSubTab === 'PACKAGES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Tag className="w-5 h-5 text-red-600" />
                Daftar Paket Transaksi Photobooth (Pre-set Fast Select)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kelola nama transaksi & harga paket yang terintegrasi di Operasional Member Loyalitas & Reset PIN.
              </p>
            </div>
            {tierSuccess && (
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Berhasil Disimpan
              </span>
            )}
          </div>

          {/* ADD NEW PACKAGE FORM */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs">Tambah Paket Transaksi Baru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nama Transaksi / Paket</label>
                <input
                  type="text"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  placeholder="Contoh: Paket Studio Group (4 Persons)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Harga Paket (Rp)</label>
                <input
                  type="number"
                  value={newPkgPrice}
                  onChange={(e) => setNewPkgPrice(parseInt(e.target.value, 10) || 0)}
                  placeholder="50000"
                  step="5000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!newPkgName.trim() || newPkgPrice <= 0) {
                  alert('Harap isi Nama Paket dan Harga Paket yang valid.');
                  return;
                }
                const newPkg = {
                  id: `pkg-${Date.now()}`,
                  name: newPkgName.trim(),
                  price: newPkgPrice,
                };
                const updatedList = [...(tierForm.presetPackages || []), newPkg];
                setTierForm({ ...tierForm, presetPackages: updatedList });
                setNewPkgName('');
                setNewPkgPrice(50000);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah ke Daftar Preset</span>
            </button>
          </div>

          {/* PRESET PACKAGES LIST */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs">Daftar Preset Aktif ({ (tierForm.presetPackages || []).length } Paket)</h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {(tierForm.presetPackages || []).length > 0 ? (
                (tierForm.presetPackages || []).map((pkg, idx) => (
                  <div key={pkg.id || idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-red-100 text-red-700 font-extrabold text-xs flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-900">{pkg.name}</h5>
                        <p className="text-xs font-mono font-bold text-emerald-600">
                          Rp {pkg.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const filtered = (tierForm.presetPackages || []).filter((_, i) => i !== idx);
                        setTierForm({ ...tierForm, presetPackages: filtered });
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                      title="Hapus Preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Belum ada preset paket transaksi.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveTierSettings}
            disabled={saveTierLoading}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saveTierLoading ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
