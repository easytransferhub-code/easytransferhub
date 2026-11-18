import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { checkBookingRateLimit, isValidEmailAddress, processBookingConfirmation } from './api/booking-confirm';
import reviewsHandler from './api/reviews';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '50kb' }));

// Direct endpoints for code export & downloads
app.get('/BookingCalculator.txt', (req, res) => {
  const filePath = path.resolve(__dirname, 'src/components/BookingCalculator.tsx');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.sendFile(filePath);
});

app.get('/BookingCalculator.tsx', (req, res) => {
  const filePath = path.resolve(__dirname, 'src/components/BookingCalculator.tsx');
  res.download(filePath, 'BookingCalculator.tsx');
});

app.get('/easytransferhub-source-code.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-source-code.zip');
  res.download(zipPath, 'easytransferhub-source-code.zip');
});

app.get('/easytransferhub-netlify.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-netlify.zip');
  res.download(zipPath, 'easytransferhub-netlify.zip');
});

app.get('/easytransferhub-white-green-theme.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-white-green-theme.zip');
  res.download(zipPath, 'easytransferhub-white-green-theme.zip');
});

app.get('/easytransferhub-ocean-blue-theme.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-ocean-blue-theme.zip');
  res.download(zipPath, 'easytransferhub-ocean-blue-theme.zip');
});

app.get('/easytransferhub-lagoon-water-theme.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-lagoon-water-theme.zip');
  res.download(zipPath, 'easytransferhub-lagoon-water-theme.zip');
});

app.get('/easytransferhub-vercel.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-vercel.zip');
  res.download(zipPath, 'easytransferhub-vercel.zip');
});

app.get('/easytransferhub-photos.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-photos.zip');
  res.download(zipPath, 'easytransferhub-photos.zip');
});

app.get('/easytransferhub-white-green-animated-theme.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-white-green-animated-theme.zip');
  res.download(zipPath, 'easytransferhub-white-green-animated-theme.zip');
});

app.get('/api/maps-config', (_req, res) => {
  const apiKey = (
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ''
  )
    .trim()
    .replace(/^["']|["']$/g, '');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.json({ apiKey });
});

const SYSTEM_INSTRUCTION = `You are the friendly, professional virtual concierge for EasyTransferHub (owned and managed by Mr. Mir in Barcelona, Spain).
Contact Details:
- WhatsApp / Phone: +34 666 744 440
- Email: easytransferhub@gmail.com
- Base: Barcelona, Catalonia, Spain

Barcelona 10-Zone Fixed Airport Rates (Airport <-> City, all supplements included):
- Zones 1–6 (Ciutat Vella: Raval, Gòtic, Barceloneta, Born | Eixample: Sagrada Família, Sant Antoni, Fort Pienc, Dreta, Esquerra | Sants-Montjuïc: Sants, Hostafrancs, Poble-sec, Montjuïc, Zona Franca | Les Corts: Les Corts, Pedralbes, La Maternitat | Sarrià-Sant Gervasi: Sarrià, Sant Gervasi, Bonanova, Vallvidrera | Gràcia: Vila de Gràcia, El Coll, La Salut, Vallcarca):
  * Standard Sedan (1–4 pax): €50
  * Comfort Executive (1–4 pax): €60
  * Minivan / Van (5–8 pax): €70
- Zones 7–10 (Horta-Guinardó: Horta, Carmel, Guinardó, Vall d'Hebron | Nou Barris: Roquetes, Porta, Verdun, Vilapicina, Trinitat Nova | Sant Andreu: Sant Andreu, Sagrera, Bon Pastor, Trinitat Vella | Sant Martí: Poblenou, Clot, Besòs, Diagonal Mar, Vila Olímpica):
  * Standard Sedan (1–4 pax): €60
  * Comfort Executive (1–4 pax): €70
  * Minivan / Van (5–8 pax): €80

Other Fixed Destinations from Barcelona:
- Airport (BCN) <-> Cruise Port (Zone 3): Standard €50 | Comfort €60 | Minivan €70
- Barcelona <-> Sitges: Standard €74 | Comfort €89 | Minivan €112
- Barcelona <-> Montserrat: Standard €89 | Comfort €105 | Minivan €130
- Barcelona <-> Girona: Standard €189 | Comfort €227 | Minivan €284
- Barcelona <-> Salou / PortAventura: Standard €164 | Comfort €197 | Minivan €246
- Barcelona <-> Andorra: Standard €284 | Comfort €341 | Minivan €426
- Barcelona <-> Valencia / Zaragoza / Madrid: Custom long-distance rates available.

Key Guarantees:
- Free flight tracking: If the passenger's flight is delayed, driver adjusts arrival automatically.
- 60 minutes free waiting time after flight landing.
- Meet & Greet: Driver waits at arrivals terminal holding a sign with passenger's name and assists with luggage.
- Extra child / baby / booster seats available on request (+€5 per extra seat).
- Fixed prices with all highway tolls, supplements, luggage, and airport parking fees included. No hidden charges.
- Payment: Pay cash or card to driver, or online. Free cancellation up to 24 hours prior.

Your Role:
- Answer customer questions promptly, warmly, and clearly.
- If they ask in English, Spanish, Catalan, Urdu, or Hindi, reply in their language.
- Provide price estimates and vehicle recommendations.
- When they are ready to book or want immediate confirmation, encourage them to click the "Book on WhatsApp" button or contact Mr. Mir directly at +34 666 744 440.
- Keep answers concise, helpful, and courteous.`;

// Assistant Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userMessage } = req.body;
    const query = userMessage || (messages && messages[messages.length - 1]?.content) || '';

    if (!query) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10;

    if (isRealKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        const contents = [
          { role: 'user', parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nCustomer question: ${query}` }] }
        ];

        // Call with 6s timeout
        const generatePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 6000)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        const reply = response.text || "I'd be delighted to assist you with your transfer. Please contact Mr. Mir on WhatsApp at +34 666 744 440 for instant confirmation.";
        return res.json({ reply });
      } catch (aiErr) {
        console.warn('Gemini API call failed or timed out, using fallback rules:', aiErr);
      }
    }

    // Smart fallback if no API key provided in environment
    const qLower = query.toLowerCase();
    let fallbackReply = `Hello! EasyTransferHub provides 24/7 private transfers across Barcelona and Spain. For instant booking and personal service, message Mr. Mir on WhatsApp at +34 666 744 440.`;

    if (qLower.includes('airport') || qLower.includes('bcn') || qLower.includes('aeropuerto') || qLower.includes('zone')) {
      fallbackReply = `Barcelona Airport (BCN T1 & T2) ↔ City rates (all supplements included): Zones 1–6 (Ciutat Vella, Eixample, Sants-Montjuïc, Les Corts, Sarrià, Gràcia) are €50 Standard / €60 Comfort / €70 Minivan. Zones 7–10 (Horta-Guinardó, Nou Barris, Sant Andreu, Sant Martí) are €60 Standard / €70 Comfort / €80 Minivan.`;
    } else if (qLower.includes('sitges')) {
      fallbackReply = `Transfers between Barcelona and Sitges start at €74 for Standard (1-4 pax), €89 for Comfort, and €112 for Minivan (up to 8 pax). Highway tolls are included.`;
    } else if (qLower.includes('montserrat')) {
      fallbackReply = `Barcelona to Montserrat private transfer starts at €89 for Standard, €105 for Comfort, and €130 for Minivan (up to 8 pax). We also offer return trips and waiting-driver packages!`;
    } else if (qLower.includes('child') || qLower.includes('baby') || qLower.includes('seat') || qLower.includes('bebé')) {
      fallbackReply = `Yes! Certified baby seats and child booster seats are available for +€5 per extra seat. Please specify the number of child seats and ages when booking.`;
    } else if (qLower.includes('flight') || qLower.includes('delay') || qLower.includes('late') || qLower.includes('retraso')) {
      fallbackReply = `Don't worry about flight delays! We track your flight number in real-time. Even if your flight arrives hours late, your chauffeur will be waiting at the arrivals gate with your name sign, and waiting time is completely free.`;
    } else if (qLower.includes('pay') || qLower.includes('pago') || qLower.includes('card') || qLower.includes('cash')) {
      fallbackReply = `You can pay comfortably in cash or by credit/debit card directly to the driver upon arrival. The agreed price is 100% fixed with zero hidden charges.`;
    }

    return res.json({ reply: fallbackReply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      reply: "Thank you for reaching out! You can reach Mr. Mir directly on WhatsApp at +34 666 744 440 or email easytransferhub@gmail.com for instant transfer quotes."
    });
  }
});

// Automated Booking Confirmation Endpoint (Email + WhatsApp)
app.post('/api/booking-confirm', async (req, res) => {
  if (!checkBookingRateLimit(req)) {
    return res.status(429).json({
      error: 'Too many booking attempts. Please wait a few minutes and try again.',
    });
  }

  try {
    const body = req.body || {};
    const email = String(body.email || '').trim();
    const phoneDigits = String(body.phone || '').replace(/[^\d]/g, '');

    if (
      !String(body.pickup || '').trim() ||
      !String(body.dropoff || '').trim() ||
      !String(body.passengerName || '').trim() ||
      !email ||
      !phoneDigits
    ) {
      return res.status(400).json({
        error: 'Pickup, drop-off, full name, email, and phone number are required.',
      });
    }

    if (!isValidEmailAddress(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address.',
      });
    }

    if (phoneDigits.length < 6) {
      return res.status(400).json({
        error: 'Please enter a valid phone / WhatsApp number.',
      });
    }

    const result = await processBookingConfirmation(body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Booking Confirm API Error:', error);
    return res.status(500).json({
      error: 'Unable to send automated notifications right now.',
    });
  }
});

// Live Visitors Meter & Client Reviews Endpoint
app.get('/api/reviews', (req, res) => reviewsHandler(req, res));
app.post('/api/reviews', (req, res) => reviewsHandler(req, res));

// Setup Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
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
