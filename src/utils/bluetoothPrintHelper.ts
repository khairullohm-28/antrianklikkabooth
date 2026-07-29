import { Ticket, PrintSettings } from '../types';

/**
 * Generate instruction string for "Bluetooth Print" Android App (mate.bluetoothprint)
 * 
 * Specification:
 * 1. Text format: <BAF>Content
 *    - B: Bold (0=no, 1=yes)
 *    - A: Align (0=left, 1=center, 2=right)
 *    - F: Size (0=normal, 1=double Height, 2=double Height+Width, 3=double Width)
 *    e.g. <112>STORE NAME\n
 * 2. QR Code: <QR>A#S#Value
 *    - A: Align (0=left, 1=center, 2=right)
 *    - S: Size (e.g. 45)
 *    - Value: QR content URL
 * 3. Barcode: <BARCODE>A#W#H#Value
 * 4. Image: <IMAGE>A#Base64
 * 5. HTML: <HTML>Code
 */
export function generateBluetoothPrintPayload(
  ticket: Ticket,
  settings: PrintSettings,
  boothName?: string,
  estimatedWaitMinutes?: number,
  customerQrUrl?: string
): string {
  let str = '';

  const header = (settings.headerText || 'KLIKKA PHOTOBOOTH').toUpperCase();
  const subtitle = settings.subtitleText || '';
  const footer = settings.footerText || 'Terima Kasih Atas Kunjungan Anda!';

  // 1. Header (Bold=1, Center=1, Double Height+Width=2)
  str += `<112>${header}\n`;
  if (subtitle) {
    str += `<010>${subtitle}\n`;
  }

  str += `<010>================================\n`;

  // 2. Ticket Title & Big Number
  str += `<110>NOMOR ANTRIAN\n`;
  str += `<112>${ticket.ticketNumber || 'A001'}\n`;

  // 3. Booth / Service Category
  const categoryLabel = boothName || ticket.category || 'STUDIO PHOTOBOOTH';
  str += `<110>${categoryLabel.toUpperCase()}\n`;

  str += `<010>--------------------------------\n`;

  // 4. Ticket Timestamp & Wait Details
  const nowStr = new Date(ticket.createdAt || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  str += `<010>Waktu   : ${nowStr}\n`;

  if (typeof estimatedWaitMinutes === 'number' && estimatedWaitMinutes >= 0) {
    str += `<010>Estimasi: ~${estimatedWaitMinutes} Menit\n`;
  }

  if (ticket.customerName) {
    str += `<010>Nama    : ${ticket.customerName}\n`;
  }

  str += `<010>--------------------------------\n`;

  // 5. QR Code
  const qrTarget = customerQrUrl || ticket.ticketNumber || 'A001';
  str += `<QR>1#45#${qrTarget}\n`;

  // 6. Footer
  if (footer) {
    str += `<010>${footer}\n`;
  }

  // Extra line feeds for paper cutter
  str += `<010>\n\n\n`;

  return str;
}

/**
 * Trigger Android Intent to launch Bluetooth Print app (mate.bluetoothprint)
 */
export function sendToBluetoothPrintApp(payload: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const encoded = encodeURIComponent(payload);
    // Standard Android Intent URI for ACTION_SEND to mate.bluetoothprint
    const intentUrl = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;package=mate.bluetoothprint;S.android.intent.extra.TEXT=${encoded};end;`;

    // Trigger intent launch
    window.location.href = intentUrl;
    return true;
  } catch (err) {
    console.error('Failed to launch Bluetooth Print Intent:', err);
    return false;
  }
}
