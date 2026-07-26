import { Booth, PrintSettings, AppsScriptConfig, Ticket, ActivityLog } from '../types';

export const DEFAULT_BOOTHS: Booth[] = [
  {
    id: 'booth-vintage',
    name: 'Vintage Booth',
    code: 'VIN',
    currentNumber: 1,
    totalTickets: 3,
    status: 'active',
    avgTimePerSession: 5,
    themeColor: '#8B5CF6', // Purple
  },
  {
    id: 'booth-aesthetic',
    name: 'Aesthetic Booth',
    code: 'AES',
    currentNumber: 1,
    totalTickets: 2,
    status: 'active',
    avgTimePerSession: 5,
    themeColor: '#EC4899', // Pink
  },
  {
    id: 'booth-glamour',
    name: 'Glamour Booth',
    code: 'GLM',
    currentNumber: 0,
    totalTickets: 1,
    status: 'active',
    avgTimePerSession: 6,
    themeColor: '#F59E0B', // Amber
  },
];

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&auto=format&fit=crop&q=80',
  logoWidth: 50,
  headerTitle: 'NOMOR ANTRIAN',
  subHeaderTitle: 'PHOTOBOOTH QUEUE TICKET',
  branchName: 'Photobooth Studio - Cabang Utama',
  footerText: 'Harap menunggu sampai nomor kamu dipanggil. Terima kasih!',
  customNote: 'Harap simpan tiket fisik ini sampai sesi foto selesai.',

  showBranchName: true,
  showBoothName: true,
  showTicketNumber: true,
  showDateTime: true,
  showEstimatedWait: true,

  dateTimeFormat: 'DD/MM/YYYY, HH:mm',

  dividerStyle: 'dashed',
  dividerText: '--------------------------------',
  labelShape: 'rounded',
  fontFamily: 'monospace',
  textAlign: 'center',

  paperWidth: '58mm',
  fontScale: 'normal',

  showQR: true,
  qrSize: 110,
  qrSubText1: 'Scan QR di bawah untuk:',
  qrSubText2: 'Cek posisi antrian real-time',
  qrCustomUrlPattern: '',

  monitorLogoUrl: '',
  monitorBrandTitle: 'LAYAR ANTRIAN PHOTOBOOTH',
  monitorWelcomeText: '📸 Selamat Datang di Klikka Photobooth! Silakan bersantai & perhatikan panggilan nomor antrian Anda di layar. Selamat mengabadikan momen seru! ✨',

  speechVoiceName: '',
  speechRate: 0.88,
  speechPitch: 1.0,
};

export interface TicketLayoutTemplate {
  id: string;
  name: string;
  description: string;
  settings: Partial<PrintSettings>;
}

export const TICKET_TEMPLATES: TicketLayoutTemplate[] = [
  {
    id: 'classic-thermal',
    name: 'Classic Thermal 58mm POS',
    description: 'Format standar struk cetak thermal kasir kasual dengan garis putus-putus.',
    settings: {
      logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&auto=format&fit=crop&q=80',
      logoWidth: 44,
      headerTitle: 'NOMOR ANTRIAN',
      subHeaderTitle: 'PHOTOBOOTH QUEUE',
      branchName: 'Photobooth Studio - Main Branch',
      footerText: 'Harap menunggu sampai nomor dipanggil. Terima kasih!',
      customNote: 'Tiket berlaku hanya untuk hari ini',
      showBranchName: true,
      showBoothName: true,
      showTicketNumber: true,
      showDateTime: true,
      showEstimatedWait: true,
      dateTimeFormat: 'DD/MM/YYYY, HH:mm',
      dividerStyle: 'dashed',
      dividerText: '--------------------------------',
      labelShape: 'standard',
      fontFamily: 'monospace',
      textAlign: 'center',
      paperWidth: '58mm',
      fontScale: 'normal',
      showQR: true,
      qrSize: 100,
      qrSubText1: 'Scan QR di bawah untuk:',
      qrSubText2: 'Cek posisi antrian real-time',
    },
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Clean 80mm Wide',
    description: 'Desain bersih dengan font sans-serif modern, ukuran kertas 80mm lebih leluasa.',
    settings: {
      logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&auto=format&fit=crop&q=80',
      logoWidth: 56,
      headerTitle: 'ANTRIAN PHOTOBOOTH',
      subHeaderTitle: 'WELCOME TO OUR STUDIO',
      branchName: 'Photobooth Studio - Grand Opening',
      footerText: 'Silakan pindai QR code untuk mengecek estimasi giliran secara live!',
      customNote: 'Datang tepat waktu saat nomor dipanggil',
      showBranchName: true,
      showBoothName: true,
      showTicketNumber: true,
      showDateTime: true,
      showEstimatedWait: true,
      dateTimeFormat: 'DD MMM YYYY, HH:mm',
      dividerStyle: 'solid',
      dividerText: '────────────────────────────────',
      labelShape: 'rounded',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      paperWidth: '80mm',
      fontScale: 'normal',
      showQR: true,
      qrSize: 125,
      qrSubText1: 'Lacak Antrian Live:',
      qrSubText2: 'Scan untuk update real-time',
    },
  },
  {
    id: 'compact-sticker',
    name: 'Sticker Label 50x30mm',
    description: 'Label stiker ringkas khusus ditempel pada merchandise/voucher customer.',
    settings: {
      logoUrl: '',
      headerTitle: 'TIKET ANTRIAN',
      subHeaderTitle: '',
      branchName: 'Photobooth',
      footerText: 'Simpan label ini',
      customNote: '',
      showBranchName: false,
      showBoothName: true,
      showTicketNumber: true,
      showDateTime: true,
      showEstimatedWait: false,
      dateTimeFormat: 'HH:mm (Time Only)',
      dividerStyle: 'solid',
      dividerText: '────────────────',
      labelShape: 'bordered',
      fontFamily: 'monospace',
      textAlign: 'center',
      paperWidth: '50x30mm',
      fontScale: 'small',
      showQR: true,
      qrSize: 70,
      qrSubText1: 'Scan QR:',
      qrSubText2: '',
    },
  },
  {
    id: 'retro-vintage',
    name: 'Retro Photobooth Studio',
    description: 'Gaya vintage photobooth klasik dengan garis bintang dan hiasan ornamen retro.',
    settings: {
      logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&auto=format&fit=crop&q=80',
      logoWidth: 50,
      headerTitle: '★ TIKET PHOTOBOOTH ★',
      subHeaderTitle: 'VINTAGE PHOTO STUDIO',
      branchName: 'Photobooth Studio',
      footerText: 'Abadikan momen berhargamu bersama kami!',
      customNote: '★ Tunjukkan tiket ke petugas booth ★',
      showBranchName: true,
      showBoothName: true,
      showTicketNumber: true,
      showDateTime: true,
      showEstimatedWait: true,
      dateTimeFormat: 'DD/MM/YYYY, HH:mm',
      dividerStyle: 'stars',
      dividerText: '********************************',
      labelShape: 'tear-off',
      fontFamily: 'serif',
      textAlign: 'center',
      paperWidth: '80mm',
      fontScale: 'large',
      showQR: true,
      qrSize: 120,
      qrSubText1: 'Pantau Giliranmu:',
      qrSubText2: 'Scan QR Code Struk Ini',
    },
  },
  {
    id: 'thermal-78x100',
    name: 'POS Thermal 78x100mm Large',
    description: 'Ukuran kertas label thermal besar 78x100mm dengan layout memuat QR Code & info lengkap.',
    settings: {
      logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&auto=format&fit=crop&q=80',
      logoWidth: 60,
      headerTitle: 'NOMOR ANTRIAN PHOTOBOOTH',
      subHeaderTitle: 'STUDIO CELEBRATION TICKET',
      branchName: 'Photobooth Studio - Main Branch',
      footerText: 'Harap perhatikan nomor antrian di layar TV Monitor.',
      customNote: 'Scan QR Code untuk memantau panggilan langsung dari HP Anda',
      showBranchName: true,
      showBoothName: true,
      showTicketNumber: true,
      showDateTime: true,
      showEstimatedWait: true,
      dateTimeFormat: 'DD/MM/YYYY, HH:mm',
      dividerStyle: 'solid',
      dividerText: '────────────────────────────────',
      labelShape: 'rounded',
      fontFamily: 'monospace',
      textAlign: 'center',
      paperWidth: '78x100mm',
      orientation: 'portrait',
      fontScale: 'normal',
      showQR: true,
      qrSize: 130,
      qrSubText1: 'Scan QR di bawah untuk:',
      qrSubText2: 'Lacak Antrian Live di Smartphone',
    },
  },
];

export const DEFAULT_APPS_SCRIPT_CONFIG: AppsScriptConfig = {
  enabled: false,
  webAppUrl: '',
  autoSync: true,
  syncStatus: 'idle',
};

const now = new Date();
const formattedDate = now.toISOString();

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'ticket-vin-1',
    boothId: 'booth-vintage',
    boothName: 'Vintage Booth',
    boothCode: 'VIN',
    ticketNumber: 'VIN001',
    sequence: 1,
    status: 'called',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    calledAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'ticket-vin-2',
    boothId: 'booth-vintage',
    boothName: 'Vintage Booth',
    boothCode: 'VIN',
    ticketNumber: 'VIN002',
    sequence: 2,
    status: 'waiting',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'ticket-vin-3',
    boothId: 'booth-vintage',
    boothName: 'Vintage Booth',
    boothCode: 'VIN',
    ticketNumber: 'VIN003',
    sequence: 3,
    status: 'waiting',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'ticket-aes-1',
    boothId: 'booth-aesthetic',
    boothName: 'Aesthetic Booth',
    boothCode: 'AES',
    ticketNumber: 'AES001',
    sequence: 1,
    status: 'called',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    calledAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  {
    id: 'ticket-aes-2',
    boothId: 'booth-aesthetic',
    boothName: 'Aesthetic Booth',
    boothCode: 'AES',
    ticketNumber: 'AES002',
    sequence: 2,
    status: 'waiting',
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: 'ticket-glm-1',
    boothId: 'booth-glamour',
    boothName: 'Glamour Booth',
    boothCode: 'GLM',
    ticketNumber: 'GLM001',
    sequence: 1,
    status: 'waiting',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: new Date().toLocaleDateString('id-ID'),
    action: 'PRINT_TICKET',
    details: 'Mencetak tiket baru VIN001',
    boothName: 'Vintage Booth',
    ticketNumber: 'VIN001',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 2 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: new Date().toLocaleDateString('id-ID'),
    action: 'CALL_NEXT',
    details: 'Memanggil antrian VIN001',
    boothName: 'Vintage Booth',
    ticketNumber: 'VIN001',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: new Date().toLocaleDateString('id-ID'),
    action: 'CALL_NEXT',
    details: 'Memanggil antrian AES001',
    boothName: 'Aesthetic Booth',
    ticketNumber: 'AES001',
  },
];

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script Backend for Photobooth Queue Management System
 * Save this file as Code.gs in Google Sheets > Extensions > Apps Script
 * Deploy as Web App (Execute as: Me, Who has access: Anyone)
 */

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "getQueue") {
    return handleGetQueue(ss);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Google Apps Script Photobooth Queue API active!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "syncAll") {
      return handleSyncAll(ss, data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetQueue(ss) {
  var ticketSheet = getOrCreateSheet(ss, "Tickets");
  var boothSheet = getOrCreateSheet(ss, "Booths");
  var logSheet = getOrCreateSheet(ss, "Logs");
  var settingsSheet = getOrCreateSheet(ss, "Settings");
  
  var tickets = sheetToObjects(ticketSheet);
  var booths = sheetToObjects(boothSheet);
  var logs = sheetToObjects(logSheet);
  var settings = sheetToObjects(settingsSheet);
  
  var adminPin = "";
  for (var k = 0; k < settings.length; k++) {
    if (settings[k].key === "adminPin") adminPin = settings[k].value;
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    booths: booths,
    tickets: tickets,
    logs: logs,
    adminPin: adminPin
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleSyncAll(ss, data) {
  var ticketSheet = getOrCreateSheet(ss, "Tickets");
  var boothSheet = getOrCreateSheet(ss, "Booths");
  var logSheet = getOrCreateSheet(ss, "Logs");
  var settingsSheet = getOrCreateSheet(ss, "Settings");
  
  // Save Booths
  if (data.booths) {
    boothSheet.clear();
    boothSheet.appendRow(["id", "name", "code", "currentNumber", "totalTickets", "status", "avgTimePerSession", "themeColor"]);
    data.booths.forEach(function(b) {
      if (b && b.id && b.name) {
        boothSheet.appendRow([b.id, b.name, b.code, b.currentNumber, b.totalTickets, b.status, b.avgTimePerSession, b.themeColor]);
      }
    });
  }
  
  // Save Tickets (clear sheet even if data.tickets is empty [])
  if (data.tickets) {
    ticketSheet.clear();
    ticketSheet.appendRow(["id", "boothId", "boothName", "boothCode", "ticketNumber", "sequence", "status", "createdAt", "calledAt", "completedAt"]);
    data.tickets.forEach(function(t) {
      if (t && t.id && t.ticketNumber) {
        ticketSheet.appendRow([t.id, t.boothId, t.boothName, t.boothCode, t.ticketNumber, t.sequence, t.status, t.createdAt, t.calledAt || "", t.completedAt || ""]);
      }
    });
  }
  
  // Save Logs
  if (data.logs) {
    logSheet.clear();
    logSheet.appendRow(["id", "timestamp", "date", "action", "details", "boothName", "ticketNumber"]);
    data.logs.forEach(function(l) {
      if (l && l.id) {
        logSheet.appendRow([l.id, l.timestamp, l.date, l.action, l.details, l.boothName || "", l.ticketNumber || ""]);
      }
    });
  }

  // Save Settings / Admin PIN
  if (data.adminPin) {
    settingsSheet.clear();
    settingsSheet.appendRow(["key", "value"]);
    settingsSheet.appendRow(["adminPin", String(data.adminPin)]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Synced data to Google Sheets",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var idVal = String(data[i][0]).trim();
    if (!idVal) continue; // skip blank rows
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}
`;
