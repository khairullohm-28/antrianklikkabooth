import React, { useState, useEffect } from 'react';
import { MemberHistory } from '../../../types';
import { subscribeMemberHistory } from '../../../services/memberService';
import { History, ShoppingBag, Search, Tag, Filter, Clock } from 'lucide-react';

export const TransaksiMasterView: React.FC = () => {
  const [histories, setHistories] = useState<MemberHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    const unsub = subscribeMemberHistory(null, (list) => {
      setHistories(list);
    });
    return () => unsub();
  }, []);

  const filtered = histories.filter((h) => {
    const matchesSearch =
      (h.memberName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || h.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-red-500" />
            Master Data Transaksi Member
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Riwayat seluruh transaksi pembelanjaan, penambahan poin/stamp, dan penukaran promo.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-xs font-bold text-slate-300">
          <span>Total Transaksi: <strong className="text-white font-black font-mono text-sm">{histories.length}</strong></span>
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
            placeholder="Cari Member / Detail Transaksi / Ref ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-2xl text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="ALL">Semua Tipe Transaksi</option>
            <option value="PURCHASE">Pembelian (Purchase)</option>
            <option value="REDEEM_POINT">Penukaran Poin</option>
            <option value="REDEEM_STAMP">Penukaran Stamp</option>
          </select>
        </div>
      </div>

      {/* TRANSACTION TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Tanggal & Ref ID</th>
                <th className="p-4">Member</th>
                <th className="p-4">Tipe & Detail Transaksi</th>
                <th className="p-4 text-right">Nominal Pembelanjaan</th>
                <th className="p-4 text-center">Perubahan Poin</th>
                <th className="p-4 text-center">Perubahan Stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-mono font-bold text-slate-900 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(item.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">{item.transactionId || item.id}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{item.memberName || 'Member ID: ' + item.memberId}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider inline-block mb-1 ${
                        item.type === 'PURCHASE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.type}
                      </span>
                      <p className="text-slate-700 font-semibold">{item.details}</p>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {item.amount ? `Rp ${item.amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-4 text-center font-mono font-black">
                      <span className={item.pointsChange > 0 ? 'text-emerald-600' : item.pointsChange < 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {item.pointsChange > 0 ? `+${item.pointsChange}` : item.pointsChange} Pts
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-black">
                      <span className={item.stampsChange > 0 ? 'text-emerald-600' : item.stampsChange < 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {item.stampsChange > 0 ? `+${item.stampsChange}` : item.stampsChange} Stamp
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Belum ada riwayat transaksi recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
