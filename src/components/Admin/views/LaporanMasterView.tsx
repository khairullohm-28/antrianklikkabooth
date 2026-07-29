import React, { useState, useEffect } from 'react';
import { Member, MemberHistory, Promo } from '../../../types';
import { subscribeMemberHistory, subscribePromos } from '../../../services/memberService';
import { FileText, Users, Award, TrendingUp, Sparkles, Crown, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface LaporanMasterViewProps {
  members: Member[];
}

export const LaporanMasterView: React.FC<LaporanMasterViewProps> = ({ members }) => {
  const [histories, setHistories] = useState<MemberHistory[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    const unsubHist = subscribeMemberHistory(null, (list) => setHistories(list));
    const unsubPromos = subscribePromos((list) => setPromos(list));
    return () => {
      unsubHist();
      unsubPromos();
    };
  }, []);

  // Summary Metrics
  const activeMembersCount = members.filter((m) => (m.status || 'Aktif') === 'Aktif').length;

  const totalPointsIssued = histories
    .filter((h) => h.pointsChange > 0)
    .reduce((acc, curr) => acc + curr.pointsChange, 0);

  const totalPointsRedeemed = Math.abs(
    histories
      .filter((h) => h.pointsChange < 0)
      .reduce((acc, curr) => acc + curr.pointsChange, 0)
  );

  const totalStampsIssued = histories
    .filter((h) => h.stampsChange > 0)
    .reduce((acc, curr) => acc + curr.stampsChange, 0);

  const totalStampsRedeemed = Math.abs(
    histories
      .filter((h) => h.stampsChange < 0)
      .reduce((acc, curr) => acc + curr.stampsChange, 0)
  );

  // Top Members by Points
  const topMembers = [...members]
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  // Popular Promo Redemptions Count
  const promoRedemptionCounts: { [title: string]: number } = {};
  histories
    .filter((h) => h.type === 'REDEEM_POINT' || h.type === 'REDEEM_STAMP')
    .forEach((h) => {
      const cleanTitle = h.details.replace('Penukaran Promo: ', '').trim();
      promoRedemptionCounts[cleanTitle] = (promoRedemptionCounts[cleanTitle] || 0) + 1;
    });

  const popularPromos = Object.entries(promoRedemptionCounts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-500" />
            LAPORAN MEMBER
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ringkasan member aktif, peringkat member terbaik (Top Member), serta sirkulasi poin dan stamp.
          </p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Member Aktif</p>
            <h4 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{activeMembersCount} <span className="text-xs font-sans text-slate-500">Member</span></h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Poin Masuk</p>
            <h4 className="text-2xl font-black text-amber-600 font-mono mt-0.5">+{totalPointsIssued} <span className="text-xs font-sans text-slate-500">Pts</span></h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Poin Ditukarkan</p>
            <h4 className="text-2xl font-black text-rose-600 font-mono mt-0.5">-{totalPointsRedeemed} <span className="text-xs font-sans text-slate-500">Pts</span></h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Stamp Masuk</p>
            <h4 className="text-2xl font-black text-emerald-600 font-mono mt-0.5">+{totalStampsIssued} <span className="text-xs font-sans text-slate-500">Stamps</span></h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP MEMBERS LEADERBOARD */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Peringkat Member Teratas (Top Member)
            </h3>
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Top 5</span>
          </div>

          <div className="space-y-3">
            {topMembers.map((m, idx) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-stone-300 text-slate-800'
                  }`}>
                    #{idx + 1}
                  </div>
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">{m.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{m.phone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-black uppercase tracking-wider">
                    {m.tier}
                  </span>
                  <p className="text-xs font-mono font-black text-slate-900 mt-0.5">{m.points} Pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROMO PENUKARAN TERLAKU / FAVORIT */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Gift className="w-4 h-4 text-red-500" />
              Promo & Rewards Terfavorit Ditukarkan
            </h3>
          </div>

          <div className="space-y-3">
            {popularPromos.length > 0 ? (
              popularPromos.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">{p.title}</h4>
                    <p className="text-[10px] text-slate-500">Penukaran Berhasil</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 font-mono font-black text-xs rounded-full">
                    {p.count}x Klaim
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Belum ada data penukaran promo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
