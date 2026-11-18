import fs from 'fs';
import path from 'path';

export type TelemetryEventType =
  | 'seoVisit'
  | 'directVisit'
  | 'placesSearch'
  | 'placesDetail'
  | 'routeCall'
  | 'mapLoad'
  | 'freeFallback'
  | 'aiChat'
  | 'bookingEmail'
  | 'vercelApi';

export interface QuotaLimits {
  placesMonthlyLimit: number;
  routesMonthlyLimit: number;
  mapsMonthlyLimit: number;
  vercelApiMonthlyLimit: number;
  vercelBandwidthGbLimit: number;
  githubActionsMinutesLimit: number;
  geminiDailyLimit: number;
  gmailDailyLimit: number;
  domainRenewalDate: string;
}

export interface ManualSyncUsage {
  vercelBandwidthGbUsed: number;
  githubActionsMinutesUsed: number;
  gscMonthlyClicks: number;
  gbpMonthlyActions: number;
}

export interface TelemetryStore {
  monthKey: string;
  todayDate: string;
  lastUpdated: string;
  totalVisitsMonthly: number;
  seoGoogleVisitsMonthly: number;
  directOtherVisitsMonthly: number;
  todayVisits: number;
  placesSearchCalls: number;
  placesDetailCalls: number;
  routesApiCalls: number;
  mapsJsLoads: number;
  freeFallbackSaves: number;
  aiChatCallsToday: number;
  aiChatCallsMonthly: number;
  bookingEmailsToday: number;
  bookingEmailsMonthly: number;
  vercelApiCallsMonthly: number;
  limits: QuotaLimits;
  manualUsage: ManualSyncUsage;
}

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), '.data');
const TELEMETRY_FILE = path.join(DATA_DIR, 'easytransferhub-telemetry.json');
const TELEMETRY_RATE_MAP = new Map<string, number[]>();

const DEFAULT_LIMITS: QuotaLimits = {
  placesMonthlyLimit: 5000,
  routesMonthlyLimit: 10000,
  mapsMonthlyLimit: 10000,
  vercelApiMonthlyLimit: 100000,
  vercelBandwidthGbLimit: 100,
  githubActionsMinutesLimit: 2000,
  geminiDailyLimit: 1500,
  gmailDailyLimit: 500,
  domainRenewalDate: '2027-01-15',
};

const DEFAULT_MANUAL_USAGE: ManualSyncUsage = {
  vercelBandwidthGbUsed: 0,
  githubActionsMinutesUsed: 0,
  gscMonthlyClicks: 0,
  gbpMonthlyActions: 0,
};

let memoryTelemetry: TelemetryStore | null = null;

function getMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function createCleanStore(
  preserveLimits?: QuotaLimits,
  preserveManual?: ManualSyncUsage
): TelemetryStore {
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
    limits: preserveLimits ? { ...DEFAULT_LIMITS, ...preserveLimits } : { ...DEFAULT_LIMITS },
    manualUsage: preserveManual
      ? { ...DEFAULT_MANUAL_USAGE, ...preserveManual }
      : { ...DEFAULT_MANUAL_USAGE },
  };
}

function rollPeriodsIfNeeded(store: TelemetryStore): TelemetryStore {
  const currentMonth = getMonthKey();
  const currentToday = getTodayKey();

  if (store.monthKey !== currentMonth) {
    return createCleanStore(store.limits, {
      ...store.manualUsage,
      vercelBandwidthGbUsed: 0,
      githubActionsMinutesUsed: 0,
    });
  }

  if (store.todayDate !== currentToday) {
    store.todayDate = currentToday;
    store.todayVisits = 0;
    store.aiChatCallsToday = 0;
    store.bookingEmailsToday = 0;
  }

  return store;
}

function safeInt(val: unknown, fallback = 0, max = 10_000_000): number {
  const n = Math.floor(Number(val));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
}

function safeFloat(val: unknown, fallback = 0, max = 10000): number {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(Math.round(n * 100) / 100, max);
}

function loadTelemetryStore(): TelemetryStore {
  if (memoryTelemetry) {
    memoryTelemetry = rollPeriodsIfNeeded(memoryTelemetry);
    return memoryTelemetry;
  }

  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      const raw = fs.readFileSync(TELEMETRY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const currentMonth = getMonthKey();
        if (parsed.monthKey === currentMonth) {
          const loaded: TelemetryStore = {
            monthKey: currentMonth,
            todayDate: typeof parsed.todayDate === 'string' ? parsed.todayDate : getTodayKey(),
            lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : new Date().toISOString(),
            totalVisitsMonthly: safeInt(parsed.totalVisitsMonthly),
            seoGoogleVisitsMonthly: safeInt(parsed.seoGoogleVisitsMonthly),
            directOtherVisitsMonthly: safeInt(parsed.directOtherVisitsMonthly),
            todayVisits: safeInt(parsed.todayVisits),
            placesSearchCalls: safeInt(parsed.placesSearchCalls),
            placesDetailCalls: safeInt(parsed.placesDetailCalls),
            routesApiCalls: safeInt(parsed.routesApiCalls),
            mapsJsLoads: safeInt(parsed.mapsJsLoads),
            freeFallbackSaves: safeInt(parsed.freeFallbackSaves),
            aiChatCallsToday: safeInt(parsed.aiChatCallsToday),
            aiChatCallsMonthly: safeInt(parsed.aiChatCallsMonthly),
            bookingEmailsToday: safeInt(parsed.bookingEmailsToday),
            bookingEmailsMonthly: safeInt(parsed.bookingEmailsMonthly),
            vercelApiCallsMonthly: safeInt(parsed.vercelApiCallsMonthly),
            limits: { ...DEFAULT_LIMITS, ...(parsed.limits || {}) },
            manualUsage: { ...DEFAULT_MANUAL_USAGE, ...(parsed.manualUsage || {}) },
          };
          memoryTelemetry = rollPeriodsIfNeeded(loaded);
          return memoryTelemetry;
        }
        memoryTelemetry = createCleanStore(parsed.limits);
        return memoryTelemetry;
      }
    }
  } catch {
    // fallback cleanly
  }

  memoryTelemetry = createCleanStore();
  return memoryTelemetry;
}

function saveTelemetryStore(store: TelemetryStore): void {
  store.lastUpdated = new Date().toISOString();
  memoryTelemetry = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(store), 'utf-8');
  } catch {
    // non-fatal on read-only environments
  }
}

export function getTelemetrySnapshot(): TelemetryStore {
  return loadTelemetryStore();
}

export function recordServerTelemetryEvent(event: TelemetryEventType): TelemetryStore {
  const store = loadTelemetryStore();

  switch (event) {
    case 'seoVisit':
      store.totalVisitsMonthly += 1;
      store.seoGoogleVisitsMonthly += 1;
      store.todayVisits += 1;
      store.vercelApiCallsMonthly += 1;
      break;
    case 'directVisit':
      store.totalVisitsMonthly += 1;
      store.directOtherVisitsMonthly += 1;
      store.todayVisits += 1;
      store.vercelApiCallsMonthly += 1;
      break;
    case 'placesSearch':
      store.placesSearchCalls += 1;
      store.vercelApiCallsMonthly += 1;
      break;
    case 'placesDetail':
      store.placesDetailCalls += 1;
      store.vercelApiCallsMonthly += 1;
      break;
    case 'routeCall':
      store.routesApiCalls += 1;
      store.vercelApiCallsMonthly += 1;
      break;
    case 'mapLoad':
      store.mapsJsLoads += 1;
      store.vercelApiCallsMonthly += 1;
      break;
    case 'freeFallback':
      store.freeFallbackSaves += 1;
      break;
    case 'aiChat':
      store.aiChatCallsToday += 1;
      store.aiChatCallsMonthly += 1;
      store.vercelApiCallsMonthly += 1;
      break;
    case 'bookingEmail':
      store.bookingEmailsToday += 1;
      store.bookingEmailsMonthly += 1;
      store.vercelApiCallsMonthly += 1;
      break;
    case 'vercelApi':
      store.vercelApiCallsMonthly += 1;
      break;
  }

  saveTelemetryStore(store);
  return store;
}

function checkTelemetryRateLimit(req: any, maxRequests = 120, windowMs = 60 * 1000): boolean {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '');
  const ip = (forwarded.split(',')[0] || req?.socket?.remoteAddress || 'unknown').trim();
  const now = Date.now();
  const history = (TELEMETRY_RATE_MAP.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (history.length >= maxRequests) return false;
  history.push(now);
  if (TELEMETRY_RATE_MAP.size > 500) TELEMETRY_RATE_MAP.clear();
  TELEMETRY_RATE_MAP.set(ip, history);
  return true;
}

const VALID_EVENTS = new Set<TelemetryEventType>([
  'seoVisit',
  'directVisit',
  'placesSearch',
  'placesDetail',
  'routeCall',
  'mapLoad',
  'freeFallback',
  'aiChat',
  'bookingEmail',
  'vercelApi',
]);

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'GET') {
    return res.status(200).json(getTelemetrySnapshot());
  }

  if (req.method === 'POST') {
    if (!checkTelemetryRateLimit(req)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    try {
      const body =
        typeof req.body === 'string'
          ? req.body.length <= 10000
            ? JSON.parse(req.body)
            : {}
          : req.body || {};

      const action = String(body.action || 'track');

      if (action === 'track') {
        const event = String(body.event || '') as TelemetryEventType;
        if (!VALID_EVENTS.has(event)) {
          return res.status(400).json({ error: 'Invalid telemetry event' });
        }
        const updated = recordServerTelemetryEvent(event);
        return res.status(200).json(updated);
      }

      if (action === 'updateSettings') {
        const store = loadTelemetryStore();
        if (body.limits && typeof body.limits === 'object') {
          const l = body.limits;
          store.limits = {
            placesMonthlyLimit: safeInt(l.placesMonthlyLimit, store.limits.placesMonthlyLimit, 5_000_000) || 5000,
            routesMonthlyLimit: safeInt(l.routesMonthlyLimit, store.limits.routesMonthlyLimit, 5_000_000) || 10000,
            mapsMonthlyLimit: safeInt(l.mapsMonthlyLimit, store.limits.mapsMonthlyLimit, 5_000_000) || 10000,
            vercelApiMonthlyLimit: safeInt(l.vercelApiMonthlyLimit, store.limits.vercelApiMonthlyLimit, 10_000_000) || 100000,
            vercelBandwidthGbLimit: safeInt(l.vercelBandwidthGbLimit, store.limits.vercelBandwidthGbLimit, 10000) || 100,
            githubActionsMinutesLimit: safeInt(l.githubActionsMinutesLimit, store.limits.githubActionsMinutesLimit, 100000) || 2000,
            geminiDailyLimit: safeInt(l.geminiDailyLimit, store.limits.geminiDailyLimit, 500000) || 1500,
            gmailDailyLimit: safeInt(l.gmailDailyLimit, store.limits.gmailDailyLimit, 10000) || 500,
            domainRenewalDate:
              typeof l.domainRenewalDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(l.domainRenewalDate)
                ? l.domainRenewalDate
                : store.limits.domainRenewalDate,
          };
        }
        if (body.manualUsage && typeof body.manualUsage === 'object') {
          const m = body.manualUsage;
          store.manualUsage = {
            vercelBandwidthGbUsed: safeFloat(m.vercelBandwidthGbUsed, store.manualUsage.vercelBandwidthGbUsed),
            githubActionsMinutesUsed: safeInt(m.githubActionsMinutesUsed, store.manualUsage.githubActionsMinutesUsed),
            gscMonthlyClicks: safeInt(m.gscMonthlyClicks, store.manualUsage.gscMonthlyClicks),
            gbpMonthlyActions: safeInt(m.gbpMonthlyActions, store.manualUsage.gbpMonthlyActions),
          };
        }
        saveTelemetryStore(store);
        return res.status(200).json(store);
      }

      if (action === 'resetMonth') {
        const current = loadTelemetryStore();
        const reset = createCleanStore(current.limits, DEFAULT_MANUAL_USAGE);
        saveTelemetryStore(reset);
        return res.status(200).json(reset);
      }

      return res.status(400).json({ error: 'Unknown action' });
    } catch {
      return res.status(400).json({ error: 'Invalid telemetry payload' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
