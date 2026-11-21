import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bookingConfirmHandler from './api/booking-confirm';
import chatHandler from './api/chat';
import mapsConfigHandler from './api/maps-config';
import ownerAuthHandler from './api/owner-auth';
import reviewsHandler from './api/reviews';
import telemetryHandler from './api/telemetry';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '50kb' }));

function isPreviewArchiveHost(req: express.Request): boolean {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    return false;
  }
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const host = rawHost.split(',')[0].split(':')[0].trim().toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.run.app')
  );
}

// Block raw source code disclosure on all environments
app.get(['/BookingCalculator.txt', '/BookingCalculator.tsx', '/settings.json'], (_req, res) => {
  return res.status(404).send('Not found');
});

// Restrict downloadable build/theme ZIPs to AI Studio preview & local dev only (blocked in production)
for (const zipFile of [
  'easytransferhub-source-code.zip',
  'easytransferhub-netlify.zip',
  'easytransferhub-white-green-theme.zip',
  'easytransferhub-ocean-blue-theme.zip',
  'easytransferhub-lagoon-water-theme.zip',
  'easytransferhub-vercel.zip',
  'easytransferhub-photos.zip',
  'easytransferhub-comfort-photos.zip',
  'easytransferhub-minivan-photos.zip',
  'easytransferhub-business-card.zip',
  'easytransferhub-white-green-animated-theme.zip',
]) {
  app.get(`/${zipFile}`, (req, res) => {
    if (!isPreviewArchiveHost(req)) {
      return res.status(404).send('Not found');
    }
    const zipPath = path.resolve(__dirname, 'public', zipFile);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Content-Type', 'application/zip');
    return res.download(zipPath, zipFile);
  });
}

app.get('/easytransferhub-card-front.jpg', (_req, res) => {
  const imgPath = path.resolve(__dirname, 'public/easytransferhub-card-front.jpg');
  res.setHeader('Content-Type', 'image/jpeg');
  res.sendFile(imgPath);
});

app.get('/easytransferhub-card-back.jpg', (_req, res) => {
  const imgPath = path.resolve(__dirname, 'public/easytransferhub-card-back.jpg');
  res.setHeader('Content-Type', 'image/jpeg');
  res.sendFile(imgPath);
});

app.get('/easytransferhub-card-both-sides.jpg', (_req, res) => {
  const imgPath = path.resolve(__dirname, 'public/easytransferhub-card-both-sides.jpg');
  res.setHeader('Content-Type', 'image/jpeg');
  res.sendFile(imgPath);
});

app.get('/favicon.ico', (_req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.resolve(__dirname, 'public/favicon.ico'));
});

for (const pngIcon of [
  '/favicon-48x48.png',
  '/favicon-96x96.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
]) {
  app.get(pngIcon, (_req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(path.resolve(__dirname, `public${pngIcon}`));
  });
}

app.get('/site.webmanifest', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.resolve(__dirname, 'public/site.webmanifest'));
});

app.get('/easytransferhub-promo-vertical.mp4', (_req, res) => {
  res.setHeader('Content-Type', 'video/mp4');
  res.sendFile(path.resolve(__dirname, 'public/easytransferhub-promo-vertical.mp4'));
});

app.get('/easytransferhub-promo-landscape.mp4', (_req, res) => {
  res.setHeader('Content-Type', 'video/mp4');
  res.sendFile(path.resolve(__dirname, 'public/easytransferhub-promo-landscape.mp4'));
});

// Unified API endpoints backed by hardened /api/* handlers
app.get('/api/maps-config', (req, res) => mapsConfigHandler(req, res));
app.post('/api/chat', (req, res) => chatHandler(req, res));
app.get('/api/booking-confirm', (req, res) => bookingConfirmHandler(req, res));
app.post('/api/booking-confirm', (req, res) => bookingConfirmHandler(req, res));
app.get('/api/reviews', (req, res) => reviewsHandler(req, res));
app.post('/api/reviews', (req, res) => reviewsHandler(req, res));
app.get('/api/telemetry', (req, res) => telemetryHandler(req, res));
app.post('/api/telemetry', (req, res) => telemetryHandler(req, res));
app.get('/api/owner-auth', (req, res) => ownerAuthHandler(req, res));
app.post('/api/owner-auth', (req, res) => ownerAuthHandler(req, res));

// Setup Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EasyTransferHub Server running on http://0.0.0.0:${PORT}`);
});

