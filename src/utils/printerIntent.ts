import { Ticket, PrintSettings } from '../types';

export type AlignOption = 0 | 1 | 2; // 0=left, 1=center, 2=right
export type BoldOption = 0 | 1; // 0=no, 1=yes
export type FormatOption = 0 | 1 | 2 | 3; // 0=normal, 1=double Height, 2=double Height+Width, 3=double Width

/**
 * Format text tag for Bluetooth Print App
 * Syntax: <BAF>Content
 * B: Bold (0/1)
 * A: Align (0=left, 1=center, 2=right)
 * F: Format (0=normal, 1=double H, 2=double H+W, 3=double W)
 */
export function formatText(
  content: string,
  bold: BoldOption = 0,
  align: AlignOption = 0,
  format: FormatOption = 0
): string {
  return `<${bold}${align}${format}>${content}`;
}

/**
 * Format Image tag for Bluetooth Print App
 * Syntax: <IMAGE>A#Base64
 */
export function formatImage(base64Data: string, align: AlignOption = 1): string {
  const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  return `<IMAGE>${align}#${cleanBase64}`;
}

/**
 * Format Barcode tag for Bluetooth Print App
 * Syntax: <BARCODE>A#W#H#Value
 */
export function formatBarcode(
  value: string,
  align: AlignOption = 1,
  width: number = 100,
  height: number = 50
): string {
  return `<BARCODE>${align}#${width}#${height}#${value}`;
}

/**
 * Format QR Code tag for Bluetooth Print App
 * Syntax: <QR>A#S#Value
 */
export function formatQR(value: string, align: AlignOption = 1, size: number = 40): string {
  return `<QR>${align}#${size}#${value}`;
}

/**
 * Format HTML tag for Bluetooth Print App
 * Syntax: <HTML>Code with < and > escaped to &lt; and &gt;
 */
export function formatHTML(htmlCode: string): string {
  const escaped = htmlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<HTML>${escaped}`;
}

/**
 * Build complete string payload for photobooth queue ticket
 */
export function buildTicketBluetoothPrintPayload(
  ticket: Ticket,
  settings: PrintSettings,
  boothName?: string,
  estimatedWaitMinutes?: number,
  customerQrUrl?: string
): string {
  let payload = '';

  const header = (settings.headerText || 'KLIKKA PHOTOBOOTH').toUpperCase();
  const subtitle = settings.subtitleText || '';
  const footer = settings.footerText || 'Terima Kasih Atas Kunjungan Anda!';

  // Header Title
  payload += formatText(`${header}\n`, 1, 1, 2);
  if (subtitle) {
    payload += formatText(`${subtitle}\n`, 0, 1, 0);
  }

  payload += formatText('================================\n', 0, 1, 0);

  // Ticket Header & Big Number
  payload += formatText('NOMOR ANTRIAN\n', 1, 1, 0);
  payload += formatText(`${ticket.ticketNumber || 'A001'}\n`, 1, 1, 2);

  // Booth / Category Name
  const categoryLabel = boothName || ticket.category || 'STUDIO PHOTOBOOTH';
  payload += formatText(`${categoryLabel.toUpperCase()}\n`, 1, 1, 0);

  payload += formatText('--------------------------------\n', 0, 1, 0);

  // Details
  const nowStr = new Date(ticket.createdAt || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  payload += formatText(`Waktu   : ${nowStr}\n`, 0, 0, 0);

  if (typeof estimatedWaitMinutes === 'number' && estimatedWaitMinutes >= 0) {
    payload += formatText(`Estimasi: ~${estimatedWaitMinutes} Menit\n`, 0, 0, 0);
  }

  if (ticket.customerName) {
    payload += formatText(`Nama    : ${ticket.customerName}\n`, 0, 0, 0);
  }

  payload += formatText('--------------------------------\n', 0, 1, 0);

  // QR Code
  const qrTarget = customerQrUrl || ticket.ticketNumber || 'A001';
  payload += formatQR(qrTarget, 1, 45);

  // Footer
  if (footer) {
    payload += formatText(`\n${footer}\n`, 0, 1, 0);
  }

  // Extra line feeds for tear/cut
  payload += formatText('\n\n\n', 0, 0, 0);

  return payload;
}

/**
 * Trigger Android Intent to launch Bluetooth Print app (mate.bluetoothprint)
 */
export function sendBluetoothPrintIntent(payload: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const encoded = encodeURIComponent(payload);
    // Standard Android Intent URI for ACTION_SEND targeting mate.bluetoothprint
    const intentUrl = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;package=mate.bluetoothprint;S.android.intent.extra.TEXT=${encoded};end;`;

    window.location.href = intentUrl;
    return true;
  } catch (err) {
    console.error('Failed to trigger Bluetooth Print Android Intent:', err);
    return false;
  }
}
