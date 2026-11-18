import { GoogleGenAI } from '@google/genai';
import { recordServerTelemetryEvent } from './telemetry';

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

Other Fixed & Regional Destinations:
- Airport (BCN) <-> Cruise Port (Zone 3): Standard €50 | Comfort €60 | Minivan €70
- Barcelona <-> Sitges: Standard €74 | Comfort €89 | Minivan €112
- Barcelona <-> Montserrat: Standard €89 | Comfort €105 | Minivan €130
- Barcelona <-> Girona: Standard €189 | Comfort €227 | Minivan €284
- Barcelona <-> Salou / PortAventura: Standard €164 | Comfort €197 | Minivan €246
- Barcelona <-> Andorra: Standard €284 | Comfort €341 | Minivan €426
- Barcelona <-> Valencia / Zaragoza / Madrid: Custom long-distance rates available.

Key Policies & Guarantees:
- Free flight tracking & 60 minutes free waiting time after flight landing.
- Meet & Greet with passenger's name sign & luggage assistance.
- Extra child / baby / booster seats: +€5 per extra seat.
- Fixed prices with all highway tolls, supplements, luggage, and airport parking fees included. Zero hidden charges.
- Payment: Cash or card to driver, or online. Free cancellation up to 24 hours prior.

Your Role:
- Answer customer questions promptly, warmly, and clearly in English, Spanish, Catalan, Urdu, or Hindi.
- Recommend calculating on our Google Maps route calculator or contacting Mr. Mir directly on WhatsApp at +34 666 744 440.`;

const CHAT_RATE_MAP = new Map<string, number[]>();

function checkChatRateLimit(req: any, maxRequests = 25, windowMs = 5 * 60 * 1000): boolean {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '');
  const ip = (forwarded.split(',')[0] || req?.socket?.remoteAddress || 'unknown').trim();
  const now = Date.now();
  const history = (CHAT_RATE_MAP.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (history.length >= maxRequests) return false;
  history.push(now);
  if (CHAT_RATE_MAP.size > 500) CHAT_RATE_MAP.clear();
  CHAT_RATE_MAP.set(ip, history);
  return true;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkChatRateLimit(req)) {
    return res.status(429).json({
      reply: 'Please wait a moment before sending another message, or contact Mr. Mir directly on WhatsApp at +34 666 744 440.',
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? req.body.length <= 20000
          ? JSON.parse(req.body)
          : {}
        : req.body || {};
    const { messages, userMessage } = body;
    const rawQuery = userMessage || (messages && messages[messages.length - 1]?.content) || '';
    const query = String(rawQuery).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, 1000);

    if (!query) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10;

    if (isRealKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const contents = [
          { role: 'user', parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nCustomer question: ${query}` }] },
        ];

        const generatePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 6000)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        const reply =
          response.text ||
          "I'd be delighted to assist you with your transfer. Please contact Mr. Mir on WhatsApp at +34 666 744 440 for instant confirmation.";
        recordServerTelemetryEvent('aiChat');
        return res.status(200).json({ reply });
      } catch (aiErr) {
        console.warn('Gemini API call failed or timed out, using fallback rules:', aiErr);
      }
    }

    const qLower = query.toLowerCase();
    let fallbackReply =
      'Hello! EasyTransferHub provides 24/7 private transfers across Barcelona and Spain. For instant booking and personal service, message Mr. Mir on WhatsApp at +34 666 744 440.';

    if (qLower.includes('airport') || qLower.includes('bcn') || qLower.includes('aeropuerto') || qLower.includes('zone')) {
      fallbackReply =
        'Barcelona Airport (BCN T1 & T2) ↔ City rates (all supplements included): Zones 1–6 (Ciutat Vella, Eixample, Sants-Montjuïc, Les Corts, Sarrià, Gràcia) are €50 Standard / €60 Comfort / €70 Minivan. Zones 7–10 (Horta-Guinardó, Nou Barris, Sant Andreu, Sant Martí) are €60 Standard / €70 Comfort / €80 Minivan.';
    } else if (qLower.includes('sitges')) {
      fallbackReply =
        'Transfers between Barcelona and Sitges start at €74 for Standard (1-4 pax), €89 for Comfort, and €112 for Minivan (up to 8 pax). Highway tolls are included.';
    } else if (qLower.includes('montserrat')) {
      fallbackReply =
        'Barcelona to Montserrat private transfer starts at €89 for Standard, €105 for Comfort, and €130 for Minivan (up to 8 pax). We also offer return trips and waiting-driver packages!';
    } else if (qLower.includes('child') || qLower.includes('baby') || qLower.includes('seat') || qLower.includes('bebé')) {
      fallbackReply =
        'Yes! Certified baby seats and child booster seats are available for +€5 per extra seat. Please specify the number of child seats and ages when booking.';
    } else if (qLower.includes('flight') || qLower.includes('delay') || qLower.includes('late') || qLower.includes('retraso')) {
      fallbackReply =
        "Don't worry about flight delays! We track your flight number in real-time. Even if your flight arrives hours late, your chauffeur will be waiting at the arrivals gate with your name sign, and waiting time is completely free.";
    } else if (qLower.includes('pay') || qLower.includes('pago') || qLower.includes('card') || qLower.includes('cash')) {
      fallbackReply =
        'You can pay comfortably in cash or by credit/debit card directly to the driver upon arrival. The agreed price is 100% fixed with all supplements included.';
    }

    return res.status(200).json({ reply: fallbackReply });
  } catch (error) {
    console.error('Vercel Chat API Error:', error);
    return res.status(500).json({
      reply:
        'Thank you for reaching out! You can reach Mr. Mir directly on WhatsApp at +34 666 744 440 or email easytransferhub@gmail.com for instant transfer quotes.',
    });
  }
}
