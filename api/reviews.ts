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
}

export interface CommunityStore {
  totalVisits: number;
  todayDate: string;
  todayVisits: number;
  reviews: ClientReview[];
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
}): { ok: boolean; error?: string; review?: ClientReview; store?: CommunityStore } {
  const name = sanitizeText(raw.name, 70);
  const route = sanitizeText(raw.route, 100) || 'Barcelona Private Transfer';
  const comment = sanitizeText(raw.comment, 500);
  const rating = Math.round(Number(raw.rating));

  if (name.length < 2) {
    return { ok: false, error: 'Please enter your name (at least 2 characters).' };
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Please select a star rating between 1 and 5.' };
  }
  if (comment.length < 5) {
    return { ok: false, error: 'Please write a short comment (at least 5 characters).' };
  }

  const store = loadStore();
  const review: ClientReview = {
    id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    route,
    rating,
    comment,
    createdAt: new Date().toISOString(),
    helpfulCount: 0,
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

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'GET') {
    return res.status(200).json(getCommunitySnapshot());
  }

  if (req.method === 'POST') {
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
        const store = recordSiteVisit();
        return res.status(200).json(store);
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
