import React from 'react';
import { useQueue } from '../../context/QueueContext';
import { TicketReceiptView } from './TicketReceiptView';
import { Printer, X, Share2 } from 'lucide-react';
import { getPaperDimensionSpec } from '../../utils/paperDimensions';

export const TicketPrintModal: React.FC = () => {
  const {
    activeTicketToPrint,
    isPrintModalOpen,
    setIsPrintModalOpen,
    printSettings,
    appsScriptConfig,
    booths,
    tickets,
  } = useQueue();

  const [isPrinting, setIsPrinting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!isPrintModalOpen || !activeTicketToPrint) return null;

  const spec = getPaperDimensionSpec(printSettings.paperWidth);

  // Calculate estimated wait time for this ticket
  const booth = booths.find((b) => b.id === activeTicketToPrint.boothId);
  const waitingAhead = tickets.filter(
    (t) => t.boothId === activeTicketToPrint.boothId && t.status === 'waiting' && t.sequence < activeTicketToPrint.sequence
  ).length;
  const avgTime = booth?.avgTimePerSession || 5;
  const estimatedWaitMinutes = waitingAhead * avgTime;

  // Build target QR code URL to customer view
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  let customerQrUrl = `${origin}?view=customer&ticket=${activeTicketToPrint.ticketNumber}`;
  if (appsScriptConfig.enabled && appsScriptConfig.webAppUrl) {
    customerQrUrl += `&gas=${encodeURIComponent(appsScriptConfig.webAppUrl)}`;
  }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
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
        <div className="p-6 bg-slate-100 overflow-y-auto flex justify-center items-center">
          <TicketReceiptView
            ticket={activeTicketToPrint}
            settings={printSettings}
            estimatedWaitMinutes={estimatedWaitMinutes}
            id="printable-thermal-ticket"
            isPrintMode={true}
          />
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

      {/* Dynamic Thermal Label Print CSS Injection */}
      <style>{`
        @media print {
          @page {
            size: ${spec.pageSizeCss};
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: ${spec.widthMm}mm !important;
            ${spec.heightMm ? `height: ${spec.heightMm}mm !important;` : ''}
          }
          body * {
            visibility: hidden;
          }
          #printable-thermal-ticket, #printable-thermal-ticket * {
            visibility: visible;
          }
          #printable-thermal-ticket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${spec.widthMm}mm !important;
            ${spec.heightMm ? `height: ${spec.heightMm}mm !important; max-height: ${spec.heightMm}mm !important;` : 'height: auto !important;'}
            padding: ${spec.printPaddingCss} !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
