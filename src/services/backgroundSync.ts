import { doc, setDoc } from '../firebase';
import { db } from '../firebase';

export type ConnectionState = 'connected' | 'offline' | 'syncing';

export interface SyncStatus {
  isOnline: boolean;
  isFirestoreConnected: boolean;
  connectionState: ConnectionState;
  hasPendingWrites: boolean;
  lastSyncedAt: Date | null;
  pendingCount: number;
}

type SyncListener = (status: SyncStatus) => void;

class BackgroundSyncService {
  private listeners: Set<SyncListener> = new Set();
  private status: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isFirestoreConnected: true,
    connectionState: 'connected',
    hasPendingWrites: false,
    lastSyncedAt: new Date(),
    pendingCount: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  public updateFirestoreStatus(
    isFromCache: boolean,
    hasPendingWrites: boolean,
    isQuotaExceeded: boolean = false
  ) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    let state: ConnectionState = 'connected';

    if (!isOnline || isQuotaExceeded) {
      state = 'offline';
    } else if (hasPendingWrites) {
      state = 'syncing';
    } else if (isFromCache) {
      state = 'offline';
    } else {
      state = 'connected';
    }

    const prevHasPending = this.status.hasPendingWrites;

    this.status = {
      isOnline,
      isFirestoreConnected: !isFromCache && isOnline && !isQuotaExceeded,
      connectionState: state,
      hasPendingWrites,
      pendingCount: hasPendingWrites ? 1 : 0,
      lastSyncedAt: !hasPendingWrites && !isFromCache ? new Date() : this.status.lastSyncedAt,
    };

    if (prevHasPending && !hasPendingWrites && isOnline) {
      console.info('[BackgroundSyncService] 🎉 Pending writes successfully flushed to Firestore cloud!');
    }

    this.notify();
  }

  private handleOnline = () => {
    console.info('[BackgroundSyncService] 🌐 Network connection restored. Retrying pending Firestore syncs...');
    this.status.isOnline = true;
    this.status.connectionState = this.status.hasPendingWrites ? 'syncing' : 'connected';
    this.notify();
  };

  private handleOffline = () => {
    console.warn('[BackgroundSyncService] 📡 Device went offline. Using Firestore IndexedDB local persistence.');
    this.status.isOnline = false;
    this.status.isFirestoreConnected = false;
    this.status.connectionState = 'offline';
    this.notify();
  };

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.getStatus());
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    }
  }

  /**
   * Force retry pending local state write to Firestore
   */
  public async retryPendingWrites(payloadGetter: () => any): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('[BackgroundSyncService] Cannot retry sync while offline.');
      return false;
    }

    try {
      this.status.connectionState = 'syncing';
      this.notify();

      const data = payloadGetter();
      if (data) {
        const docRef = doc(db, 'photobooth', 'appState');
        await setDoc(docRef, data, { merge: true });
        this.status.lastSyncedAt = new Date();
        this.status.hasPendingWrites = false;
        this.status.connectionState = 'connected';
        this.notify();
        return true;
      }
    } catch (err) {
      console.warn('[BackgroundSyncService] Retry sync failed, will retry automatically on reconnect:', err);
      this.status.connectionState = 'offline';
      this.notify();
    }
    return false;
  }
}

export const backgroundSync = new BackgroundSyncService();
