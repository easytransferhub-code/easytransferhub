import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

interface EmailMeetingPointConfig {
  terminal: 'T1' | 'T2';
  cid: string;
  filename: string;
  localName: string;
  publicUrl: string;
  headerLabel: string;
  headline: string;
  ownerLine: string;
  plainLine: string;
  imgAlt: string;
}

function getEmailMeetingPointConfig(pickup?: string): EmailMeetingPointConfig | null {
  if (!pickup) return null;
  if (
    /terminal\s*1|\bbcn\s*t1\b|\bt1\b.*(?:airport|barcelona|bcn|prat)|(?:airport|barcelona|bcn|prat).*\bt1\b/i.test(
      pickup
    )
  ) {
    return {
      terminal: 'T1',
      cid: 'como-t1-meeting-point@easytransferhub.com',
      filename: 'como-restaurant-terminal1-meeting-point.jpg',
      localName: 'como-t1-meeting-point.jpg',
      publicUrl: 'https://www.easytransferhub.com/images/como-t1-meeting-point.jpg',
      headerLabel: 'Terminal 1 Meeting Point · Barcelona Airport (BCN)',
      headline: 'In front of COMO Restaurant (Arrivals Hall, Floor 1)',
      ownerLine: 'Terminal 1 Arrivals — In front of COMO Restaurant',
      plainLine:
        'Meeting Point (T1): In front of COMO Restaurant (Arrivals Hall, Floor 1) — Photo: https://www.easytransferhub.com/images/como-t1-meeting-point.jpg',
      imgAlt: 'COMO Restaurante & Café meeting point at Barcelona Airport Terminal 1',
    };
  }
  if (
    /terminal\s*2|\bbcn\s*t2\b|\bt2\b.*(?:airport|barcelona|bcn|prat)|(?:airport|barcelona|bcn|prat).*\bt2\b/i.test(
      pickup
    )
  ) {
    return {
      terminal: 'T2',
      cid: 'horse-t2-meeting-point@easytransferhub.com',
      filename: 'horse-statue-terminal2-meeting-point.jpg',
      localName: 'horse-t2-meeting-point.jpg',
      publicUrl: 'https://www.easytransferhub.com/images/horse-t2-meeting-point.jpg',
      headerLabel: 'Terminal 2 Meeting Point · Barcelona Airport (BCN)',
      headline: 'At the Horse Statue · "El Caballo" (T2 Arrivals Hall)',
      ownerLine: 'Terminal 2 Arrivals — At the Horse Statue ("El Caballo")',
      plainLine:
        'Meeting Point (T2): At the Horse Statue "El Caballo" (T2 Arrivals Hall) — Photo: https://www.easytransferhub.com/images/horse-t2-meeting-point.jpg',
      imgAlt: 'Horse Statue El Caballo meeting point at Barcelona Airport Terminal 2',
    };
  }
  return null;
}

function loadMeetingPointPhotoBuffer(localName: string): Buffer | null {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'public/images', localName),
      path.resolve(process.cwd(), 'dist/images', localName),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
    }
  } catch {
    // fallback to hosted HTTPS URL
  }
  return null;
}

async function trackBookingEmailSafely() {
  try {
    const mod: any = await import('./telemetry.js').catch(() => import('./telemetry'));
    mod?.recordServerTelemetryEvent?.('bookingEmail');
  } catch {
    // telemetry is best-effort and must never fail booking emails on Vercel ESM
  }
}

export interface BookingConfirmPayload {
  bookingRef?: string;
  pickup: string;
  dropoff: string;
  dateTime?: string;
  isRoundTrip?: boolean;
  returnDateTime?: string;
  passengers: number;
  adults?: number;
  children?: number;
  childAge?: string;
  luggage: number;
  luggageDetails?: string;
  childSeats: number;
  childSeatsDetails?: string;
  vehicleName: string;
  quotedPrice: number;
  flightNumber?: string;
  passengerName: string;
  email: string;
  phone: string;
  paymentMethod?: string;
  driverNotes?: string;
  distanceKm?: number;
  durationText?: string;
}

const EMAIL_REGEX = /^[^\s@<>()[\]\\,;:"']+@[^\s@<>()[\]\\,;:"']+\.[^\s@<>()[\]\\,;:"']{2,}$/;
const RATE_LIMIT_MAP = new Map<string, number[]>();

export function checkBookingRateLimit(req: any, maxRequests = 12, windowMs = 10 * 60 * 1000): boolean {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '');
  const ip = (forwarded.split(',')[0] || req?.socket?.remoteAddress || 'unknown').trim();
  const now = Date.now();
  const history = (RATE_LIMIT_MAP.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (history.length >= maxRequests) {
    return false;
  }
  history.push(now);
  if (RATE_LIMIT_MAP.size > 500) {
    RATE_LIMIT_MAP.clear();
  }
  RATE_LIMIT_MAP.set(ip, history);
  return true;
}

function sanitizeLine(value: unknown, maxLen = 200): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\r\n\0\x00-\x1F\x7F]/g, ' ')
    .replace(/https?:\/\/\S+|ftp:\/\/\S+|www\.\S+/gi, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function isValidEmailAddress(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 160;
}

function computeMinimumAllowedFare(
  pickup: string,
  dropoff: string,
  vehicleName: string,
  childSeats: number,
  isRoundTrip: boolean
): number {
  const combined = `${pickup} ${dropoff}`.toLowerCase();
  const veh = vehicleName.toLowerCase();
  let minBase = 50;
  if (veh.includes('minivan') || veh.includes('vito') || veh.includes('tourneo') || veh.includes('van')) {
    minBase = 70;
  } else if (veh.includes('comfort') || veh.includes('executive') || veh.includes('mercedes') || veh.includes('tesla')) {
    minBase = 60;
  }
  if (combined.includes('andorra')) minBase = Math.max(minBase, 284);
  else if (combined.includes('girona')) minBase = Math.max(minBase, 189);
  else if (combined.includes('salou') || combined.includes('portaventura') || combined.includes('cambrils')) minBase = Math.max(minBase, 164);
  else if (combined.includes('montserrat')) minBase = Math.max(minBase, 89);
  else if (combined.includes('sitges')) minBase = Math.max(minBase, 74);

  const oneWay = minBase + Math.max(0, childSeats) * 5;
  return isRoundTrip ? Math.round(oneWay * 1.8) : oneWay;
}

function sanitizeBookingPayload(raw: BookingConfirmPayload): BookingConfirmPayload {
  const cleanRef = sanitizeLine(raw.bookingRef, 20);
  const safePrice = Number(raw.quotedPrice);
  const safePax = Math.min(30, Math.max(1, Number(raw.passengers) || 1));
  const safeBags = Math.min(30, Math.max(0, Number(raw.luggage) || 0));
  const safeSeats = Math.min(10, Math.max(0, Number(raw.childSeats) || 0));
  const cleanPickup = sanitizeLine(raw.pickup, 220);
  const cleanDropoff = sanitizeLine(raw.dropoff, 220);
  const cleanVehicle = sanitizeLine(raw.vehicleName, 100) || 'Standard Sedan';
  const roundTrip = Boolean(raw.isRoundTrip);
  const minAllowed = computeMinimumAllowedFare(
    cleanPickup,
    cleanDropoff,
    cleanVehicle,
    safeSeats,
    roundTrip
  );

  return {
    bookingRef: /^ETH-\d{6}$/.test(cleanRef)
      ? cleanRef
      : `ETH-${Math.floor(100000 + Math.random() * 900000)}`,
    pickup: cleanPickup,
    dropoff: cleanDropoff,
    dateTime: sanitizeLine(raw.dateTime, 60),
    isRoundTrip: roundTrip,
    returnDateTime: sanitizeLine(raw.returnDateTime, 60),
    passengers: safePax,
    adults: Math.min(30, Math.max(1, Number(raw.adults) || safePax)),
    children: Math.min(20, Math.max(0, Number(raw.children) || 0)),
    childAge: sanitizeLine(raw.childAge, 80),
    luggage: safeBags,
    luggageDetails: sanitizeLine(raw.luggageDetails, 160),
    childSeats: safeSeats,
    childSeatsDetails: sanitizeLine(raw.childSeatsDetails, 160),
    vehicleName: cleanVehicle,
    quotedPrice:
      Number.isFinite(safePrice) && safePrice >= minAllowed && safePrice <= 50000
        ? Math.round(safePrice)
        : minAllowed,
    flightNumber: sanitizeLine(raw.flightNumber, 40),
    passengerName: sanitizeLine(raw.passengerName, 120),
    email: sanitizeLine(raw.email, 160).toLowerCase(),
    phone: sanitizeLine(raw.phone, 40),
    paymentMethod: sanitizeLine(raw.paymentMethod, 120),
    driverNotes: sanitizeLine(raw.driverNotes, 400),
    distanceKm: typeof raw.distanceKm === 'number' && Number.isFinite(raw.distanceKm) ? raw.distanceKm : undefined,
    durationText: sanitizeLine(raw.durationText, 60),
  };
}

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '').slice(0, 16);
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildBookingEmailHtml(data: BookingConfirmPayload, bookingRef: string, hasEmbeddedCid = false): string {
  const safeName = escapeHtml(data.passengerName);
  const safePickup = escapeHtml(data.pickup);
  const safeDropoff = escapeHtml(data.dropoff);
  const safeVehicle = escapeHtml(data.vehicleName);
  const safePayment = escapeHtml(data.paymentMethod || 'Card / Cash to Chauffeur');
  const safeDateTime = escapeHtml(data.dateTime || 'To be confirmed');
  const safeReturn = data.isRoundTrip && data.returnDateTime ? escapeHtml(data.returnDateTime) : '';
  const safeFlight = data.flightNumber ? escapeHtml(data.flightNumber) : '';
  const safeNotes = data.driverNotes ? escapeHtml(data.driverNotes) : '';
  const safePhone = escapeHtml(data.phone);
  const mp = getEmailMeetingPointConfig(data.pickup);
  const mpImgSrc = mp ? (hasEmbeddedCid ? `cid:${mp.cid}` : mp.publicUrl) : '';

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#FAF9F6; padding:28px 16px; color:#0D0F12;">
    <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #E3D6AD; border-radius:20px; overflow:hidden; box-shadow:0 12px 32px rgba(13,15,18,0.10);">
      <div style="height:6px; background:#F5B800;"></div>
      <div style="background:#0D0F12; padding:22px 26px; border-bottom:2px solid #F5B800;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td>
              <div style="font-size:22px; font-weight:800; color:#FAF9F6; letter-spacing:-0.02em;">
                EasyTransfer<span style="color:#F5B800;">Hub</span>
              </div>
              <div style="margin-top:4px; font-size:12px; color:#E5C158; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">
                Official Transfer Confirmation · AMB / IMET Barcelona
              </div>
            </td>
            <td style="text-align:right; vertical-align:top;">
              <span style="display:inline-block; background:#F5B800; color:#0D0F12; font-weight:800; font-size:12px; padding:6px 12px; border-radius:999px;">
                REF ${escapeHtml(bookingRef)}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:26px;">
        <p style="margin:0 0 12px; font-size:15px;">Dear <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 20px; font-size:14px; color:#334155; line-height:1.55;">
          Thank you for choosing <strong>Easytransferhub</strong>. Your private Barcelona chauffeur transfer has been registered with our 24/7 dispatch center. Here is your official ride pass:
        </p>

        <div style="background:#FCFBF7; border:1px solid #E3D6AD; border-radius:14px; padding:18px; margin-bottom:18px;">
          <div style="font-size:11px; font-weight:800; color:#8A5D00; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">Pickup Location</div>
          <div style="font-size:15px; font-weight:800; color:#0D0F12; margin-bottom:12px;">${safePickup}</div>
          <div style="border-top:1px dashed #DFC670; margin:10px 0;"></div>
          <div style="font-size:11px; font-weight:800; color:#8A5D00; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">Drop-off Destination</div>
          <div style="font-size:15px; font-weight:800; color:#0D0F12;">${safeDropoff}</div>
        </div>

        <div style="background:#ffffff; border:1px solid #E6DFCB; border-radius:14px; padding:16px 18px; margin-bottom:18px;">
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tr>
              <td style="padding:7px 0; color:#64748b; width:155px; border-bottom:1px solid #f1f5f9;">Pickup Date &amp; Time</td>
              <td style="padding:7px 0; font-weight:700; color:#0f172a; border-bottom:1px solid #f1f5f9;">${safeDateTime}</td>
            </tr>
            ${safeReturn ? `<tr><td style="padding:7px 0; color:#64748b; border-bottom:1px solid #f1f5f9;">Return Date &amp; Time</td><td style="padding:7px 0; font-weight:700; color:#0f172a; border-bottom:1px solid #f1f5f9;">${safeReturn}</td></tr>` : ''}
            ${safeFlight ? `<tr><td style="padding:7px 0; color:#64748b; border-bottom:1px solid #f1f5f9;">Flight Number</td><td style="padding:7px 0; font-weight:700; color:#0f172a; border-bottom:1px solid #f1f5f9;">${safeFlight} (Auto-Tracked)</td></tr>` : ''}
            <tr>
              <td style="padding:7px 0; color:#64748b; border-bottom:1px solid #f1f5f9;">Selected Vehicle</td>
              <td style="padding:7px 0; font-weight:700; color:#0f172a; border-bottom:1px solid #f1f5f9;">${safeVehicle}</td>
            </tr>
            <tr>
              <td style="padding:7px 0; color:#64748b; border-bottom:1px solid #f1f5f9;">Passengers &amp; Luggage</td>
              <td style="padding:7px 0; font-weight:700; color:#0f172a; border-bottom:1px solid #f1f5f9;">${data.passengers} Pax · ${data.luggage} Bags${data.childSeats > 0 ? ` · ${data.childSeats} Child Seat(s) (+€${data.childSeats * 5})` : ''}</td>
            </tr>
            <tr>
              <td style="padding:7px 0; color:#64748b; border-bottom:1px solid #f1f5f9;">Passenger Phone</td>
              <td style="padding:7px 0; font-weight:700; color:#0f172a; border-bottom:1px solid #f1f5f9;">${safePhone}</td>
            </tr>
            <tr>
              <td style="padding:7px 0; color:#64748b;">Payment Method</td>
              <td style="padding:7px 0; font-weight:700; color:#0f172a;">${safePayment}</td>
            </tr>
            ${safeNotes ? `<tr><td style="padding:7px 0; color:#64748b; border-top:1px solid #f1f5f9;">Notes for Chauffeur</td><td style="padding:7px 0; color:#0f172a; border-top:1px solid #f1f5f9;">${safeNotes}</td></tr>` : ''}
          </table>
        </div>

        <div style="background:#FBF7E6; border:1px solid #DFC670; border-radius:14px; padding:16px 20px; margin-bottom:20px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td>
                <div style="font-size:11px; font-weight:800; color:#8A5D00; text-transform:uppercase; letter-spacing:0.05em;">Guaranteed Fixed Fare</div>
                <div style="font-size:12px; color:#334155; margin-top:2px;">All highway tolls, taxes &amp; 60m flight wait included</div>
              </td>
              <td style="text-align:right;">
                <span style="font-size:26px; font-weight:800; color:#0D0F12;">€${data.quotedPrice}</span>
              </td>
            </tr>
          </table>
        </div>

        ${
          mp
            ? `
        <div style="background:#FBF7E6; border:1px solid #DFC670; border-radius:14px; padding:16px 18px; margin-bottom:20px; font-size:13px; color:#334155; line-height:1.55;">
          <div style="font-size:11px; font-weight:800; color:#8A5D00; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">
            ${escapeHtml(mp.headerLabel)}
          </div>
          <div style="font-size:15px; font-weight:800; color:#0D0F12; margin-bottom:6px;">
            ${escapeHtml(mp.headline)}
          </div>
          <p style="margin:0 0 10px;">
            ${
              mp.terminal === 'T1'
                ? `After collecting your luggage, exit into the main Terminal 1 public Arrivals Hall and walk toward <strong>COMO Restaurante &amp; Café</strong>. Your chauffeur will be waiting right outside COMO Restaurant holding a nameboard reading <strong>"${safeName}"</strong> (60 minutes free airport waiting included).`
                : `After collecting your luggage at Terminal 2, exit into the main Arrivals Hall and walk toward the famous giant bronze <strong>Horse Statue (&ldquo;El Caballo&rdquo;)</strong>. Your chauffeur will be waiting right beside the Horse Statue holding a nameboard reading <strong>"${safeName}"</strong> (60 minutes free airport waiting included).`
            }
          </p>
          <img src="${mpImgSrc}" alt="${escapeHtml(mp.imgAlt)}" style="display:block; width:100%; max-width:540px; height:auto; border-radius:10px; border:1px solid #DFC670;" />
        </div>`
            : `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px; margin-bottom:20px; font-size:13px; color:#334155; line-height:1.5;">
          <strong style="color:#0D0F12;">Airport Meet &amp; Greet Instructions:</strong><br/>
          Your chauffeur will track your flight live and wait inside the arrivals hall holding a nameboard reading <strong>"${safeName}"</strong>. 60 minutes of complimentary airport waiting time is included.
        </div>`
        }

        <div style="text-align:center; margin-bottom:14px;">
          <a href="https://wa.me/34666744440?text=${encodeURIComponent(`Hello Mr. Mir, regarding my EasyTransferHub booking ${bookingRef} (${data.pickup} to ${data.dropoff}).`)}" style="display:inline-block; background:#F5B800; color:#0D0F12; text-decoration:none; font-weight:800; font-size:14px; padding:12px 24px; border-radius:12px; border:1px solid #D99F00;">
            Message Chauffeur Dispatch on WhatsApp
          </a>
        </div>

        <p style="margin:0; font-size:12px; color:#64748b; text-align:center;">
          24/7 Dispatch Manager: <strong>Mr. Mir</strong> · WhatsApp: <strong>+34 666 744 440</strong> · Email: <strong>easytransferhub@gmail.com</strong>
        </p>
      </div>
    </div>
  </div>`;
}

function buildOwnerDispatchEmailHtml(data: BookingConfirmPayload, bookingRef: string): string {
  const clientDigits = normalizePhoneDigits(data.phone);
  const waClientReplyUrl = clientDigits
    ? `https://wa.me/${clientDigits}?text=${encodeURIComponent(`Hello ${data.passengerName}, thank you for booking with EasyTransferHub! Your transfer (${bookingRef}) from ${data.pickup} to ${data.dropoff} is confirmed for €${data.quotedPrice}. Best regards, Mr. Mir (+34 666 744 440)`)}`
    : '';

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#FAF9F6; padding:24px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border:2px solid #F5B800; border-radius:16px; overflow:hidden;">
      <div style="background:#0D0F12; padding:16px 24px; border-bottom:2px solid #F5B800;">
        <div style="font-size:11px; font-weight:800; color:#F5B800; text-transform:uppercase; letter-spacing:0.08em;">
          NEW TRANSFER BOOKING RECEIVED
        </div>
        <h2 style="margin:4px 0 0; color:#FFFFFF; font-size:20px;">
          ${escapeHtml(bookingRef)} · €${data.quotedPrice} (${escapeHtml(data.vehicleName)})
        </h2>
      </div>
      <div style="padding:22px 24px;">
        <p style="margin:0 0 16px; font-size:14px; color:#0f172a; line-height:1.7;">
          <strong>Client:</strong> ${escapeHtml(data.passengerName)}<br/>
          <strong>Phone / WhatsApp:</strong> ${escapeHtml(data.phone)}<br/>
          <strong>Email:</strong> ${escapeHtml(data.email)}<br/>
          <strong>Pickup:</strong> ${escapeHtml(data.pickup)}<br/>
          ${(() => {
            const mpOwner = getEmailMeetingPointConfig(data.pickup);
            return mpOwner ? `<strong>Meeting Point:</strong> ${escapeHtml(mpOwner.ownerLine)}<br/>` : '';
          })()}
          <strong>Drop-off:</strong> ${escapeHtml(data.dropoff)}<br/>
          <strong>Date &amp; Time:</strong> ${escapeHtml(data.dateTime || 'To be confirmed')}<br/>
          ${data.flightNumber ? `<strong>Flight:</strong> ${escapeHtml(data.flightNumber)}<br/>` : ''}
          <strong>Pax / Luggage / Seats:</strong> ${data.passengers} Pax · ${data.luggage} Bags · ${data.childSeats} Child Seats${data.childSeats > 0 ? ` (+€${data.childSeats * 5})` : ''}<br/>
          <strong>Payment:</strong> ${escapeHtml(data.paymentMethod || 'Card / Cash')}<br/>
          ${data.driverNotes ? `<strong>Notes:</strong> ${escapeHtml(data.driverNotes)}<br/>` : ''}
        </p>
        ${waClientReplyUrl ? `<a href="${waClientReplyUrl}" style="display:inline-block; background:#25D366; color:#FFFFFF; font-weight:800; font-size:14px; text-decoration:none; padding:12px 20px; border-radius:10px;">1-Tap Reply to Client on WhatsApp</a>` : ''}
      </div>
    </div>
  </div>`;
}

function buildPlainTextMessage(data: BookingConfirmPayload, bookingRef: string): string {
  const mpPlain = getEmailMeetingPointConfig(data.pickup);
  const lines = [
    `Easytransferhub — Booking Confirmed (${bookingRef})`,
    ``,
    `Hello ${data.passengerName},`,
    `Your private transfer booking is confirmed:`,
    ``,
    `• Ref: ${bookingRef}`,
    `• Pickup: ${data.pickup}`,
    ...(mpPlain ? [`• ${mpPlain.plainLine}`] : []),
    `• Drop-off: ${data.dropoff}`,
    `• Date & Time: ${data.dateTime || 'To be confirmed'}`,
  ];
  if (data.isRoundTrip && data.returnDateTime) {
    lines.push(`• Return Date & Time: ${data.returnDateTime}`);
  }
  if (data.flightNumber) {
    lines.push(`• Flight: ${data.flightNumber}`);
  }
  lines.push(
    `• Vehicle: ${data.vehicleName}`,
    `• Passengers: ${data.passengers} | Luggage: ${data.luggage} bags${data.childSeats > 0 ? ` | Child Seats: ${data.childSeats} (+€${data.childSeats * 5})` : ''}`,
    `• Payment Method: ${data.paymentMethod || 'Card / Cash to Chauffeur'}`,
    `• Total Fixed Price: €${data.quotedPrice} (All tolls & 60m flight waiting included)`
  );
  if (data.driverNotes) {
    lines.push(`• Driver Notes: ${data.driverNotes}`);
  }
  lines.push(
    ``,
    `24/7 Dispatch (Mr. Mir): +34 666 744 440 | easytransferhub@gmail.com`
  );
  return lines.join('\n');
}

function cleanEnvValue(val?: string): string {
  return (val || '').trim().replace(/^["']|["']$/g, '').trim();
}

function maskEmailAddress(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

function getResolvedEmailEnv() {
  const configuredOwnerRaw = cleanEnvValue(process.env.BOOKING_OWNER_EMAIL);
  const parsedOwners = configuredOwnerRaw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL_REGEX.test(e));
  const ownerEmails =
    parsedOwners.length > 0 ? Array.from(new Set(parsedOwners)) : ['easytransferhub@gmail.com'];

  const resendKey = cleanEnvValue(process.env.RESEND_API_KEY);
  const resendFrom =
    cleanEnvValue(process.env.RESEND_FROM_EMAIL) || 'EasyTransferHub <bookings@easytransferhub.com>';

  const smtpUser =
    cleanEnvValue(process.env.SMTP_USER) ||
    cleanEnvValue(process.env.GMAIL_USER) ||
    cleanEnvValue(process.env.EMAIL_USER) ||
    ownerEmails[0];
  const rawPass =
    cleanEnvValue(process.env.SMTP_PASS) ||
    cleanEnvValue(process.env.GMAIL_APP_PASSWORD) ||
    cleanEnvValue(process.env.SMTP_PASSWORD) ||
    cleanEnvValue(process.env.EMAIL_PASS) ||
    '';
  const smtpPass = rawPass.replace(/\s+/g, '').trim();
  const smtpHost = cleanEnvValue(process.env.SMTP_HOST) || 'smtp.gmail.com';
  const smtpPort = Number(cleanEnvValue(process.env.SMTP_PORT) || 465);

  return {
    ownerEmails,
    ownerEmail: ownerEmails[0],
    resendKey,
    resendFrom,
    smtpUser,
    smtpPass,
    smtpHost,
    smtpPort,
  };
}

export function getEmailConfigStatus() {
  const cfg = getResolvedEmailEnv();
  const resendConfigured = Boolean(cfg.resendKey && cfg.resendKey.length > 8);
  const smtpConfigured = Boolean(cfg.smtpUser && cfg.smtpPass && cfg.smtpPass.length >= 8);
  const ready = resendConfigured || smtpConfigured;

  let issueHint = 'Configured and ready to send client & owner confirmation emails.';
  if (!ready) {
    if (cfg.smtpPass && cfg.smtpPass.length < 8) {
      issueHint = 'SMTP_PASS looks too short. Set your 16-character Google App Password in Vercel Environment Variables and Redeploy.';
    } else {
      issueHint =
        'Neither SMTP_PASS (16-char Google App Password) nor RESEND_API_KEY is configured in Environment Variables. Add SMTP_PASS in Vercel -> Settings -> Environment Variables and Redeploy.';
    }
  }

  return {
    ok: true,
    ready,
    provider: resendConfigured ? 'resend' : smtpConfigured ? 'smtp' : null,
    resendConfigured,
    smtpConfigured,
    smtpHost: cfg.smtpHost,
    smtpPort: cfg.smtpPort,
    smtpUserMasked: maskEmailAddress(cfg.smtpUser),
    ownerEmailMasked: maskEmailAddress(cfg.ownerEmail),
    issueHint,
  };
}

function summarizeEmailError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (/535|Invalid login|Username and Password not accepted|BadCredentials/i.test(raw)) {
    return 'Gmail rejected password (535). Use a 16-character Google App Password (myaccount.google.com/apppasswords), not your regular Gmail password.';
  }
  if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|Greeting never received/i.test(raw)) {
    return `SMTP connection timeout/blocked (${raw.slice(0, 90)}). Consider using Resend API (RESEND_API_KEY) for instant HTTP delivery.`;
  }
  if (/domain is not verified|not verified|403/i.test(raw)) {
    return 'Resend rejected sender domain. Verify easytransferhub.com DNS in Resend, or use Gmail SMTP_USER + SMTP_PASS.';
  }
  return raw ? raw.slice(0, 140) : 'Email delivery failed.';
}

async function sendEmailNotifications(
  data: BookingConfirmPayload,
  bookingRef: string
): Promise<{ sent: boolean; ownerSent: boolean; provider: string | null; emailError?: string }> {
  const cfg = getResolvedEmailEnv();
  const { ownerEmails, ownerEmail, resendKey, resendFrom, smtpUser, smtpPass, smtpHost, smtpPort } = cfg;

  const subject = `Booking Confirmation ${bookingRef} - EasyTransferHub Barcelona`;
  const ownerSubject = `New Booking ${bookingRef} (${data.vehicleName}) - ${data.passengerName}`;
  const mpConfig = getEmailMeetingPointConfig(data.pickup);
  const mpBuffer = mpConfig ? loadMeetingPointPhotoBuffer(mpConfig.localName) : null;
  const html = buildBookingEmailHtml(data, bookingRef, Boolean(mpBuffer));
  const ownerHtml = buildOwnerDispatchEmailHtml(data, bookingRef);
  const text = buildPlainTextMessage(data, bookingRef);

  const errors: string[] = [];

  // Primary Option: Resend HTTP API
  if (resendKey && resendKey.length > 8) {
    try {
      const resendBody: Record<string, any> = {
        from: resendFrom,
        to: [data.email],
        reply_to: ownerEmail,
        subject,
        html,
        text,
        headers: {
          'X-Entity-Ref-ID': bookingRef,
        },
      };
      if (mpConfig && mpBuffer) {
        resendBody.attachments = [
          {
            filename: mpConfig.filename,
            content: mpBuffer.toString('base64'),
            content_id: mpConfig.cid,
          },
        ];
      }

      const requests: Promise<Response>[] = [
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resendBody),
        }),
      ];

      if (ownerEmails.length > 0) {
        requests.push(
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: resendFrom,
              to: ownerEmails,
              reply_to: data.email,
              subject: ownerSubject,
              html: ownerHtml,
              text,
              headers: {
                'X-Entity-Ref-ID': `${bookingRef}-owner`,
              },
            }),
          })
        );
      }

      const [clientSettled, ownerSettled] = await Promise.allSettled(requests);
      const clientOk =
        clientSettled.status === 'fulfilled' && clientSettled.value.ok;
      const ownerOk =
        ownerSettled?.status === 'fulfilled' ? ownerSettled.value.ok : false;

      if (!clientOk && clientSettled.status === 'fulfilled') {
        const errBody = await clientSettled.value.text();
        console.warn('Resend client email returned non-OK:', errBody);
        errors.push(summarizeEmailError(errBody));
      }
      if (!ownerOk && ownerSettled?.status === 'fulfilled') {
        const errBody = await ownerSettled.value.text();
        console.warn('Resend owner email returned non-OK:', errBody);
        if (errors.length === 0) errors.push(summarizeEmailError(errBody));
      }

      if (clientOk || ownerOk) {
        return {
          sent: clientOk,
          ownerSent: ownerOk,
          provider: 'resend',
          emailError: errors[0],
        };
      }
    } catch (err) {
      console.warn('Resend email error:', err);
      errors.push(summarizeEmailError(err));
    }
  }

  // Fallback / Direct Free Option: Gmail / Custom SMTP via Nodemailer (IPv4 + 465/587 retry)
  if (smtpUser && smtpPass) {
    const attemptSmtpPort = async (port: number) => {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: port === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          servername: smtpHost,
        },
        // Prefer IPv4 to avoid slow/broken IPv6 sockets on serverless runtimes
        family: 4,
      } as any);

      let clientAccepted = false;
      let ownerSent = false;
      let lastErr = '';

      try {
        const clientInfo = await transporter.sendMail({
          from: `"EasyTransferHub" <${smtpUser}>`,
          to: data.email,
          replyTo: ownerEmail,
          subject,
          html,
          text,
          attachments:
            mpConfig && mpBuffer
              ? [
                  {
                    filename: mpConfig.filename,
                    content: mpBuffer,
                    cid: mpConfig.cid,
                    contentDisposition: 'inline',
                  },
                ]
              : undefined,
          headers: {
            'X-Entity-Ref-ID': bookingRef,
          },
        });
        clientAccepted = Array.isArray(clientInfo?.accepted) && clientInfo.accepted.length > 0;
        if (!clientAccepted) {
          lastErr = `SMTP client rejected: ${JSON.stringify(clientInfo?.rejected)}`;
        }
      } catch (clientErr: unknown) {
        lastErr = summarizeEmailError(clientErr);
        console.warn(`SMTP (port ${port}) client email error:`, clientErr);
      }

      for (const targetOwner of ownerEmails) {
        const ownerInboxTarget =
          targetOwner.toLowerCase() === smtpUser.toLowerCase() &&
          /@gmail\.com$/i.test(targetOwner)
            ? targetOwner.replace(/@gmail\.com$/i, '+booking@gmail.com')
            : targetOwner;

        try {
          const ownerInfo = await transporter.sendMail({
            from: `"EasyTransferHub Dispatch" <${smtpUser}>`,
            to: ownerInboxTarget,
            replyTo: data.email,
            subject: ownerSubject,
            html: ownerHtml,
            text,
            headers: {
              'X-Entity-Ref-ID': `${bookingRef}-owner`,
            },
          });
          if (Array.isArray(ownerInfo?.accepted) && ownerInfo.accepted.length > 0) {
            ownerSent = true;
          }
        } catch (ownerErr: unknown) {
          if (!lastErr) lastErr = summarizeEmailError(ownerErr);
          console.warn(`SMTP (port ${port}) owner dispatch error:`, ownerErr);
        }
      }

      return { clientAccepted, ownerSent, lastErr };
    };

    try {
      let attempt = await attemptSmtpPort(smtpPort);
      // If Gmail 465 was blocked/timed out, retry once on port 587 STARTTLS
      if (!attempt.clientAccepted && !attempt.ownerSent && smtpHost === 'smtp.gmail.com' && smtpPort === 465 && /timeout|ECONN/i.test(attempt.lastErr)) {
        attempt = await attemptSmtpPort(587);
      }

      if (attempt.lastErr) {
        errors.push(attempt.lastErr);
      }

      if (attempt.clientAccepted || attempt.ownerSent) {
        return {
          sent: attempt.clientAccepted,
          ownerSent: attempt.ownerSent,
          provider: 'smtp',
          emailError: errors[0],
        };
      }
    } catch (err) {
      console.warn('SMTP transport error:', err);
      errors.push(summarizeEmailError(err));
    }
  } else {
    errors.push(
      'Missing SMTP_PASS (16-char Google App Password) and RESEND_API_KEY in server Environment Variables.'
    );
  }

  return {
    sent: false,
    ownerSent: false,
    provider: null,
    emailError: errors[0] || 'No active email provider configured.',
  };
}

async function sendWhatsAppNotifications(
  data: BookingConfirmPayload,
  bookingRef: string
): Promise<{ sent: boolean; provider: string | null }> {
  const cleanEnv = (val?: string) =>
    (val || '').trim().replace(/^["']|["']$/g, '').trim();
  const clientDigits = normalizePhoneDigits(data.phone);
  const ownerDigits = normalizePhoneDigits(cleanEnv(process.env.OWNER_WHATSAPP_NUMBER) || '34666744440');
  const messageBody = buildPlainTextMessage(data, bookingRef);

  if (!clientDigits) {
    return { sent: false, provider: null };
  }

  // Option 1: Meta WhatsApp Cloud API
  const waToken = cleanEnv(process.env.WHATSAPP_CLOUD_TOKEN);
  const waPhoneId = cleanEnv(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const waTemplate = cleanEnv(process.env.WHATSAPP_TEMPLATE_NAME);

  if (waToken && waPhoneId) {
    try {
      const endpoint = `https://graph.facebook.com/v21.0/${waPhoneId}/messages`;

      const cleanParam = (val: string) =>
        val.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 180) || '-';

      const buildMetaPayload = (toDigits: string, isOwner: boolean) => {
        if (waTemplate) {
          const params = isOwner
            ? [
                cleanParam(`NEW BOOKING: ${data.passengerName} (+${clientDigits})`),
                cleanParam(`${bookingRef} | ${data.email}`),
                cleanParam(`${data.pickup} -> ${data.dropoff} (${data.dateTime || 'TBC'})`),
                cleanParam(`€${data.quotedPrice} (${data.paymentMethod || 'Card/Cash'})`),
              ]
            : [
                cleanParam(data.passengerName),
                cleanParam(bookingRef),
                cleanParam(`${data.pickup} -> ${data.dropoff}`),
                cleanParam(`€${data.quotedPrice}`),
              ];

          return {
            messaging_product: 'whatsapp',
            to: toDigits,
            type: 'template',
            template: {
              name: waTemplate,
              language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
              components: [
                {
                  type: 'body',
                  parameters: params.map((text) => ({ type: 'text', text })),
                },
              ],
            },
          };
        }
        return {
          messaging_product: 'whatsapp',
          to: toDigits,
          type: 'text',
          text: {
            body: isOwner
              ? `NEW BOOKING ALERT (${bookingRef})\nClient: ${data.passengerName} (+${clientDigits})\nEmail: ${data.email}\n\n${messageBody}`
              : messageBody,
          },
        };
      };

      const metaRequests: Promise<Response>[] = [
        fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${waToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildMetaPayload(clientDigits, false)),
        }),
      ];

      // Notify owner in parallel using template too (so it delivers 24/7 even outside 24h window)
      if (ownerDigits && ownerDigits !== clientDigits) {
        metaRequests.push(
          fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${waToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(buildMetaPayload(ownerDigits, true)),
          })
        );
      }

      const [clientSettled] = await Promise.allSettled(metaRequests);
      if (clientSettled.status === 'fulfilled' && clientSettled.value.ok) {
        return { sent: true, provider: 'whatsapp-cloud' };
      }
      if (clientSettled.status === 'fulfilled') {
        console.warn('Meta WhatsApp Cloud API returned non-OK:', await clientSettled.value.text());
      }
    } catch (err) {
      console.warn('Meta WhatsApp Cloud error:', err);
    }
  }

  // Option 2: Twilio WhatsApp API
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;

  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const authHeader = `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`;
      const fromFormatted = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;

      const params = new URLSearchParams({
        From: fromFormatted,
        To: `whatsapp:+${clientDigits}`,
        Body: messageBody,
      });

      const twilioRequests: Promise<Response>[] = [
        fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }),
      ];

      if (ownerDigits && ownerDigits !== clientDigits) {
        const ownerParams = new URLSearchParams({
          From: fromFormatted,
          To: `whatsapp:+${ownerDigits}`,
          Body: `NEW BOOKING ALERT (${bookingRef})\nClient: ${data.passengerName} (+${clientDigits})\nEmail: ${data.email}\n\n${messageBody}`,
        });
        twilioRequests.push(
          fetch(twilioUrl, {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: ownerParams.toString(),
          })
        );
      }

      const [clientSettled] = await Promise.allSettled(twilioRequests);
      if (clientSettled.status === 'fulfilled' && clientSettled.value.ok) {
        return { sent: true, provider: 'twilio' };
      }
      if (clientSettled.status === 'fulfilled') {
        console.warn('Twilio WhatsApp API returned non-OK:', await clientSettled.value.text());
      }
    } catch (err) {
      console.warn('Twilio WhatsApp error:', err);
    }
  }

  return { sent: false, provider: null };
}

export async function processBookingConfirmation(rawPayload: BookingConfirmPayload) {
  const payload = sanitizeBookingPayload(rawPayload);
  const bookingRef = payload.bookingRef as string;

  const [emailResult, whatsappResult] = await Promise.all([
    sendEmailNotifications(payload, bookingRef),
    sendWhatsAppNotifications(payload, bookingRef),
  ]);

  return {
    success: true,
    bookingRef,
    emailSent: emailResult.sent,
    ownerEmailSent: emailResult.ownerSent,
    emailProvider: emailResult.provider,
    emailError: emailResult.emailError,
    whatsappSent: whatsappResult.sent,
    whatsappProvider: whatsappResult.provider,
  };
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
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (!(await isAuthorizedOwner(req))) {
      return res.status(401).json({ error: 'Owner authentication required.' });
    }
    return res.status(200).json(getEmailConfigStatus());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isValidOrigin(req))) {
    return res.status(403).json({ error: 'Forbidden origin.' });
  }

  if (!checkBookingRateLimit(req)) {
    return res.status(429).json({
      error: 'Too many booking attempts. Please wait a few minutes and try again.',
    });
  }

  try {
    const rawBody =
      typeof req.body === 'string'
        ? req.body.length <= 50000
          ? JSON.parse(req.body)
          : {}
        : req.body || {};

    const body = sanitizeBookingPayload(rawBody);

    const submittedPrice = Number(rawBody?.quotedPrice);
    const minFareAllowed = computeMinimumAllowedFare(
      body.pickup,
      body.dropoff,
      body.vehicleName,
      body.childSeats,
      Boolean(body.isRoundTrip)
    );
    if (!Number.isFinite(submittedPrice) || submittedPrice < minFareAllowed || submittedPrice > 50000) {
      return res.status(400).json({
        error: `Invalid transfer fare. Minimum verified fare for this route and vehicle is €${minFareAllowed}.`,
      });
    }

    if (
      !body.pickup ||
      !body.dropoff ||
      !body.passengerName ||
      !body.email ||
      !body.phone
    ) {
      return res.status(400).json({
        error: 'Pickup, drop-off, full name, email, and phone number are required.',
      });
    }

    if (!isValidEmailAddress(body.email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address.',
      });
    }

    if (normalizePhoneDigits(body.phone).length < 6) {
      return res.status(400).json({
        error: 'Please enter a valid phone / WhatsApp number.',
      });
    }

    const result = await processBookingConfirmation(body);
    await trackBookingEmailSafely();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Booking Confirm API Error:', error);
    return res.status(500).json({
      error: 'Unable to process automated notifications right now.',
    });
  }
}
