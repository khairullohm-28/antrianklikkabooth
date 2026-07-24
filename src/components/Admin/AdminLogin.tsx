import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, Camera } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { loginAdmin } = useQueue();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Harap masukkan PIN Admin!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const success = loginAdmin(pin.trim());
      if (!success) {
        setErrorMsg('PIN Admin salah. Coba lagi atau gunakan PIN default: 1234');
        setIsSubmitting(false);
      }
    }, 200);
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + num);
      setErrorMsg('');
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-rose-100 overflow-hidden relative">
        {/* Top Decorative Banner - Dark Red & Blue High-Tech Theme */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 p-8 text-center text-white relative">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 backdrop-blur-md border border-red-500/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 text-red-300 text-[11px] font-bold border border-red-700/60 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            Keamanan Control Center
          </span>
          <h2 className="text-2xl font-black tracking-tight text-white">Login Operator Admin</h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Masukkan PIN Operator untuk mengelola antrian photobooth & cetak label.
          </p>
        </div>

        {/* Login Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              PIN Admin / Operator
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan 4-digit PIN"
                maxLength={8}
                autoFocus
                className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-lg font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all tracking-widest text-center"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Touch-Friendly On-Screen Keypad for Quick Mobile / Kiosk Entry */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="py-3 bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-2xl text-base font-extrabold text-slate-700 hover:text-rose-600 transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 transition-all"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3 bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-2xl text-base font-extrabold text-slate-700 hover:text-rose-600 transition-all active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 transition-all"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Masuk Dashboard Admin</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {/* Friendly PIN Hint */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-800 text-[11px] font-medium text-center flex items-center justify-center gap-1.5">
            <span>💡</span>
            <span>
              PIN Default Operator saat ini: <strong className="font-bold text-amber-900">1234</strong>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
