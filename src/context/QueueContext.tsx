import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Booth, Ticket, PrintSettings, ActivityLog, ActiveTab, ActivityAction } from '../types';
import { DEFAULT_BOOTHS, DEFAULT_PRINT_SETTINGS, INITIAL_TICKETS, INITIAL_LOGS } from '../data/defaultData';
import { announceQueueVoice } from '../utils/audio';
import { db, doc, onSnapshot, setDoc } from '../firebase';

interface QueueContextType {
  booths: Booth[];
  tickets: Ticket[];
  printSettings: PrintSettings;
  logs: ActivityLog[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedTicketForCustomer: Ticket | null;
  setSelectedTicketForCustomer: (ticket: Ticket | null) => void;
  lastCalledTicket: Ticket | null;
  activeTicketToPrint: Ticket | null;
  setActiveTicketToPrint: (ticket: Ticket | null) => void;
  isPrintModalOpen: boolean;
  setIsPrintModalOpen: (open: boolean) => void;

  // Admin Authentication State
  isAdminLoggedIn: boolean;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  adminPin: string;
  changeAdminPin: (newPin: string) => void;

  // Actions
  callNext: (boothId: string) => Ticket | null;
  printTicket: (boothId: string) => Ticket | null;
  recallTicket: (ticketId: string) => void;
  completeTicket: (ticketId: string) => void;
  cancelTicket: (ticketId: string) => void;
  deleteTicket: (ticketId: string) => void;
  addBooth: (boothData: { name: string; code: string; avgTimePerSession?: number; themeColor?: string }) => void;
  editBooth: (boothId: string, updated: Partial<Booth>) => void;
  deleteBooth: (boothId: string) => void;
  updatePrintSettings: (settings: Partial<PrintSettings>) => void;
  clearTodayLogs: () => void;
  resetQueue: () => void;
  
  // Audio state
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Firebase Quota & Offline state
  isQuotaExceeded: boolean;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_BOOTHS = 'photobooth_queue_booths_v1';
const LOCAL_STORAGE_KEY_TICKETS = 'photobooth_queue_tickets_v1';
const LOCAL_STORAGE_KEY_PRINT = 'photobooth_queue_print_v1';
const LOCAL_STORAGE_KEY_SCRIPT = 'photobooth_queue_script_v1';
const LOCAL_STORAGE_KEY_LOGS = 'photobooth_queue_logs_v1';

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [booths, setBooths] = useState<Booth[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BOOTHS);
      return saved ? JSON.parse(saved) : DEFAULT_BOOTHS;
    } catch {
      return DEFAULT_BOOTHS;
    }
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS);
      return saved ? JSON.parse(saved) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  });

  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PRINT);
      return saved ? { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_PRINT_SETTINGS;
    } catch {
      return DEFAULT_PRINT_SETTINGS;
    }
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  // Admin Authentication & PIN state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('photobooth_admin_logged_in') === 'true';
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('photobooth_admin_pin') || '1234';
  });

  const loginAdmin = useCallback((inputPin: string): boolean => {
    if (inputPin === adminPin) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('photobooth_admin_logged_in', 'true');
      return true;
    }
    return false;
  }, [adminPin]);

  const logoutAdmin = useCallback(() => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('photobooth_admin_logged_in');
    localStorage.removeItem('photobooth_admin_active_tab');
  }, []);

  // UI state
  const [activeTab, setActiveTabState] = useState<ActiveTab>('admin');
  const [selectedTicketForCustomer, setSelectedTicketForCustomer] = useState<Ticket | null>(null);
  const [lastCalledTicket, setLastCalledTicket] = useState<Ticket | null>(() => {
    try {
      const saved = localStorage.getItem('photobooth_last_called_ticket');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTicketToPrint, setActiveTicketToPrint] = useState<Ticket | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('photobooth_sound_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Ref to prevent polling from overwriting recent local updates (race condition prevention)
  const lastMutationTimeRef = useRef<number>(0);
  const isQuotaExceededRef = useRef<boolean>(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);

  // Save helper for Firebase Firestore
  const saveToFirebase = useCallback(
    async (
      newBooths: Booth[],
      newTickets: Ticket[],
      newPrint: PrintSettings,
      newLogs: ActivityLog[],
      newAdminPin: string,
      activeLastCalled?: Ticket | null
    ) => {
      if (isQuotaExceededRef.current) return;
      try {
        lastMutationTimeRef.current = Date.now();
        const docRef = doc(db, 'photobooth', 'appState');
        await setDoc(
          docRef,
          {
            booths: newBooths,
            tickets: newTickets,
            printSettings: newPrint,
            logs: (newLogs || []).slice(0, 25),
            adminPin: newAdminPin,
            lastCalledTicket: activeLastCalled !== undefined ? activeLastCalled : lastCalledTicket,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        const errCode = String(err?.code || '');
        if (errMsg.includes('Quota exceeded') || errCode.includes('resource-exhausted')) {
          isQuotaExceededRef.current = true;
          setIsQuotaExceeded(true);
          console.info('[QueueContext] Firebase Firestore quota limit reached. Seamlessly switched to Local Synchronization (BroadcastChannel & LocalStorage).');
        } else {
          console.warn('Firebase save error:', err);
        }
      }
    },
    [lastCalledTicket]
  );

  const setSoundEnabled = useCallback(
    (enabled: boolean | ((prev: boolean) => boolean)) => {
      setSoundEnabledState((prev) => {
        const next = typeof enabled === 'function' ? enabled(prev) : enabled;
        try {
          localStorage.setItem('photobooth_sound_enabled', JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to save sound preference:', e);
        }
        return next;
      });
    },
    []
  );

  const changeAdminPin = useCallback((newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('photobooth_admin_pin', newPin);
    saveToFirebase(booths, tickets, printSettings, logs, newPin, lastCalledTicket);
  }, [booths, tickets, logs, printSettings, lastCalledTicket, saveToFirebase]);

  // Broadcast Channel & Storage listener for multi-tab sync
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  // Lock ref to prevent rapid double inputs / clicks
  const lastActionTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY_TICKETS && e.newValue) {
        try { setTickets(JSON.parse(e.newValue)); } catch (err) { console.error(err); }
      }
      if (e.key === LOCAL_STORAGE_KEY_BOOTHS && e.newValue) {
        try { setBooths(JSON.parse(e.newValue)); } catch (err) { console.error(err); }
      }
      if (e.key === 'photobooth_last_called_ticket') {
        try { setLastCalledTicket(e.newValue ? JSON.parse(e.newValue) : null); } catch (err) { console.error(err); }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('photobooth_queue_channel');
      setBroadcastChannel(channel);

      channel.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'STATE_UPDATE') {
          if (data.booths) setBooths(data.booths);
          if (data.tickets) setTickets(data.tickets);
          if (data.printSettings) setPrintSettings(data.printSettings);
          if (data.logs) setLogs(data.logs);
          if (data.lastCalledTicket) setLastCalledTicket(data.lastCalledTicket);
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [soundEnabled]);

  // Read URL params on load to detect customer direct link e.g. ?ticket=VIN001 or ?view=customer or #admin
  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window === 'undefined') return;
      
      const searchParams = new URLSearchParams(window.location.search);
      const rawHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      const hashParams = new URLSearchParams(rawHash);

      let viewParam = (searchParams.get('view') || hashParams.get('view')) as ActiveTab | null;
      if (!viewParam && ['admin', 'monitor', 'customer'].includes(rawHash)) {
        viewParam = rawHash as ActiveTab;
      }

      const ticketParam =
        searchParams.get('ticket') ||
        searchParams.get('t') ||
        searchParams.get('ticketNumber') ||
        searchParams.get('no') ||
        hashParams.get('ticket') ||
        hashParams.get('t');

      if (viewParam && ['admin', 'monitor', 'customer'].includes(viewParam)) {
        setActiveTabState((prev) => (prev === viewParam ? prev : viewParam));
      }

      if (ticketParam) {
        const cleanNo = ticketParam.trim().toUpperCase();
        const found = tickets.find((t) => (t.ticketNumber || '').toString().trim().toUpperCase() === cleanNo);

        setSelectedTicketForCustomer((prev) => {
          if (found) {
            return prev?.id === found.id ? prev : found;
          }
          if (prev && (prev.ticketNumber || '').toString().trim().toUpperCase() === cleanNo) {
            return prev;
          }
          const boothCode = cleanNo.replace(/[^A-Z]/g, '').substring(0, 3) || 'BOOTH';
          const matchedBooth = booths.find((b) => b.code.toUpperCase() === boothCode) || (booths.length > 0 ? booths[0] : null);
          const seqNum = parseInt(cleanNo.replace(/\D/g, ''), 10) || 1;
          return {
            id: `virtual-${cleanNo}`,
            boothId: matchedBooth ? matchedBooth.id : 'b1',
            boothName: matchedBooth ? matchedBooth.name : 'Photobooth',
            boothCode: matchedBooth ? matchedBooth.code : boothCode,
            ticketNumber: cleanNo,
            sequence: seqNum,
            status: 'waiting',
            createdAt: new Date().toISOString(),
          };
        });

        setActiveTabState((prev) => (prev === 'customer' ? prev : 'customer'));
        try {
          localStorage.setItem('photobooth_customer_last_ticket_num', cleanNo);
        } catch (e) {
          console.error(e);
        }
      } else {
        // Auto-restore last searched ticket if active
        try {
          const savedNo = localStorage.getItem('photobooth_customer_last_ticket_num');
          if (savedNo) {
            const found = tickets.find((t) => (t.ticketNumber || '').toString().trim().toUpperCase() === savedNo.trim().toUpperCase());
            if (found) {
              setSelectedTicketForCustomer((prev) => (prev?.id === found.id ? prev : found));
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [tickets, booths]);

  // Ref to hold latest state for initial seeding without re-subscribing onSnapshot
  const stateRef = useRef({ booths, tickets, printSettings, logs, adminPin, lastCalledTicket, soundEnabled });
  useEffect(() => {
    stateRef.current = { booths, tickets, printSettings, logs, adminPin, lastCalledTicket, soundEnabled };
  }, [booths, tickets, printSettings, logs, adminPin, lastCalledTicket, soundEnabled]);

  // Firebase Realtime Firestore Subscription across all clients/devices
  useEffect(() => {
    const docRef = doc(db, 'photobooth', 'appState');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        // Skip updating state if local user action occurred within the last 1.2 seconds
        if (Date.now() - lastMutationTimeRef.current < 1200) {
          console.log('[QueueTrace FIRESTORE_SYNC] Skipping snapshot due to recent local mutation (<1200ms)');
          return;
        }

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            console.log('[QueueTrace FIRESTORE_SYNC] Snapshot synced:', {
              timestamp: new Date().toLocaleTimeString('id-ID'),
              ticketsCount: Array.isArray(data.tickets) ? data.tickets.length : 0,
              calledTickets: Array.isArray(data.tickets) ? data.tickets.filter((t: any) => t.status === 'called').map((t: any) => t.ticketNumber) : [],
              lastCalled: data.lastCalledTicket?.ticketNumber || 'None',
            });
            if (Array.isArray(data.booths)) {
              setBooths((prev) => (JSON.stringify(prev) === JSON.stringify(data.booths) ? prev : data.booths));
              try { localStorage.setItem(LOCAL_STORAGE_KEY_BOOTHS, JSON.stringify(data.booths)); } catch {}
            }
            if (Array.isArray(data.tickets)) {
              setTickets((prev) => (JSON.stringify(prev) === JSON.stringify(data.tickets) ? prev : data.tickets));
              try { localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(data.tickets)); } catch {}
            }
            if (data.printSettings) {
              const mergedPrint = { ...DEFAULT_PRINT_SETTINGS, ...data.printSettings };
              setPrintSettings((prev) => (JSON.stringify(prev) === JSON.stringify(mergedPrint) ? prev : mergedPrint));
              try { localStorage.setItem(LOCAL_STORAGE_KEY_PRINT, JSON.stringify(mergedPrint)); } catch {}
            }
            if (Array.isArray(data.logs)) {
              setLogs((prev) => (JSON.stringify(prev) === JSON.stringify(data.logs) ? prev : data.logs));
              try { localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(data.logs)); } catch {}
            }
            if (data.adminPin && typeof data.adminPin === 'string') {
              setAdminPin((prev) => (prev === data.adminPin ? prev : data.adminPin));
              try { localStorage.setItem('photobooth_admin_pin', data.adminPin); } catch {}
            }
            if (data.lastCalledTicket !== undefined) {
              const nextLast = data.lastCalledTicket as Ticket | null;
              setLastCalledTicket((prev) => (JSON.stringify(prev) === JSON.stringify(nextLast) ? prev : nextLast));
              if (nextLast) {
                try { localStorage.setItem('photobooth_last_called_ticket', JSON.stringify(nextLast)); } catch {}
              } else {
                try { localStorage.removeItem('photobooth_last_called_ticket'); } catch {}
              }
            }
          }
        } else {
          // Document does not exist yet on Firestore -> Seed initial state
          const s = stateRef.current;
          saveToFirebase(s.booths, s.tickets, s.printSettings, s.logs, s.adminPin, s.lastCalledTicket);
        }
      },
      (error) => {
        const errMsg = String(error?.message || error);
        const errCode = String((error as any)?.code || '');
        if (errMsg.includes('Quota exceeded') || errCode.includes('resource-exhausted')) {
          isQuotaExceededRef.current = true;
          setIsQuotaExceeded(true);
          console.info('[QueueContext] Firestore Quota exceeded. Offline Local Mode active (BroadcastChannel & LocalStorage).');
        } else {
          console.warn('Firebase onSnapshot error:', error);
        }
      }
    );

    return () => unsubscribe();
  }, [saveToFirebase]);

  // Save to LocalStorage, Firebase & broadcast
  const saveAndBroadcast = useCallback(
    (
      newBooths: Booth[],
      newTickets: Ticket[],
      newPrint: PrintSettings,
      newLogs: ActivityLog[],
      calledTicket?: Ticket | null
    ) => {
      lastMutationTimeRef.current = Date.now();
      const activeLastCalled = calledTicket !== undefined ? calledTicket : lastCalledTicket;
      localStorage.setItem(LOCAL_STORAGE_KEY_BOOTHS, JSON.stringify(newBooths));
      localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(newTickets));
      localStorage.setItem(LOCAL_STORAGE_KEY_PRINT, JSON.stringify(newPrint));
      localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(newLogs));
      if (activeLastCalled) {
        localStorage.setItem('photobooth_last_called_ticket', JSON.stringify(activeLastCalled));
      } else {
        localStorage.removeItem('photobooth_last_called_ticket');
      }

      saveToFirebase(newBooths, newTickets, newPrint, newLogs, adminPin, activeLastCalled);

      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'STATE_UPDATE',
          data: {
            booths: newBooths,
            tickets: newTickets,
            printSettings: newPrint,
            logs: newLogs,
            lastCalledTicket: activeLastCalled,
          },
        });
      }
    },
    [broadcastChannel, lastCalledTicket, adminPin, saveToFirebase]
  );

  const addLog = useCallback(
    (action: ActivityAction, details: string, boothName?: string, ticketNumber?: string): ActivityLog[] => {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString('id-ID'),
        action,
        details,
        boothName,
        ticketNumber,
      };
      // Cap at 25 items max to prevent excessive Firestore document size and sync collisions
      const updatedLogs = [newLog, ...logs].slice(0, 25);
      setLogs(updatedLogs);
      return updatedLogs;
    },
    [logs]
  );

  // Actions implementation
  const callNext = useCallback(
    (boothId: string): Ticket | null => {
      // Prevent double input within 450ms
      const now = Date.now();
      if (now - lastActionTimeRef.current < 450) {
        console.warn('[QueueTrace CALL_NEXT] Ignored duplicate click (<450ms)');
        return null;
      }
      lastActionTimeRef.current = now;

      const booth = booths.find((b) => b.id === boothId);
      if (!booth) return null;

      // Find waiting tickets for this booth sorted by sequence
      const waiting = tickets
        .filter((t) => t.boothId === boothId && t.status === 'waiting')
        .sort((a, b) => a.sequence - b.sequence);

      if (waiting.length === 0) {
        console.log(`[QueueTrace CALL_NEXT] No waiting tickets for booth ${booth.name}`);
        return null;
      }

      const ticketToCall = waiting[0];
      const nowIso = new Date().toISOString();

      const prevCalled = tickets.filter((t) => t.boothId === boothId && t.status === 'called');
      if (prevCalled.length > 0) {
        console.log(`[QueueTrace CALL_NEXT] Transitioning previous called tickets to completed for booth ${booth.name}:`, prevCalled.map(t => t.ticketNumber));
      }

      console.log(`[QueueTrace CALL_NEXT] Calling ticket ${ticketToCall.ticketNumber} for booth ${booth.name}`);

      const updatedTickets = tickets.map((t) => {
        if (t.boothId === boothId && (t.status === 'called' || (t.status as string) === 'serving')) {
          return {
            ...t,
            status: 'completed' as const,
            completedAt: nowIso,
          };
        }
        if (t.id === ticketToCall.id) {
          return {
            ...t,
            status: 'called' as const,
            calledAt: nowIso,
          };
        }
        return t;
      });

      const updatedBooths = booths.map((b) =>
        b.id === boothId ? { ...b, currentNumber: ticketToCall.sequence } : b
      );

      const calledTicket: Ticket = {
        ...ticketToCall,
        status: 'called',
        calledAt: new Date().toISOString(),
      };

      const updatedLogs = addLog(
        'CALL_NEXT',
        `Memanggil antrian ${ticketToCall.ticketNumber}`,
        booth.name,
        ticketToCall.ticketNumber
      );

      setBooths(updatedBooths);
      setTickets(updatedTickets);
      setLastCalledTicket(calledTicket);

      saveAndBroadcast(updatedBooths, updatedTickets, printSettings, updatedLogs, calledTicket);

      // Play sound
      if (soundEnabled) {
        announceQueueVoice(ticketToCall.ticketNumber, booth.name, {
          voiceName: printSettings.speechVoiceName,
          rate: printSettings.speechRate,
          pitch: printSettings.speechPitch,
        });
      }

      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'CALL_ANNOUNCEMENT',
          data: {
            ticket: calledTicket,
            boothName: booth.name,
          },
        });
      }

      return calledTicket;
    },
    [booths, tickets, addLog, saveAndBroadcast, printSettings, soundEnabled, broadcastChannel]
  );

  const printTicket = useCallback(
    (boothId: string): Ticket | null => {
      // Prevent double input within 450ms
      const now = Date.now();
      if (now - lastActionTimeRef.current < 450) {
        return null;
      }
      lastActionTimeRef.current = now;

      const booth = booths.find((b) => b.id === boothId);
      if (!booth) throw new Error('Booth not found');

      const nextSeq = booth.totalTickets + 1;
      const formattedSeq = String(nextSeq).padStart(3, '0');
      const ticketNumber = `${booth.code}${formattedSeq}`;

      const newTicket: Ticket = {
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        boothId: booth.id,
        boothName: booth.name,
        boothCode: booth.code,
        ticketNumber,
        sequence: nextSeq,
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      const updatedBooths = booths.map((b) =>
        b.id === boothId ? { ...b, totalTickets: nextSeq } : b
      );

      const updatedTickets = [...tickets, newTicket];
      const updatedLogs = addLog(
        'PRINT_TICKET',
        `Mencetak tiket baru ${ticketNumber}`,
        booth.name,
        ticketNumber
      );

      setBooths(updatedBooths);
      setTickets(updatedTickets);
      setActiveTicketToPrint(newTicket);
      setIsPrintModalOpen(true);

      saveAndBroadcast(updatedBooths, updatedTickets, printSettings, updatedLogs);

      return newTicket;
    },
    [booths, tickets, addLog, saveAndBroadcast, printSettings]
  );

  const recallTicket = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const nowIso = new Date().toISOString();
      const updatedTickets = tickets.map((t) => {
        if (t.boothId === ticket.boothId && (t.status === 'called' || (t.status as string) === 'serving') && t.id !== ticketId) {
          return { ...t, status: 'completed' as const, completedAt: nowIso };
        }
        if (t.id === ticketId) {
          return { ...t, status: 'called' as const, calledAt: nowIso };
        }
        return t;
      });

      if (soundEnabled) {
        announceQueueVoice(ticket.ticketNumber, ticket.boothName, {
          voiceName: printSettings.speechVoiceName,
          rate: printSettings.speechRate,
          pitch: printSettings.speechPitch,
        });
      }

      const updatedLogs = addLog(
        'RECALL',
        `Memanggil ulang antrian ${ticket.ticketNumber}`,
        ticket.boothName,
        ticket.ticketNumber
      );

      const recalledTicket = { ...ticket, status: 'called' as const, calledAt: nowIso };

      setTickets(updatedTickets);
      setLastCalledTicket(recalledTicket);
      saveAndBroadcast(booths, updatedTickets, printSettings, updatedLogs, recalledTicket);
    },
    [tickets, soundEnabled, addLog, saveAndBroadcast, booths, printSettings]
  );

  const completeTicket = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const updatedTickets = tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
            }
          : t
      );

      const updatedLogs = addLog(
        'COMPLETE',
        `Selesai sesi fotobooth ${ticket.ticketNumber}`,
        ticket.boothName,
        ticket.ticketNumber
      );

      setTickets(updatedTickets);
      saveAndBroadcast(booths, updatedTickets, printSettings, updatedLogs);
    },
    [tickets, addLog, saveAndBroadcast, booths, printSettings]
  );

  const cancelTicket = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const updatedTickets = tickets.map((t) =>
        t.id === ticketId ? { ...t, status: 'cancelled' as const } : t
      );

      const updatedLogs = addLog(
        'CANCEL',
        `Membatalkan tiket ${ticket.ticketNumber}`,
        ticket.boothName,
        ticket.ticketNumber
      );

      setTickets(updatedTickets);
      saveAndBroadcast(booths, updatedTickets, printSettings, updatedLogs);
    },
    [tickets, addLog, saveAndBroadcast, booths, printSettings]
  );

  const deleteTicket = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const updatedTickets = tickets.filter((t) => t.id !== ticketId);

      const updatedLogs = addLog(
        'CANCEL',
        `Menghapus antrian ${ticket.ticketNumber}`,
        ticket.boothName,
        ticket.ticketNumber
      );

      setTickets(updatedTickets);
      if (lastCalledTicket?.id === ticketId) {
        setLastCalledTicket(null);
      }
      if (selectedTicketForCustomer?.id === ticketId) {
        setSelectedTicketForCustomer(null);
      }
      saveAndBroadcast(booths, updatedTickets, printSettings, updatedLogs);
    },
    [tickets, addLog, saveAndBroadcast, booths, printSettings, lastCalledTicket, selectedTicketForCustomer]
  );

  const addBooth = useCallback(
    (boothData: { name: string; code: string; avgTimePerSession?: number; themeColor?: string }) => {
      const codeClean = boothData.code.trim().toUpperCase() || 'BTH';
      const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'];
      const randomColor = colors[booths.length % colors.length];

      const newBooth: Booth = {
        id: `booth-${Date.now()}`,
        name: boothData.name.trim(),
        code: codeClean,
        currentNumber: 0,
        totalTickets: 0,
        status: 'active',
        avgTimePerSession: boothData.avgTimePerSession || 5,
        themeColor: boothData.themeColor || randomColor,
      };

      const updatedBooths = [...booths, newBooth];
      const updatedLogs = addLog('ADD_BOOTH', `Menambah booth baru "${newBooth.name}" (${newBooth.code})`, newBooth.name);

      setBooths(updatedBooths);
      saveAndBroadcast(updatedBooths, tickets, printSettings, updatedLogs);
    },
    [booths, addLog, saveAndBroadcast, tickets, printSettings]
  );

  const editBooth = useCallback(
    (boothId: string, updated: Partial<Booth>) => {
      const updatedBooths = booths.map((b) => (b.id === boothId ? { ...b, ...updated } : b));
      const targetBooth = updatedBooths.find((b) => b.id === boothId);

      const updatedLogs = addLog(
        'EDIT_BOOTH',
        `Mengubah pengaturan booth "${targetBooth?.name || boothId}"`,
        targetBooth?.name
      );

      setBooths(updatedBooths);
      saveAndBroadcast(updatedBooths, tickets, printSettings, updatedLogs);
    },
    [booths, addLog, saveAndBroadcast, tickets, printSettings]
  );

  const deleteBooth = useCallback(
    (boothId: string) => {
      const target = booths.find((b) => b.id === boothId);
      const updatedBooths = booths.filter((b) => b.id !== boothId);
      const updatedLogs = addLog('CANCEL', `Menghapus booth "${target?.name || boothId}"`);

      setBooths(updatedBooths);
      saveAndBroadcast(updatedBooths, tickets, printSettings, updatedLogs);
    },
    [booths, addLog, saveAndBroadcast, tickets, printSettings]
  );

  const updatePrintSettings = useCallback(
    (settings: Partial<PrintSettings>) => {
      const updated = { ...printSettings, ...settings };
      const updatedLogs = addLog('UPDATE_SETTINGS', 'Mengubah pengaturan label cetak tiket');

      setPrintSettings(updated);
      saveAndBroadcast(booths, tickets, updated, updatedLogs);
    },
    [printSettings, addLog, saveAndBroadcast, booths, tickets]
  );

  const clearTodayLogs = useCallback(() => {
    lastMutationTimeRef.current = Date.now();
    setLogs([]);
    saveAndBroadcast(booths, tickets, printSettings, []);
  }, [booths, tickets, printSettings, saveAndBroadcast]);

  const resetQueue = useCallback(() => {
    lastMutationTimeRef.current = Date.now();
    const resetBooths = booths.map((b) => ({ ...b, currentNumber: 0, totalTickets: 0 }));
    const resetLogs: ActivityLog[] = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString('id-ID'),
        action: 'RESET_QUEUE',
        details: 'Mereset ulang antrian hari ini ke 0',
      },
    ];

    setBooths(resetBooths);
    setTickets([]);
    setLogs(resetLogs);
    setLastCalledTicket(null);
    setSelectedTicketForCustomer(null);
    try {
      localStorage.removeItem('photobooth_customer_last_ticket_num');
    } catch (err) {
      console.error(err);
    }
    saveAndBroadcast(resetBooths, [], printSettings, resetLogs, null);
  }, [booths, saveAndBroadcast, printSettings]);

  const setActiveTab = useCallback((tab: ActiveTab) => {
    setActiveTabState(tab);
    // Update URL query string with pushState so history works
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', tab);
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  return (
    <QueueContext.Provider
      value={{
        booths,
        tickets,
        printSettings,
        logs,
        activeTab,
        setActiveTab,
        selectedTicketForCustomer,
        setSelectedTicketForCustomer,
        lastCalledTicket,
        activeTicketToPrint,
        setActiveTicketToPrint,
        isPrintModalOpen,
        setIsPrintModalOpen,

        isAdminLoggedIn,
        loginAdmin,
        logoutAdmin,
        adminPin,
        changeAdminPin,

        callNext,
        printTicket,
        recallTicket,
        completeTicket,
        cancelTicket,
        deleteTicket,
        addBooth,
        editBooth,
        deleteBooth,
        updatePrintSettings,
        clearTodayLogs,
        resetQueue,

        soundEnabled,
        setSoundEnabled,
        isQuotaExceeded,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
