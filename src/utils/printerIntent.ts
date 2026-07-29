/**
 * Utility for generating Bluetooth Print app formatting strings (BAF - Bluetooth Print App Format)
 * and triggering direct Android Bluetooth printing via App Intent.
 */

export interface PrinterTicketData {
  ticketNumber: string;
  boothName: string;
  boothCode: string;
  dateStr: string;
  timeStr: string;
  headerTitle?: string;
  footerMessage?: string;
  qrCodeUrl?: string;
  barcodeValue?: string;
  packageNote?: string;
}

/**
 * Format string as bold, aligned, or scaled using BAF tags
 */
export const BAF = {
  center: (text: string) => `[C]${text}\n`,
  left: (text: string) => `[L]${text}\n`,
  right: (text: string) => `[R]${text}\n`,
  bold: (text: string) => `[B]${text}[/B]`,
  title: (text: string) => `[C][L3][B]${text}[/B][/L3]\n`,
  bigTicket: (numberStr: string) => `[C][L4][B]${numberStr}[/B][/L4]\n`,
  line: () => `[C]--------------------------------\n`,
  doubleLine: () => `[C]================================\n`,
};

export const formatText = BAF;

/**
 * Generate Image command tag for Bluetooth Print app
 */
export const IMAGE = (urlOrBase64: string): string => {
  if (!urlOrBase64) return '';
  return `[C][IMAGE]${urlOrBase64}[/IMAGE]\n`;
};
export const formatImage = IMAGE;

/**
 * Generate Barcode command tag
 */
export const BARCODE = (value: string, type: 'CODE39' | 'CODE128' | 'EAN13' = 'CODE128'): string => {
  if (!value) return '';
  return `[C][BARCODE=${type}]${value}[/BARCODE]\n`;
};
export const formatBarcode = BARCODE;

/**
 * Generate QR Code command tag
 */
export const QR = (value: string, size: number = 200): string => {
  if (!value) return '';
  return `[C][QR size=${size}]${value}[/QR]\n`;
};
export const formatQR = QR;

/**
 * HTML Format generator
 */
export const formatHTML = (html: string): string => {
  if (!html) return '';
  return `[HTML]${html}[/HTML]\n`;
};

/**
 * Generates complete BAF formatted ticket string
 */
export const generateTicketBAFString = (data: PrinterTicketData): string => {
  let baf = '';

  // Header Title
  baf += BAF.center(data.headerTitle || 'PHOTOBOOTH QUEUE TICKET');
  baf += BAF.doubleLine();

  // Ticket Number
  baf += BAF.center('NOMOR ANTRIAN ANDA');
  baf += BAF.bigTicket(data.ticketNumber);

  // Booth Info
  baf += BAF.center(`Studio / Booth: ${data.boothName} (${data.boothCode})`);
  
  if (data.packageNote) {
    baf += BAF.center(`Paket: ${data.packageNote}`);
  }

  baf += BAF.line();

  // Date & Time
  baf += BAF.left(`Tanggal : ${data.dateStr}`);
  baf += BAF.left(`Waktu   : ${data.timeStr}`);
  baf += BAF.line();

  // QR Code or Barcode
  if (data.qrCodeUrl) {
    baf += QR(data.qrCodeUrl, 180);
  } else {
    baf += BARCODE(data.barcodeValue || data.ticketNumber, 'CODE128');
  }

  // Footer Message
  baf += BAF.doubleLine();
  baf += BAF.center(data.footerMessage || 'Terima kasih atas kunjungan Anda!\nHarap simpan tiket ini.');
  baf += '\n\n'; // Feed lines

  return baf;
};

export const buildTicketBluetoothPrintPayload = generateTicketBAFString;
export const generatePrintIntentString = generateTicketBAFString;

/**
 * Sends BAF string directly to Android Bluetooth Print App via Intent
 */
export const sendBluetoothPrintIntent = (data: PrinterTicketData | string): boolean => {
  try {
    const bafString = typeof data === 'string' ? data : generateTicketBAFString(data);
    const encodedData = encodeURIComponent(bafString);
    
    // Android Intent URL format for Bluetooth Print App (com.mprans.bluetoothprint)
    const intentUrl = `intent://print?data=${encodedData}#Intent;scheme=bluetoothprint;package=com.mprans.bluetoothprint;end;`;
    
    window.location.href = intentUrl;
    return true;
  } catch (error) {
    console.error('Failed to trigger Android Bluetooth Print intent:', error);
    return false;
  }
};

export const printViaAndroidBluetoothApp = sendBluetoothPrintIntent;
