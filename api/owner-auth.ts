import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), '.data');
const AUTH_FILE = path.join(DATA_DIR, 'easytransferhub-owner-auth.json');

// Session signing key from environment, or cryptographic random fallback in memory per process
const EPHEMERAL_SIGNING_SECRET = crypto.randomBytes(32).toString('hex');
function getSigningSecret(): string {
  return (
    process.env.OWNER_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    EPHEMERAL_SIGNING_SECRET
  );
}

interface StoredOwnerRecord {
  salt: string;
  hash: string;
  claimedAt: string;
}

let memoryOwnerRecord: StoredOwnerRecord | null = null;
const AUTH_RATE_MAP = new Map<string, { fails: number; windowStart: number }>();

function getClientIp(req: any): string {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '');
  return (forwarded.split(',')[0] || req?.socket?.remoteAddress || 'unknown').trim();
}

function isAuthRateLimited(req: any): boolean {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = AUTH_RATE_MAP.get(ip);
  if (!entry || now - entry.windowStart > 15 * 60 * 1000) {
    return false;
  }
  return entry.fails >= 6;
}

function recordAuthFailure(req: any): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = AUTH_RATE_MAP.get(ip);
  if (!entry || now - entry.windowStart > 15 * 60 * 1000) {
    if (AUTH_RATE_MAP.size > 500) AUTH_RATE_MAP.clear();
    AUTH_RATE_MAP.set(ip, { fails: 1, windowStart: now });
  } else {
    entry.fails += 1;
  }
}

function clearAuthFailures(req: any): void {
  AUTH_RATE_MAP.delete(getClientIp(req));
}

function getEnvPasscode(): string {
  return (process.env.OWNER_ADMIN_PASSCODE || '').trim();
}

function loadClaimedOwnerRecord(): StoredOwnerRecord | null {
  if (memoryOwnerRecord) return memoryOwnerRecord;
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const raw = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      if (
        raw &&
        typeof raw.salt === 'string' &&
        typeof raw.hash === 'string' &&
        raw.salt.length >= 16 &&
        raw.hash.length >= 64
      ) {
        memoryOwnerRecord = raw as StoredOwnerRecord;
        return memoryOwnerRecord;
      }
    }
  } catch {
    // ignore read failure
  }
  return null;
}

function saveClaimedOwnerRecord(record: StoredOwnerRecord): void {
  memoryOwnerRecord = record;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(record), 'utf-8');
  } catch {
    // non-fatal on read-only environments
  }
}

function hashPasscodeScrypt(passcode: string, saltHex: string): Buffer {
  return crypto.scryptSync(passcode, saltHex, 64);
}

function timingSafeComparePasscode(input: string, expected: string): boolean {
  const inputDigest = crypto.createHash('sha256').update(input, 'utf8').digest();
  const expectedDigest = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(inputDigest, expectedDigest);
}

export function issueOwnerBearerToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'owner',
      exp: expiresAt,
      nonce: crypto.randomBytes(12).toString('hex'),
    }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
  return { token: `${payload}.${sig}`, expiresAt };
}

export function verifyOwnerBearerToken(req: any): boolean {
  try {
    const authHeader = String(req?.headers?.authorization || req?.headers?.Authorization || '');
    if (!authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7).trim();
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, sig] = parts;
    if (!payload || !sig) return false;

    const expectedSig = crypto
      .createHmac('sha256', getSigningSecret())
      .update(payload)
      .digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded || decoded.sub !== 'owner' || typeof decoded.exp !== 'number') {
      return false;
    }
    return decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export function isAllowedBrowserOrigin(req: any): boolean {
  const origin = String(req?.headers?.origin || '').trim();
  if (!origin) return true; // Non-browser or same-origin navigation without Origin header
  try {
    const parsed = new URL(origin);
    const hostHeader = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').split(',')[0].trim().toLowerCase();
    const originHost = parsed.host.toLowerCase();
    if (hostHeader && originHost === hostHeader) return true;
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'www.easytransferhub.com' ||
      parsed.hostname === 'easytransferhub.com' ||
      parsed.hostname.endsWith('.run.app') ||
      parsed.hostname.endsWith('.vercel.app')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'GET') {
    const envPass = getEnvPasscode();
    const claimed = Boolean(loadClaimedOwnerRecord());
    const authenticated = verifyOwnerBearerToken(req);
    return res.status(200).json({
      envConfigured: Boolean(envPass),
      claimed: Boolean(envPass) || claimed,
      authenticated,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAllowedBrowserOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  if (isAuthRateLimited(req)) {
    return res.status(429).json({
      error: 'Too many failed passcode attempts. Please wait 15 minutes before trying again.',
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? req.body.length <= 2048
          ? JSON.parse(req.body)
          : {}
        : req.body || {};

    const action = String(body.action || 'login');
    const passcode = typeof body.passcode === 'string' ? body.passcode.trim() : '';

    if (passcode.length < 6 || passcode.length > 128) {
      return res.status(400).json({
        error: 'Passcode must be between 6 and 128 characters.',
      });
    }

    const envPass = getEnvPasscode();
    const existingClaim = loadClaimedOwnerRecord();

    if (action === 'claim') {
      if (envPass || existingClaim) {
        return res.status(409).json({
          error: 'Owner passcode is already configured. Please sign in instead.',
        });
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const derived = hashPasscodeScrypt(passcode, salt).toString('hex');
      saveClaimedOwnerRecord({
        salt,
        hash: derived,
        claimedAt: new Date().toISOString(),
      });
      clearAuthFailures(req);
      const { token, expiresAt } = issueOwnerBearerToken();
      return res.status(201).json({ token, expiresAt });
    }

    // Login verification: environment variable passcode takes precedence over claimed fallback
    if (envPass) {
      if (!timingSafeComparePasscode(passcode, envPass)) {
        recordAuthFailure(req);
        return res.status(401).json({ error: 'Incorrect owner passcode.' });
      }
      clearAuthFailures(req);
      const { token, expiresAt } = issueOwnerBearerToken();
      return res.status(200).json({ token, expiresAt });
    }

    if (!existingClaim) {
      return res.status(409).json({
        error: 'No owner passcode has been set yet. Create your owner passcode first.',
      });
    }

    const candidateHash = hashPasscodeScrypt(passcode, existingClaim.salt);
    const storedHash = Buffer.from(existingClaim.hash, 'hex');
    if (
      candidateHash.length !== storedHash.length ||
      !crypto.timingSafeEqual(candidateHash, storedHash)
    ) {
      recordAuthFailure(req);
      return res.status(401).json({ error: 'Incorrect owner passcode.' });
    }

    clearAuthFailures(req);
    const { token, expiresAt } = issueOwnerBearerToken();
    return res.status(200).json({ token, expiresAt });
  } catch {
    return res.status(400).json({ error: 'Invalid authentication request.' });
  }
}
