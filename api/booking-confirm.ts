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

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

function escapeHtml(str: string): string {
  return str
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
              <td style="padding:7px 0; font-weight:700; color:#0f172a; border-bottom:1px solid #f1f5f9;">${data.passengers} Pax · ${data.luggage} Bags${data.childSeats > 0 ? ` · ${data.childSeats} Child Seat(s)` : ''}</td>
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
        <strong>Pax / Luggage / Seats:</strong> ${data.passengers} Pax · ${data.luggage} Bags · ${data.childSeats} Child Seats<br/>
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
    `• Passengers: ${data.passengers} | Luggage: ${data.luggage} bags${data.childSeats > 0 ? ` | Child Seats: ${data.childSeats}` : ''}`,
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
): Promise<{ sent: boolean; provider: string | null }> {
  const ownerEmail = process.env.BOOKING_OWNER_EMAIL || 'easytransferhub@gmail.com';
  const subject = `Booking Confirmed [${bookingRef}] — ${data.pickup} to ${data.dropoff} (€${data.quotedPrice})`;
  const ownerSubject = `NEW BOOKING [${bookingRef}] €${data.quotedPrice} — ${data.passengerName} (${data.phone})`;
  const html = buildBookingEmailHtml(data, bookingRef);
  const ownerHtml = buildOwnerDispatchEmailHtml(data, bookingRef);
  const text = buildPlainTextMessage(data, bookingRef);

  // Primary Recommended Option: Gmail / Custom SMTP via Nodemailer
  const smtpUser =
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER ||
    ownerEmail;
  const smtpPass =
    process.env.SMTP_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASSWORD ||
    process.env.EMAIL_PASS;

  if (smtpUser && smtpPass) {
    try {
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
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

      const [clientResult] = await Promise.allSettled([
        transporter.sendMail({
          from: `"Easytransferhub" <${smtpUser}>`,
          to: data.email,
          replyTo: ownerEmail,
          subject,
          html,
          text,
        }),
        transporter.sendMail({
          from: `"Easytransferhub Dispatch" <${smtpUser}>`,
          to: ownerEmail,
          replyTo: data.email,
          subject: ownerSubject,
          html: ownerHtml,
          text,
        }),
      ]);

      if (clientResult.status === 'fulfilled') {
        return { sent: true, provider: 'smtp' };
      }
      console.warn('SMTP client email rejected:', clientResult.reason);
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

      const [clientSettled] = await Promise.allSettled(requests);
      if (clientSettled.status === 'fulfilled' && clientSettled.value.ok) {
        return { sent: true, provider: 'resend' };
      }
      if (clientSettled.status === 'fulfilled') {
        console.warn('Resend email API returned non-OK:', await clientSettled.value.text());
      }
    } catch (err) {
      console.warn('Resend email error:', err);
    }
  }

  return { sent: false, provider: null };
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

export async function processBookingConfirmation(payload: BookingConfirmPayload) {
  const bookingRef =
    payload.bookingRef || `ETH-${Math.floor(100000 + Math.random() * 900000)}`;

  const [emailResult, whatsappResult] = await Promise.all([
    sendEmailNotifications(payload, bookingRef),
    sendWhatsAppNotifications(payload, bookingRef),
  ]);

  return {
    success: true,
    bookingRef,
    emailSent: emailResult.sent,
    emailProvider: emailResult.provider,
    whatsappSent: whatsappResult.sent,
    whatsappProvider: whatsappResult.provider,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: BookingConfirmPayload =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    if (
      !body.pickup?.trim() ||
      !body.dropoff?.trim() ||
      !body.passengerName?.trim() ||
      !body.email?.trim() ||
      !body.phone?.trim()
    ) {
      return res.status(400).json({
        error: 'Pickup, drop-off, full name, email, and phone number are required.',
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
