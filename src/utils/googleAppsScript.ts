import { Booth, Ticket, ActivityLog, AppsScriptConfig } from '../types';

export async function syncToGoogleAppsScript(
  config: AppsScriptConfig,
  booths: Booth[],
  tickets: Ticket[],
  logs: ActivityLog[],
  adminPin?: string
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.webAppUrl) {
    return { success: false, message: 'Google Apps Script belum diaktifkan atau URL belum diisi' };
  }

  try {
    const payload = {
      action: 'syncAll',
      booths,
      tickets,
      logs: logs.slice(0, 50), // sync latest 50 logs
      adminPin,
    };

    // Google Apps Script requires no-cors or standard redirect handling
    const response = await fetch(config.webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const data = await response.json().catch(() => ({ status: 'success' }));
    return {
      success: true,
      message: data.message || 'Berhasil sinkronisasi dengan Google Sheets',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Gagal menghubungi Apps Script';
    console.error('Apps Script Sync error:', err);
    return {
      success: false,
      message: `Error: ${errorMessage}. Pastikan Web App diset ke 'Anyone'.`,
    };
  }
}

export async function fetchFromGoogleAppsScript(
  config: AppsScriptConfig
): Promise<{ success: boolean; booths?: Booth[]; tickets?: Ticket[]; logs?: ActivityLog[]; adminPin?: string; message?: string }> {
  if (!config.enabled || !config.webAppUrl) {
    return { success: false, message: 'Google Apps Script belum aktif' };
  }

  try {
    const url = `${config.webAppUrl}?action=getQueue&t=${Date.now()}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.status === 'success') {
      const rawBooths = Array.isArray(data.booths) ? data.booths : [];
      const parsedBooths = rawBooths
        .filter((b: Record<string, unknown>) => Boolean(b && b.id && String(b.id).trim() && b.name && String(b.name).trim()))
        .map((b: Record<string, unknown>) => ({
          ...b,
          id: String(b.id).trim(),
          name: String(b.name).trim(),
          code: String(b.code || 'BTH').trim().toUpperCase(),
          currentNumber: Number(b.currentNumber || 0),
          totalTickets: Number(b.totalTickets || 0),
          avgTimePerSession: Number(b.avgTimePerSession || 5),
          status: String(b.status || 'active') as 'active' | 'inactive' | 'maintenance',
          themeColor: String(b.themeColor || '#8B5CF6'),
        }));

      const rawTickets = Array.isArray(data.tickets) ? data.tickets : [];
      const parsedTickets = rawTickets
        .filter((t: Record<string, unknown>) => Boolean(t && t.id && String(t.id).trim() && t.ticketNumber && String(t.ticketNumber).trim()))
        .map((t: Record<string, unknown>) => ({
          ...t,
          id: String(t.id).trim(),
          boothId: String(t.boothId || '').trim(),
          boothName: String(t.boothName || '').trim(),
          boothCode: String(t.boothCode || '').trim(),
          ticketNumber: String(t.ticketNumber).trim(),
          sequence: Number(t.sequence || 0),
          status: String(t.status || 'waiting') as 'waiting' | 'called' | 'completed' | 'cancelled',
          createdAt: String(t.createdAt || new Date().toISOString()),
          calledAt: t.calledAt ? String(t.calledAt) : undefined,
          completedAt: t.completedAt ? String(t.completedAt) : undefined,
        }));

      const rawLogs = Array.isArray(data.logs) ? data.logs : [];
      const parsedLogs = rawLogs
        .filter((l: Record<string, unknown>) => Boolean(l && l.id && String(l.id).trim()))
        .map((l: Record<string, unknown>) => ({
          id: String(l.id || `log-${Date.now()}`),
          timestamp: String(l.timestamp || ''),
          date: String(l.date || ''),
          action: String(l.action || 'UPDATE_SETTINGS') as any,
          details: String(l.details || ''),
          boothName: l.boothName ? String(l.boothName) : undefined,
          ticketNumber: l.ticketNumber ? String(l.ticketNumber) : undefined,
        }));

      const adminPin = data.adminPin ? String(data.adminPin).trim() : undefined;

      return {
        success: true,
        booths: parsedBooths as Booth[],
        tickets: parsedTickets as Ticket[],
        logs: parsedLogs as ActivityLog[],
        adminPin,
      };
    }
    return { success: false, message: 'Data tidak valid dari Google Sheets' };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data dari Apps Script';
    console.error('Fetch Google Apps Script Error:', err);
    return { success: false, message: errorMessage };
  }
}


