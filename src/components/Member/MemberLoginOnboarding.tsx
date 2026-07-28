import React, { useState } from 'react';
import { Member } from '../../types';
import { updateMemberInFirestore } from '../../services/memberService';
import { UserCheck, KeyRound, Calendar, Lock, AlertCircle, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface MemberLoginOnboardingProps {
  members: Member[];
  onLoginSuccess: (member: Member) => void;
  onBackToMain?: () => void;
}

export const MemberLoginOnboarding: React.FC<MemberLoginOnboardingProps> = ({
  members,
  onLoginSuccess,
  onBackToMain,
}) => {
  const [step, setStep] = useState<'LOGIN' | 'ONBOARDING'>('LOGIN');

  // Step 1 State: Login Form
  const [phoneInput, setPhoneInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active Member undergoing Onboarding
  const [activeMember, setActiveMember] = useState<Member | null>(null);

  // Step 2 State: Onboarding Form
  const [dobInput, setDobInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [onboardingError, setOnboardingError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanPhone = phoneInput.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setLoginError('Masukkan nomor telepon yang terdaftar.');
      return;
    }

    if (!pinInput) {
      setLoginError('Masukkan PIN member.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const found = members.find(
        (m) => m.phone.trim().replace(/\s+/g, '') === cleanPhone
      );

      if (!found) {
        setLoginError('Nomor telepon tidak terdaftar. Hubungi Admin Kasir untuk pendaftaran.');
        setLoading(false);
        return;
      }

      if (found.pin !== pinInput.trim()) {
        setLoginError('PIN yang Anda masukkan salah. PIN default pertama kali: 12345');
        setLoading(false);
        return;
      }

      setLoading(false);

      if (found.isFirstLogin) {
        setActiveMember(found);
        setStep('ONBOARDING');
      } else {
        onLoginSuccess(found);
      }
    }, 400);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError('');

    if (!activeMember) return;

    if (!dobInput) {
      setOnboardingError('Harap isi Tanggal Lahir.');
      return;
    }

    if (newPinInput.length < 4) {
      setOnboardingError('PIN Baru minimal 4 karakter / angka.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setOnboardingError('Konfirmasi PIN Baru tidak cocok.');
      return;
    }

    if (newPinInput === '12345') {
      setOnboardingError('Ganti PIN Anda selain PIN default 12345.');
      return;
    }

    setLoading(true);

    try {
      const updatedData: Partial<Member> = {
        dob: dobInput,
        pin: newPinInput,
        isFirstLogin: false,
      };

      await updateMemberInFirestore(activeMember.id, updatedData);

      const finalMember: Member = {
        ...activeMember,
        ...updatedData,
        isFirstLogin: false,
      };

      setLoading(false);
      onLoginSuccess(finalMember);
    } catch (err: any) {
      setLoading(false);
      setOnboardingError('Gagal menyimpan data onboarding: ' + (err?.message || 'Error server'));
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* HEADER BRANDING BANNER */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
          <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg font-black text-2xl border border-red-500/40">
            PB
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Portal Member Loyalitas
          </h2>
          <p className="text-xs text-rose-200 mt-1 font-medium">
            Photobooth Studio Rewards & Member Privileges
          </p>
        </div>

        {/* STEP 1: LOGIN FORM */}
        {step === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Masuk Akun Member</h3>
              <p className="text-xs text-slate-500">
                Masukkan Nomor Telepon dan PIN Anda. PIN default: <strong className="text-red-600 font-bold">12345</strong>
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Nomor Telepon HP
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  PIN Member
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Default: 12345"
                    maxLength={10}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl text-sm font-mono font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span>Masuk Ke Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onBackToMain && (
              <button
                type="button"
                onClick={onBackToMain}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Kembali ke Antrian
              </button>
            )}
          </form>
        )}

        {/* STEP 2: ONBOARDING PERTAMA KALI */}
        {step === 'ONBOARDING' && activeMember && (
          <form onSubmit={handleOnboardingSubmit} className="p-6 space-y-5">
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-red-900 text-xs">Selamat Datang, {activeMember.name}!</h4>
                <p className="text-[11px] text-red-700 font-medium">
                  Ini adalah login pertama Anda. Mohon lengkapi Tanggal Lahir dan Buat PIN Baru demi keamanan.
                </p>
              </div>
            </div>

            {onboardingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{onboardingError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Tanggal Lahir (Untuk Kejutan Gift Ulang Tahun)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dobInput}
                    onChange={(e) => setDobInput(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Buat PIN Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Minimal 4 digit angka/PIN"
                    maxLength={10}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl text-sm font-mono font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Konfirmasi PIN Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Ulangi PIN Baru"
                    maxLength={10}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl text-sm font-mono font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Menyimpan Onboarding...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Masuk Ke Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
