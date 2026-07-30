import React from 'react';
import ReactDOM from 'react-dom';
import { useQueue } from '../../context/QueueContext';
import { TicketReceiptView } from './TicketReceiptView';
import { Printer, X, Share2, Smartphone, Copy, Check, ExternalLink } from 'lucide-react';
import { getPaperDimensionSpec } from '../../utils/paperDimensions';
import { generateBluetoothPrintPayload, sendToBluetoothPrintApp } from '../../utils/bluetoothPrintHelper';

export const TicketPrintModal: React.FC = () => {
  const {
    activeTicketToPrint,
    isPrintModalOpen,
    setIsPrintModalOpen,
    printSettings,
    booths,
    tickets,
  } = useQueue();

  const [isPrinting, setIsPrinting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [btCopied, setBtCopied] = React.useState(false);
  const [showBtCode, setShowBtCode] = React.useState(false);

  if (!isPrintModalOpen || !activeTicketToPrint) return null;

  const spec = getPaperDimensionSpec(printSettings.paperWidth, printSettings.orientation || 'portrait');

  // Calculate estimated wait time for this ticket
  const booth = booths.find((b) => b.id === activeTicketToPrint.boothId);
  const waitingAhead = tickets.filter(
    (t) => t.boothId === activeTicketToPrint.boothId && t.status === 'waiting' && t.sequence < activeTicketToPrint.sequence
  ).length;
  const avgTime = booth?.avgTimePerSession || 5;
  const estimatedWaitMinutes = waitingAhead * avgTime;

  // Build target QR code URL to customer view
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const customerQrUrl = `${origin}?view=customer&ticket=${activeTicketToPrint.ticketNumber}`;

  // Format date/time for the Bluetooth payload (same source field as the on-screen receipt)
  const createdDate = new Date(activeTicketToPrint.createdAt);
  const isValidCreatedDate = !isNaN(createdDate.getTime());
  const btDateStr = isValidCreatedDate
    ? `${String(createdDate.getDate()).padStart(2, '0')}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${createdDate.getFullYear()}`
    : activeTicketToPrint.createdAt;
  const btTimeStr = isValidCreatedDate
    ? `${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`
    : '';

  // Generate Bluetooth Print payload string
  const bluetoothPayload = generateBluetoothPrintPayload({
    ticketNumber: activeTicketToPrint.ticketNumber,
    boothName: booth?.name || '',
    boothCode: booth?.code || '',
    dateStr: btDateStr,
    timeStr: btTimeStr,
    logoUrl: printSettings.logoUrl,
    showLogo: printSettings.showLogo,
    headerTitle: printSettings.headerTitle,
    footerMessage: printSettings.footerText,
    qrCodeUrl: customerQrUrl,
  });

  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.warn('Window print error:', err);
        } finally {
          setIsPrinting(false);
        }
      }, 100);
    });
  };

  const handleBluetoothPrint = () => {
    const success = sendToBluetoothPrintApp(bluetoothPayload);
    if (!success) {
      alert('Gagal membuka Bluetooth Print App. Pastikan aplikasi Bluetooth Print terinstall di perangkat Android Anda.');
    }
  };

  const handleCopyBtCode = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(bluetoothPayload);
      }
      setBtCopied(true);
      setTimeout(() => setBtCopied(false), 2500);
    } catch {
      setBtCopied(true);
      setTimeout(() => setBtCopied(false), 2500);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(customerQrUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      {/* Screen Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-red-500" />
              <h3 className="font-extrabold text-base">Tiket Antrian Berhasil Dicetak</h3>
            </div>
            <button
              id="btn-close-print-modal"
              onClick={() => setIsPrintModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Receipt Container Preview */}
          <div className="p-6 bg-slate-100 overflow-y-auto flex flex-col items-center gap-3">
            <TicketReceiptView
              ticket={activeTicketToPrint}
              settings={printSettings}
              estimatedWaitMinutes={estimatedWaitMinutes}
              id="preview-thermal-ticket"
              isPrintMode={false}
            />

            {/* BLUETOOTH PRINT APP INTEGRATION SECTION */}
            <div className="w-full max-w-xs p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-left space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-blue-950">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Bluetooth Print App (Android)</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded">App Direct</span>
              </div>

              <p className="text-[11px] text-blue-800 leading-tight">
                Kirim tiket langsung ke aplikasi <b>Bluetooth Print</b> untuk printer thermal Bluetooth/USB Android.
              </p>

              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  id="btn-trigger-bluetooth-app"
                  onClick={handleBluetoothPrint}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Cetak via App</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBtCode(!showBtCode)}
                  className="px-2.5 py-1.5 bg-white border border-blue-300 hover:bg-blue-100 text-blue-900 font-bold text-[11px] rounded-lg transition-all"
                >
                  {showBtCode ? 'Sembunyikan Tag' : 'Lihat Tag'}
                </button>
              </div>

              {showBtCode && (
                <div className="mt-2 p-2 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono space-y-1.5 overflow-x-auto">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <span className="text-slate-400 font-sans font-bold">Bluetooth Print Payload:</span>
                    <button
                      onClick={handleCopyBtCode}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans text-[10px]"
                    >
                      {btCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{btCopied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-all text-emerald-400 text-[10px]">
                    {bluetoothPayload}
                  </pre>
                  <div className="pt-1 text-[9px] font-sans text-slate-400">
                    Play Store App Package: <code className="text-blue-300">mate.bluetoothprint</code>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              id="btn-copy-ticket-link"
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              {copied ? 'Link Tersalin!' : 'Salin Link QR'}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="btn-close-ticket-modal"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Tutup
              </button>
              <button
                id="btn-trigger-browser-print"
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                {isPrinting ? 'Menyiapkan Cetak...' : 'Cetak Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable DOM Portal (Direct child of body) */}
      {typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="thermal-print-portal" className="hidden print:block">
            <TicketReceiptView
              ticket={activeTicketToPrint}
              settings={printSettings}
              estimatedWaitMinutes={estimatedWaitMinutes}
              id="printable-thermal-ticket"
              isPrintMode={true}
            />
            <style>{`
              @media print {
                @page {
                  size: ${spec.pageSizeCss};
                  margin: 0 !important;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  width: ${spec.widthMm}mm !important;
                  max-width: ${spec.widthMm}mm !important;
                  height: ${spec.effectiveHeightMm}mm !important;
                  max-height: ${spec.effectiveHeightMm}mm !important;
                  overflow: hidden !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  -webkit-font-smoothing: none !important;
                  -moz-osx-font-smoothing: unset !important;
                  font-smooth: never !important;
                  text-rendering: geometricPrecision !important;
                }
                body > *:not(#thermal-print-portal) {
                  display: none !important;
                }
                #thermal-print-portal {
                  display: block !important;
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: ${spec.widthMm}mm !important;
                  max-width: ${spec.widthMm}mm !important;
                  height: ${spec.effectiveHeightMm}mm !important;
                  max-height: ${spec.effectiveHeightMm}mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                }
                #printable-thermal-ticket {
                  width: ${spec.widthMm}mm !important;
                  max-width: ${spec.widthMm}mm !important;
                  height: ${spec.effectiveHeightMm}mm !important;
                  max-height: ${spec.effectiveHeightMm}mm !important;
                  margin: 0 !important;
                  padding: ${spec.printPaddingCss} !important;
                  box-sizing: border-box !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  overflow: hidden !important;
                  text-align: center !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  align-items: center !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                }
                #printable-thermal-ticket * {
                  color: #000000 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  text-shadow: none !important;
                  box-shadow: none !important;
                  font-weight: 800 !important;
                  -webkit-font-smoothing: none !important;
                  -moz-osx-font-smoothing: unset !important;
                  font-smooth: never !important;
                  text-rendering: geometricPrecision !important;
                  image-rendering: pixelated !important;
                  image-rendering: -webkit-optimize-contrast !important;
                  image-rendering: crisp-edges !important;
                }
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  );
};
