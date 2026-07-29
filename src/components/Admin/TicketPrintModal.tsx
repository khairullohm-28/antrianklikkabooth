import React from 'react';
import ReactDOM from 'react-dom';
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
    booths,
    tickets,
  } = useQueue();

  const [isPrinting, setIsPrinting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

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

            <div className="w-full max-w-xs p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-snug">
              <span className="font-extrabold text-amber-950 block mb-0.5">💡 Tips Cetak Printer Thermal/Stiker:</span>
              Pada dialog cetak browser, pastikan Ukuran Kertas dipilih <b>{spec.widthMm}mm x {spec.heightMm ? `${spec.heightMm}mm` : 'Auto/Roll'}</b> agar pas & tidak terpotong.
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
                  width: 100% !important;
                  height: auto !important;
                  min-height: 100% !important;
                  overflow: visible !important;
                  display: flex !important;
                  justify-content: center !important;
                  align-items: flex-start !important;
                }
                body > *:not(#thermal-print-portal) {
                  display: none !important;
                }
                #thermal-print-portal {
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  justify-content: flex-start !important;
                  position: relative !important;
                  width: 100% !important;
                  max-width: ${spec.widthMm ? `${spec.widthMm}mm` : '100%'} !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  overflow: visible !important;
                  box-sizing: border-box !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                #printable-thermal-ticket {
                  width: 100% !important;
                  max-width: 100% !important;
                  height: auto !important;
                  margin: 0 auto !important;
                  padding: ${spec.printPaddingCss} !important;
                  box-sizing: border-box !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  overflow: visible !important;
                  text-align: center !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  );
};
