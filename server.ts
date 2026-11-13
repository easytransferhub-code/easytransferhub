import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json());

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

app.get('/easytransferhub-white-green-animated-theme.zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/easytransferhub-white-green-animated-theme.zip');
  res.download(zipPath, 'easytransferhub-white-green-animated-theme.zip');
});

const SYSTEM_INSTRUCTION = `You are the friendly, professional virtual concierge for EasyTransferHub (owned and managed by Mr. Mir in Barcelona, Spain).
Contact Details:
- WhatsApp / Phone: +34 663 958 889
- Email: easytransferhub@gmail.com
- Base: Barcelona, Catalonia, Spain

Business Services:
- Private transfers, airport pickups (Barcelona El Prat Airport BCN T1 & T2), cruise port transfers (Port de Barcelona), train station (Barcelona Sants), and intercity transfers across Spain.
- Fleet:
  * Standard Sedan (1-4 passengers, up to 3 large suitcases): Starting at €39 (Airport to Barcelona City Centre).
  * Comfort Executive (1-4 passengers, extra legroom, high-spec car): Starting at €47.
  * Minivan / Van (5-8 passengers, up to 8 large suitcases): Starting at €59.
- Popular Fixed Destinations from Barcelona:
  * Airport (BCN) <-> Barcelona City: Standard €39 | Comfort €47 | Van €59
  * Airport (BCN) <-> Cruise Port: Standard €43 | Comfort €52 | Van €65
  * Barcelona <-> Sitges: Standard €74 | Comfort €89 | Van €112
  * Barcelona <-> Montserrat: Standard €89 | Comfort €105 | Van €130
  * Barcelona <-> Girona: Standard €189 | Comfort €227 | Van €284
  * Barcelona <-> Salou / PortAventura: Standard €164 | Comfort €197 | Van €246
  * Barcelona <-> Andorra: Standard €284 | Comfort €341 | Van €426
  * Barcelona <-> Valencia / Zaragoza / Madrid: Custom long-distance rates available.

Key Guarantees:
- Free flight tracking: If the passenger's flight is delayed, driver adjusts arrival automatically.
- 60 minutes free waiting time after flight landing.
- Meet & Greet: Driver waits at arrivals terminal holding a sign with passenger's name and assists with luggage.
- Child / baby booster seats available on request (€5 or free bundle depending on trip).
- Fixed prices with all highway tolls, luggage, and airport parking fees included. No hidden charges.
- Payment: Pay cash or card to driver, or online. Free cancellation up to 24 hours prior.

Your Role:
- Answer customer questions promptly, warmly, and clearly.
- If they ask in English, Spanish, Catalan, Urdu, or Hindi, reply in their language.
- Provide price estimates and vehicle recommendations.
- When they are ready to book or want immediate confirmation, encourage them to click the "Book on WhatsApp" button or contact Mr. Mir directly at +34 663 958 889.
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
        const reply = response.text || "I'd be delighted to assist you with your transfer. Please contact Mr. Mir on WhatsApp at +34 663 958 889 for instant confirmation.";
        return res.json({ reply });
      } catch (aiErr) {
        console.warn('Gemini API call failed or timed out, using fallback rules:', aiErr);
      }
    }

    // Smart fallback if no API key provided in environment
    const qLower = query.toLowerCase();
    let fallbackReply = `Hello! EasyTransferHub provides 24/7 private transfers across Barcelona and Spain. For instant booking and personal service, message Mr. Mir on WhatsApp at +34 663 958 889.`;

    if (qLower.includes('airport') || qLower.includes('bcn') || qLower.includes('aeropuerto')) {
      fallbackReply = `Barcelona Airport (BCN T1 & T2) transfers to Barcelona City start at €39 (Standard 1-4 pax), €47 (Comfort), and €59 (Van up to 8 pax). Flight delay tracking and 60 minutes free waiting time with a name-sign meet & greet are included! Would you like to book on WhatsApp?`;
    } else if (qLower.includes('sitges')) {
      fallbackReply = `Transfers between Barcelona and Sitges start at €74 for Standard (1-4 pax), €89 for Comfort, and €112 for Minivan (up to 8 pax). Highway tolls are included.`;
    } else if (qLower.includes('montserrat')) {
      fallbackReply = `Barcelona to Montserrat private transfer starts at €89 for Standard, €105 for Comfort, and €130 for Van (up to 8 pax). We also offer return trips and waiting-driver packages!`;
    } else if (qLower.includes('child') || qLower.includes('baby') || qLower.includes('seat') || qLower.includes('bebé')) {
      fallbackReply = `Yes! We provide baby seats and child booster seats for all ages. Please mention the age or weight of your children when booking so we bring the correct safety seat.`;
    } else if (qLower.includes('flight') || qLower.includes('delay') || qLower.includes('late') || qLower.includes('retraso')) {
      fallbackReply = `Don't worry about flight delays! We track your flight number in real-time. Even if your flight arrives hours late, your chauffeur will be waiting at the arrivals gate with your name sign, and waiting time is completely free.`;
    } else if (qLower.includes('pay') || qLower.includes('pago') || qLower.includes('card') || qLower.includes('cash')) {
      fallbackReply = `You can pay comfortably in cash or by credit/debit card directly to the driver upon arrival. The agreed price is 100% fixed with zero hidden charges.`;
    }

    return res.json({ reply: fallbackReply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      reply: "Thank you for reaching out! You can reach Mr. Mir directly on WhatsApp at +34 663 958 889 or email easytransferhub@gmail.com for instant transfer quotes."
    });
  }
});

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
