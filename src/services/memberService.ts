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
        callback({ ...DEFAULT_LOYALTY_SETTINGS, ...snapshot.data() } as LoyaltySettings);
      } else {
        // Seed default loyalty settings
        setDoc(docRef, DEFAULT_LOYALTY_SETTINGS).catch(console.error);
        callback(DEFAULT_LOYALTY_SETTINGS);
      }
    },
    (err) => {
      console.warn('Error subscribing to loyalty settings:', err);
      callback(DEFAULT_LOYALTY_SETTINGS);
    }
  );
}

// Update Loyalty Settings
export async function updateLoyaltySettingsInFirestore(settings: LoyaltySettings) {
  const docRef = doc(db, 'loyalty_settings', 'config');
  await setDoc(docRef, settings, { merge: true });
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
        callback(list);
      } else {
        // Seed default members if collection is empty
        Promise.all(
          DEFAULT_MEMBERS.map((m) => setDoc(doc(db, 'members', m.id), m))
        ).catch(console.error);
        callback(DEFAULT_MEMBERS);
      }
    },
    (err) => {
      console.warn('Error subscribing members:', err);
      callback(DEFAULT_MEMBERS);
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

  const docRef = doc(db, 'members', memberId);
  await setDoc(docRef, newMember);
  return newMember;
}

// Update Member fields
export async function updateMemberInFirestore(memberId: string, updates: Partial<Member>) {
  const docRef = doc(db, 'members', memberId);
  await updateDoc(docRef, updates);
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

  // Update member balance and tier
  const docRef = doc(db, 'members', member.id);
  await updateDoc(docRef, {
    points: newPoints,
    stamps: newStamps,
    tier: newTier,
  });

  // Log to member_history
  const historyId = `hist_${Date.now()}`;
  const historyRef = doc(db, 'member_history', historyId);
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
  await setDoc(historyRef, historyItem);

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
        callback(list);
      } else {
        // Seed default promos
        Promise.all(
          DEFAULT_PROMOS.map((p) => setDoc(doc(db, 'promos', p.id), p))
        ).catch(console.error);
        callback(DEFAULT_PROMOS);
      }
    },
    (err) => {
      console.warn('Error subscribing promos:', err);
      callback(DEFAULT_PROMOS);
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
  await setDoc(doc(db, 'promos', promoId), promoData, { merge: true });
  return promoId;
}

// Delete Promo
export async function deletePromoInFirestore(promoId: string) {
  await deleteDoc(doc(db, 'promos', promoId));
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

  // Deduct balance
  await updateDoc(doc(db, 'members', member.id), {
    points: newPoints,
    stamps: newStamps,
  });

  // Log history
  const historyId = `hist_${Date.now()}`;
  const historyRef = doc(db, 'member_history', historyId);
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
  await setDoc(historyRef, historyItem);

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
      // Sort by date descending
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (memberId) {
        list = list.filter((h) => h.memberId === memberId);
      }
      callback(list);
    },
    (err) => {
      console.warn('Error subscribing member history:', err);
      callback([]);
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

  await updateDoc(doc(db, 'members', found.id), {
    pin: newPin,
  });

  return {
    success: true,
    message: `PIN member ${found.name} berhasil diperbarui!`,
  };
}
