import React, { useState, useEffect } from 'react';
import { Member, Promo, MemberHistory, LoyaltySettings } from '../../types';
import { useQueue } from '../../context/QueueContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  updateMemberInFirestore,
  redeemPromoForMember,
  subscribeMemberHistory
} from '../../services/memberService';
import {
  Home,
  Tag,
  History,
  User,
  Award,
  Sparkles,
  Ticket,
  Gift,
  ChevronRight,
  LogOut,
  Edit2,
  Calendar,
  MapPin,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Crown,
  ShieldCheck,
  ChevronLeft,
  Info,
  Upload
} from 'lucide-react';

interface MemberDashboardProps {
  member: Member;
  promos: Promo[];
  loyaltySettings: LoyaltySettings;
  onLogout: () => void;
  onUpdateMemberLocal?: (updated: Member) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  member,
  promos,
  loyaltySettings,
  onLogout,
  onUpdateMemberLocal
}) => {
  const { printSettings } = useQueue();
  const companyLogoUrl = printSettings?.monitorLogoUrl || printSettings?.logoUrl;
  const [activeTab, setActiveTab] = useState<'home' | 'promo' | 'history' | 'profile'>('home');

  // Realtime Member Histories
  const [histories, setHistories] = useState<MemberHistory[]>([]);

  // Modals & Interactivity States
  const [selectedPromoForRedeem, setSelectedPromoForRedeem] = useState<Promo | null>(null);
  const [redeemResultMsg, setRedeemResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(member.name);
  const [editDob, setEditDob] = useState(member.dob || '');
  const [editAddress, setEditAddress] = useState(member.address || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(member.avatarUrl || '');
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);

  // Change PIN Form State
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Banner Slide Index
  const [bannerIndex, setBannerIndex] = useState(0);

  // Subscribe to Member History from Firestore
  useEffect(() => {
    if (!member.id) return;
    const unsub = subscribeMemberHistory(member.id, (list) => {
      setHistories(list);
    });
    return () => unsub();
  }, [member.id]);

  // Sync props to edit form state
  useEffect(() => {
    setEditName(member.name);
    setEditDob(member.dob || '');
    setEditAddress(member.address || '');
    setEditAvatarUrl(member.avatarUrl || '');
  }, [member]);

  // Dynamic Greeting according to time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'pagi';
    if (hour >= 11 && hour < 15) return 'siang';
    if (hour >= 15 && hour < 18) return 'sore';
    return 'malam';
  };

  // Next Tier Progress calculation
  const getTierProgress = () => {
    if (member.tier === 'Diamond') {
      return { nextTier: 'Maksimal (Diamond VIP)', current: member.points, max: member.points, pct: 100 };
    }
    if (member.tier === 'Gold') {
      const max = loyaltySettings.diamondThresholdPoints || 500;
      const pct = Math.min(100, Math.round((member.points / max) * 100));
      return { nextTier: 'Diamond', current: member.points, max, pct };
    }
    // Bronze
    const max = loyaltySettings.goldThresholdPoints || 100;
    const pct = Math.min(100, Math.round((member.points / max) * 100));
    return { nextTier: 'Gold', current: member.points, max, pct };
  };

  const progressInfo = getTierProgress();

  // Banner slide auto interval
  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % promos.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [promos.length]);

  // Handle Promo Redeem Execution
  const handleConfirmRedeem = async () => {
    if (!selectedPromoForRedeem) return;
    const res = await redeemPromoForMember(member, selectedPromoForRedeem);
    setRedeemResultMsg({ success: res.success, text: res.message });
    if (res.success && onUpdateMemberLocal) {
      onUpdateMemberLocal({
        ...member,
        points: Math.max(0, member.points - selectedPromoForRedeem.costPoints),
        stamps: Math.max(0, member.stamps - selectedPromoForRedeem.costStamps),
      });
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveProfileLoading(true);
    try {
      const updates = {
        name: editName.trim(),
        dob: editDob,
        address: editAddress.trim(),
        avatarUrl: editAvatarUrl.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(editName)}`,
      };
      await updateMemberInFirestore(member.id, updates);
      if (onUpdateMemberLocal) {
        onUpdateMemberLocal({ ...member, ...updates });
      }
      setSaveProfileLoading(false);
      setIsEditProfileModalOpen(false);
    } catch (err: any) {
      setSaveProfileLoading(false);
      alert('Gagal memperbarui profil: ' + err.message);
    }
  };

  // Handle PIN Change
  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    if (currentPinInput !== member.pin) {
      setPinChangeMsg({ success: false, text: 'PIN Lama Anda tidak cocok.' });
      return;
    }
    if (newPinInput.length < 4) {
      setPinChangeMsg({ success: false, text: 'PIN Baru minimal 4 digit.' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinChangeMsg({ success: false, text: 'Konfirmasi PIN Baru tidak sesuai.' });
      return;
    }

    try {
      await updateMemberInFirestore(member.id, { pin: newPinInput });
      if (onUpdateMemberLocal) {
        onUpdateMemberLocal({ ...member, pin: newPinInput });
      }
      setPinChangeMsg({ success: true, text: 'PIN Member berhasil diubah!' });
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => {
        setIsChangePinModalOpen(false);
        setPinChangeMsg(null);
      }, 1500);
    } catch (err: any) {
      setPinChangeMsg({ success: false, text: 'Gagal memperbarui PIN: ' + err.message });
    }
  };

  // Tier Card Styling helper
  const getTierCardStyle = () => {
    if (member.tier === 'Diamond') {
      return 'bg-gradient-to-br from-indigo-900 via-slate-900 to-cyan-900 text-white border-cyan-400/40 shadow-cyan-900/40';
    }
    if (member.tier === 'Gold') {
      return 'bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-900 text-white border-amber-300/40 shadow-amber-900/40';
    }
    return 'bg-gradient-to-br from-slate-800 via-stone-800 to-red-950 text-white border-red-500/30 shadow-slate-900/40';
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans relative">
      {/* TOP COMPACT APP HEADER */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 shadow-md flex items-center justify-between border-b border-red-500">
        <div className="flex items-center gap-2.5">
          <img
            src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
            alt="Avatar"
            className="w-9 h-9 rounded-full object-cover shadow-sm"
          />
          <div>
            <h1 className="text-xs font-black text-white leading-tight">{member.name}</h1>
            <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-300" />
              Member {member.tier}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 text-xs font-bold flex items-center gap-1 shadow-sm"
          title="Keluar Member"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[11px]">Logout</span>
        </button>
      </div>

      {/* VIEW CONTENT PAGES */}
      <main className="p-4 space-y-5">
        {/* TAB 1: BERANDA */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* GREETING HEADER */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Halo, Kak <span className="text-red-600 font-black">{member.name}</span> 👋
              </h2>
              <p className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-1.5">
                <span>Selamat {getGreeting()}! Siap abadikan momen serumu hari ini? ✨</span>
              </p>
            </div>

            {/* DIGITAL MEMBER CARD SUMMARY (LUXURY PHOTOBOOTH CARD) */}
            <div
              onClick={() => setIsTierModalOpen(true)}
              className={`p-6 rounded-3xl shadow-2xl cursor-pointer relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] ${getTierCardStyle()}`}
            >
              {/* Glossy Overlay & Radial Light */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-gradient-to-br from-white/20 via-amber-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-36 h-36 bg-gradient-to-tr from-amber-500/10 via-white/10 to-transparent rounded-full blur-xl pointer-events-none" />

              {/* CARD TOP BAR */}
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover shadow-md shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-black text-xs text-white shadow-md shrink-0">
                      PB
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/90 block">Photobooth Card</span>
                    <h3 className="text-base font-black text-white tracking-tight">{member.name}</h3>
                  </div>
                </div>

                <div className="px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-amber-200 border border-amber-300/40 flex items-center gap-1.5 shadow-lg">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>{member.tier} VIP</span>
                </div>
              </div>

              {/* CHIP & MEMBER PHONE CARD NUMBER */}
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-9 h-7 bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 rounded-lg border border-amber-500/50 shadow-inner flex flex-col justify-around p-1">
                  <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                  <div className="w-2/3 h-0.5 bg-amber-600/40 rounded-full" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block">Nomor HP Member</span>
                  <span className="text-xs font-mono font-black tracking-widest text-white/95">{member.phone}</span>
                </div>
              </div>

              {/* POINTS & STAMPS DISPLAY */}
              <div className="grid grid-cols-2 gap-3 mb-4 bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 shadow-inner relative z-10">
                <div>
                  <p className="text-[10px] font-extrabold text-amber-200/80 uppercase tracking-wider">Jumlah Poin</p>
                  <p className="text-2xl font-black font-mono text-amber-300 mt-0.5">{member.points} <span className="text-xs font-sans text-white/80">Pts</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-emerald-200/80 uppercase tracking-wider">Jumlah Stamp</p>
                  <p className="text-2xl font-black font-mono text-emerald-300 mt-0.5">{member.stamps} <span className="text-xs font-sans text-white/80">Stamps</span></p>
                </div>
              </div>

              {/* TIER PROGRESS BAR */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-[10px] font-bold text-white/80">
                  <span>Target Ke Level {progressInfo.nextTier}</span>
                  <span>{progressInfo.current} / {progressInfo.max} Pts</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="bg-gradient-to-r from-amber-300 via-yellow-300 to-emerald-300 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progressInfo.pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 text-right relative z-10">
                <span className="text-[10px] text-amber-200/90 font-bold hover:underline inline-flex items-center gap-1">
                  Detail Benefit Level Member <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* PROMO BANNER CAROUSEL SLIDE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  Promo Special
                </h3>
                <button
                  onClick={() => setActiveTab('promo')}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Lihat Semua
                </button>
              </div>

              {promos.length > 0 ? (
                <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-lg aspect-[16/9] border border-slate-200">
                  <img
                    src={promos[bannerIndex]?.bannerUrl}
                    alt={promos[bannerIndex]?.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
                    <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-md w-max mb-1 uppercase tracking-wider">
                      {promos[bannerIndex]?.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-black text-white leading-snug">
                      {promos[bannerIndex]?.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5 font-medium">
                      {promos[bannerIndex]?.description}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPromoForRedeem(promos[bannerIndex]);
                        setRedeemResultMsg(null);
                      }}
                      className="mt-2.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl shadow-md self-start flex items-center gap-1"
                    >
                      <Gift className="w-3.5 h-3.5 text-red-600" />
                      <span>Klaim Promo</span>
                    </button>
                  </div>

                  {/* Banner Navigation Dots */}
                  <div className="absolute bottom-2 right-3 flex items-center gap-1">
                    {promos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setBannerIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === bannerIndex ? 'w-5 bg-red-500' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Belum ada promo aktif saat ini
                </div>
              )}
            </div>

            {/* QUICK MENU TILES */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('promo')}
                className="p-4 bg-white hover:bg-rose-50/50 rounded-2xl border border-slate-200 shadow-sm text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
                  <Tag className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs">Tukar Poin & Stamp</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Katalog potongan harga & produk gratis</p>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className="p-4 bg-white hover:bg-rose-50/50 rounded-2xl border border-slate-200 shadow-sm text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
                  <History className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs">Riwayat Transaksi</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Catatan belanja & penukaran promo</p>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PROMO KATALOG */}
        {activeTab === 'promo' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Katalog Promo & Rewards
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Gunakan Poin & Stamp Anda untuk mendapatkan diskon dan hadiah gratis.
              </p>
            </div>

            {/* BALANCE BAR */}
            <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs font-bold border border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-amber-300 font-mono font-black">{member.points} Poin</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-300 font-mono font-black">{member.stamps} Stamp</span>
              </div>
              <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider">{member.tier} Tier</span>
            </div>

            {/* PROMO CARDS LIST */}
            <div className="space-y-3">
              {promos.filter((p) => p.isActive).map((promo) => {
                const canAfford =
                  member.points >= promo.costPoints && member.stamps >= promo.costStamps;

                // Check tier eligibility
                const isTierEligible =
                  !promo.targetTier ||
                  promo.targetTier === 'Semua Tier' ||
                  member.tier.toUpperCase() === promo.targetTier.toUpperCase() ||
                  (promo.targetTier === 'Bronze' && ['BRONZE', 'GOLD', 'DIAMOND'].includes(member.tier.toUpperCase())) ||
                  (promo.targetTier === 'Gold' && ['GOLD', 'DIAMOND'].includes(member.tier.toUpperCase()));

                // Check max redeem limit from history
                const memberRedeemCount = histories.filter(
                  (h) => h.type === 'REDEEM' && h.details?.includes(promo.title)
                ).length;

                const isMaxRedeemed =
                  promo.maxRedeemPerMember !== undefined &&
                  promo.maxRedeemPerMember > 0 &&
                  memberRedeemCount >= promo.maxRedeemPerMember;

                return (
                  <div
                    key={promo.id}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-stretch"
                  >
                    <div className="w-full sm:w-36 md:w-40 h-36 sm:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                      <img
                        src={promo.bannerUrl}
                        alt={promo.title}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    </div>
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5 gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            {promo.type.replace('_', ' ')}
                          </span>
                          {promo.targetTier && promo.targetTier !== 'Semua Tier' && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              Khusus {promo.targetTier}
                            </span>
                          )}
                          <div className="text-xs font-mono font-black ml-auto">
                            {promo.costPoints > 0 && <span className="text-amber-600">{promo.costPoints} Pts </span>}
                            {promo.costStamps > 0 && <span className="text-emerald-600">{promo.costStamps} Stamp</span>}
                          </div>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">{promo.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{promo.description}</p>
                      </div>

                      {isMaxRedeemed ? (
                        <div className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-extrabold text-center">
                          Sudah Expired / Batas Tukar Habis
                        </div>
                      ) : !isTierEligible ? (
                        <div className="w-full py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-extrabold text-center">
                          Khusus Member Tier {promo.targetTier}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPromoForRedeem(promo);
                            setRedeemResultMsg(null);
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                            canAfford
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 active:scale-95'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>{canAfford ? 'Tukarkan Promo' : 'Poin/Stamp Tidak Cukup'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {promos.filter((p) => p.isActive).length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Belum ada promo yang tersedia saat ini.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Riwayat Transaksi & Rewards
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Catatan penambahan poin, stamp, dan penukaran promo Anda.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {histories.length > 0 ? (
                histories.map((item) => {
                  const isPositive = item.pointsChange > 0 || item.stampsChange > 0;
                  return (
                    <div key={item.id} className="p-3.5 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            item.type === 'PURCHASE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {new Date(item.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 mt-1">{item.details}</p>
                        {item.transactionId && (
                          <p className="text-[10px] text-slate-400 font-mono">Ref: {item.transactionId}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0 font-mono font-black text-xs">
                        {item.pointsChange !== 0 && (
                          <p className={item.pointsChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {item.pointsChange > 0 ? `+${item.pointsChange}` : item.pointsChange} Pts
                          </p>
                        )}
                        {item.stampsChange !== 0 && (
                          <p className={item.stampsChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {item.stampsChange > 0 ? `+${item.stampsChange}` : item.stampsChange} Stamp
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Belum ada riwayat transaksi recorded.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFIL MEMBER */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Profil & Kartu Member Digital
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Kelola informasi akun dan lihat hak keanggotaan Anda.
              </p>
            </div>

            {/* DIGITAL MEMBER CARD DISPLAY (LUXURY PHOTOBOOTH CARD) */}
            <div
              onClick={() => setIsTierModalOpen(true)}
              className={`p-6 rounded-3xl shadow-2xl cursor-pointer relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] ${getTierCardStyle()}`}
            >
              {/* Glossy Overlay */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-gradient-to-br from-white/20 via-amber-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover shadow-md shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-black text-xs text-white shadow-md shrink-0">
                      PB
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200/90">Photobooth Card</h3>
                    <p className="text-base font-black text-white tracking-tight">{member.name}</p>
                  </div>
                </div>

                <div className="px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-amber-200 border border-amber-300/40 flex items-center gap-1.5 shadow-lg">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>{member.tier} VIP</span>
                </div>
              </div>

              {/* CARD DETAILS ROW */}
              <div className="flex items-end justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-7 bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 rounded-lg border border-amber-500/50 shadow-inner flex flex-col justify-around p-1">
                    <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                    <div className="w-2/3 h-0.5 bg-amber-600/40 rounded-full" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Nomor HP Member</p>
                    <p className="text-xs font-mono font-black tracking-widest text-white">{member.phone}</p>
                  </div>
                </div>

                <span className="text-[10px] text-amber-200 underline font-bold flex items-center gap-1">
                  Info Keuntungan Tier
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* PROFILE DETAILS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover shadow-sm"
                  />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{member.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Terdaftar sejak {new Date(member.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Nomor Telepon:
                  </span>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-800">{member.phone}</span>
                    <p className="text-[9px] text-red-600 font-medium italic">*Hanya bisa diubah melalui Admin</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tanggal Lahir:
                  </span>
                  <span className="font-bold text-slate-800">{member.dob || 'Belum diisi'}</span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Alamat:
                  </span>
                  <span className="font-bold text-slate-800 text-right max-w-[200px]">{member.address || 'Belum diisi'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setIsChangePinModalOpen(true)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ganti PIN Member</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR (FIXED) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 max-w-md mx-auto px-2 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-extrabold transition-all ${
            activeTab === 'home' ? 'text-red-600 bg-red-50' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Beranda</span>
        </button>

        <button
          onClick={() => setActiveTab('promo')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-extrabold transition-all ${
            activeTab === 'promo' ? 'text-red-600 bg-red-50' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span>Promo</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-extrabold transition-all ${
            activeTab === 'history' ? 'text-red-600 bg-red-50' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-5 h-5" />
          <span>History</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-extrabold transition-all ${
            activeTab === 'profile' ? 'text-red-600 bg-red-50' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profil</span>
        </button>
      </nav>

      {/* MODAL: PROMO REDEEM */}
      {selectedPromoForRedeem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-red-600" />
                Penukaran Promo
              </h3>
              <button
                onClick={() => {
                  setSelectedPromoForRedeem(null);
                  setRedeemResultMsg(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {redeemResultMsg ? (
              <div className="space-y-4 text-center py-2">
                <div className={`p-4 rounded-2xl border ${
                  redeemResultMsg.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <p className="text-xs font-bold leading-relaxed">{redeemResultMsg.text}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPromoForRedeem(null);
                    setRedeemResultMsg(null);
                  }}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <img
                  src={selectedPromoForRedeem.bannerUrl}
                  alt={selectedPromoForRedeem.title}
                  className="w-full h-32 object-cover rounded-2xl"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{selectedPromoForRedeem.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{selectedPromoForRedeem.description}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Biaya Poin/Stamp:</span>
                    <span className="font-mono text-red-600">
                      {selectedPromoForRedeem.costPoints > 0 && `${selectedPromoForRedeem.costPoints} Pts `}
                      {selectedPromoForRedeem.costStamps > 0 && `${selectedPromoForRedeem.costStamps} Stamp`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Saldo Anda Saat Ini:</span>
                    <span>{member.points} Pts / {member.stamps} Stamp</span>
                  </div>
                </div>

                {/* CASHIER WARNING */}
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 text-xs font-black flex items-center gap-2.5 shadow-sm animate-pulse">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Penting: Jangan tekan tukar sebelum di depan kasir!</span>
                </div>

                <button
                  onClick={handleConfirmRedeem}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Gift className="w-4 h-4" />
                  <span>Konfirmasi Penukaran</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DETAIL TIER & SYARAT TINGKATAN */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                Informasi Tingkatan Member
              </h3>
              <button onClick={() => setIsTierModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* BAGIAN 1: HAK & KEUNTUNGAN LEVEL TIER MEMBER */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-md block w-fit mb-2">
                  1. Hak & Keuntungan Member
                </span>
                <div className="space-y-2.5 text-xs">
                  {/* BRONZE */}
                  <div className="p-3 bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/80 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-amber-900 text-xs">BRONZE MEMBER</h4>
                      <span className="text-[9px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Level 1</span>
                    </div>
                    <p className="text-slate-700 text-[11px] font-medium leading-relaxed">{loyaltySettings.tierBenefits.bronze}</p>
                    <div className="pt-1 text-[10px] text-amber-800 font-extrabold flex items-center gap-1">
                      <span>🎯 Syarat:</span>
                      <span>{loyaltySettings.tierBenefits.bronzeMin}</span>
                    </div>
                  </div>

                  {/* GOLD */}
                  <div className="p-3 bg-gradient-to-r from-amber-100/70 to-yellow-100/70 border border-amber-300 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-amber-950 text-xs">GOLD MEMBER</h4>
                      <span className="text-[9px] font-extrabold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">Level 2</span>
                    </div>
                    <p className="text-slate-800 text-[11px] font-medium leading-relaxed">{loyaltySettings.tierBenefits.gold}</p>
                    <div className="pt-1 text-[10px] text-amber-900 font-extrabold flex items-center gap-1">
                      <span>🎯 Syarat:</span>
                      <span>{loyaltySettings.tierBenefits.goldMin}</span>
                    </div>
                  </div>

                  {/* DIAMOND */}
                  <div className="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-300 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-cyan-950 text-xs">DIAMOND VIP MEMBER</h4>
                      <span className="text-[9px] font-extrabold bg-cyan-400 text-cyan-950 px-2 py-0.5 rounded-full">Top Tier</span>
                    </div>
                    <p className="text-slate-800 text-[11px] font-medium leading-relaxed">{loyaltySettings.tierBenefits.diamond}</p>
                    <div className="pt-1 text-[10px] text-cyan-900 font-extrabold flex items-center gap-1">
                      <span>🎯 Syarat:</span>
                      <span>{loyaltySettings.tierBenefits.diamondMin}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: ATURAN POIN & STAMP */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md block w-fit mb-2">
                  2. Aturan Perolehan Poin & Stamp
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Perolehan Poin:</span>
                    <span className="font-mono font-black text-amber-600">
                      Rp {loyaltySettings.pointsEarnRate?.toLocaleString() || '10.000'} = 1 Poin
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Perolehan Stamp:</span>
                    <span className="font-mono font-black text-emerald-600">
                      Rp {loyaltySettings.stampsEarnRate?.toLocaleString() || '50.000'} = 1 Stamp
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-200/60 italic">
                    *Poin & Stamp yang telah terkumpul dapat ditukarkan dengan promo/diskon spesial di menu Katalog Promo.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsTierModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFIL */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-red-600" />
                Edit Profil Member
              </h3>
              <button type="button" onClick={() => setIsEditProfileModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
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
                <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto Profil Member</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={editAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                      alt="Preview Avatar"
                      className="w-14 h-14 rounded-full object-cover shadow-sm shrink-0"
                    />
                    <label className="cursor-pointer px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Foto HD</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const compressed = await compressImage(file, 500, 500, 0.82);
                            setEditAvatarUrl(compressed);
                          } catch (err) {
                            alert('Gagal mengompres gambar foto profil: ' + err);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveProfileLoading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              {saveProfileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: GANTI PIN MEMBER */}
      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleChangePinSubmit} className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                Ganti PIN Member
              </h3>
              <button type="button" onClick={() => setIsChangePinModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pinChangeMsg && (
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                pinChangeMsg.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {pinChangeMsg.text}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Saat Ini</label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Baru</label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Konfirmasi PIN Baru</label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              Simpan PIN Baru
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
