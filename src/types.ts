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
export type TicketLabelShape = 'standard' | 'rounded' | 'tear-off' | 'bordered' | 'none' | 'borderless';
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
  showLogo?: boolean; // Toggle ON/OFF for displaying logo on ticket
  logoWidth?: number; // e.g. 48px
  logoThreshold?: number; // B/W binarization threshold (default 128)

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

  // Voice & Speech Synthesis Settings
  speechVoiceName?: string;
  speechRate?: number;
  speechPitch?: number;
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

export type MemberTier = 'Bronze' | 'Gold' | 'Diamond';

export interface Member {
  id: string;
  name: string;
  phone: string;
  pin: string;
  points: number;
  stamps: number;
  tier: MemberTier;
  dob: string; // e.g. "1998-05-15"
  address: string;
  avatarUrl: string;
  isFirstLogin: boolean;
  createdAt: string; // ISO string
  status: 'Aktif' | 'Nonaktif';
}

export type PromoType = 'POINT_DISCOUNT' | 'STAMP_PRODUCT' | 'EVENT';

export interface Promo {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  type: PromoType;
  costPoints: number;
  costStamps: number;
  isActive: boolean;
  targetTier?: string; // 'Semua Tier' | 'Bronze' | 'Gold' | 'Diamond'
  maxRedeemPerMember?: number; // 0 for unlimited, 1 for once, 2, etc.
}

export type MemberHistoryType = 'PURCHASE' | 'REDEEM_POINT' | 'REDEEM_STAMP';

export interface MemberHistory {
  id: string;
  memberId: string;
  memberName?: string;
  date: string; // ISO string or formatted date
  transactionId?: string;
  type: MemberHistoryType;
  details: string;
  pointsChange: number;
  stampsChange: number;
  amount?: number;
  promoId?: string;
  packageName?: string;
  packagePrice?: number;
}

export interface TransactionPackage {
  id: string;
  name: string;
  price: number;
}

export interface CustomTier {
  id: string;
  name: string;
  minPointsRequirement: string;
  benefitDescription: string;
  colorTheme?: string;
}

export interface LoyaltySettings {
  spendPerPoint: number; // e.g., 10000 -> Rp 10.000 = 1 point
  spendPerStamp: number; // e.g., 50000 -> Rp 50.000 = 1 stamp
  goldThresholdPoints: number; // e.g., 100 points -> Gold
  diamondThresholdPoints: number; // e.g., 500 points -> Diamond
  tierBenefits: {
    bronze: string;
    gold: string;
    diamond: string;
    bronzeMin: string;
    goldMin: string;
    diamondMin: string;
  };
  customTiers?: CustomTier[];
  presetPackages?: TransactionPackage[];
}

export type ActiveTab = 'admin' | 'monitor' | 'customer' | 'member';

