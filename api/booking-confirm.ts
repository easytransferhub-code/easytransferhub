import nodemailer from 'nodemailer';

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
  return value.replace(/[\r\n\0\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

export function isValidEmailAddress(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 160;
}

function sanitizeBookingPayload(raw: BookingConfirmPayload): BookingConfirmPayload {
  const cleanRef = sanitizeLine(raw.bookingRef, 20);
  const safePrice = Number(raw.quotedPrice);
  const safePax = Math.min(30, Math.max(1, Number(raw.passengers) || 1));
  const safeBags = Math.min(30, Math.max(0, Number(raw.luggage) || 0));
  const safeSeats = Math.min(10, Math.max(0, Number(raw.childSeats) || 0));

  return {
    bookingRef: /^ETH-\d{6}$/.test(cleanRef)
      ? cleanRef
      : `ETH-${Math.floor(100000 + Math.random() * 900000)}`,
    pickup: sanitizeLine(raw.pickup, 220),
    dropoff: sanitizeLine(raw.dropoff, 220),
    dateTime: sanitizeLine(raw.dateTime, 60),
    isRoundTrip: Boolean(raw.isRoundTrip),
    returnDateTime: sanitizeLine(raw.returnDateTime, 60),
    passengers: safePax,
    adults: Math.min(30, Math.max(1, Number(raw.adults) || safePax)),
    children: Math.min(20, Math.max(0, Number(raw.children) || 0)),
    childAge: sanitizeLine(raw.childAge, 80),
    luggage: safeBags,
    luggageDetails: sanitizeLine(raw.luggageDetails, 160),
    childSeats: safeSeats,
    childSeatsDetails: sanitizeLine(raw.childSeatsDetails, 160),
    vehicleName: sanitizeLine(raw.vehicleName, 100) || 'Standard Sedan',
    quotedPrice: Number.isFinite(safePrice) && safePrice > 0 && safePrice <= 50000 ? Math.round(safePrice) : 50,
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

function buildBookingEmailHtml(data: BookingConfirmPayload, bookingRef: string): string {
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

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#f2feff; padding:28px 16px; color:#0f172a;">
    <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #67efff; border-radius:20px; overflow:hidden; box-shadow:0 12px 32px rgba(0,166,191,0.12);">
      <div style="height:6px; background:#00f0ff;"></div>
      <div style="background:#e6fdff; padding:22px 26px; border-bottom:1px solid #8ceeff;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td>
              <div style="font-size:22px; font-weight:800; color:#042f40; letter-spacing:-0.02em;">
                Easytransfer<span style="color:#00a6bf;">hub</span>
              </div>
              <div style="margin-top:4px; font-size:12px; color:#007c91; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">
                Official Transfer Confirmation
              </div>
            </td>
            <td style="text-align:right; vertical-align:top;">
              <span style="display:inline-block; background:#00f0ff; color:#042f40; font-weight:800; font-size:12px; padding:6px 12px; border-radius:999px; border:1px solid #00c8e8;">
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

        <div style="background:#f5feff; border:1px solid #8ceeff; border-radius:14px; padding:18px; margin-bottom:18px;">
          <div style="font-size:11px; font-weight:800; color:#007c91; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">Pickup Location</div>
          <div style="font-size:15px; font-weight:800; color:#042f40; margin-bottom:12px;">${safePickup}</div>
          <div style="border-top:1px dashed #67efff; margin:10px 0;"></div>
          <div style="font-size:11px; font-weight:800; color:#007c91; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">Drop-off Destination</div>
          <div style="font-size:15px; font-weight:800; color:#042f40;">${safeDropoff}</div>
        </div>

        <div style="background:#ffffff; border:1px solid #cff9ff; border-radius:14px; padding:16px 18px; margin-bottom:18px;">
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

        <div style="background:#e6fdff; border:1px solid #00c8e8; border-radius:14px; padding:16px 20px; margin-bottom:20px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td>
                <div style="font-size:11px; font-weight:800; color:#007c91; text-transform:uppercase; letter-spacing:0.05em;">Guaranteed Fixed Fare</div>
                <div style="font-size:12px; color:#334155; margin-top:2px;">All highway tolls, taxes &amp; 60m flight wait included</div>
              </td>
              <td style="text-align:right;">
                <span style="font-size:26px; font-weight:800; color:#042f40;">€${data.quotedPrice}</span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px; margin-bottom:20px; font-size:13px; color:#334155; line-height:1.5;">
          <strong style="color:#042f40;">Airport Meet &amp; Greet Instructions:</strong><br/>
          Your chauffeur will track your flight live and wait inside the arrivals hall holding a nameboard reading <strong>"${safeName}"</strong>. 60 minutes of complimentary airport waiting time is included.
        </div>

        <div style="text-align:center; margin-bottom:14px;">
          <a href="https://wa.me/34663958889?text=${encodeURIComponent(`Hello Mr. Mir, regarding my Easytransferhub booking ${bookingRef} (${data.pickup} to ${data.dropoff}).`)}" style="display:inline-block; background:#00f0ff; color:#042f40; text-decoration:none; font-weight:800; font-size:14px; padding:12px 24px; border-radius:12px; border:1px solid #00c8e8;">
            Message Chauffeur Dispatch on WhatsApp
          </a>
        </div>

        <p style="margin:0; font-size:12px; color:#64748b; text-align:center;">
          24/7 Dispatch Manager: <strong>Mr. Mir</strong> · WhatsApp: <strong>+34 663 958 889</strong> · Email: <strong>easytransferhub@gmail.com</strong>
        </p>
      </div>
    </div>
  </div>`;
}

function buildOwnerDispatchEmailHtml(data: BookingConfirmPayload, bookingRef: string): string {
  const clientDigits = normalizePhoneDigits(data.phone);
  const waClientReplyUrl = clientDigits
    ? `https://wa.me/${clientDigits}?text=${encodeURIComponent(`Hello ${data.passengerName}, thank you for booking with Easytransferhub! Your transfer (${bookingRef}) from ${data.pickup} to ${data.dropoff} is confirmed for €${data.quotedPrice}. Best regards, Mr. Mir (+34 663 958 889)`)}`
    : '';

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f2feff; padding:24px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border:2px solid #00c8e8; border-radius:16px; padding:24px;">
      <div style="font-size:12px; font-weight:800; color:#007c91; text-transform:uppercase; letter-spacing:0.06em;">
        NEW TRANSFER BOOKING RECEIVED
      </div>
      <h2 style="margin:6px 0 16px; color:#042f40; font-size:20px;">
        ${escapeHtml(bookingRef)} · €${data.quotedPrice} (${escapeHtml(data.vehicleName)})
      </h2>
      <p style="margin:0 0 14px; font-size:14px; color:#0f172a;">
        <strong>Client:</strong> ${escapeHtml(data.passengerName)}<br/>
        <strong>Phone / WhatsApp:</strong> ${escapeHtml(data.phone)}<br/>
        <strong>Email:</strong> ${escapeHtml(data.email)}<br/>
        <strong>Pickup:</strong> ${escapeHtml(data.pickup)}<br/>
        <strong>Drop-off:</strong> ${escapeHtml(data.dropoff)}<br/>
        <strong>Date &amp; Time:</strong> ${escapeHtml(data.dateTime || 'To be confirmed')}<br/>
        ${data.flightNumber ? `<strong>Flight:</strong> ${escapeHtml(data.flightNumber)}<br/>` : ''}
        <strong>Pax / Luggage / Seats:</strong> ${data.passengers} Pax · ${data.luggage} Bags · ${data.childSeats} Child Seats${data.childSeats > 0 ? ` (+€${data.childSeats * 5})` : ''}<br/>
        <strong>Payment:</strong> ${escapeHtml(data.paymentMethod || 'Card / Cash')}<br/>
        ${data.driverNotes ? `<strong>Notes:</strong> ${escapeHtml(data.driverNotes)}<br/>` : ''}
      </p>
      ${waClientReplyUrl ? `<a href="${waClientReplyUrl}" style="display:inline-block; background:#00f0ff; color:#042f40; font-weight:800; font-size:14px; text-decoration:none; padding:12px 20px; border-radius:10px; border:1px solid #00c8e8;">1-Tap Reply to Client on WhatsApp</a>` : ''}
    </div>
  </div>`;
}

function buildPlainTextMessage(data: BookingConfirmPayload, bookingRef: string): string {
  const lines = [
    `Easytransferhub — Booking Confirmed (${bookingRef})`,
    ``,
    `Hello ${data.passengerName},`,
    `Your private transfer booking is confirmed:`,
    ``,
    `• Ref: ${bookingRef}`,
    `• Pickup: ${data.pickup}`,
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
    `24/7 Dispatch (Mr. Mir): +34 663 958 889 | easytransferhub@gmail.com`
  );
  return lines.join('\n');
}

async function sendEmailNotifications(
  data: BookingConfirmPayload,
  bookingRef: string
): Promise<{ sent: boolean; ownerSent: boolean; provider: string | null }> {
  const cleanEnv = (val?: string) =>
    (val || '').trim().replace(/^["']|["']$/g, '').trim();
  const configuredOwner = cleanEnv(process.env.BOOKING_OWNER_EMAIL);
  const ownerEmail = EMAIL_REGEX.test(configuredOwner)
    ? configuredOwner
    : 'easytransferhub@gmail.com';
  const subject = `Your Easytransferhub Transfer Confirmation [${bookingRef}] — €${data.quotedPrice}`;
  const ownerSubject = `NEW BOOKING [${bookingRef}] €${data.quotedPrice} — ${data.passengerName} (${data.phone})`;
  const html = buildBookingEmailHtml(data, bookingRef);
  const ownerHtml = buildOwnerDispatchEmailHtml(data, bookingRef);
  const text = buildPlainTextMessage(data, bookingRef);

  // Primary Recommended Option: Gmail / Custom SMTP via Nodemailer
  const smtpUser =
    cleanEnv(process.env.SMTP_USER) ||
    cleanEnv(process.env.GMAIL_USER) ||
    cleanEnv(process.env.EMAIL_USER) ||
    ownerEmail;
  const rawPass =
    cleanEnv(process.env.SMTP_PASS) ||
    cleanEnv(process.env.GMAIL_APP_PASSWORD) ||
    cleanEnv(process.env.SMTP_PASSWORD) ||
    cleanEnv(process.env.EMAIL_PASS) ||
    '';
  const smtpPass = rawPass.replace(/\s+/g, '').trim();

  if (smtpUser && smtpPass) {
    try {
      const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
      const smtpPort = Number(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport(
        smtpHost === 'smtp.gmail.com'
          ? {
              service: 'gmail',
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
      );

      // 1. Send Client Email FIRST
      const clientInfo = await transporter.sendMail({
        from: `"Easytransferhub Bookings" <${smtpUser}>`,
        to: data.email,
        replyTo: ownerEmail,
        subject,
        html,
        text,
        headers: {
          'X-Entity-Ref-ID': bookingRef,
        },
      });

      const clientAccepted =
        Array.isArray(clientInfo?.accepted) && clientInfo.accepted.length > 0;

      // 2. Send Dedicated Owner Dispatch Email to Inbox
      // If sender and owner are the same @gmail.com account, use +booking sub-address
      // so Gmail delivers it into Primary Inbox instead of hiding it as self-sent mail.
      let ownerSent = false;
      if (ownerEmail) {
        const ownerInboxTarget =
          ownerEmail.toLowerCase() === smtpUser.toLowerCase() &&
          /@gmail\.com$/i.test(ownerEmail)
            ? ownerEmail.replace(/@gmail\.com$/i, '+booking@gmail.com')
            : ownerEmail;

        try {
          const ownerInfo = await transporter.sendMail({
            from: `"Easytransferhub Dispatch" <${smtpUser}>`,
            to: ownerInboxTarget,
            replyTo: data.email,
            subject: ownerSubject,
            html: ownerHtml,
            text,
            headers: {
              'X-Entity-Ref-ID': `${bookingRef}-dispatch`,
            },
          });
          ownerSent =
            Array.isArray(ownerInfo?.accepted) && ownerInfo.accepted.length > 0;
        } catch (ownerErr: unknown) {
          console.warn('SMTP owner dispatch warning:', ownerErr);
        }
      }

      if (clientAccepted || ownerSent) {
        return { sent: clientAccepted, ownerSent, provider: 'smtp' };
      }
      console.warn('SMTP emails not accepted:', clientInfo?.rejected);
    } catch (err) {
      console.warn('SMTP email error:', err);
    }
  }

  // Secondary Option: Resend HTTP API
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && resendKey.length > 8) {
    try {
      const fromAddress =
        process.env.RESEND_FROM_EMAIL || 'Easytransferhub <onboarding@resend.dev>';
      const requests: Promise<Response>[] = [
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [data.email],
            reply_to: ownerEmail,
            subject,
            html,
            text,
          }),
        }),
      ];

      if (ownerEmail) {
        requests.push(
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [ownerEmail],
              reply_to: data.email,
              subject: ownerSubject,
              html: ownerHtml,
              text,
            }),
          })
        );
      }

      const [clientSettled, ownerSettled] = await Promise.allSettled(requests);
      const clientOk =
        clientSettled.status === 'fulfilled' && clientSettled.value.ok;
      const ownerOk =
        ownerSettled?.status === 'fulfilled' ? ownerSettled.value.ok : false;

      if (clientOk || ownerOk) {
        return { sent: clientOk, ownerSent: ownerOk, provider: 'resend' };
      }
      if (clientSettled.status === 'fulfilled') {
        console.warn('Resend email API returned non-OK:', await clientSettled.value.text());
      }
    } catch (err) {
      console.warn('Resend email error:', err);
    }
  }

  return { sent: false, ownerSent: false, provider: null };
}

async function sendWhatsAppNotifications(
  data: BookingConfirmPayload,
  bookingRef: string
): Promise<{ sent: boolean; provider: string | null }> {
  const clientDigits = normalizePhoneDigits(data.phone);
  const ownerDigits = normalizePhoneDigits(process.env.OWNER_WHATSAPP_NUMBER || '34663958889');
  const messageBody = buildPlainTextMessage(data, bookingRef);

  if (!clientDigits) {
    return { sent: false, provider: null };
  }

  // Option 1: Meta WhatsApp Cloud API
  const waToken = process.env.WHATSAPP_CLOUD_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const waTemplate = process.env.WHATSAPP_TEMPLATE_NAME;

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
    whatsappSent: whatsappResult.sent,
    whatsappProvider: whatsappResult.provider,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    return res.status(200).json(result);
  } catch (error) {
    console.error('Booking Confirm API Error:', error);
    return res.status(500).json({
      error: 'Unable to process automated notifications right now.',
    });
  }
}
