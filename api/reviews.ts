import fs from 'fs';
import path from 'path';

async function trackReviewApiSafely() {
  try {
    const mod: any = await import('./telemetry.js').catch(() => import('./telemetry'));
    mod?.recordServerTelemetryEvent?.('vercelApi');
  } catch {
    // telemetry is best-effort and must never crash /api/reviews on Vercel ESM
  }
}

export interface ClientReview {
  id: string;
  name: string;
  route: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpfulCount: number;
  source?: 'direct' | 'trustpilot';
}

export interface TrustpilotLiveStatus {
  totalReviews: number;
  trustScore: number;
  stars: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
  checkedAt: string;
  apiSynced: boolean;
  liveCheckOk: boolean;
}

export interface CommunityStore {
  totalVisits: number;
  todayDate: string;
  todayVisits: number;
  reviews: ClientReview[];
}

const TRUSTPILOT_BU_ID = '6b00acd0a7dbf30ad4d332ac';
const TRUSTPILOT_WIDGET_DATA_URL = `https://widget.trustpilot.com/trustbox-data/56278e9abfbbba0bdcd568bc?businessUnitId=${TRUSTPILOT_BU_ID}&locale=en-US`;
let cachedTrustpilot: { expiresAt: number; status: TrustpilotLiveStatus; syncedReviews: ClientReview[] } | null = null;

async function fetchLiveTrustpilotStatus(forceFresh = false): Promise<{
  status: TrustpilotLiveStatus;
  syncedReviews: ClientReview[];
}> {
  const now = Date.now();
  if (!forceFresh && cachedTrustpilot && cachedTrustpilot.expiresAt > now) {
    return { status: cachedTrustpilot.status, syncedReviews: cachedTrustpilot.syncedReviews };
  }

  const fallbackStatus: TrustpilotLiveStatus = cachedTrustpilot?.status || {
    totalReviews: 0,
    trustScore: 0,
    stars: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
    checkedAt: new Date().toISOString(),
    apiSynced: false,
    liveCheckOk: false,
  };

  let status = { ...fallbackStatus, checkedAt: new Date().toISOString() };
  let syncedReviews: ClientReview[] = cachedTrustpilot?.syncedReviews || [];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const widgetRes = await fetch(TRUSTPILOT_WIDGET_DATA_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (widgetRes.ok) {
      const data: any = await widgetRes.json();
      const bu = data?.businessUnit || data?.businessEntity;
      const counts = bu?.numberOfReviews || {};
      status = {
        totalReviews: Number(counts.total || 0),
        trustScore: Number(bu?.trustScore || 0),
        stars: Number(bu?.stars || 0),
        fiveStars: Number(counts.fiveStars || 0),
        fourStars: Number(counts.fourStars || 0),
        threeStars: Number(counts.threeStars || 0),
        twoStars: Number(counts.twoStars || 0),
        oneStar: Number(counts.oneStar || 0),
        checkedAt: new Date().toISOString(),
        apiSynced: false,
        liveCheckOk: true,
      };
    }
  } catch {
    // keep fallbackStatus gracefully
  }

  // Optional official Trustpilot Public API sync when TRUSTPILOT_API_KEY is configured
  const tpApiKey = (process.env.TRUSTPILOT_API_KEY || '').trim();
  if (tpApiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const apiRes = await fetch(
        `https://api.trustpilot.com/v1/business-units/${TRUSTPILOT_BU_ID}/reviews?apikey=${encodeURIComponent(tpApiKey)}&perPage=20`,
        { signal: controller.signal, headers: { Accept: 'application/json' } }
      );
      clearTimeout(timer);
      if (apiRes.ok) {
        const apiJson: any = await apiRes.json();
        const items = Array.isArray(apiJson?.reviews) ? apiJson.reviews : [];
        syncedReviews = items
          .filter((item: any) => item && (item.text || item.title))
          .map((item: any) => ({
            id: `tp-${String(item.id || Date.now())}`,
            name: sanitizeText(item?.consumer?.displayName || 'Trustpilot Traveler', 70) || 'Trustpilot Traveler',
            route: sanitizeText(item?.title || 'Verified Trustpilot Review', 100) || 'Verified Trustpilot Review',
            rating: Math.min(5, Math.max(1, Math.round(Number(item?.stars || 5)))),
            comment: sanitizeText(item?.text || item?.title || '', 500),
            createdAt: typeof item?.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
            helpfulCount: Number(item?.likes || 0),
            source: 'trustpilot' as const,
          }));
        status.apiSynced = true;
      }
    } catch {
      // keep non-fatal
    }
  }

  cachedTrustpilot = {
    expiresAt: now + 90 * 1000,
    status,
    syncedReviews,
  };

  return { status, syncedReviews };
}

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'easytransferhub-community.json');
const REVIEW_RATE_MAP = new Map<string, number[]>();

let memoryStore: CommunityStore | null = null;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStore(): CommunityStore {
  const today = getTodayKey();
  if (memoryStore) {
    if (memoryStore.todayDate !== today) {
      memoryStore.todayDate = today;
      memoryStore.todayVisits = 0;
    }
    return memoryStore;
  }

  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalVisits === 'number' && Array.isArray(parsed.reviews)) {
        memoryStore = {
          totalVisits: Math.max(0, Math.floor(parsed.totalVisits)),
          todayDate: typeof parsed.todayDate === 'string' ? parsed.todayDate : today,
          todayVisits:
            parsed.todayDate === today && typeof parsed.todayVisits === 'number'
              ? Math.max(0, Math.floor(parsed.todayVisits))
              : 0,
          reviews: parsed.reviews.slice(0, 100),
        };
        return memoryStore;
      }
    }
  } catch {
    // fallback to clean initial store
  }

  memoryStore = {
    totalVisits: 0,
    todayDate: today,
    todayVisits: 0,
    reviews: [],
  };
  return memoryStore;
}

function saveStore(store: CommunityStore): void {
  memoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store), 'utf-8');
  } catch {
    // non-fatal if filesystem is read-only
  }
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\r\n\0\x00-\x1F\x7F]/g, ' ')
    .replace(/https?:\/\/\S+|ftp:\/\/\S+|www\.\S+/gi, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function checkReviewRateLimit(req: any, maxRequests = 6, windowMs = 10 * 60 * 1000): boolean {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '');
  const ip = (forwarded.split(',')[0] || req?.socket?.remoteAddress || 'unknown').trim();
  const now = Date.now();
  const history = (REVIEW_RATE_MAP.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (history.length >= maxRequests) return false;
  history.push(now);
  if (REVIEW_RATE_MAP.size > 500) REVIEW_RATE_MAP.clear();
  REVIEW_RATE_MAP.set(ip, history);
  return true;
}

export function getCommunitySnapshot(): CommunityStore {
  return loadStore();
}

export function recordSiteVisit(): CommunityStore {
  const store = loadStore();
  store.totalVisits += 1;
  store.todayVisits += 1;
  saveStore(store);
  return store;
}

export function addClientReview(raw: {
  name?: unknown;
  route?: unknown;
  rating?: unknown;
  comment?: unknown;
  source?: unknown;
}): { ok: boolean; error?: string; review?: ClientReview; store?: CommunityStore } {
  const name = sanitizeText(raw.name, 70);
  const route = sanitizeText(raw.route, 100) || 'Barcelona Private Transfer';
  const comment = sanitizeText(raw.comment, 500);
  const rating = Math.round(Number(raw.rating));
  const source = raw.source === 'trustpilot' ? 'trustpilot' : 'direct';

  if (name.length < 2) {
    return { ok: false, error: 'Please enter passenger name (at least 2 characters).' };
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Please select a star rating between 1 and 5.' };
  }
  if (comment.length < 5) {
    return { ok: false, error: 'Please write a short review text (at least 5 characters).' };
  }

  const store = loadStore();
  const review: ClientReview = {
    id: `${source === 'trustpilot' ? 'tp' : 'rev'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    route,
    rating,
    comment,
    createdAt: new Date().toISOString(),
    helpfulCount: 0,
    source,
  };

  store.reviews = [review, ...store.reviews].slice(0, 100);
  saveStore(store);
  return { ok: true, review, store };
}

export function toggleHelpfulReview(reviewId: string): CommunityStore {
  const store = loadStore();
  const cleanId = sanitizeText(reviewId, 64);
  const target = store.reviews.find((r) => r.id === cleanId);
  if (target) {
    target.helpfulCount = Math.max(0, (target.helpfulCount || 0) + 1);
    saveStore(store);
  }
  return store;
}

async function isAuthorizedOwner(req: any): Promise<boolean> {
  try {
    const mod: any = await import('./owner-auth.js').catch(() => import('./owner-auth'));
    return Boolean(mod?.verifyOwnerBearerToken?.(req));
  } catch {
    return false;
  }
}

async function isValidOrigin(req: any): Promise<boolean> {
  try {
    const mod: any = await import('./owner-auth.js').catch(() => import('./owner-auth'));
    return Boolean(mod?.isAllowedBrowserOrigin?.(req));
  } catch {
    return true;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'GET') {
    const snapshot = getCommunitySnapshot();
    const forceFresh = String(req?.query?.fresh || '') === '1' || String(req?.url || '').includes('fresh=1');
    const { status: trustpilot, syncedReviews } = await fetchLiveTrustpilotStatus(forceFresh);
    const mergedMap = new Map<string, ClientReview>();
    for (const r of [...syncedReviews, ...snapshot.reviews]) {
      if (r?.id && !mergedMap.has(r.id)) mergedMap.set(r.id, r);
    }
    const sortedReviews = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.status(200).json({
      ...snapshot,
      reviews: sortedReviews,
      trustpilot,
    });
  }

  if (req.method === 'POST') {
    if (!(await isValidOrigin(req))) {
      return res.status(403).json({ error: 'Forbidden origin.' });
    }

    try {
      const body =
        typeof req.body === 'string'
          ? req.body.length <= 10000
            ? JSON.parse(req.body)
            : {}
          : req.body || {};

      const action = String(body.action || 'review');
      void trackReviewApiSafely();

      if (action === 'visit') {
        if (!checkReviewRateLimit(req, 30, 60 * 1000)) {
          return res.status(429).json({ error: 'Too many requests.' });
        }
        const store = recordSiteVisit();
        return res.status(200).json({
          totalVisits: store.totalVisits,
          todayVisits: store.todayVisits,
          reviews: store.reviews,
        });
      }

      // Only authenticated Owner can add/modify reviews displayed on homepage slider
      if (!(await isAuthorizedOwner(req))) {
        return res.status(401).json({
          error: 'Owner authentication required to publish reviews.',
        });
      }

      if (action === 'helpful') {
        const store = toggleHelpfulReview(String(body.reviewId || ''));
        return res.status(200).json(store);
      }

      if (!checkReviewRateLimit(req)) {
        return res.status(429).json({
          error: 'Too many submissions. Please wait a few minutes before posting again.',
        });
      }

      const result = addClientReview(body);
      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }
      return res.status(201).json({
        review: result.review,
        store: result.store,
      });
    } catch {
      return res.status(400).json({ error: 'Invalid request payload.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
