export interface Booth {
  id: string;
  name: string;
  code: string; // Unique code prefix e.g. "VIN", "EST", "GLM"
  currentNumber: number; // Current sequence number being called (0 if none)
  totalTickets: number; // Total tickets printed today
  status: 'active' | 'maintenance';
  avgTimePerSession: number; // Average session length in minutes (e.g., 5)
  themeColor: string; // Tailwind color class or hex for visual differentiation
}

export type TicketStatus = 'waiting' | 'called' | 'completed' | 'cancelled' | 'skipped';

export interface Ticket {
  id: string;
  boothId: string;
  boothName: string;
  boothCode: string;
  ticketNumber: string; // e.g. "VIN001"
  sequence: number; // Integer e.g. 1
  status: TicketStatus;
  createdAt: string; // ISO string
  calledAt?: string;
  completedAt?: string;
  customerPhone?: string;
  notes?: string;
}

export type TicketFontFamily = 'monospace' | 'sans-serif' | 'serif' | 'display';
export type TicketDividerStyle = 'dashed' | 'double' | 'dotted' | 'solid' | 'stars' | 'diamonds' | 'custom';
export type TicketLabelShape = 'standard' | 'rounded' | 'tear-off' | 'bordered';
export type TicketDateFormat = 'DD/MM/YYYY, HH:mm' | 'YYYY-MM-DD HH:mm' | 'DD MMM YYYY, HH:mm' | 'MM/DD/YYYY hh:mm A' | 'HH:mm (Time Only)';
export type TicketPaperWidth =
  | '58mm'
  | '80mm'
  | '50x30mm'
  | '50x40mm'
  | '57x40mm'
  | '60x40mm'
  | '70x20mm'
  | '76x100mm'
  | '78x100mm'
  | '76x130mm'
  | '100x100mm'
  | '100x150mm'
  | '100x180mm'
  | '100x200mm'
  | '210x300mm'
  | '80x50mm';
export type TicketAlign = 'center' | 'left' | 'right';

export interface PrintSettings {
  // Logo
  logoUrl: string;
  logoWidth?: number; // e.g. 48px

  // Static Texts
  headerTitle: string;
  subHeaderTitle?: string;
  branchName: string;
  footerText: string;
  customNote?: string;

  // Dynamic Fields Visibility & Toggles
  showBranchName?: boolean;
  showBoothName?: boolean;
  showTicketNumber?: boolean;
  showDateTime?: boolean;
  showEstimatedWait?: boolean;

  // Date/Time Formatting
  dateTimeFormat?: TicketDateFormat;

  // Layout & Decorative Elements
  dividerStyle?: TicketDividerStyle;
  dividerText: string;
  labelShape?: TicketLabelShape;
  fontFamily?: TicketFontFamily;
  textAlign?: TicketAlign;

  // Dimensions, Orientation & Scale
  paperWidth: TicketPaperWidth;
  orientation?: 'portrait' | 'landscape';
  fontScale?: 'small' | 'normal' | 'large';

  // QR Code Settings
  showQR: boolean;
  qrSize?: number;
  qrSubText1: string;
  qrSubText2: string;
  qrCustomUrlPattern?: string;

  // TV / Monitor Screen Settings
  monitorLogoUrl?: string;
  monitorBrandTitle?: string;
  monitorWelcomeText?: string;
}

export type ActivityAction =
  | 'PRINT_TICKET'
  | 'CALL_NEXT'
  | 'RECALL'
  | 'COMPLETE'
  | 'CANCEL'
  | 'ADD_BOOTH'
  | 'EDIT_BOOTH'
  | 'UPDATE_SETTINGS'
  | 'RESET_QUEUE';

export interface ActivityLog {
  id: string;
  timestamp: string; // e.g. "14:25:10"
  date: string; // e.g. "23/07/2026"
  action: ActivityAction;
  details: string;
  boothName?: string;
  ticketNumber?: string;
}

export interface AppsScriptConfig {
  enabled: boolean;
  webAppUrl: string;
  autoSync: boolean;
  lastSyncTime?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export type ActiveTab = 'admin' | 'monitor' | 'customer' | 'script-guide';
