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

  // Active Logged-in Member State
  const [currentMember, setCurrentMember] = useState<Member | null>(() => {
    try {
      const saved = sessionStorage.getItem('photobooth_logged_member');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Subscribe to Firestore collections
  useEffect(() => {
    const unsubMembers = subscribeMembers((list) => {
      setMembers(list);
      // Keep currentMember updated with Firestore realtime changes
      if (currentMember) {
        const updated = list.find((m) => m.id === currentMember.id);
        if (updated) {
          setCurrentMember(updated);
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
  }, [currentMember?.id]);

  const handleMemberLoginSuccess = (member: Member) => {
    setCurrentMember(member);
    sessionStorage.setItem('photobooth_logged_member', JSON.stringify(member));
  };

  const handleMemberLogout = () => {
    setCurrentMember(null);
    sessionStorage.removeItem('photobooth_logged_member');
  };

  const handleUpdateMemberLocal = (updated: Member) => {
    setCurrentMember(updated);
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
