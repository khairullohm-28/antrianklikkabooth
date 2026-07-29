import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from '../firebase';
import { Member, MemberTier, Promo, MemberHistory, LoyaltySettings } from '../types';

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  spendPerPoint: 10000,
  spendPerStamp: 50000,
  goldThresholdPoints: 100,
  diamondThresholdPoints: 500,
  tierBenefits: {
    bronze: 'Bonus Ulang Tahun, Diskon 5% Setiap Pembelian Paket Photobooth.',
    gold: 'Bonus Ulang Tahun, Diskon 10% Semua Paket, Prioritas Cetak & Gratis Softcopy Digital.',
    diamond: 'Bonus Ulang Tahun, Diskon 20% Semua Paket, Free Frame Eksklusif & Sesi VIP Tanpa Antri.',
    bronzeMin: 'Status Awal Pendaftaran (0 - 99 Poin)',
    goldMin: 'Akumulasi Poin Minimal 100 Poin',
    diamondMin: 'Akumulasi Poin Minimal 500 Poin',
  },
};

export const DEFAULT_PROMOS: Promo[] = [
  {
    id: 'promo-1',
    title: 'Diskon Rp 15.000 Paket Vintage',
    description: 'Tukarkan 30 poin untuk potongan langsung Rp 15.000 pada paket photo strip vintage.',
    bannerUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
    type: 'POINT_DISCOUNT',
    costPoints: 30,
    costStamps: 0,
    isActive: true,
  },
  {
    id: 'promo-2',
    title: 'Gratis 1 Strip Foto Tambahan',
    description: 'Tukarkan 3 stamp untuk mendapatkan 1 lembar foto strip fisik tambahan secara gratis!',
    bannerUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    type: 'STAMP_PRODUCT',
    costPoints: 0,
    costStamps: 3,
    isActive: true,
  },
  {
    id: 'promo-3',
    title: 'Promo Spesial Event Studio 50% OFF',
    description: 'Spesial event bulan ini! Diskon 50% untuk sesi foto photobooth bersama sahabat.',
    bannerUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    type: 'EVENT',
    costPoints: 50,
    costStamps: 0,
    isActive: true,
  },
];

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    name: 'Budi Santoso',
    phone: '081234567890',
    pin: '12345',
    points: 120,
    stamps: 5,
    tier: 'Gold',
    dob: '1998-08-17',
    address: 'Jl. Sudirman No. 45, Jakarta',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    isFirstLogin: false,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    status: 'Aktif',
  },
  {
    id: 'mem-2',
    name: 'Siti Rahma',
    phone: '085678901234',
    pin: '12345',
    points: 45,
    stamps: 2,
    tier: 'Bronze',
    dob: '2001-03-22',
    address: 'Jl. Mawar No. 12, Bandung',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    isFirstLogin: true,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    status: 'Aktif',
  },
];

const CACHE_KEY_LOYALTY = 'photobooth_cached_loyalty_settings';
const CACHE_KEY_MEMBERS = 'photobooth_cached_members';
const CACHE_KEY_PROMOS = 'photobooth_cached_promos';
const CACHE_KEY_HISTORY = 'photobooth_cached_member_history';

function getLocalCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalCache(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// Calculate Tier from points
export function calculateTier(points: number, settings: LoyaltySettings): MemberTier {
  if (points >= settings.diamondThresholdPoints) return 'Diamond';
  if (points >= settings.goldThresholdPoints) return 'Gold';
  return 'Bronze';
}

// Subscribe to Loyalty Settings
export function subscribeLoyaltySettings(callback: (settings: LoyaltySettings) => void) {
  const docRef = doc(db, 'loyalty_settings', 'config');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = { ...DEFAULT_LOYALTY_SETTINGS, ...snapshot.data() } as LoyaltySettings;
        setLocalCache(CACHE_KEY_LOYALTY, data);
        callback(data);
      } else {
        // Seed default loyalty settings
        setDoc(docRef, DEFAULT_LOYALTY_SETTINGS).catch(() => {});
        setLocalCache(CACHE_KEY_LOYALTY, DEFAULT_LOYALTY_SETTINGS);
        callback(DEFAULT_LOYALTY_SETTINGS);
      }
    },
    (err) => {
      const errMsg = String(err?.message || err);
      if (errMsg.includes('Quota limit exceeded') || errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted')) {
        console.info('[MemberService] Firestore Quota exceeded. Using local cached Loyalty Settings.');
      } else {
        console.warn('Notice on subscribing loyalty settings:', errMsg);
      }
      callback(getLocalCache(CACHE_KEY_LOYALTY, DEFAULT_LOYALTY_SETTINGS));
    }
  );
}

// Update Loyalty Settings
export async function updateLoyaltySettingsInFirestore(settings: LoyaltySettings) {
  setLocalCache(CACHE_KEY_LOYALTY, settings);
  try {
    const docRef = doc(db, 'loyalty_settings', 'config');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.info('[MemberService] Firestore update failed (Quota or offline). Saved locally:', err);
  }
}

// Subscribe to Members list
export function subscribeMembers(callback: (members: Member[]) => void) {
  const collRef = collection(db, 'members');
  return onSnapshot(
    collRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: Member[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Member);
        });
        setLocalCache(CACHE_KEY_MEMBERS, list);
        callback(list);
      } else {
        // Seed default members if collection is empty
        Promise.all(
          DEFAULT_MEMBERS.map((m) => setDoc(doc(db, 'members', m.id), m))
        ).catch(() => {});
        setLocalCache(CACHE_KEY_MEMBERS, DEFAULT_MEMBERS);
        callback(DEFAULT_MEMBERS);
      }
    },
    (err) => {
      const errMsg = String(err?.message || err);
      if (errMsg.includes('Quota limit exceeded') || errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted')) {
        console.info('[MemberService] Firestore Quota exceeded. Using local cached Members.');
      } else {
        console.warn('Notice on subscribing members:', errMsg);
      }
      callback(getLocalCache(CACHE_KEY_MEMBERS, DEFAULT_MEMBERS));
    }
  );
}

// Create Quick Member
export async function createMember(name: string, phone: string, initialPin = '12345'): Promise<Member> {
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const memberId = `mem_${Date.now()}`;
  const newMember: Member = {
    id: memberId,
    name: name.trim(),
    phone: cleanPhone,
    pin: initialPin,
    points: 0,
    stamps: 0,
    tier: 'Bronze',
    dob: '',
    address: '',
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    isFirstLogin: true,
    createdAt: new Date().toISOString(),
    status: 'Aktif',
  };

  // Update local cache
  const currentList = getLocalCache<Member[]>(CACHE_KEY_MEMBERS, DEFAULT_MEMBERS);
  setLocalCache(CACHE_KEY_MEMBERS, [newMember, ...currentList]);

  try {
    const docRef = doc(db, 'members', memberId);
    await setDoc(docRef, newMember);
  } catch (err) {
    console.info('[MemberService] Firestore createMember failed (Quota or offline). Saved locally:', err);
  }
  return newMember;
}

// Update Member fields
export async function updateMemberInFirestore(memberId: string, updates: Partial<Member>) {
  // Update local cache
  const currentList = getLocalCache<Member[]>(CACHE_KEY_MEMBERS, DEFAULT_MEMBERS);
  const updatedList = currentList.map((m) => (m.id === memberId ? { ...m, ...updates } : m));
  setLocalCache(CACHE_KEY_MEMBERS, updatedList);

  try {
    const docRef = doc(db, 'members', memberId);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.info('[MemberService] Firestore updateMember failed (Quota or offline). Saved locally:', err);
  }
}

// Process Purchase Transaction for Member (Adds Points & Stamps, recalculates Tier)
export async function processMemberPurchase(
  member: Member,
  amount: number,
  details: string,
  settings: LoyaltySettings
): Promise<{ addedPoints: number; addedStamps: number; newTier: MemberTier }> {
  const addedPoints = Math.floor(amount / (settings.spendPerPoint || 10000));
  const addedStamps = Math.floor(amount / (settings.spendPerStamp || 50000));

  const newPoints = (member.points || 0) + addedPoints;
  const newStamps = (member.stamps || 0) + addedStamps;
  const newTier = calculateTier(newPoints, settings);

  // Local cache update
  const currentList = getLocalCache<Member[]>(CACHE_KEY_MEMBERS, DEFAULT_MEMBERS);
  const updatedList = currentList.map((m) =>
    m.id === member.id ? { ...m, points: newPoints, stamps: newStamps, tier: newTier } : m
  );
  setLocalCache(CACHE_KEY_MEMBERS, updatedList);

  const historyId = `hist_${Date.now()}`;
  const historyItem: MemberHistory = {
    id: historyId,
    memberId: member.id,
    memberName: member.name,
    date: new Date().toISOString(),
    transactionId: `TRX-${Date.now().toString().slice(-6)}`,
    type: 'PURCHASE',
    details: details || `Pembelian paket Photobooth Rp ${amount.toLocaleString('id-ID')}`,
    pointsChange: addedPoints,
    stampsChange: addedStamps,
    amount: amount,
  };

  const currentHist = getLocalCache<MemberHistory[]>(CACHE_KEY_HISTORY, []);
  setLocalCache(CACHE_KEY_HISTORY, [historyItem, ...currentHist]);

  try {
    const docRef = doc(db, 'members', member.id);
    await updateDoc(docRef, {
      points: newPoints,
      stamps: newStamps,
      tier: newTier,
    });

    const historyRef = doc(db, 'member_history', historyId);
    await setDoc(historyRef, historyItem);
  } catch (err) {
    console.info('[MemberService] Firestore purchase update failed (Quota or offline). Saved locally:', err);
  }

  return { addedPoints, addedStamps, newTier };
}

// Subscribe to Promos list
export function subscribePromos(callback: (promos: Promo[]) => void) {
  const collRef = collection(db, 'promos');
  return onSnapshot(
    collRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: Promo[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Promo);
        });
        setLocalCache(CACHE_KEY_PROMOS, list);
        callback(list);
      } else {
        // Seed default promos
        Promise.all(
          DEFAULT_PROMOS.map((p) => setDoc(doc(db, 'promos', p.id), p))
        ).catch(() => {});
        setLocalCache(CACHE_KEY_PROMOS, DEFAULT_PROMOS);
        callback(DEFAULT_PROMOS);
      }
    },
    (err) => {
      const errMsg = String(err?.message || err);
      if (errMsg.includes('Quota limit exceeded') || errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted')) {
        console.info('[MemberService] Firestore Quota exceeded. Using local cached Promos.');
      } else {
        console.warn('Notice on subscribing promos:', errMsg);
      }
      callback(getLocalCache(CACHE_KEY_PROMOS, DEFAULT_PROMOS));
    }
  );
}

// Save Promo
export async function savePromoInFirestore(promo: Partial<Promo> & { id?: string }): Promise<string> {
  const promoId = promo.id || `promo_${Date.now()}`;
  const promoData: Promo = {
    id: promoId,
    title: promo.title || 'Promo Baru',
    description: promo.description || '',
    bannerUrl: promo.bannerUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
    type: promo.type || 'POINT_DISCOUNT',
    costPoints: promo.costPoints || 0,
    costStamps: promo.costStamps || 0,
    isActive: promo.isActive !== undefined ? promo.isActive : true,
  };

  const currentPromos = getLocalCache<Promo[]>(CACHE_KEY_PROMOS, DEFAULT_PROMOS);
  const exists = currentPromos.some((p) => p.id === promoId);
  const updatedPromos = exists
    ? currentPromos.map((p) => (p.id === promoId ? promoData : p))
    : [promoData, ...currentPromos];
  setLocalCache(CACHE_KEY_PROMOS, updatedPromos);

  try {
    await setDoc(doc(db, 'promos', promoId), promoData, { merge: true });
  } catch (err) {
    console.info('[MemberService] Firestore savePromo failed (Quota or offline). Saved locally:', err);
  }
  return promoId;
}

// Delete Promo
export async function deletePromoInFirestore(promoId: string) {
  const currentPromos = getLocalCache<Promo[]>(CACHE_KEY_PROMOS, DEFAULT_PROMOS);
  setLocalCache(CACHE_KEY_PROMOS, currentPromos.filter((p) => p.id !== promoId));

  try {
    await deleteDoc(doc(db, 'promos', promoId));
  } catch (err) {
    console.info('[MemberService] Firestore deletePromo failed (Quota or offline). Saved locally:', err);
  }
}

// Redeem Promo
export async function redeemPromoForMember(
  member: Member,
  promo: Promo
): Promise<{ success: boolean; message: string }> {
  if (member.points < promo.costPoints) {
    return { success: false, message: `Poin tidak cukup. Butuh ${promo.costPoints} Poin.` };
  }
  if (member.stamps < promo.costStamps) {
    return { success: false, message: `Stamp tidak cukup. Butuh ${promo.costStamps} Stamp.` };
  }

  const newPoints = member.points - promo.costPoints;
  const newStamps = member.stamps - promo.costStamps;

  // Local cache
  const currentList = getLocalCache<Member[]>(CACHE_KEY_MEMBERS, DEFAULT_MEMBERS);
  const updatedList = currentList.map((m) =>
    m.id === member.id ? { ...m, points: newPoints, stamps: newStamps } : m
  );
  setLocalCache(CACHE_KEY_MEMBERS, updatedList);

  const historyId = `hist_${Date.now()}`;
  const historyItem: MemberHistory = {
    id: historyId,
    memberId: member.id,
    memberName: member.name,
    date: new Date().toISOString(),
    transactionId: `RDM-${Date.now().toString().slice(-6)}`,
    type: promo.costStamps > 0 ? 'REDEEM_STAMP' : 'REDEEM_POINT',
    details: `Penukaran Promo: ${promo.title}`,
    pointsChange: -promo.costPoints,
    stampsChange: -promo.costStamps,
  };

  const currentHist = getLocalCache<MemberHistory[]>(CACHE_KEY_HISTORY, []);
  setLocalCache(CACHE_KEY_HISTORY, [historyItem, ...currentHist]);

  try {
    await updateDoc(doc(db, 'members', member.id), {
      points: newPoints,
      stamps: newStamps,
    });
    await setDoc(doc(db, 'member_history', historyId), historyItem);
  } catch (err) {
    console.info('[MemberService] Firestore redeemPromo failed (Quota or offline). Saved locally:', err);
  }

  return {
    success: true,
    message: `Berhasil menukarkan "${promo.title}"! Tunjukkan kode voucher ini ke Kasir: ${historyItem.transactionId}`,
  };
}

// Subscribe to Member History (single member or all members)
export function subscribeMemberHistory(
  memberId: string | null,
  callback: (histories: MemberHistory[]) => void
) {
  const collRef = collection(db, 'member_history');
  return onSnapshot(
    collRef,
    (snapshot) => {
      let list: MemberHistory[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as MemberHistory);
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLocalCache(CACHE_KEY_HISTORY, list);
      if (memberId) {
        list = list.filter((h) => h.memberId === memberId);
      }
      callback(list);
    },
    (err) => {
      const errMsg = String(err?.message || err);
      if (errMsg.includes('Quota limit exceeded') || errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted')) {
        console.info('[MemberService] Firestore Quota exceeded. Using local cached Member History.');
      } else {
        console.warn('Notice on subscribing member history:', errMsg);
      }
      let list = getLocalCache<MemberHistory[]>(CACHE_KEY_HISTORY, []);
      if (memberId) {
        list = list.filter((h) => h.memberId === memberId);
      }
      callback(list);
    }
  );
}

// Reset PIN with name, phone, dob matching
export async function resetMemberPinWithVerification(
  name: string,
  phone: string,
  dob: string,
  newPin: string,
  allMembers: Member[]
): Promise<{ success: boolean; message: string }> {
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const cleanName = name.trim().toLowerCase();

  const found = allMembers.find(
    (m) =>
      (m.phone || '').toString().trim().replace(/\s+/g, '') === cleanPhone &&
      (m.name || '').toString().trim().toLowerCase() === cleanName &&
      (m.dob || '').trim() === dob.trim()
  );

  if (!found) {
    return {
      success: false,
      message: 'Data member tidak cocok (Nama, No. Telepon, dan Tanggal Lahir harus sesuai).',
    };
  }

  // Local cache update
  const currentList = getLocalCache<Member[]>(CACHE_KEY_MEMBERS, DEFAULT_MEMBERS);
  const updatedList = currentList.map((m) => (m.id === found.id ? { ...m, pin: newPin } : m));
  setLocalCache(CACHE_KEY_MEMBERS, updatedList);

  try {
    await updateDoc(doc(db, 'members', found.id), {
      pin: newPin,
    });
  } catch (err) {
    console.info('[MemberService] Firestore resetPin failed (Quota or offline). Saved locally:', err);
  }

  return {
    success: true,
    message: `PIN member ${found.name} berhasil diperbarui!`,
  };
}
