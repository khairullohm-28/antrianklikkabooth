import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Booth, Ticket, PrintSettings, AppsScriptConfig, ActivityLog, ActiveTab, ActivityAction } from '../types';
import { DEFAULT_BOOTHS, DEFAULT_PRINT_SETTINGS, DEFAULT_APPS_SCRIPT_CONFIG, INITIAL_TICKETS, INITIAL_LOGS } from '../data/defaultData';
import { announceQueueVoice } from '../utils/audio';
import { syncToGoogleAppsScript, fetchFromGoogleAppsScript } from '../utils/googleAppsScript';
import { db, doc, onSnapshot, setDoc } from '../firebase';

interface QueueContextType {
  booths: Booth[];
  tickets: Ticket[];
  printSettings: PrintSettings;
  appsScriptConfig: AppsScriptConfig;
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
  updateAppsScriptConfig: (config: Partial<AppsScriptConfig>) => void;
  clearTodayLogs: () => void;
  resetQueue: () => void;
  triggerSyncToGoogleSheets: () => Promise<void>;
  
  // Audio state
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
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

  const [appsScriptConfig, setAppsScriptConfig] = useState<AppsScriptConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SCRIPT);
      return saved ? JSON.parse(saved) : DEFAULT_APPS_SCRIPT_CONFIG;
    } catch {
      return DEFAULT_APPS_SCRIPT_CONFIG;
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

  // Save helper for Firebase Firestore
  const saveToFirebase = useCallback(
    async (
      newBooths: Booth[],
      newTickets: Ticket[],
      newPrint: PrintSettings,
      newScript: AppsScriptConfig,
      newLogs: ActivityLog[],
      newAdminPin: string,
      activeLastCalled?: Ticket | null,
      newSoundEnabled?: boolean
    ) => {
      try {
        lastMutationTimeRef.current = Date.now();
        const docRef = doc(db, 'photobooth', 'appState');
        await setDoc(
          docRef,
          {
            booths: newBooths,
            tickets: newTickets,
            printSettings: newPrint,
            appsScriptConfig: newScript,
            logs: newLogs,
            adminPin: newAdminPin,
            lastCalledTicket: activeLastCalled !== undefined ? activeLastCalled : lastCalledTicket,
            soundEnabled: newSoundEnabled !== undefined ? newSoundEnabled : soundEnabled,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firebase save error:', err);
      }
    },
    [lastCalledTicket, soundEnabled]
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
        saveToFirebase(booths, tickets, printSettings, appsScriptConfig, logs, adminPin, lastCalledTicket, next);
        return next;
      });
    },
    [booths, tickets, printSettings, appsScriptConfig, logs, adminPin, lastCalledTicket, saveToFirebase]
  );

  const changeAdminPin = useCallback((newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('photobooth_admin_pin', newPin);
    saveToFirebase(booths, tickets, printSettings, appsScriptConfig, logs, newPin, lastCalledTicket);
    if (appsScriptConfig.enabled && appsScriptConfig.autoSync && appsScriptConfig.webAppUrl) {
      syncToGoogleAppsScript(appsScriptConfig, booths, tickets, logs, newPin);
    }
  }, [appsScriptConfig, booths, tickets, logs, printSettings, lastCalledTicket, saveToFirebase]);

  // Broadcast Channel & Storage listener for multi-tab sync
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  // Lock ref to prevent rapid double inputs / clicks
  const lastActionTimeRef = useRef<number>(0);

  // Periodic Google Apps Script remote polling (every 800ms if enabled - sub-second realtime)
  useEffect(() => {
    if (!appsScriptConfig.enabled || !appsScriptConfig.webAppUrl) return;

    const pollAppsScript = async () => {
      try {
        // Do not overwrite local state if a local action occurred within the last 1.2 seconds
        if (Date.now() - lastMutationTimeRef.current < 1200) {
          return;
        }

        const res = await fetchFromGoogleAppsScript(appsScriptConfig);

        // Re-check mutation lock after async fetch completes
        if (Date.now() - lastMutationTimeRef.current < 1200) {
          return;
        }

        if (res.success) {
          if (res.adminPin && res.adminPin.trim().length > 0) {
            setAdminPin((prev) => {
              if (prev !== res.adminPin) {
                localStorage.setItem('photobooth_admin_pin', res.adminPin!);
                return res.adminPin!;
              }
              return prev;
            });
          }
          if (Array.isArray(res.tickets)) {
            setTickets((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(res.tickets)) {
                localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(res.tickets));
                return res.tickets;
              }
              return prev;
            });

            // Sync lastCalledTicket from remote tickets
            const calledTickets = res.tickets.filter((t) => t.status === 'called');
            if (calledTickets.length > 0) {
              // Get the most recently called ticket
              const latestCalled = [...calledTickets].sort((a, b) => {
                const timeA = a.calledAt ? new Date(a.calledAt).getTime() : 0;
                const timeB = b.calledAt ? new Date(b.calledAt).getTime() : 0;
                return timeB - timeA;
              })[0];

              setLastCalledTicket((prevLast) => {
                if (!prevLast || prevLast.id !== latestCalled.id || prevLast.calledAt !== latestCalled.calledAt) {
                  localStorage.setItem('photobooth_last_called_ticket', JSON.stringify(latestCalled));
                  if (soundEnabled) {
                    announceQueueVoice(latestCalled.ticketNumber, latestCalled.boothName, {
                      voiceName: printSettings.speechVoiceName,
                      rate: printSettings.speechRate,
                      pitch: printSettings.speechPitch,
                    });
                  }
                  return latestCalled;
                }
                return prevLast;
              });
            } else {
              if (res.tickets.length === 0 || !res.tickets.some((t) => t.status === 'called')) {
                setLastCalledTicket(null);
                localStorage.removeItem('photobooth_last_called_ticket');
              }
            }
          }
          if (Array.isArray(res.booths) && res.booths.length > 0) {
            setBooths((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(res.booths)) {
                localStorage.setItem(LOCAL_STORAGE_KEY_BOOTHS, JSON.stringify(res.booths));
                return res.booths;
              }
              return prev;
            });
          }
          if (Array.isArray(res.logs)) {
            setLogs((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(res.logs)) {
                localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(res.logs));
                return res.logs;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn('Error during pollAppsScript:', err);
      }
    };

    // Initial fetch on mount / enable
    pollAppsScript();

    const interval = setInterval(pollAppsScript, 800);
    return () => clearInterval(interval);
  }, [appsScriptConfig, soundEnabled]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY_TICKETS && e.newValue) {
        try { setTickets(JSON.parse(e.newValue)); } catch (err) { console.error(err); }
      }
      if (e.key === LOCAL_STORAGE_KEY_BOOTHS && e.newValue) {
        try { setBooths(JSON.parse(e.newValue)); } catch (err) { console.error(err); }
      }
      if (e.key === LOCAL_STORAGE_KEY_SCRIPT && e.newValue) {
        try { setAppsScriptConfig(JSON.parse(e.newValue)); } catch (err) { console.error(err); }
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
          if (data.appsScriptConfig) {
            setAppsScriptConfig(data.appsScriptConfig);
            try { localStorage.setItem(LOCAL_STORAGE_KEY_SCRIPT, JSON.stringify(data.appsScriptConfig)); } catch (e) { console.error(e); }
          }
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
      if (!viewParam && ['admin', 'monitor', 'customer', 'script-guide'].includes(rawHash)) {
        viewParam = rawHash as ActiveTab;
      }

      const ticketParam =
        searchParams.get('ticket') ||
        searchParams.get('t') ||
        searchParams.get('ticketNumber') ||
        searchParams.get('no') ||
        hashParams.get('ticket') ||
        hashParams.get('t');

      const gasParam =
        searchParams.get('gas') ||
        searchParams.get('script') ||
        searchParams.get('scriptUrl') ||
        hashParams.get('gas');

      if (gasParam) {
        try {
          const decodedUrl = decodeURIComponent(gasParam);
          if (decodedUrl && decodedUrl.startsWith('http')) {
            const newConfig: AppsScriptConfig = {
              enabled: true,
              autoSync: true,
              webAppUrl: decodedUrl,
              syncStatus: 'idle',
            };
            setAppsScriptConfig(newConfig);
            localStorage.setItem(LOCAL_STORAGE_KEY_SCRIPT, JSON.stringify(newConfig));

            // Immediate fetch on mobile when opened via QR code / URL parameter
            fetchFromGoogleAppsScript(newConfig).then((res) => {
              if (res.success) {
                if (Array.isArray(res.tickets)) setTickets(res.tickets);
                if (Array.isArray(res.booths)) setBooths(res.booths);
                if (Array.isArray(res.logs)) setLogs(res.logs);
              }
            });
          }
        } catch (e) {
          console.error('Failed to parse gas param from URL:', e);
        }
      }

      if (viewParam && ['admin', 'monitor', 'customer', 'script-guide'].includes(viewParam)) {
        setActiveTabState(viewParam);
      }

      if (ticketParam) {
        const cleanNo = ticketParam.trim().toUpperCase();
        const found = tickets.find((t) => t.ticketNumber.trim().toUpperCase() === cleanNo);
        if (found) {
          setSelectedTicketForCustomer(found);
        } else if (!selectedTicketForCustomer || selectedTicketForCustomer.ticketNumber !== cleanNo) {
          const boothCode = cleanNo.replace(/[^A-Z]/g, '').substring(0, 3) || 'BOOTH';
          const matchedBooth = booths.find((b) => b.code.toUpperCase() === boothCode) || (booths.length > 0 ? booths[0] : null);
          const seqNum = parseInt(cleanNo.replace(/\D/g, ''), 10) || 1;
          const virtualTicket: Ticket = {
            id: `virtual-${cleanNo}`,
            boothId: matchedBooth ? matchedBooth.id : 'b1',
            boothName: matchedBooth ? matchedBooth.name : 'Photobooth',
            boothCode: matchedBooth ? matchedBooth.code : boothCode,
            ticketNumber: cleanNo,
            sequence: seqNum,
            status: 'waiting',
            createdAt: new Date().toISOString(),
          };
          setSelectedTicketForCustomer(virtualTicket);
        }
        setActiveTabState('customer');
        try {
          localStorage.setItem('photobooth_customer_last_ticket_num', cleanNo);
        } catch (e) {
          console.error(e);
        }
      } else if (!selectedTicketForCustomer) {
        // Auto-restore last searched ticket if active
        try {
          const savedNo = localStorage.getItem('photobooth_customer_last_ticket_num');
          if (savedNo) {
            const found = tickets.find((t) => t.ticketNumber.trim().toUpperCase() === savedNo.trim().toUpperCase());
            if (found) {
              setSelectedTicketForCustomer(found);
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
  }, [tickets, selectedTicketForCustomer]);

  // Ref to hold latest state for initial seeding without re-subscribing onSnapshot
  const stateRef = useRef({ booths, tickets, printSettings, appsScriptConfig, logs, adminPin, lastCalledTicket, soundEnabled });
  useEffect(() => {
    stateRef.current = { booths, tickets, printSettings, appsScriptConfig, logs, adminPin, lastCalledTicket, soundEnabled };
  }, [booths, tickets, printSettings, appsScriptConfig, logs, adminPin, lastCalledTicket, soundEnabled]);

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
              setBooths(data.booths);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_BOOTHS, JSON.stringify(data.booths)); } catch {}
            }
            if (Array.isArray(data.tickets)) {
              setTickets(data.tickets);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(data.tickets)); } catch {}
            }
            if (data.printSettings) {
              const mergedPrint = { ...DEFAULT_PRINT_SETTINGS, ...data.printSettings };
              setPrintSettings(mergedPrint);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_PRINT, JSON.stringify(mergedPrint)); } catch {}
            }
            if (data.appsScriptConfig) {
              setAppsScriptConfig(data.appsScriptConfig);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_SCRIPT, JSON.stringify(data.appsScriptConfig)); } catch {}
            }
            if (Array.isArray(data.logs)) {
              setLogs(data.logs);
              try { localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(data.logs)); } catch {}
            }
            if (data.adminPin && typeof data.adminPin === 'string') {
              setAdminPin(data.adminPin);
              try { localStorage.setItem('photobooth_admin_pin', data.adminPin); } catch {}
            }
            if (data.soundEnabled !== undefined && typeof data.soundEnabled === 'boolean') {
              setSoundEnabledState(data.soundEnabled);
              try { localStorage.setItem('photobooth_sound_enabled', JSON.stringify(data.soundEnabled)); } catch {}
            }
            if (data.lastCalledTicket !== undefined) {
              const nextLast = data.lastCalledTicket as Ticket | null;
              setLastCalledTicket(nextLast);
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
          saveToFirebase(s.booths, s.tickets, s.printSettings, s.appsScriptConfig, s.logs, s.adminPin, s.lastCalledTicket, s.soundEnabled);
        }
      },
      (error) => {
        console.warn('Firebase onSnapshot error:', error);
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
      newScript: AppsScriptConfig,
      newLogs: ActivityLog[],
      calledTicket?: Ticket | null
    ) => {
      lastMutationTimeRef.current = Date.now();
      const activeLastCalled = calledTicket !== undefined ? calledTicket : lastCalledTicket;
      localStorage.setItem(LOCAL_STORAGE_KEY_BOOTHS, JSON.stringify(newBooths));
      localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(newTickets));
      localStorage.setItem(LOCAL_STORAGE_KEY_PRINT, JSON.stringify(newPrint));
      localStorage.setItem(LOCAL_STORAGE_KEY_SCRIPT, JSON.stringify(newScript));
      localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(newLogs));
      if (activeLastCalled) {
        localStorage.setItem('photobooth_last_called_ticket', JSON.stringify(activeLastCalled));
      } else {
        localStorage.removeItem('photobooth_last_called_ticket');
      }

      saveToFirebase(newBooths, newTickets, newPrint, newScript, newLogs, adminPin, activeLastCalled);

      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'STATE_UPDATE',
          data: {
            booths: newBooths,
            tickets: newTickets,
            printSettings: newPrint,
            appsScriptConfig: newScript,
            logs: newLogs,
            lastCalledTicket: activeLastCalled,
          },
        });
      }

      if (newScript.enabled && newScript.autoSync && newScript.webAppUrl) {
        syncToGoogleAppsScript(newScript, newBooths, newTickets, newLogs, adminPin)
          .then(() => {
            lastMutationTimeRef.current = Date.now();
          })
          .catch((err) => {
            console.error('Auto sync to Google Apps Script failed:', err);
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

  // Background Google Apps Script sync
  const triggerSyncToGoogleSheets = useCallback(async () => {
    if (!appsScriptConfig.enabled || !appsScriptConfig.webAppUrl) return;

    lastMutationTimeRef.current = Date.now();
    setAppsScriptConfig((prev) => ({ ...prev, syncStatus: 'syncing', errorMessage: undefined }));
    const result = await syncToGoogleAppsScript(appsScriptConfig, booths, tickets, logs, adminPin);
    lastMutationTimeRef.current = Date.now();

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (result.success) {
      setAppsScriptConfig((prev) => ({
        ...prev,
        syncStatus: 'success',
        lastSyncTime: nowStr,
      }));
    } else {
      setAppsScriptConfig((prev) => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: result.message,
      }));
    }
  }, [appsScriptConfig, booths, tickets, logs]);

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
        if (t.boothId === boothId && t.status === 'called') {
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

      saveAndBroadcast(updatedBooths, updatedTickets, printSettings, appsScriptConfig, updatedLogs, calledTicket);

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
    [booths, tickets, addLog, saveAndBroadcast, printSettings, appsScriptConfig, soundEnabled, broadcastChannel]
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

      saveAndBroadcast(updatedBooths, updatedTickets, printSettings, appsScriptConfig, updatedLogs);

      return newTicket;
    },
    [booths, tickets, addLog, saveAndBroadcast, printSettings, appsScriptConfig]
  );

  const recallTicket = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const nowIso = new Date().toISOString();
      const updatedTickets = tickets.map((t) => {
        if (t.boothId === ticket.boothId && t.status === 'called' && t.id !== ticketId) {
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
      saveAndBroadcast(booths, updatedTickets, printSettings, appsScriptConfig, updatedLogs, recalledTicket);
    },
    [tickets, soundEnabled, addLog, saveAndBroadcast, booths, printSettings, appsScriptConfig]
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
      saveAndBroadcast(booths, updatedTickets, printSettings, appsScriptConfig, updatedLogs);
    },
    [tickets, addLog, saveAndBroadcast, booths, printSettings, appsScriptConfig]
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
      saveAndBroadcast(booths, updatedTickets, printSettings, appsScriptConfig, updatedLogs);
    },
    [tickets, addLog, saveAndBroadcast, booths, printSettings, appsScriptConfig]
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
      saveAndBroadcast(booths, updatedTickets, printSettings, appsScriptConfig, updatedLogs);
    },
    [tickets, addLog, saveAndBroadcast, booths, printSettings, appsScriptConfig, lastCalledTicket, selectedTicketForCustomer]
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
      saveAndBroadcast(updatedBooths, tickets, printSettings, appsScriptConfig, updatedLogs);
    },
    [booths, addLog, saveAndBroadcast, tickets, printSettings, appsScriptConfig]
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
      saveAndBroadcast(updatedBooths, tickets, printSettings, appsScriptConfig, updatedLogs);
    },
    [booths, addLog, saveAndBroadcast, tickets, printSettings, appsScriptConfig]
  );

  const deleteBooth = useCallback(
    (boothId: string) => {
      const target = booths.find((b) => b.id === boothId);
      const updatedBooths = booths.filter((b) => b.id !== boothId);
      const updatedLogs = addLog('CANCEL', `Menghapus booth "${target?.name || boothId}"`);

      setBooths(updatedBooths);
      saveAndBroadcast(updatedBooths, tickets, printSettings, appsScriptConfig, updatedLogs);
    },
    [booths, addLog, saveAndBroadcast, tickets, printSettings, appsScriptConfig]
  );

  const updatePrintSettings = useCallback(
    (settings: Partial<PrintSettings>) => {
      const updated = { ...printSettings, ...settings };
      const updatedLogs = addLog('UPDATE_SETTINGS', 'Mengubah pengaturan label cetak tiket');

      setPrintSettings(updated);
      saveAndBroadcast(booths, tickets, updated, appsScriptConfig, updatedLogs);
    },
    [printSettings, addLog, saveAndBroadcast, booths, tickets, appsScriptConfig]
  );

  const updateAppsScriptConfig = useCallback(
    (config: Partial<AppsScriptConfig>) => {
      const updated = { ...appsScriptConfig, ...config };
      const updatedLogs = addLog('UPDATE_SETTINGS', 'Mengubah konfigurasi Google Apps Script');

      setAppsScriptConfig(updated);
      saveAndBroadcast(booths, tickets, printSettings, updated, updatedLogs);
    },
    [appsScriptConfig, addLog, saveAndBroadcast, booths, tickets, printSettings]
  );

  const clearTodayLogs = useCallback(() => {
    lastMutationTimeRef.current = Date.now();
    setLogs([]);
    saveAndBroadcast(booths, tickets, printSettings, appsScriptConfig, []);
  }, [booths, tickets, printSettings, appsScriptConfig, saveAndBroadcast]);

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
    saveAndBroadcast(resetBooths, [], printSettings, appsScriptConfig, resetLogs, null);
  }, [booths, saveAndBroadcast, printSettings, appsScriptConfig]);

  const setActiveTab = useCallback((tab: ActiveTab) => {
    setActiveTabState(tab);
    // Update URL query string with pushState so history works
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', tab);
      if (appsScriptConfig.webAppUrl) {
        url.searchParams.set('gas', appsScriptConfig.webAppUrl);
      }
      window.history.pushState({}, '', url.toString());
    }
  }, [appsScriptConfig.webAppUrl]);

  return (
    <QueueContext.Provider
      value={{
        booths,
        tickets,
        printSettings,
        appsScriptConfig,
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
        updateAppsScriptConfig,
        clearTodayLogs,
        resetQueue,
        triggerSyncToGoogleSheets,

        soundEnabled,
        setSoundEnabled,
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
