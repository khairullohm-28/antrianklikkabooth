import React from 'react';
import { Ticket, PrintSettings } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { useQueue } from '../../context/QueueContext';

interface TicketReceiptViewProps {
  ticket: Ticket;
  settings: PrintSettings;
  estimatedWaitMinutes?: number;
  id?: string;
  isPrintMode?: boolean;
}

export const TicketReceiptView: React.FC<TicketReceiptViewProps> = ({
  ticket,
  settings,
  estimatedWaitMinutes,
  id = 'printable-thermal-ticket',
  isPrintMode = false,
}) => {
  const { appsScriptConfig } = useQueue();
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
    let content = '--------------------------------';

    if (style === 'dashed') content = '--------------------------------';
    else if (style === 'double') content = '════════════════════════════════';
    else if (style === 'dotted') content = '................................';
    else if (style === 'solid') content = '────────────────────────────────';
    else if (style === 'stars') content = '********************************';
    else if (style === 'diamonds') content = '◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇';
    else if (style === 'custom') content = settings.dividerText || '--------------------------------';

    return (
      <div className="text-black text-[11px] my-1 select-none overflow-hidden whitespace-nowrap leading-none tracking-tighter">
        {content}
      </div>
    );
  };

  // Paper Width Class or style
  const getPaperWidthPx = () => {
    switch (settings.paperWidth) {
      case '80mm':
      case '80x50mm':
        return '300px';
      case '78x100mm':
        return '295px';
      case '50x30mm':
        return '190px';
      case '58mm':
      default:
        return '230px';
    }
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
        return 'rounded-2xl border border-slate-300 shadow-md';
      case 'bordered':
        return 'border-2 border-slate-900 rounded-lg shadow-sm';
      case 'tear-off':
        return 'border-x border-slate-300 relative before:content-[""] before:block before:h-2 before:bg-[radial-gradient(circle,_transparent_4px,_white_4px)] before:bg-[length:12px_12px] after:content-[""] after:block after:h-2 after:bg-[radial-gradient(circle,_transparent_4px,_white_4px)] after:bg-[length:12px_12px]';
      case 'standard':
      default:
        return 'border border-slate-300 rounded-lg shadow-sm';
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

  const logoWidth = settings.logoWidth || 48;
  const qrSize = settings.qrSize || 100;

  return (
    <div
      id={id}
      className={`bg-white p-4 text-slate-900 ${getFontFamilyClass()} ${getShapeClass()} ${getFontScaleClass()} select-none text-center flex flex-col items-center justify-center transition-all`}
      style={{
        width: getPaperWidthPx(),
        minHeight: settings.paperWidth === '50x30mm' ? '120px' : 'auto',
      }}
    >
      {/* 1. LOGO */}
      {settings.logoUrl && (
        <img
          src={settings.logoUrl}
          alt="Photobooth Logo"
          className="object-contain mb-1 rounded"
          style={{ width: `${logoWidth}px`, height: `${logoWidth}px` }}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      )}

      {/* 2. HEADER TITLE (STATIC) */}
      {settings.headerTitle && (
        <h2 className="font-black text-xs uppercase tracking-wider text-black leading-tight">
          {settings.headerTitle}
        </h2>
      )}

      {/* SUB-HEADER TITLE */}
      {settings.subHeaderTitle && (
        <p className="text-[10px] text-black font-medium tracking-tight mt-0.5">
          {settings.subHeaderTitle}
        </p>
      )}

      {/* 3. BRANCH NAME (DYNAMIC / STATIC) */}
      {(settings.showBranchName ?? true) && settings.branchName && (
        <p className="text-[11px] text-black font-sans mt-0.5 max-w-[200px] leading-snug">
          {settings.branchName}
        </p>
      )}

      {renderDivider()}

      {/* 4. TICKET NUMBER (DYNAMIC) */}
      {(settings.showTicketNumber ?? true) && (
        <div className="text-3xl sm:text-4xl font-black tracking-tight text-black my-1 font-mono">
          {ticket.ticketNumber}
        </div>
      )}

      {/* 5. BOOTH NAME (DYNAMIC) */}
      {(settings.showBoothName ?? true) && (
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-black bg-slate-100 px-2.5 py-0.5 rounded border border-black my-0.5">
          {ticket.boothName}
        </div>
      )}

      {/* ESTIMATED WAIT TIME (DYNAMIC) */}
      {(settings.showEstimatedWait ?? true) && estimatedWaitMinutes !== undefined && (
        <div className="text-[10px] text-black bg-slate-100 px-2 py-0.5 rounded border border-black mt-1 font-sans font-bold">
          Estimasi tunggu: ~{estimatedWaitMinutes} menit
        </div>
      )}

      {/* 6. DATE & TIME (DYNAMIC FORMATTED) */}
      {(settings.showDateTime ?? true) && (
        <div className="text-[10px] text-black my-1 font-mono">
          {formatDateTime()}
        </div>
      )}

      {renderDivider()}

      {/* 7. QR CODE & SUBTEXTS */}
      {settings.showQR && (
        <div className="flex flex-col items-center my-1">
          {settings.qrSubText1 && (
            <p className="text-[10px] font-sans font-medium text-black leading-tight">
              {settings.qrSubText1}
            </p>
          )}
          {settings.qrSubText2 && (
            <p className="text-[10px] font-sans font-bold text-black leading-tight mb-1">
              {settings.qrSubText2}
            </p>
          )}

          <div className="p-1.5 bg-white border border-black rounded-lg">
            <QRCodeSVG value={customerQrUrl} size={qrSize} level="M" />
          </div>
        </div>
      )}

      {/* 8. CUSTOM NOTE / INSTRUCTIONS */}
      {settings.customNote && (
        <p className="text-[10px] font-sans font-semibold text-black italic my-1 px-1">
          "{settings.customNote}"
        </p>
      )}

      {settings.showQR && renderDivider()}

      {/* 9. FOOTER TEXT (STATIC) */}
      {settings.footerText && (
        <p className="text-[9px] font-sans text-black leading-tight max-w-[200px] mt-0.5">
          {settings.footerText}
        </p>
      )}
    </div>
  );
};
