import { TicketPaperWidth } from '../types';

export interface PaperDimensionSpec {
  widthMm: number;
  heightMm: number | null; // null for continuous roll
  widthPx: string;
  heightPx: string; // 'auto' or e.g. '113px'
  pageSizeCss: string; // e.g. '50mm 30mm'
  paddingClass: string;
  printPaddingCss: string;
  logoMaxPx: number;
  qrSizePx: number;
  ticketNumberClass: string;
  headerTitleClass: string;
  subHeaderClass: string;
  textDetailClass: string;
  footerClass: string;
  dividerText: string;
  isCompactHeight: boolean;
  isMicroHeight: boolean;
}

export const getPaperDimensionSpec = (paperWidth?: TicketPaperWidth): PaperDimensionSpec => {
  switch (paperWidth) {
    case '70x20mm':
      return {
        widthMm: 70,
        heightMm: 20,
        widthPx: '264px',
        heightPx: '75px',
        pageSizeCss: '70mm 20mm',
        paddingClass: 'px-2 py-0.5',
        printPaddingCss: '1.5mm 2.5mm',
        logoMaxPx: 16,
        qrSizePx: 32,
        ticketNumberClass: 'text-base font-black my-0 leading-none',
        headerTitleClass: 'text-[8px] font-black leading-none uppercase',
        subHeaderClass: 'text-[7px] leading-none',
        textDetailClass: 'text-[7.5px] leading-none font-mono',
        footerClass: 'text-[7px] leading-none',
        dividerText: '--------------------',
        isCompactHeight: true,
        isMicroHeight: true,
      };

    case '50x30mm':
      return {
        widthMm: 50,
        heightMm: 30,
        widthPx: '189px',
        heightPx: '113px',
        pageSizeCss: '50mm 30mm',
        paddingClass: 'p-1.5',
        printPaddingCss: '2mm',
        logoMaxPx: 22,
        qrSizePx: 42,
        ticketNumberClass: 'text-xl font-black my-0.5 leading-none',
        headerTitleClass: 'text-[9px] font-black leading-tight uppercase',
        subHeaderClass: 'text-[8px] leading-tight',
        textDetailClass: 'text-[8px] leading-tight font-mono',
        footerClass: 'text-[7.5px] leading-tight',
        dividerText: '----------------',
        isCompactHeight: true,
        isMicroHeight: false,
      };

    case '50x40mm':
      return {
        widthMm: 50,
        heightMm: 40,
        widthPx: '189px',
        heightPx: '151px',
        pageSizeCss: '50mm 40mm',
        paddingClass: 'p-2',
        printPaddingCss: '2.5mm',
        logoMaxPx: 28,
        qrSizePx: 50,
        ticketNumberClass: 'text-2xl font-black my-0.5 leading-none',
        headerTitleClass: 'text-[10px] font-black leading-tight uppercase',
        subHeaderClass: 'text-[8.5px] leading-tight',
        textDetailClass: 'text-[8.5px] leading-tight font-mono',
        footerClass: 'text-[8px] leading-tight',
        dividerText: '----------------',
        isCompactHeight: true,
        isMicroHeight: false,
      };

    case '57x40mm':
      return {
        widthMm: 57,
        heightMm: 40,
        widthPx: '215px',
        heightPx: '151px',
        pageSizeCss: '57mm 40mm',
        paddingClass: 'p-2',
        printPaddingCss: '2.5mm',
        logoMaxPx: 32,
        qrSizePx: 54,
        ticketNumberClass: 'text-2xl font-black my-0.5 leading-none',
        headerTitleClass: 'text-[10px] font-black leading-tight uppercase',
        subHeaderClass: 'text-[9px] leading-tight',
        textDetailClass: 'text-[9px] leading-tight font-mono',
        footerClass: 'text-[8px] leading-tight',
        dividerText: '------------------',
        isCompactHeight: true,
        isMicroHeight: false,
      };

    case '60x40mm':
      return {
        widthMm: 60,
        heightMm: 40,
        widthPx: '226px',
        heightPx: '151px',
        pageSizeCss: '60mm 40mm',
        paddingClass: 'p-2',
        printPaddingCss: '2.5mm',
        logoMaxPx: 34,
        qrSizePx: 58,
        ticketNumberClass: 'text-2xl font-black my-0.5 leading-none',
        headerTitleClass: 'text-[10px] font-black leading-tight uppercase',
        subHeaderClass: 'text-[9px] leading-tight',
        textDetailClass: 'text-[9px] leading-tight font-mono',
        footerClass: 'text-[8.5px] leading-tight',
        dividerText: '--------------------',
        isCompactHeight: true,
        isMicroHeight: false,
      };

    case '80x50mm':
      return {
        widthMm: 80,
        heightMm: 50,
        widthPx: '300px',
        heightPx: '189px',
        pageSizeCss: '80mm 50mm',
        paddingClass: 'p-2.5',
        printPaddingCss: '3mm',
        logoMaxPx: 38,
        qrSizePx: 68,
        ticketNumberClass: 'text-3xl font-black my-1 leading-none',
        headerTitleClass: 'text-xs font-black leading-tight uppercase',
        subHeaderClass: 'text-[10px] leading-tight',
        textDetailClass: 'text-[10px] leading-tight font-mono',
        footerClass: 'text-[9px] leading-tight',
        dividerText: '--------------------------------',
        isCompactHeight: true,
        isMicroHeight: false,
      };

    case '76x100mm':
    case '78x100mm':
      return {
        widthMm: 76,
        heightMm: 100,
        widthPx: '287px',
        heightPx: '378px',
        pageSizeCss: '76mm 100mm',
        paddingClass: 'p-3.5',
        printPaddingCss: '4mm',
        logoMaxPx: 52,
        qrSizePx: 95,
        ticketNumberClass: 'text-4xl font-black my-1.5 leading-tight',
        headerTitleClass: 'text-xs font-black uppercase tracking-wider',
        subHeaderClass: 'text-[10px]',
        textDetailClass: 'text-[10.5px] font-mono',
        footerClass: 'text-[9.5px]',
        dividerText: '------------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };

    case '76x130mm':
      return {
        widthMm: 76,
        heightMm: 130,
        widthPx: '287px',
        heightPx: '491px',
        pageSizeCss: '76mm 130mm',
        paddingClass: 'p-4',
        printPaddingCss: '5mm',
        logoMaxPx: 60,
        qrSizePx: 110,
        ticketNumberClass: 'text-4xl font-black my-2 leading-tight',
        headerTitleClass: 'text-sm font-black uppercase tracking-wider',
        subHeaderClass: 'text-xs',
        textDetailClass: 'text-xs font-mono',
        footerClass: 'text-[10px]',
        dividerText: '------------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };

    case '100x100mm':
      return {
        widthMm: 100,
        heightMm: 100,
        widthPx: '378px',
        heightPx: '378px',
        pageSizeCss: '100mm 100mm',
        paddingClass: 'p-4',
        printPaddingCss: '5mm',
        logoMaxPx: 64,
        qrSizePx: 115,
        ticketNumberClass: 'text-5xl font-black my-2 leading-tight',
        headerTitleClass: 'text-sm font-black uppercase tracking-wider',
        subHeaderClass: 'text-xs',
        textDetailClass: 'text-xs font-mono',
        footerClass: 'text-[10px]',
        dividerText: '----------------------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };

    case '100x150mm':
      return {
        widthMm: 100,
        heightMm: 150,
        widthPx: '378px',
        heightPx: '567px',
        pageSizeCss: '100mm 150mm',
        paddingClass: 'p-5',
        printPaddingCss: '6mm',
        logoMaxPx: 72,
        qrSizePx: 135,
        ticketNumberClass: 'text-5xl font-black my-3 leading-none',
        headerTitleClass: 'text-base font-black uppercase tracking-wider',
        subHeaderClass: 'text-xs sm:text-sm',
        textDetailClass: 'text-xs sm:text-sm font-mono',
        footerClass: 'text-xs',
        dividerText: '----------------------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };

    case '100x180mm':
      return {
        widthMm: 100,
        heightMm: 180,
        widthPx: '378px',
        heightPx: '680px',
        pageSizeCss: '100mm 180mm',
        paddingClass: 'p-6',
        printPaddingCss: '7mm',
        logoMaxPx: 80,
        qrSizePx: 145,
        ticketNumberClass: 'text-6xl font-black my-3.5 leading-none',
        headerTitleClass: 'text-lg font-black uppercase tracking-wider',
        subHeaderClass: 'text-sm',
        textDetailClass: 'text-sm font-mono',
        footerClass: 'text-xs',
        dividerText: '----------------------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };

    case '100x200mm':
      return {
        widthMm: 100,
        heightMm: 200,
        widthPx: '378px',
        heightPx: '755px',
        pageSizeCss: '100mm 200mm',
        paddingClass: 'p-6',
        printPaddingCss: '8mm',
        logoMaxPx: 88,
        qrSizePx: 155,
        ticketNumberClass: 'text-6xl font-black my-4 leading-none',
        headerTitleClass: 'text-xl font-black uppercase tracking-wider',
        subHeaderClass: 'text-sm',
        textDetailClass: 'text-sm font-mono',
        footerClass: 'text-xs',
        dividerText: '----------------------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };

    case '210x300mm':
      return {
        widthMm: 210,
        heightMm: 300,
        widthPx: '780px',
        heightPx: '1130px',
        pageSizeCss: '210mm 300mm',
        paddingClass: 'p-8',
        printPaddingCss: '10mm',
        logoMaxPx: 120,
        qrSizePx: 210,
        ticketNumberClass: 'text-7xl font-black my-6 leading-none',
        headerTitleClass: 'text-2xl font-black uppercase tracking-wider',
        subHeaderClass: 'text-base',
        textDetailClass: 'text-base font-mono',
        footerClass: 'text-sm',
        dividerText: '----------------------------------------------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };

    case '80mm':
      return {
        widthMm: 80,
        heightMm: null,
        widthPx: '300px',
        heightPx: 'auto',
        pageSizeCss: '80mm auto',
        paddingClass: 'p-4',
        printPaddingCss: '3mm 4mm',
        logoMaxPx: 54,
        qrSizePx: 100,
        ticketNumberClass: 'text-4xl font-black my-1.5 leading-none',
        headerTitleClass: 'text-xs font-black uppercase tracking-wider',
        subHeaderClass: 'text-[11px]',
        textDetailClass: 'text-[11px] font-mono',
        footerClass: 'text-[9.5px]',
        dividerText: '--------------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };

    case '58mm':
    default:
      return {
        widthMm: 58,
        heightMm: null,
        widthPx: '230px',
        heightPx: 'auto',
        pageSizeCss: '58mm auto',
        paddingClass: 'p-3',
        printPaddingCss: '2.5mm 3mm',
        logoMaxPx: 42,
        qrSizePx: 80,
        ticketNumberClass: 'text-3xl font-black my-1 leading-none',
        headerTitleClass: 'text-[11px] font-black uppercase tracking-wider',
        subHeaderClass: 'text-[9.5px]',
        textDetailClass: 'text-[9.5px] font-mono',
        footerClass: 'text-[8.5px]',
        dividerText: '-------------------------',
        isCompactHeight: false,
        isMicroHeight: false,
      };
  }
};
