import type {
  ManualSyncUsage,
  QuotaLimits,
  TelemetryEventType,
  TelemetryStore,
} from '../../api/telemetry';

const STORAGE_PREFIX = 'eth_owner_telemetry_v1_';
const SESSION_VISIT_KEY = 'eth_telemetry_visit_recorded_v1';

function getMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultLocalStore(): TelemetryStore {
  return {
    monthKey: getMonthKey(),
    todayDate: getTodayKey(),
    lastUpdated: new Date().toISOString(),
    totalVisitsMonthly: 0,
    seoGoogleVisitsMonthly: 0,
    directOtherVisitsMonthly: 0,
    todayVisits: 0,
    placesSearchCalls: 0,
    placesDetailCalls: 0,
    routesApiCalls: 0,
    mapsJsLoads: 0,
    freeFallbackSaves: 0,
    aiChatCallsToday: 0,
    aiChatCallsMonthly: 0,
    bookingEmailsToday: 0,
    bookingEmailsMonthly: 0,
    vercelApiCallsMonthly: 0,
    limits: {
      placesMonthlyLimit: 5000,
      routesMonthlyLimit: 10000,
      mapsMonthlyLimit: 10000,
      vercelApiMonthlyLimit: 100000,
      vercelBandwidthGbLimit: 100,
      githubActionsMinutesLimit: 2000,
      geminiDailyLimit: 1500,
      gmailDailyLimit: 500,
      domainRenewalDate: '2027-01-15',
    },
    manualUsage: {
      vercelBandwidthGbUsed: 0,
      githubActionsMinutesUsed: 0,
      gscMonthlyClicks: 0,
      gbpMonthlyActions: 0,
    },
  };
}

function readLocalTelemetry(): TelemetryStore {
  const monthKey = getMonthKey();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${monthKey}`);
    if (raw) {
      const parsed = JSON.parse(raw) as TelemetryStore;
      if (parsed && parsed.monthKey === monthKey) {
        const today = getTodayKey();
        if (parsed.todayDate !== today) {
          parsed.todayDate = today;
          parsed.todayVisits = 0;
          parsed.aiChatCallsToday = 0;
          parsed.bookingEmailsToday = 0;
        }
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return getDefaultLocalStore();
}

function writeLocalTelemetry(store: TelemetryStore): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${store.monthKey}`, JSON.stringify(store));
  } catch {
    // ignore storage quota errors
  }
}

function applyEventLocally(store: TelemetryStore, event: TelemetryEventType): TelemetryStore {
  const next = { ...store, lastUpdated: new Date().toISOString() };
  switch (event) {
    case 'seoVisit':
      next.totalVisitsMonthly += 1;
      next.seoGoogleVisitsMonthly += 1;
      next.todayVisits += 1;
      next.vercelApiCallsMonthly += 1;
      break;
    case 'directVisit':
      next.totalVisitsMonthly += 1;
      next.directOtherVisitsMonthly += 1;
      next.todayVisits += 1;
      next.vercelApiCallsMonthly += 1;
      break;
    case 'placesSearch':
      next.placesSearchCalls += 1;
      next.vercelApiCallsMonthly += 1;
      break;
    case 'placesDetail':
      next.placesDetailCalls += 1;
      next.vercelApiCallsMonthly += 1;
      break;
    case 'routeCall':
      next.routesApiCalls += 1;
      next.vercelApiCallsMonthly += 1;
      break;
    case 'mapLoad':
      next.mapsJsLoads += 1;
      next.vercelApiCallsMonthly += 1;
      break;
    case 'freeFallback':
      next.freeFallbackSaves += 1;
      break;
    case 'aiChat':
      next.aiChatCallsToday += 1;
      next.aiChatCallsMonthly += 1;
      next.vercelApiCallsMonthly += 1;
      break;
    case 'bookingEmail':
      next.bookingEmailsToday += 1;
      next.bookingEmailsMonthly += 1;
      next.vercelApiCallsMonthly += 1;
      break;
    case 'vercelApi':
      next.vercelApiCallsMonthly += 1;
      break;
  }
  return next;
}

function mergeServerAndLocal(server: TelemetryStore, local: TelemetryStore): TelemetryStore {
  if (server.monthKey !== local.monthKey) {
    return server;
  }
  const sameDay = server.todayDate === local.todayDate;
  return {
    ...server,
    totalVisitsMonthly: Math.max(server.totalVisitsMonthly, local.totalVisitsMonthly),
    seoGoogleVisitsMonthly: Math.max(server.seoGoogleVisitsMonthly, local.seoGoogleVisitsMonthly),
    directOtherVisitsMonthly: Math.max(server.directOtherVisitsMonthly, local.directOtherVisitsMonthly),
    todayVisits: sameDay ? Math.max(server.todayVisits, local.todayVisits) : server.todayVisits,
    placesSearchCalls: Math.max(server.placesSearchCalls, local.placesSearchCalls),
    placesDetailCalls: Math.max(server.placesDetailCalls, local.placesDetailCalls),
    routesApiCalls: Math.max(server.routesApiCalls, local.routesApiCalls),
    mapsJsLoads: Math.max(server.mapsJsLoads, local.mapsJsLoads),
    freeFallbackSaves: Math.max(server.freeFallbackSaves, local.freeFallbackSaves),
    aiChatCallsToday: sameDay ? Math.max(server.aiChatCallsToday, local.aiChatCallsToday) : server.aiChatCallsToday,
    aiChatCallsMonthly: Math.max(server.aiChatCallsMonthly, local.aiChatCallsMonthly),
    bookingEmailsToday: sameDay ? Math.max(server.bookingEmailsToday, local.bookingEmailsToday) : server.bookingEmailsToday,
    bookingEmailsMonthly: Math.max(server.bookingEmailsMonthly, local.bookingEmailsMonthly),
    vercelApiCallsMonthly: Math.max(server.vercelApiCallsMonthly, local.vercelApiCallsMonthly),
    limits: server.limits,
    manualUsage: server.manualUsage,
  };
}

export function detectVisitSource(): 'seoVisit' | 'directVisit' {
  if (typeof window === 'undefined') return 'directVisit';
  const ref = (document.referrer || '').toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const utmSource = (params.get('utm_source') || '').toLowerCase();
  const isSearchEngine =
    ref.includes('google.') ||
    ref.includes('bing.') ||
    ref.includes('yahoo.') ||
    ref.includes('duckduckgo.') ||
    ref.includes('ecosia.') ||
    utmSource === 'google' ||
    utmSource === 'seo';

  return isSearchEngine ? 'seoVisit' : 'directVisit';
}

export function recordSessionVisitOnce(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(SESSION_VISIT_KEY) === '1') return;
    sessionStorage.setItem(SESSION_VISIT_KEY, '1');
  } catch {
    // ignore
  }
  trackQuotaEvent(detectVisitSource());
}

export function trackQuotaEvent(event: TelemetryEventType): void {
  if (typeof window === 'undefined') return;
  const current = readLocalTelemetry();
  const updatedLocal = applyEventLocally(current, event);
  writeLocalTelemetry(updatedLocal);

  void fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'track', event }),
    keepalive: true,
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((serverData: TelemetryStore | null) => {
      if (serverData && serverData.monthKey) {
        writeLocalTelemetry(mergeServerAndLocal(serverData, readLocalTelemetry()));
      }
    })
    .catch(() => {
      // local cache continues tracking smoothly
    });
}

export async function fetchQuotaSnapshot(): Promise<TelemetryStore> {
  const local = readLocalTelemetry();
  try {
    const res = await fetch('/api/telemetry', { cache: 'no-store' });
    if (res.ok) {
      const serverData = (await res.json()) as TelemetryStore;
      const merged = mergeServerAndLocal(serverData, local);
      writeLocalTelemetry(merged);
      return merged;
    }
  } catch {
    // fallback to local snapshot
  }
  return local;
}

export async function updateQuotaSettings(
  limits: Partial<QuotaLimits>,
  manualUsage?: Partial<ManualSyncUsage>
): Promise<TelemetryStore> {
  const local = readLocalTelemetry();
  const updatedLocal: TelemetryStore = {
    ...local,
    limits: { ...local.limits, ...limits },
    manualUsage: manualUsage ? { ...local.manualUsage, ...manualUsage } : local.manualUsage,
    lastUpdated: new Date().toISOString(),
  };
  writeLocalTelemetry(updatedLocal);

  try {
    const res = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateSettings', limits, manualUsage }),
    });
    if (res.ok) {
      const serverData = (await res.json()) as TelemetryStore;
      const merged = mergeServerAndLocal(serverData, updatedLocal);
      writeLocalTelemetry(merged);
      return merged;
    }
  } catch {
    // ignore
  }
  return updatedLocal;
}

export async function resetMonthlyMeter(): Promise<TelemetryStore> {
  const fresh = getDefaultLocalStore();
  writeLocalTelemetry(fresh);
  try {
    const res = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resetMonth' }),
    });
    if (res.ok) {
      const serverData = (await res.json()) as TelemetryStore;
      writeLocalTelemetry(serverData);
      return serverData;
    }
  } catch {
    // ignore
  }
  return fresh;
}
