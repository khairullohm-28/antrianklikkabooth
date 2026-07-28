import React, { useState, useEffect } from 'react';
import { Member, Promo, LoyaltySettings } from '../../types';
import {
  subscribeMembers,
  subscribePromos,
  subscribeLoyaltySettings,
  DEFAULT_LOYALTY_SETTINGS
} from '../../services/memberService';
import { MemberLoginOnboarding } from './MemberLoginOnboarding';
import { MemberDashboard } from './MemberDashboard';

export const MemberContainer: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);

  // Active Logged-in Member State (Persisted across sessions via localStorage & sessionStorage)
  const [currentMember, setCurrentMember] = useState<Member | null>(() => {
    try {
      const saved = localStorage.getItem('photobooth_logged_member') || sessionStorage.getItem('photobooth_logged_member');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Subscribe to Firestore collections & update member in real-time
  useEffect(() => {
    const unsubMembers = subscribeMembers((list) => {
      setMembers(list);

      // Restore/Sync active member session with latest Firestore data
      const savedRaw = localStorage.getItem('photobooth_logged_member') || sessionStorage.getItem('photobooth_logged_member');
      let targetMemberId = currentMember?.id;
      if (!targetMemberId && savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          targetMemberId = parsed?.id;
        } catch {}
      }

      if (targetMemberId) {
        const updated = list.find((m) => m.id === targetMemberId);
        if (updated) {
          setCurrentMember(updated);
          localStorage.setItem('photobooth_logged_member', JSON.stringify(updated));
          sessionStorage.setItem('photobooth_logged_member', JSON.stringify(updated));
        }
      }
    });

    const unsubPromos = subscribePromos((list) => setPromos(list));
    const unsubSettings = subscribeLoyaltySettings((s) => setLoyaltySettings(s));

    return () => {
      unsubMembers();
      unsubPromos();
      unsubSettings();
    };
  }, []); // Run once on mount

  const handleMemberLoginSuccess = (member: Member) => {
    setCurrentMember(member);
    localStorage.setItem('photobooth_logged_member', JSON.stringify(member));
    sessionStorage.setItem('photobooth_logged_member', JSON.stringify(member));
  };

  const handleMemberLogout = () => {
    setCurrentMember(null);
    localStorage.removeItem('photobooth_logged_member');
    sessionStorage.removeItem('photobooth_logged_member');
  };

  const handleUpdateMemberLocal = (updated: Member) => {
    setCurrentMember(updated);
    localStorage.setItem('photobooth_logged_member', JSON.stringify(updated));
    sessionStorage.setItem('photobooth_logged_member', JSON.stringify(updated));
  };

  if (!currentMember) {
    return (
      <MemberLoginOnboarding
        members={members}
        onLoginSuccess={handleMemberLoginSuccess}
      />
    );
  }

  return (
    <MemberDashboard
      member={currentMember}
      promos={promos}
      loyaltySettings={loyaltySettings}
      onLogout={handleMemberLogout}
      onUpdateMemberLocal={handleUpdateMemberLocal}
    />
  );
};
