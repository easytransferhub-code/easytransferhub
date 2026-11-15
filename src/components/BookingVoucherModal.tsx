import React, { useEffect } from 'react';
import { X, Printer, Copy, Check, MessageCircle, MapPin, Calendar, Users, Briefcase, Car, ShieldCheck, Plane } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BUSINESS_INFO } from '../data/transferData';
import { generateWhatsAppLink } from '../utils/pricing';

interface BookingVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: any;
}

export const BookingVoucherModal: React.FC<BookingVoucherModalProps> = ({
  isOpen,
  onClose,
  bookingData,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // graceful ignore
      }
    }
  }, [isOpen]);

  if (!isOpen || !bookingData) return null;

  const bookingRef =
    bookingData.bookingRef || `ETH-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const paxDetails = bookingData.children
      ? `${bookingData.passengers} (${bookingData.adults || 1} Adults, ${bookingData.children} Children${bookingData.childAge ? ` [${bookingData.childAge}]` : ''})`
      : `${bookingData.passengers} Adult(s)`;

    const text = `EASYTRANSFERHUB BOOKING VOUCHER
Ref: ${bookingRef}
Pickup: ${bookingData.pickup}
Drop-off: ${bookingData.dropoff}
Date & Time: ${bookingData.dateTime || 'To be confirmed'}
${bookingData.flightNumber ? `Flight: ${bookingData.flightNumber}\n` : ''}${bookingData.passengerName ? `Client Name: ${bookingData.passengerName}\n` : ''}${bookingData.phone ? `Phone: ${bookingData.phone}\n` : ''}${bookingData.email ? `Email: ${bookingData.email}\n` : ''}Passengers: ${paxDetails}
Luggage: ${bookingData.luggage} bags ${bookingData.luggageDetails ? `(${bookingData.luggageDetails})` : ''}
Child Seats: ${bookingData.childSeatsDetails || (bookingData.childSeats > 0 ? `${bookingData.childSeats} seat(s) (+€${bookingData.childSeats * 5})` : 'None')}
Vehicle: ${bookingData.vehicleName}
Total Fixed Fare: €${bookingData.quotedPrice} ${bookingData.isRoundTrip ? '(Round Trip)' : '(One Way)'}
Payment Method: ${bookingData.paymentMethod || 'Pay Cash or Card to Chauffeur'}${bookingData.driverNotes ? `\nDriver Notes: ${bookingData.driverNotes}` : ''}
Manager: ${BUSINESS_INFO.owner} (${BUSINESS_INFO.phoneDisplay})
All highway tolls & flight tracking included.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const link = generateWhatsAppLink({
      pickup: bookingData.pickup,
      dropoff: bookingData.dropoff,
      dateTime: bookingData.dateTime,
      isRoundTrip: bookingData.isRoundTrip,
      returnDateTime: bookingData.returnDateTime,
      passengers: bookingData.passengers,
      adults: bookingData.adults,
      children: bookingData.children,
      childAge: bookingData.childAge,
      luggage: bookingData.luggage,
      luggageDetails: bookingData.luggageDetails,
      childSeats: bookingData.childSeats,
      childSeatsDetails: bookingData.childSeatsDetails,
      vehicleName: bookingData.vehicleName,
      quotedPrice: bookingData.quotedPrice,
      flightNumber: bookingData.flightNumber,
      passengerName: bookingData.passengerName,
      email: bookingData.email,
      phone: bookingData.phone,
      paymentMethod: bookingData.paymentMethod,
      driverNotes: bookingData.driverNotes,
      distanceKm: bookingData.distanceKm,
    });
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#67efff] overflow-hidden my-6">
        {/* Voucher Header */}
        <div className="bg-[#e6fdff] text-slate-900 p-5 flex items-center justify-between border-b border-[#8ceeff]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg text-slate-900">
                Easytransfer<span className="text-[#00a6bf]">hub</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#00f0ff] text-slate-950 px-2 py-0.5 rounded">
                Official Voucher
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">Booking Reference: <b className="text-[#007c91]">{bookingRef}</b></p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-[#ccfbff] transition-colors cursor-pointer"
            aria-label="Close voucher"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Printable Content */}
        <div className="p-6 space-y-5 text-slate-900 printable-content">
          {/* Status strip */}
          <div className="p-3 bg-[#f2feff] border border-[#8ceeff] rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-[#042f40]">Fare Quoted & Ready for Confirmation</span>
            <span className="font-semibold text-[#008da1]">60 Min Free Airport Waiting</span>
          </div>

          {/* Route details */}
          <div className="border border-[#9beeff] rounded-xl p-4 bg-[#f5feff] space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#009cb3] mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Pickup Location</span>
                <span className="font-bold text-slate-900 text-sm">{bookingData.pickup}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#007c91] mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Drop-off Destination</span>
                <span className="font-bold text-slate-900 text-sm">{bookingData.dropoff}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#9beeff]/60 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pickup Date & Time</span>
                <span className="font-bold text-slate-800">{bookingData.dateTime ? new Date(bookingData.dateTime).toLocaleString() : 'Pending confirmation'}</span>
              </div>

              {bookingData.isRoundTrip && bookingData.returnDateTime && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Return Date & Time</span>
                  <span className="font-bold text-slate-800">{new Date(bookingData.returnDateTime).toLocaleString()}</span>
                </div>
              )}

              {bookingData.flightNumber && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Flight Number</span>
                  <span className="font-bold text-slate-800">{bookingData.flightNumber}</span>
                </div>
              )}

              {bookingData.passengerName && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Client / Signboard</span>
                  <span className="font-bold text-slate-800">{bookingData.passengerName}</span>
                </div>
              )}

              {bookingData.phone && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Phone / WhatsApp</span>
                  <span className="font-bold text-slate-800">{bookingData.phone}</span>
                </div>
              )}

              {bookingData.email && (
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Email</span>
                  <span className="font-bold text-slate-800 break-all">{bookingData.email}</span>
                </div>
              )}

              {bookingData.driverNotes && (
                <div className="col-span-2 pt-1.5 border-t border-[#9beeff]/50">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Notes for Driver</span>
                  <span className="font-medium text-slate-800">{bookingData.driverNotes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle and Passengers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-[#f5feff] p-3 rounded-xl border border-[#9beeff]">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Vehicle</span>
              <span className="font-bold text-xs sm:text-sm text-slate-900">{bookingData.vehicleName}</span>
            </div>

            <div className="bg-[#f5feff] p-3 rounded-xl border border-[#9beeff]">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Passengers & Luggage</span>
              <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                {bookingData.passengers} Pax · {bookingData.luggage} Bags
              </span>
              {bookingData.luggageDetails && (
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  {bookingData.luggageDetails}
                </span>
              )}
            </div>

            <div className="bg-[#f5feff] p-3 rounded-xl border border-[#9beeff]">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Child Seats</span>
              <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                {bookingData.childSeatsDetails || (bookingData.childSeats > 0 ? `${bookingData.childSeats} seat(s) (+€${bookingData.childSeats * 5})` : 'None')}
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-xl bg-[#e6fdff] text-slate-900 flex items-center justify-between border border-[#00d8eb]">
            <div>
              <span className="text-xs text-[#042f40] uppercase tracking-wider block font-bold">
                Total Guaranteed Price
              </span>
              <span className="text-2xl font-black font-display text-[#007c91] tabular-nums">
                €{bookingData.quotedPrice}
              </span>
            </div>
            <div className="text-right text-xs text-slate-700">
              <span className="font-bold text-[#042f40]">
                {bookingData.paymentMethod || 'Pay Cash or Card to Chauffeur'}
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5">All Catalan tolls included</span>
            </div>
          </div>

          {/* Driver Contact & Assistance */}
          <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Chauffeur Dispatcher: <b>{BUSINESS_INFO.owner}</b></span>
              <span>Phone / WhatsApp: <b>{BUSINESS_INFO.phoneDisplay}</b></span>
            </div>
            <p className="text-[11px] text-slate-500">
              Meeting point: The driver waits inside the arrivals hall holding a sign with your name. Flight radar tracking is enabled automatically.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-[#9beeff]/60">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00f0ff] hover:bg-[#00d8eb] text-slate-950 font-extrabold text-xs sm:text-sm shadow-[0_4px_16px_-4px_rgba(0,240,255,0.55)] cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Confirm on WhatsApp Now</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#e6fdff] hover:bg-[#ccfbff] text-[#042f40] border border-[#67efff] font-bold text-xs cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#008da1]" /> : <Copy className="w-4 h-4 text-[#008da1]" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Voucher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
