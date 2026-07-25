import React from 'react';
import { Ticket, PrintSettings } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { useQueue } from '../../context/QueueContext';
import { getPaperDimensionSpec } from '../../utils/paperDimensions';

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
}) => {
  const { printSettings: contextSettings, appsScriptConfig } = useQueue();
  const settings = propSettings || propPrintSettings || contextSettings || {};

  const spec = getPaperDimensionSpec(settings.paperWidth);

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

  // Generate Divider Character Line
  const renderDivider = () => {
    const style = settings.dividerStyle || 'dashed';
    let content = spec.dividerText;

    if (style === 'dashed') content = spec.dividerText;
    else if (style === 'double') content = spec.dividerText.replace(/-/g, '═');
    else if (style === 'dotted') content = spec.dividerText.replace(/-/g, '.');
    else if (style === 'solid') content = spec.dividerText.replace(/-/g, '─');
    else if (style === 'stars') content = spec.dividerText.replace(/-/g, '*');
    else if (style === 'diamonds') content = '◆◇'.repeat(Math.max(3, Math.floor(spec.widthMm / 8)));
    else if (style === 'custom') content = settings.dividerText || spec.dividerText;

    return (
      <div className="text-black text-[9px] my-0.5 select-none overflow-hidden whitespace-nowrap leading-none tracking-tighter opacity-80">
        {content}
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
    switch (settings.labelShape) {
      case 'rounded':
        return 'rounded-xl border border-slate-300 shadow-sm';
      case 'bordered':
        return 'border-2 border-slate-900 rounded-lg shadow-sm';
      case 'tear-off':
        return 'border-x border-slate-300 relative before:content-[""] before:block before:h-2 before:bg-[radial-gradient(circle,_transparent_4px,_white_4px)] before:bg-[length:12px_12px] after:content-[""] after:block after:h-2 after:bg-[radial-gradient(circle,_transparent_4px,_white_4px)] after:bg-[length:12px_12px]';
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
  } else if (appsScriptConfig && appsScriptConfig.enabled && appsScriptConfig.webAppUrl) {
    customerQrUrl += `&gas=${encodeURIComponent(appsScriptConfig.webAppUrl)}`;
  }

  // Calculate dynamic logo width & QR size based on user overrides + paper spec
  const logoWidth = Math.min(settings.logoWidth || spec.logoMaxPx, spec.logoMaxPx * 1.5);
  const qrSize = Math.min(settings.qrSize || spec.qrSizePx, spec.qrSizePx * 1.4);

  return (
    <div
      id={id}
      className={`bg-white text-slate-900 ${getFontFamilyClass()} ${getShapeClass()} ${getFontScaleClass()} ${spec.paddingClass} select-none text-center flex flex-col items-center justify-between transition-all overflow-hidden box-border`}
      style={{
        width: spec.widthPx,
        height: spec.heightPx !== 'auto' ? spec.heightPx : 'auto',
        minHeight: spec.heightPx !== 'auto' ? spec.heightPx : 'auto',
        maxHeight: spec.heightPx !== 'auto' ? spec.heightPx : 'none',
      }}
    >
      <div className="w-full flex flex-col items-center justify-center space-y-0.5">
        {/* 1. LOGO */}
        {settings.logoUrl && (
          <img
            src={settings.logoUrl}
            alt="Photobooth Logo"
            className="object-contain my-0.5 rounded"
            style={{ width: `${logoWidth}px`, maxHeight: `${logoWidth}px` }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}

        {/* 2. HEADER TITLE */}
        {settings.headerTitle && (
          <h2 className={`${spec.headerTitleClass} text-black leading-tight max-w-full px-1`}>
            {settings.headerTitle}
          </h2>
        )}

        {/* SUB-HEADER TITLE */}
        {settings.subHeaderTitle && (
          <p className={`${spec.subHeaderClass} text-black font-medium tracking-tight max-w-full px-1`}>
            {settings.subHeaderTitle}
          </p>
        )}

        {/* 3. BRANCH NAME */}
        {(settings.showBranchName ?? true) && settings.branchName && (
          <p className={`${spec.textDetailClass} text-black font-sans max-w-full px-1 leading-snug`}>
            {settings.branchName}
          </p>
        )}

        {!spec.isMicroHeight && renderDivider()}

        {/* 4. TICKET NUMBER */}
        {(settings.showTicketNumber ?? true) && (
          <div className={`${spec.ticketNumberClass} text-black font-mono tracking-tight my-0.5`}>
            {ticket.ticketNumber}
          </div>
        )}

        {/* 5. BOOTH NAME */}
        {(settings.showBoothName ?? true) && (
          <div className={`${spec.textDetailClass} font-extrabold uppercase tracking-wider text-black bg-slate-100 px-2 py-0.5 rounded border border-black max-w-full truncate`}>
            {ticket.boothName}
          </div>
        )}

        {/* ESTIMATED WAIT TIME */}
        {(settings.showEstimatedWait ?? true) && estimatedWaitMinutes !== undefined && !spec.isMicroHeight && (
          <div className={`${spec.textDetailClass} text-black bg-slate-100 px-1.5 py-0.5 rounded border border-black font-sans font-bold my-0.5`}>
            Estimasi: ~{estimatedWaitMinutes} mnt
          </div>
        )}

        {/* 6. DATE & TIME */}
        {(settings.showDateTime ?? true) && (
          <div className={`${spec.textDetailClass} text-black my-0.5 font-mono`}>
            {formatDateTime()}
          </div>
        )}

        {!spec.isMicroHeight && renderDivider()}

        {/* 7. QR CODE & SUBTEXTS */}
        {settings.showQR && (
          <div className="flex flex-col items-center my-0.5 w-full">
            {settings.qrSubText1 && !spec.isMicroHeight && (
              <p className={`${spec.footerClass} font-sans font-medium text-black leading-tight px-1`}>
                {settings.qrSubText1}
              </p>
            )}
            {settings.qrSubText2 && !spec.isMicroHeight && (
              <p className={`${spec.footerClass} font-sans font-bold text-black leading-tight px-1 mb-0.5`}>
                {settings.qrSubText2}
              </p>
            )}

            <div className="p-1 bg-white border border-black rounded-md flex items-center justify-center">
              <QRCodeSVG value={customerQrUrl} size={qrSize} level="M" />
            </div>
          </div>
        )}

        {/* 8. CUSTOM NOTE */}
        {settings.customNote && !spec.isMicroHeight && (
          <p className={`${spec.footerClass} font-sans font-semibold text-black italic my-0.5 px-1 max-w-full leading-tight`}>
            "{settings.customNote}"
          </p>
        )}

        {settings.showQR && !spec.isMicroHeight && renderDivider()}

        {/* 9. FOOTER TEXT */}
        {settings.footerText && !spec.isMicroHeight && (
          <p className={`${spec.footerClass} font-sans text-black leading-tight max-w-full px-1`}>
            {settings.footerText}
          </p>
        )}
      </div>
    </div>
  );
};
