import React, { useState, useEffect } from 'react';
import { Ticket, PrintSettings } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { useQueue } from '../../context/QueueContext';
import { getPaperDimensionSpec } from '../../utils/paperDimensions';
import { processThermalLogoDataUrl } from '../../utils/thermalLogoProcessor';

interface TicketReceiptViewProps {
  ticket: Ticket;
  settings?: PrintSettings;
  printSettings?: PrintSettings;
  estimatedWaitMinutes?: number;
  id?: string;
  isPrintMode?: boolean;
  booth?: any;
}

export const TicketReceiptView: React.FC<TicketReceiptViewProps> = ({
  ticket,
  settings: propSettings,
  printSettings: propPrintSettings,
  estimatedWaitMinutes,
  id = 'printable-thermal-ticket',
  isPrintMode = false,
}) => {
  const { printSettings: contextSettings } = useQueue();
  const settings = propSettings || propPrintSettings || contextSettings || {};

  const spec = getPaperDimensionSpec(settings.paperWidth, settings.orientation || 'portrait');

  // Pre-process the logo into genuine 1-bit black/white ONLY for actual print output.
  const [printLogoSrc, setPrintLogoSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!isPrintMode || !settings.logoUrl) {
      setPrintLogoSrc(null);
      return;
    }
    let cancelled = false;
    processThermalLogoDataUrl(settings.logoUrl, { maxWidth: 250, maxHeight: 250 })
      .then((processed) => {
        if (!cancelled) setPrintLogoSrc(processed);
      })
      .catch(() => {
        if (!cancelled) setPrintLogoSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isPrintMode, settings.logoUrl]);

  const logoSrc = (isPrintMode && printLogoSrc) || settings.logoUrl;

  // Format Date & Time according to settings
  const createdDate = new Date(ticket.createdAt);
  const isValidDate = !isNaN(createdDate.getTime());

  const formatDateTime = (): string => {
    if (!isValidDate) return ticket.createdAt;

    const dd = String(createdDate.getDate()).padStart(2, '0');
    const mm = String(createdDate.getMonth() + 1).padStart(2, '0');
    const yyyy = createdDate.getFullYear();
    const hours24 = String(createdDate.getHours()).padStart(2, '0');
    const mins = String(createdDate.getMinutes()).padStart(2, '0');

    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthsShort[createdDate.getMonth()];

    const hours12Raw = createdDate.getHours() % 12 || 12;
    const hours12 = String(hours12Raw).padStart(2, '0');
    const ampm = createdDate.getHours() >= 12 ? 'PM' : 'AM';

    const fmt = settings.dateTimeFormat || 'DD/MM/YYYY, HH:mm';

    switch (fmt) {
      case 'YYYY-MM-DD HH:mm':
        return `${yyyy}-${mm}-${dd} ${hours24}:${mins}`;
      case 'DD MMM YYYY, HH:mm':
        return `${dd} ${monthName} ${yyyy}, ${hours24}:${mins}`;
      case 'MM/DD/YYYY hh:mm A':
        return `${mm}/${dd}/${yyyy} ${hours12}:${mins} ${ampm}`;
      case 'HH:mm (Time Only)':
        return `${hours24}:${mins} WIB`;
      case 'DD/MM/YYYY, HH:mm':
      default:
        return `${dd}/${mm}/${yyyy}, ${hours24}:${mins}`;
    }
  };

  // Generate Divider Line (proportional to ticket width)
  const renderDivider = () => {
    const style = settings.dividerStyle || 'dashed';

    if (style === 'dashed') {
      return <div className="w-[96%] mx-auto my-1 border-t-2 border-dashed border-black opacity-100" />;
    }
    if (style === 'double') {
      return <div className="w-[96%] mx-auto my-1 border-t-4 border-double border-black opacity-100" />;
    }
    if (style === 'dotted') {
      return <div className="w-[96%] mx-auto my-1 border-t-2 border-dotted border-black opacity-100" />;
    }
    if (style === 'solid') {
      return <div className="w-[96%] mx-auto my-1 border-t-2 border-solid border-black opacity-100" />;
    }

    let pattern = '*';
    if (style === 'stars') pattern = '★ ';
    else if (style === 'diamonds') pattern = '◆◇';
    else if (style === 'custom') pattern = settings.dividerText || '-';

    const maxChars = Math.max(12, Math.floor((spec.widthMm || 58) / 2.2));
    const repeatCount = Math.max(1, Math.floor(maxChars / (pattern.length || 1)));
    const repeated = pattern.repeat(repeatCount);

    return (
      <div className="w-[96%] mx-auto text-black font-bold text-[9px] my-0.5 select-none overflow-hidden whitespace-nowrap leading-none tracking-tighter opacity-100 text-center">
        {repeated}
      </div>
    );
  };

  // Font Family Class
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'sans-serif':
        return 'font-sans';
      case 'serif':
        return 'font-serif';
      case 'display':
        return 'font-sans uppercase tracking-wide';
      case 'monospace':
      default:
        return 'font-mono';
    }
  };

  // Font Scale Class
  const getFontScaleClass = () => {
    switch (settings.fontScale) {
      case 'small':
        return 'scale-[0.9] origin-top';
      case 'large':
        return 'scale-[1.1] origin-top';
      case 'normal':
      default:
        return 'scale-100';
    }
  };

  // Label Shape Container Classes
  const getShapeClass = () => {
    if (isPrintMode || settings.labelShape === 'none' || settings.labelShape === 'borderless') {
      return 'border-none shadow-none rounded-none';
    }
    switch (settings.labelShape) {
      case 'rounded':
        return 'rounded-xl border border-slate-300 shadow-sm';
      case 'bordered':
        return 'border-2 border-slate-900 rounded-lg shadow-sm';
      case 'tear-off':
        return 'border-x border-slate-300 relative';
      case 'standard':
      default:
        return 'border border-slate-300 rounded-md shadow-sm';
    }
  };

  // Build target QR code URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  let customerQrUrl = `${origin}?view=customer&ticket=${ticket.ticketNumber}`;
  if (settings.qrCustomUrlPattern && settings.qrCustomUrlPattern.trim()) {
    customerQrUrl = settings.qrCustomUrlPattern.replace('{ticket}', ticket.ticketNumber);
  }

  // Calculate dynamic logo width & QR size based on user overrides + paper spec
  const logoWidth = Math.min(settings.logoWidth || spec.logoMaxPx, spec.logoMaxPx * 1.5);
  const qrSize = Math.min(settings.qrSize || spec.qrSizePx, spec.qrSizePx * 1.4);

  const isLandscape = spec.orientation === 'landscape';

  return (
    <div
      id={id}
      className={`bg-white text-black font-extrabold ${getFontFamilyClass()} ${getShapeClass()} ${getFontScaleClass()} ${spec.paddingClass} select-none text-center flex flex-col items-center justify-start transition-all box-border`}
      style={{
        width: isPrintMode ? `${spec.widthMm}mm` : spec.widthPx,
        maxWidth: isPrintMode ? `${spec.widthMm}mm` : '100%',
        height: isPrintMode ? `${spec.effectiveHeightMm}mm` : (spec.heightPx !== 'auto' ? spec.heightPx : 'auto'),
        maxHeight: isPrintMode ? `${spec.effectiveHeightMm}mm` : (spec.heightPx !== 'auto' ? spec.heightPx : 'none'),
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {isLandscape ? (
        /* LANDSCAPE 2-COLUMN BALANCED LAYOUT */
        <div className="w-full flex flex-row items-center justify-between gap-2 text-center my-auto">
          {/* LEFT COLUMN: Header, Logo, Number, Booth */}
          <div className="w-1/2 flex flex-col items-center justify-center space-y-1 pr-1 border-r-2 border-dashed border-black">
            {(settings.showLogo ?? true) && settings.logoUrl && (
              <img
                src={logoSrc}
                alt="Photobooth Logo"
                className="object-contain my-0.5"
                style={{
                  width: `${logoWidth}px`,
                  maxHeight: `${logoWidth}px`,
                  filter: 'contrast(300%) grayscale(100%)',
                  imageRendering: 'pixelated',
                }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            {settings.headerTitle && (
              <h2 className={`${spec.headerTitleClass} text-black font-black leading-tight max-w-full px-1`}>
                {settings.headerTitle}
              </h2>
            )}
            {settings.subHeaderTitle && (
              <p className={`${spec.subHeaderClass} text-black font-bold tracking-tight max-w-full px-1`}>
                {settings.subHeaderTitle}
              </p>
            )}
            {(settings.showBranchName ?? true) && settings.branchName && (
              <p className={`${spec.textDetailClass} text-black font-bold max-w-full px-1 leading-snug`}>
                {settings.branchName}
              </p>
            )}
            {(settings.showTicketNumber ?? true) && (
              <div className={`${spec.ticketNumberClass} text-black font-black font-mono tracking-tight my-0.5`}>
                {ticket.ticketNumber}
              </div>
            )}
            {(settings.showBoothName ?? true) && (
              <div className={`${spec.textDetailClass} font-black uppercase tracking-wider text-black bg-white px-2 py-0.5 rounded border-2 border-black max-w-full truncate`}>
                {ticket.boothName}
              </div>
            )}
            {(settings.showDateTime ?? true) && (
              <div className={`${spec.textDetailClass} text-black font-bold my-0.5 font-mono`}>
                {formatDateTime()}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: QR, Notes & Footer */}
          <div className="w-1/2 flex flex-col items-center justify-center space-y-1 pl-1">
            {settings.showQR && (
              <div className="flex flex-col items-center my-0.5 w-full">
                {settings.qrSubText1 && !spec.isMicroHeight && (
                  <p className={`${spec.footerClass} font-bold text-black leading-tight px-1`}>
                    {settings.qrSubText1}
                  </p>
                )}
                <div className="p-1 bg-white border-2 border-black rounded flex items-center justify-center my-1">
                  <QRCodeSVG
                    value={customerQrUrl}
                    size={qrSize}
                    level="H"
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                    style={{ shapeRendering: 'crispEdges' }}
                  />
                </div>
              </div>
            )}
            {settings.customNote && !spec.isMicroHeight && (
              <p className={`${spec.footerClass} font-bold text-black italic my-0.5 px-1 max-w-full leading-tight`}>
                "{settings.customNote}"
              </p>
            )}
            {settings.footerText && !spec.isMicroHeight && (
              <p className={`${spec.footerClass} font-bold text-black leading-tight max-w-full px-1`}>
                {settings.footerText}
              </p>
            )}
            {isPrintMode && (
              <div className="thermal-feed w-full flex flex-col items-center justify-center pt-1 mt-1 border-t border-dotted border-black/80">
                <span className="text-[7px] font-mono font-black text-black tracking-widest uppercase">
                  - - - POTONG DI SINI - - -
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PORTRAIT VERTICAL STREAMLINED LAYOUT */
        <div className="w-full flex flex-col items-center justify-center space-y-0.5">
          {/* 1. LOGO */}
          {(settings.showLogo ?? true) && settings.logoUrl && (
            <img
              src={logoSrc}
              alt="Photobooth Logo"
              className="object-contain my-0.5"
              style={{
                width: `${logoWidth}px`,
                maxHeight: `${logoWidth}px`,
                filter: 'contrast(300%) grayscale(100%)',
                imageRendering: 'pixelated',
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}

          {/* 2. HEADER TITLE */}
          {settings.headerTitle && (
            <h2 className={`${spec.headerTitleClass} text-black font-black leading-tight max-w-full px-1`}>
              {settings.headerTitle}
            </h2>
          )}

          {/* SUB-HEADER TITLE */}
          {settings.subHeaderTitle && (
            <p className={`${spec.subHeaderClass} text-black font-bold tracking-tight max-w-full px-1`}>
              {settings.subHeaderTitle}
            </p>
          )}

          {/* 3. BRANCH NAME */}
          {(settings.showBranchName ?? true) && settings.branchName && (
            <p className={`${spec.textDetailClass} text-black font-bold max-w-full px-1 leading-snug`}>
              {settings.branchName}
            </p>
          )}

          {!spec.isMicroHeight && renderDivider()}

          {/* 4. TICKET NUMBER */}
          {(settings.showTicketNumber ?? true) && (
            <div className={`${spec.ticketNumberClass} text-black font-black font-mono tracking-tight my-0.5`}>
              {ticket.ticketNumber}
            </div>
          )}

          {/* 5. BOOTH NAME */}
          {(settings.showBoothName ?? true) && (
            <div className={`${spec.textDetailClass} font-black uppercase tracking-wider text-black bg-white px-2 py-0.5 rounded border-2 border-black max-w-full truncate`}>
              {ticket.boothName}
            </div>
          )}

          {/* ESTIMATED WAIT TIME */}
          {settings.showEstimatedWait === true && estimatedWaitMinutes !== undefined && estimatedWaitMinutes > 0 && !spec.isMicroHeight && (
            <div className={`${spec.textDetailClass} text-black bg-white px-1.5 py-0.5 rounded border-2 border-black font-bold my-0.5`}>
              Estimasi: ~{estimatedWaitMinutes} mnt
            </div>
          )}

          {/* 6. DATE & TIME */}
          {(settings.showDateTime ?? true) && (
            <div className={`${spec.textDetailClass} text-black font-bold my-0.5 font-mono`}>
              {formatDateTime()}
            </div>
          )}

          {!spec.isMicroHeight && renderDivider()}

          {/* 7. QR CODE & SUBTEXTS */}
          {settings.showQR && (
            <div className="flex flex-col items-center my-0.5 w-full">
              {settings.qrSubText1 && !spec.isMicroHeight && (
                <p className={`${spec.footerClass} font-bold text-black leading-tight px-1`}>
                  {settings.qrSubText1}
                </p>
              )}
              {settings.qrSubText2 && !spec.isMicroHeight && (
                <p className={`${spec.footerClass} font-bold text-black leading-tight px-1 mb-0.5`}>
                  {settings.qrSubText2}
                </p>
              )}

              <div className="p-1 bg-white border-2 border-black rounded flex items-center justify-center">
                <QRCodeSVG
                  value={customerQrUrl}
                  size={qrSize}
                  level="H"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                  style={{ shapeRendering: 'crispEdges' }}
                />
              </div>
            </div>
          )}

          {/* 8. CUSTOM NOTE */}
          {settings.customNote && !spec.isMicroHeight && (
            <p className={`${spec.footerClass} font-bold text-black italic my-0.5 px-1 max-w-full leading-tight`}>
              "{settings.customNote}"
            </p>
          )}

          {settings.showQR && !spec.isMicroHeight && renderDivider()}

          {/* 9. FOOTER TEXT */}
          {settings.footerText && !spec.isMicroHeight && (
            <p className={`${spec.footerClass} font-bold text-black leading-tight max-w-full px-1`}>
              {settings.footerText}
            </p>
          )}

          {/* 10. FEED DISTANCE GAP FOR THERMAL PAPER TEAR/CUT BAR */}
          {isPrintMode && (
            <div className="thermal-feed w-full flex flex-col items-center justify-center pt-1 mt-1 border-t border-dotted border-black/80">
              <span className="text-[7px] font-mono font-black text-black tracking-widest uppercase">
                - - - POTONG DI SINI - - -
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
