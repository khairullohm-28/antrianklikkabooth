import React, { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/defaultData';
import { useQueue } from '../context/QueueContext';
import { Code2, Copy, Check, FileSpreadsheet, ExternalLink, Github, Rocket, CheckCircle2 } from 'lucide-react';

export const GoogleScriptGuide: React.FC = () => {
  const { appsScriptConfig, updateAppsScriptConfig, triggerSyncToGoogleSheets } = useQueue();
  const [copied, setCopied] = useState(false);
  const [webUrlInput, setWebUrlInput] = useState(appsScriptConfig.webAppUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = () => {
    updateAppsScriptConfig({
      enabled: true,
      webAppUrl: webUrlInput.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 mb-3">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Panduan Integrasi Database & Deployment
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Integrasi Google Sheets & Deploy Vercel
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Sistem ini dapat menggunakan Google Sheets sebagai database online gratis melalui Google Apps Script, serta dapat langsung dideploy ke GitHub dan Vercel.
        </p>
      </div>

      {/* STEP 1: GOOGLE APPS SCRIPT SETUP */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
            1
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Cara Pasang Google Apps Script di Google Sheets</h3>
            <p className="text-xs text-slate-500">
              Gratis tanpa server, data antrian tersimpan rapi di Google Spreadsheet kamu.
            </p>
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3 items-start">
            <span className="font-bold text-purple-600">Langkah 1:</span>
            <span>
              Buka Google Sheets di <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-purple-600 font-bold underline">sheets.new</a> dan buat Spreadsheet baru dengan judul "Photobooth Queue Database".
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3 items-start">
            <span className="font-bold text-purple-600">Langkah 2:</span>
            <span>
              Di menu atas Google Sheets, klik <strong className="font-semibold text-slate-900">Extensions &gt; Apps Script</strong>.
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3 items-start">
            <span className="font-bold text-purple-600">Langkah 3:</span>
            <span>
              Hapus semua kode bawaan di file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">Code.gs</code>, lalu salin dan tempel kode di bawah ini:
            </span>
          </div>
        </div>

        {/* Script Code Block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-2xl text-slate-300 text-xs font-mono">
            <span>Code.gs (Google Apps Script)</span>
            <button
              id="btn-copy-apps-script"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-emerald-400 text-xs font-mono rounded-b-2xl overflow-x-auto max-h-60 leading-relaxed">
            {GOOGLE_APPS_SCRIPT_CODE}
          </pre>
        </div>

        {/* Step 4: Deploy instructions */}
        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-2 text-xs text-purple-900">
          <h4 className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            Langkah 4: Deploy Sebagai Web App
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-purple-800">
            <li>Klik tombol biru <strong className="font-bold text-purple-900">Deploy &gt; New Deployment</strong> di kanan atas Apps Script.</li>
            <li>Klik ikon gerigi ⚙️ di samping "Select type", pilih <strong className="font-bold text-purple-900">Web App</strong>.</li>
            <li>Atur <strong className="font-bold text-purple-900">Execute as</strong>: <code className="bg-purple-200/60 px-1 rounded">Me</code>.</li>
            <li>Atur <strong className="font-bold text-purple-900">Who has access</strong>: <code className="bg-purple-200/60 px-1 rounded">Anyone</code> (PENTING!).</li>
            <li>Klik <strong className="font-bold text-purple-900">Deploy</strong>, izinkan akses akun Google kamu, lalu salin <strong>Web App URL</strong> yang diberikan!</li>
          </ol>
        </div>

        {/* Input Field for URL */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <label className="font-bold text-slate-800 text-xs block">
            Tempelkan Google Apps Script Web App URL Kamu Di Sini:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={webUrlInput}
              onChange={(e) => setWebUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500"
            />
            <button
              id="btn-save-script-url-guide"
              onClick={handleSaveUrl}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan & Aktifkan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 2: GITHUB & VERCEL DEPLOYMENT GUIDE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
            2
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Cara Deploy Frontend ke GitHub & Vercel</h3>
            <p className="text-xs text-slate-500">
              Langkah cepat mempublikasikan web antrian ini secara online menggunakan Vercel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* GitHub Step */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Github className="w-4 h-4 text-slate-800" />
              1. Export / Push ke GitHub
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Di AI Studio UI, gunakan menu <strong className="font-semibold text-slate-900">Settings &gt; Export to GitHub</strong> atau jalankan command git berikut:
            </p>
            <pre className="p-3 bg-slate-900 text-purple-300 rounded-xl font-mono text-[11px] overflow-x-auto">
{`git init
git add .
git commit -m "Photobooth Queue System"
git branch -M main
git remote add origin <URL_REPO_GITHUB>
git push -u origin main`}
            </pre>
          </div>

          {/* Vercel Step */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-purple-600" />
              2. Deploy di Vercel App
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Buka dashboard <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-purple-600 font-bold underline">Vercel.com</a>:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>Klik <strong className="font-semibold text-slate-900">Add New &gt; Project</strong>.</li>
              <li>Pilih repository GitHub yang baru di-push.</li>
              <li>Framework Preset: <code className="bg-slate-200 px-1 py-0.5 rounded font-bold">Vite</code>.</li>
              <li>Klik <strong className="font-semibold text-purple-700">Deploy</strong>. Web kamu langsung aktif dengan HTTPS gratis!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
