import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Baby,
  Plane,
  User,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  FileText,
  Navigation,
  Loader2,
  Car,
  Minus,
  Plus,
  X,
  Info,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mail,
  Phone,
  Wallet,
  Banknote,
  Search,
  Check,
  Lock,
  Copy,
  RotateCcw,
  Anchor,
  Train,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BARCELONA_ZONES,
  BUSINESS_INFO,
  CHILD_SEAT_PRICE_EUR,
  QUICK_LOCATIONS,
  TRANSLATIONS,
  VEHICLES,
} from '../data/transferData';
import {
  calculateQuote,
  calculateHaversineKm,
  generateWhatsAppLink,
  QuoteResult,
} from '../utils/pricing';
import { GooglePlacesInput } from './GooglePlacesInput';
import { GoogleRouteDistanceSync } from './GoogleRouteMap';

interface CountryCodeOption {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRY_CODES: CountryCodeOption[] = [
  { iso2: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { iso2: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { iso2: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { iso2: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { iso2: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { iso2: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { iso2: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { iso2: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { iso2: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { iso2: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { iso2: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { iso2: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { iso2: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { iso2: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { iso2: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { iso2: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { iso2: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { iso2: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { iso2: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { iso2: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { iso2: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { iso2: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { iso2: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { iso2: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { iso2: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { iso2: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { iso2: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { iso2: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { iso2: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { iso2: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { iso2: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { iso2: 'AD', name: 'Andorra', dialCode: '+376', flag: '🇦🇩' },
];

interface BookingCalculatorProps {
  language: 'en' | 'es' | 'ca' | 'ur';
  prefilledRoute?: { pickup: string; dropoff: string } | null;
  onOpenVoucher: (bookingData: any) => void;
  mapsEnabled?: boolean;
}

export const BookingCalculator: React.FC<BookingCalculatorProps> = ({
  language,
  prefilledRoute,
  onOpenVoucher,
  mapsEnabled = false,
}) => {
  const t = TRANSLATIONS[language];

  // Form State - Empty by default so client can search or click quick chips
  const [pickup, setPickup] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [dropoff, setDropoff] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [validationError, setValidationError] = useState('');

  const [dateTime, setDateTime] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDateTime, setReturnDateTime] = useState('');

  // Step 2: Flight, Client Details, Driver Notes & Payment Method
  const [flightNumber, setFlightNumber] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(COUNTRY_CODES[0]);
  const [countrySearch, setCountrySearch] = useState('🇪🇸 Spain (+34)');
  const [showCountryList, setShowCountryList] = useState(false);
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const [passengerPhone, setPassengerPhone] = useState('');
  const [addDriverNotes, setAddDriverNotes] = useState(false);
  const [driverNotesText, setDriverNotesText] = useState('');
  const [bulkyLuggage, setBulkyLuggage] = useState(false);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cash'>('card');
  const [cardPreference, setCardPreference] = useState<'online' | 'vehicle'>('online');
  const [step2Error, setStep2Error] = useState('');

  // Detailed Passenger State
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAgeGroup, setChildAgeGroup] = useState<'0-2' | '3-6' | '7-11'>('3-6');

  // Detailed Luggage State
  const [largeBags, setLargeBags] = useState(1); // XXL / Large (75-80cm)
  const [mediumBags, setMediumBags] = useState(1); // Medium (65cm)
  const [handCarryBags, setHandCarryBags] = useState(0); // Small / Cabin (55cm)
  const [shoulderBags, setShoulderBags] = useState(0); // Backpack / Shoulder bag
  const [showLuggageDetails, setShowLuggageDetails] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Detailed Child Seats State
  const [babySeats, setBabySeats] = useState(0); // Baby seat (0-2 years, group 0+/1)
  const [boosterSeats, setBoosterSeats] = useState(0); // Booster seat (3+ years, group 2/3)

  // Derived totals
  const totalPassengers = Math.max(1, adults + children);
  const checkInSuitcases = largeBags + mediumBags;
  const totalBags = checkInSuitcases + handCarryBags + shoulderBags;
  const totalChildSeats = babySeats + boosterSeats;

  // Booking flow step: 'calculator' -> 'booking' -> 'confirmed'
  const [currentStep, setCurrentStep] = useState<'calculator' | 'booking' | 'confirmed'>('calculator');
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [confirmedBookingInfo, setConfirmedBookingInfo] = useState<{
    bookingRef: string;
    emailSent: boolean;
    whatsappSent: boolean;
    fullPhone: string;
    whatsappUrl: string;
  } | null>(null);
  const [copiedConfirmed, setCopiedConfirmed] = useState(false);

  // Selected Vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('standard');

  // Google Routes computed distance & duration
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMinutes, setRouteDurationMinutes] = useState<number | null>(null);

  // Route & Quote calculation state
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [priceRevealed, setPriceRevealed] = useState(false);

  // Toggle for merged Passengers + Luggage + Child Seats button
  const [showPassengersLuggageSeats, setShowPassengersLuggageSeats] = useState(false);

  // Quick Terminal 1 / Terminal 2 popover for Pickup or Drop-off Airport chip
  const [airportDropdownField, setAirportDropdownField] = useState<'pickup' | 'dropoff' | null>(null);
  const pickupAirportRef = useRef<HTMLDivElement>(null);
  const dropoffAirportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAirportOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        pickupAirportRef.current &&
        !pickupAirportRef.current.contains(target) &&
        dropoffAirportRef.current &&
        !dropoffAirportRef.current.contains(target)
      ) {
        setAirportDropdownField(null);
      }
    };
    document.addEventListener('mousedown', handleAirportOutside);
    return () => document.removeEventListener('mousedown', handleAirportOutside);
  }, []);

  const applyQuickLocation = (field: 'pickup' | 'dropoff', quickId: string) => {
    const loc = QUICK_LOCATIONS.find((q) => q.id === quickId);
    if (!loc) return;
    if (field === 'pickup') {
      setPickup(loc.address);
      setPickupCoords({ lat: loc.lat, lon: loc.lon });
    } else {
      setDropoff(loc.address);
      setDropoffCoords({ lat: loc.lat, lon: loc.lon });
    }
    setRouteDistanceKm(null);
    setRouteDurationMinutes(null);
    setValidationError('');
    setAirportDropdownField(null);
  };

  // Close country picker dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (countryPickerRef.current && !countryPickerRef.current.contains(e.target as Node)) {
        setShowCountryList(false);
        setCountrySearch(`${selectedCountry.flag} ${selectedCountry.name} (${selectedCountry.dialCode})`);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedCountry]);

  // Initialize default date/time (tomorrow at 10:00 AM)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const isoString = tomorrow.toISOString().slice(0, 16);
    setDateTime(isoString);

    const returnDate = new Date(tomorrow);
    returnDate.setDate(returnDate.getDate() + 4);
    returnDate.setHours(14, 0, 0, 0);
    setReturnDateTime(returnDate.toISOString().slice(0, 16));
  }, []);

  // Update if prefilled route triggered from Popular Routes
  useEffect(() => {
    if (prefilledRoute) {
      setPickup(prefilledRoute.pickup);
      setDropoff(prefilledRoute.dropoff);
      // Attempt geocode or match
      matchCoordinatesForAddresses(prefilledRoute.pickup, prefilledRoute.dropoff);
    }
  }, [prefilledRoute]);

  const resolveKnownCoords = (addr: string): { lat: number; lon: number } | null => {
    const lower = addr.toLowerCase();
    const ql = QUICK_LOCATIONS.find(
      (q) =>
        lower.includes(q.shortLabel.toLowerCase()) ||
        lower.includes(q.name.toLowerCase())
    );
    if (ql) return { lat: ql.lat, lon: ql.lon };

    const zone = BARCELONA_ZONES.find(
      (z) =>
        lower.includes(z.district.toLowerCase()) ||
        z.mainAreas.some((a) => lower.includes(a.toLowerCase()))
    );
    if (zone) return { lat: zone.center.lat, lon: zone.center.lng };

    return null;
  };

  const matchCoordinatesForAddresses = (pText: string, dText: string) => {
    const pMatch = resolveKnownCoords(pText);
    if (pMatch) setPickupCoords(pMatch);

    const dMatch = resolveKnownCoords(dText);
    if (dMatch) setDropoffCoords(dMatch);
  };

  // Recalculate Quote using Google Routes distance (or coordinate/zone fallback)
  const runRouteCalculation = () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setQuote(null);
      return;
    }

    setCalculating(true);
    const pCoords = pickupCoords || resolveKnownCoords(pickup);
    const dCoords = dropoffCoords || resolveKnownCoords(dropoff);

    let distKm = routeDistanceKm ?? 18;
    let durationMins = routeDurationMinutes ?? 28;

    if (routeDistanceKm === null && pCoords && dCoords) {
      distKm = calculateHaversineKm(pCoords.lat, pCoords.lon, dCoords.lat, dCoords.lon);
      durationMins = Math.max(15, Math.round(distKm * 1.35));
    }

    const calculatedQuote = calculateQuote(
      pickup,
      dropoff,
      distKm,
      durationMins,
      totalPassengers,
      checkInSuitcases,
      totalChildSeats,
      isRoundTrip,
      pCoords,
      dCoords
    );

    setQuote(calculatedQuote);
    setCalculating(false);
  };

  // Recalculate when pickup, dropoff, route metrics, or vehicle params change
  useEffect(() => {
    if (pickup.trim() && dropoff.trim()) {
      runRouteCalculation();
    } else {
      setQuote(null);
    }
  }, [
    pickup,
    dropoff,
    pickupCoords,
    dropoffCoords,
    routeDistanceKm,
    routeDurationMinutes,
    totalPassengers,
    checkInSuitcases,
    totalChildSeats,
    isRoundTrip,
  ]);

  // Filter vehicles based on user's exact requirements:
  // 1. Standard Sedan: strictly for max 4 passengers and max 3 suitcases.
  // 2. 4 bags: Sedan is hidden! Auto-switches to Comfort (or Van).
  // 3. 5+ passengers (or 5+ check-in bags): BOTH Sedan and Comfort are hidden! Directly shows only Minivan!
  const availableVehicles = VEHICLES.filter((v) => {
    if (totalPassengers >= 5 || checkInSuitcases >= 5) {
      return v.id === 'van';
    }
    if (checkInSuitcases === 4) {
      return v.id === 'comfort' || v.id === 'van';
    }
    return true; // 1-4 pax, 0-3 check-in suitcases: all available
  });

  // Auto-switch selected vehicle if current selection is filtered out
  useEffect(() => {
    if (!availableVehicles.some((v) => v.id === selectedVehicleId)) {
      if (totalPassengers >= 5 || checkInSuitcases >= 5) {
        setSelectedVehicleId('van');
      } else if (checkInSuitcases === 4) {
        setSelectedVehicleId('comfort');
      } else if (availableVehicles.length > 0) {
        setSelectedVehicleId(availableVehicles[0].id);
      }
    }
  }, [totalPassengers, checkInSuitcases, availableVehicles, selectedVehicleId]);

  // Active Vehicle Object
  const activeVehicleData =
    availableVehicles.find((v) => v.id === selectedVehicleId) ||
    availableVehicles[0] ||
    VEHICLES[0];

  const currentVehicleQuote =
    quote?.vehicles.find((v) => v.vehicleId === activeVehicleData.id) ||
    quote?.vehicles[0];

  const finalQuotedPrice = currentVehicleQuote
    ? isRoundTrip
      ? currentVehicleQuote.roundTripTotal
      : currentVehicleQuote.totalPrice
    : (activeVehicleData.id === 'van' ? 70 : activeVehicleData.id === 'comfort' ? 60 : 50) +
      totalChildSeats * CHILD_SEAT_PRICE_EUR;

  // Build descriptive luggage text
  const getLuggageDetailsText = () => {
    const parts = [];
    if (largeBags > 0) parts.push(`${largeBags}x Large/XXL`);
    if (mediumBags > 0) parts.push(`${mediumBags}x Medium`);
    if (handCarryBags > 0) parts.push(`${handCarryBags}x Cabin`);
    if (shoulderBags > 0) parts.push(`${shoulderBags}x Shoulder`);
    return parts.length > 0 ? parts.join(', ') : `${totalBags} bags`;
  };

  // Build descriptive seat text
  const getSeatDetailsText = () => {
    const parts = [];
    if (babySeats > 0) parts.push(`${babySeats}x Baby Seat (0–2y)`);
    if (boosterSeats > 0) parts.push(`${boosterSeats}x Booster (3+y)`);
    return parts.length > 0 ? parts.join(', ') : '';
  };

  const getChildAgeText = () => {
    if (children === 0) return undefined;
    if (childAgeGroup === '0-2') return '0–2 yrs';
    if (childAgeGroup === '3-6') return '3–6 yrs';
    return '7–11 yrs';
  };

  // Compose clean driver notes & payment label
  const getComposedDriverNotes = () => {
    if (!addDriverNotes) return '';
    const notes: string[] = [];
    if (bulkyLuggage) notes.push('Bulky luggage (bikes/snowboards/boxes)');
    if (wheelchairAccessible) notes.push('Wheelchair accessible vehicle requested');
    if (driverNotesText.trim()) notes.push(driverNotesText.trim());
    return notes.join(' · ');
  };

  const getPaymentMethodLabel = () => {
    if (paymentMethod === 'card') {
      return cardPreference === 'online'
        ? 'Card Payment (Visa / Mastercard / Amex — Secure Link)'
        : 'Card Payment (Card Terminal in Vehicle)';
    }
    if (paymentMethod === 'paypal') {
      return 'PayPal (Online Payment Link)';
    }
    return 'Cash to Driver on Arrival';
  };

  const validateStep2Contact = (): boolean => {
    if (!passengerName.trim() || !passengerEmail.trim() || !passengerPhone.trim()) {
      setStep2Error('Please fill in your full name, email address, and phone number.');
      return false;
    }
    if (!passengerEmail.includes('@')) {
      setStep2Error('Please enter a valid email address.');
      return false;
    }
    setStep2Error('');
    return true;
  };

  // Handle WhatsApp Book
  const handleBookWhatsApp = () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setValidationError('Please enter or select both pickup and drop-off locations.');
      return;
    }
    if (currentStep === 'booking' && !validateStep2Contact()) {
      return;
    }
    const fullPhone = passengerPhone.trim()
      ? `${selectedCountry.dialCode} ${passengerPhone.trim()}`
      : '';
    const waLink = generateWhatsAppLink({
      pickup,
      dropoff,
      dateTime,
      isRoundTrip,
      returnDateTime,
      passengers: totalPassengers,
      adults,
      children,
      childAge: getChildAgeText(),
      luggage: totalBags,
      luggageDetails: getLuggageDetailsText(),
      childSeats: totalChildSeats,
      childSeatsDetails: getSeatDetailsText(),
      vehicleName: activeVehicleData.name,
      quotedPrice: finalQuotedPrice,
      flightNumber: flightNumber.trim() || undefined,
      passengerName: passengerName.trim() || undefined,
      email: passengerEmail.trim() || undefined,
      phone: fullPhone || undefined,
      paymentMethod: getPaymentMethodLabel(),
      driverNotes: getComposedDriverNotes() || undefined,
      distanceKm: quote?.distanceKm,
    });
    setPriceRevealed(true);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  // Confirm Booking: Sends automated Email & WhatsApp via /api/booking-confirm
  const handleConfirmBooking = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setValidationError('Please enter or select both pickup and drop-off locations.');
      return;
    }
    if (!validateStep2Contact()) {
      return;
    }

    const generatedRef = `ETH-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullPhone = `${selectedCountry.dialCode} ${passengerPhone.trim()}`.trim();
    const waLink = generateWhatsAppLink({
      pickup,
      dropoff,
      dateTime,
      isRoundTrip,
      returnDateTime,
      passengers: totalPassengers,
      adults,
      children,
      childAge: getChildAgeText(),
      luggage: totalBags,
      luggageDetails: getLuggageDetailsText(),
      childSeats: totalChildSeats,
      childSeatsDetails: getSeatDetailsText(),
      vehicleName: activeVehicleData.name,
      quotedPrice: finalQuotedPrice,
      flightNumber: flightNumber.trim() || undefined,
      passengerName: passengerName.trim(),
      email: passengerEmail.trim(),
      phone: fullPhone,
      paymentMethod: getPaymentMethodLabel(),
      driverNotes: getComposedDriverNotes() || undefined,
      distanceKm: quote?.distanceKm,
    });

    setConfirmingBooking(true);
    setStep2Error('');
    try {
      const res = await fetch('/api/booking-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingRef: generatedRef,
          pickup,
          dropoff,
          dateTime,
          isRoundTrip,
          returnDateTime,
          passengers: totalPassengers,
          adults,
          children,
          childAge: getChildAgeText(),
          luggage: totalBags,
          luggageDetails: getLuggageDetailsText(),
          childSeats: totalChildSeats,
          childSeatsDetails: getSeatDetailsText(),
          vehicleName: activeVehicleData.name,
          quotedPrice: finalQuotedPrice,
          flightNumber: flightNumber.trim() || undefined,
          passengerName: passengerName.trim(),
          email: passengerEmail.trim(),
          phone: fullPhone,
          paymentMethod: getPaymentMethodLabel(),
          driverNotes: getComposedDriverNotes() || undefined,
          distanceKm: quote?.distanceKm,
          durationText: quote?.durationText,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const bookingRef = data.bookingRef || generatedRef;

      setConfirmedBookingInfo({
        bookingRef,
        emailSent: Boolean(data.emailSent),
        whatsappSent: Boolean(data.whatsappSent),
        fullPhone,
        whatsappUrl: waLink,
      });
      setPriceRevealed(true);
      setCurrentStep('confirmed');

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore confetti error
      }

      const el = document.getElementById('calculator');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setConfirmedBookingInfo({
        bookingRef: generatedRef,
        emailSent: false,
        whatsappSent: false,
        fullPhone,
        whatsappUrl: waLink,
      });
      setCurrentStep('confirmed');
    } finally {
      setConfirmingBooking(false);
    }
  };

  // Download .ics Calendar Invite for Confirmed Ride
  const handleDownloadCalendar = () => {
    if (!confirmedBookingInfo) return;
    const start = dateTime ? new Date(dateTime) : new Date(Date.now() + 86400000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const formatIcsDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const esc = (s: string) => s.replace(/[\r\n]+/g, ' ').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const description = [
      `Booking Reference: ${confirmedBookingInfo.bookingRef}`,
      `Passenger: ${passengerName}`,
      `Vehicle: ${activeVehicleData.name}`,
      `Fixed Fare: EUR ${finalQuotedPrice}`,
      flightNumber ? `Flight: ${flightNumber}` : '',
      `Chauffeur Dispatch (Mr. Mir): +34 663 958 889`,
    ]
      .filter(Boolean)
      .join('\\n');

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Easytransferhub//Barcelona Private Transfers//EN',
      'BEGIN:VEVENT',
      `UID:${confirmedBookingInfo.bookingRef}@easytransferhub.com`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${esc(`Easytransferhub Chauffeur: ${pickup} -> ${dropoff}`)}`,
      `LOCATION:${esc(pickup)}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Easytransferhub-${confirmedBookingInfo.bookingRef}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyConfirmedSummary = () => {
    if (!confirmedBookingInfo) return;
    const summary = `EASYTRANSFERHUB TRANSFER CONFIRMATION\nRef: ${confirmedBookingInfo.bookingRef}\nClient: ${passengerName}\nPhone: ${confirmedBookingInfo.fullPhone}\nEmail: ${passengerEmail}\nPickup: ${pickup}\nDrop-off: ${dropoff}\nDate & Time: ${dateTime || 'To be confirmed'}\n${flightNumber ? `Flight: ${flightNumber}\n` : ''}Vehicle: ${activeVehicleData.name}\nTotal Guaranteed Fare: €${finalQuotedPrice}\nPayment: ${getPaymentMethodLabel()}\n24/7 Dispatch (Mr. Mir): +34 663 958 889`;
    navigator.clipboard.writeText(summary);
    setCopiedConfirmed(true);
    setTimeout(() => setCopiedConfirmed(false), 2500);
  };

  // Open Voucher Modal
  const handleViewVoucher = () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setValidationError('Please enter or select both pickup and drop-off locations.');
      return;
    }
    if (currentStep === 'booking' && !validateStep2Contact()) {
      return;
    }
    setPriceRevealed(true);
    const fullPhone = passengerPhone.trim()
      ? `${selectedCountry.dialCode} ${passengerPhone.trim()}`
      : '';
    onOpenVoucher({
      bookingRef: confirmedBookingInfo?.bookingRef,
      pickup,
      dropoff,
      dateTime,
      isRoundTrip,
      returnDateTime,
      passengers: totalPassengers,
      adults,
      children,
      childAge: getChildAgeText(),
      luggage: totalBags,
      luggageDetails: getLuggageDetailsText(),
      childSeats: totalChildSeats,
      childSeatsDetails: getSeatDetailsText(),
      vehicleName: activeVehicleData.name,
      vehicleCategory: activeVehicleData.category,
      quotedPrice: finalQuotedPrice,
      flightNumber: flightNumber.trim() || undefined,
      passengerName: passengerName.trim() || undefined,
      email: passengerEmail.trim() || undefined,
      phone: fullPhone || undefined,
      paymentMethod: getPaymentMethodLabel(),
      driverNotes: getComposedDriverNotes() || undefined,
      distanceKm: quote?.distanceKm,
      durationText: quote?.durationText,
    });
  };



  return (
    <div
      id="calculator"
      className="bg-white rounded-2xl shadow-[0_18px_45px_-12px_rgba(0,240,255,0.22)] border border-[#67efff] overflow-hidden transition-all text-slate-900"
    >
      {/* Calculator Header Bar */}
      {currentStep === 'confirmed' ? (
        <div className="bg-[#e6fdff] text-slate-900 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2.5 border-b border-[#8ceeff]">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#00f0ff] border border-[#00c8e8] flex items-center justify-center text-slate-950">
              <Check className="w-4 h-4 stroke-[3]" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#008da1] tracking-[0.14em] block">
                Booking Confirmed
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#042f40]">
                Ref: {confirmedBookingInfo?.bookingRef}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentStep('calculator');
              setConfirmedBookingInfo(null);
            }}
            className="text-xs sm:text-sm font-bold text-[#042f40] hover:text-slate-950 bg-white hover:bg-[#d8fbff] px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-[#67efff] shadow-xs"
          >
            New Transfer
          </button>
        </div>
      ) : currentStep === 'booking' ? (
        <div className="bg-[#e6fdff] text-slate-900 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2.5 border-b border-[#8ceeff]">
          <button
            type="button"
            onClick={() => {
              setCurrentStep('calculator');
              const el = document.getElementById('calculator');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#042f40] hover:text-slate-950 bg-white hover:bg-[#d8fbff] px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-[#67efff] shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#008da1]" />
            <span>Modify Route / Back</span>
          </button>

          <div className="text-right">
            <span className="text-[10px] sm:text-xs uppercase font-extrabold text-[#008da1] tracking-[0.14em] block">
              Step 2 of 2
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Booking Details & Payment
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-[#e6fdff] text-slate-900 px-3.5 sm:px-5 py-2.5 flex flex-col gap-2 border-b border-[#8ceeff]">
          {/* Full-width top headline — stays on 1 single line on both mobile & desktop */}
          <h2
            className="w-full font-display font-extrabold text-[#042f40] whitespace-nowrap tracking-[-0.03em] sm:tracking-tight leading-tight m-0"
            style={{ fontSize: 'clamp(10.5px, 2.95vw, 20px)' }}
          >
            Private transfers from Barcelona to anywhere in Spain
          </h2>

          {/* Trip Mode Switch + Fair Price Badge directly next to Round Trip */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#8ceeff] text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setIsRoundTrip(false)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  !isRoundTrip
                    ? 'bg-[#00f0ff] text-slate-950 shadow-[0_2px_10px_-2px_rgba(0,240,255,0.65)] font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => setIsRoundTrip(true)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  isRoundTrip
                    ? 'bg-[#00f0ff] text-slate-950 shadow-[0_2px_10px_-2px_rgba(0,240,255,0.65)] font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Round Trip (-5%)
              </button>
            </div>

            <span className="text-[11px] sm:text-xs font-extrabold px-2.5 py-1.5 rounded-lg bg-[#00f0ff] border border-[#00c8e8] text-slate-950 shadow-2xs whitespace-nowrap">
              Fair Price
            </span>
          </div>
        </div>
      )}

      {currentStep === 'calculator' ? (
        <div className="p-3.5 sm:p-4 space-y-2.5">
        {/* Step 1: Pickup and Drop-off with Google Maps Places Autocomplete */}
        <div className="space-y-2.5">
          {/* Pickup Input */}
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <label htmlFor="pickup-input" className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-tight sm:tracking-wider flex items-center gap-1 whitespace-nowrap shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#008da1] shrink-0" />
                <span>{t.pickupLabel}</span>
              </label>

              <div ref={pickupAirportRef} className="relative flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setAirportDropdownField((prev) => (prev === 'pickup' ? null : 'pickup'))
                  }
                  className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    pickup.toLowerCase().includes('airport')
                      ? 'bg-[#00f0ff] border-[#00c8e8] text-slate-950'
                      : 'bg-[#e6fdff] hover:bg-[#ccfbff] border-[#8ceeff] text-[#042f40]'
                  }`}
                >
                  <Plane className="w-2.5 h-2.5 shrink-0" />
                  <span>Airport</span>
                  <ChevronDown className="w-2.5 h-2.5 shrink-0" />
                </button>

                {airportDropdownField === 'pickup' && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#67efff] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#e6fdff]">
                    <button
                      type="button"
                      onClick={() => applyQuickLocation('pickup', 'bcn_t1')}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-[#e6fdff] flex items-center justify-between cursor-pointer"
                    >
                      <span>Terminal 1 (BCN T1)</span>
                      <Plane className="w-3.5 h-3.5 text-[#008da1]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickLocation('pickup', 'bcn_t2')}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-[#e6fdff] flex items-center justify-between cursor-pointer"
                    >
                      <span>Terminal 2 (BCN T2)</span>
                      <Plane className="w-3.5 h-3.5 text-[#008da1]" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => applyQuickLocation('pickup', 'port')}
                  className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    pickup.toLowerCase().includes('cruise') || pickup.toLowerCase().includes('moll adossat')
                      ? 'bg-[#00f0ff] border-[#00c8e8] text-slate-950'
                      : 'bg-[#e6fdff] hover:bg-[#ccfbff] border-[#8ceeff] text-[#042f40]'
                  }`}
                >
                  <Anchor className="w-2.5 h-2.5 shrink-0" />
                  <span>Port</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickLocation('pickup', 'sants')}
                  className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    pickup.toLowerCase().includes('sants')
                      ? 'bg-[#00f0ff] border-[#00c8e8] text-slate-950'
                      : 'bg-[#e6fdff] hover:bg-[#ccfbff] border-[#8ceeff] text-[#042f40]'
                  }`}
                >
                  <Train className="w-2.5 h-2.5 shrink-0" />
                  <span>Sants</span>
                </button>
              </div>
            </div>

            <GooglePlacesInput
              inputId="pickup-input"
              value={pickup}
              placeholder={t.pickupPlaceholder}
              iconType="pickup"
              mapsEnabled={mapsEnabled}
              onChangeText={(val) => {
                setPickup(val);
                setPickupCoords(null);
                setRouteDistanceKm(null);
                setRouteDurationMinutes(null);
                setValidationError('');
              }}
              onSelectPlace={(place) => {
                setPickup(place.label);
                setPickupCoords(place.coords);
                setRouteDistanceKm(null);
                setRouteDurationMinutes(null);
                setValidationError('');
              }}
            />
          </div>

          {/* Drop-off Input */}
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <label htmlFor="dropoff-input" className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-tight sm:tracking-wider flex items-center gap-1 whitespace-nowrap shrink-0">
                <Navigation className="w-3.5 h-3.5 text-[#008da1] shrink-0" />
                <span>{t.dropoffLabel}</span>
              </label>

              <div ref={dropoffAirportRef} className="relative flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setAirportDropdownField((prev) => (prev === 'dropoff' ? null : 'dropoff'))
                  }
                  className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    dropoff.toLowerCase().includes('airport')
                      ? 'bg-[#00f0ff] border-[#00c8e8] text-slate-950'
                      : 'bg-[#e6fdff] hover:bg-[#ccfbff] border-[#8ceeff] text-[#042f40]'
                  }`}
                >
                  <Plane className="w-2.5 h-2.5 shrink-0" />
                  <span>Airport</span>
                  <ChevronDown className="w-2.5 h-2.5 shrink-0" />
                </button>

                {airportDropdownField === 'dropoff' && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#67efff] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#e6fdff]">
                    <button
                      type="button"
                      onClick={() => applyQuickLocation('dropoff', 'bcn_t1')}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-[#e6fdff] flex items-center justify-between cursor-pointer"
                    >
                      <span>Terminal 1 (BCN T1)</span>
                      <Plane className="w-3.5 h-3.5 text-[#008da1]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickLocation('dropoff', 'bcn_t2')}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-[#e6fdff] flex items-center justify-between cursor-pointer"
                    >
                      <span>Terminal 2 (BCN T2)</span>
                      <Plane className="w-3.5 h-3.5 text-[#008da1]" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => applyQuickLocation('dropoff', 'port')}
                  className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    dropoff.toLowerCase().includes('cruise') || dropoff.toLowerCase().includes('moll adossat')
                      ? 'bg-[#00f0ff] border-[#00c8e8] text-slate-950'
                      : 'bg-[#e6fdff] hover:bg-[#ccfbff] border-[#8ceeff] text-[#042f40]'
                  }`}
                >
                  <Anchor className="w-2.5 h-2.5 shrink-0" />
                  <span>Port</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickLocation('dropoff', 'sants')}
                  className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    dropoff.toLowerCase().includes('sants')
                      ? 'bg-[#00f0ff] border-[#00c8e8] text-slate-950'
                      : 'bg-[#e6fdff] hover:bg-[#ccfbff] border-[#8ceeff] text-[#042f40]'
                  }`}
                >
                  <Train className="w-2.5 h-2.5 shrink-0" />
                  <span>Sants</span>
                </button>
              </div>
            </div>

            <GooglePlacesInput
              inputId="dropoff-input"
              value={dropoff}
              placeholder={t.dropoffPlaceholder}
              iconType="dropoff"
              mapsEnabled={mapsEnabled}
              onChangeText={(val) => {
                setDropoff(val);
                setDropoffCoords(null);
                setRouteDistanceKm(null);
                setRouteDurationMinutes(null);
                setValidationError('');
              }}
              onSelectPlace={(place) => {
                setDropoff(place.label);
                setDropoffCoords(place.coords);
                setRouteDistanceKm(null);
                setRouteDurationMinutes(null);
                setValidationError('');
              }}
            />
          </div>

          {/* Silent background Routes API distance calculation (keeps pricing unchanged without visible map UI) */}
          <GoogleRouteDistanceSync
            pickup={pickup}
            dropoff={dropoff}
            pickupCoords={pickupCoords}
            dropoffCoords={dropoffCoords}
            mapsEnabled={mapsEnabled}
            onRouteMetrics={({ distanceKm, durationMinutes }) => {
              setRouteDistanceKm(distanceKm);
              setRouteDurationMinutes(durationMinutes);
            }}
          />
        </div>

        {/* Date & Time Row (Pickup + Optional Return if Round Trip) */}
        <div className="pt-2 border-t border-[#cff9ff]">
          <div className={`grid grid-cols-1 ${isRoundTrip ? 'sm:grid-cols-2' : ''} gap-2.5`}>
            {/* Box 1: Pickup Date & Time */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#008da1]" />
                <span>Pickup Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none shadow-2xs transition-all font-medium"
              />
            </div>

            {/* Box 2: Return Date & Time if Round Trip */}
            {isRoundTrip && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#008da1]" />
                  <span>Return Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={returnDateTime}
                  onChange={(e) => setReturnDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none shadow-2xs transition-all font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Merged Option Button: Passengers + Luggage + Child Seat */}
        <div className="pt-2 border-t border-[#cff9ff]">
          <button
            type="button"
            onClick={() => setShowPassengersLuggageSeats((prev) => !prev)}
            className={`w-full p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
              showPassengersLuggageSeats
                ? 'bg-[#e6fdff] border-[#00c8e8] ring-2 ring-[#00f0ff]/30'
                : 'bg-[#f5feff] hover:bg-[#e6fdff] border-[#9beeff] hover:border-[#00c8e8]'
            }`}
          >
            <div className="text-left min-w-0 pr-1.5 flex-1">
              <div className="text-[11px] sm:text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap truncate">
                Passengers + Luggage + Child Seat
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 flex items-center gap-1 sm:gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden">
                <span className="text-[#042f40] font-bold bg-[#e6fdff] px-1.5 py-0.2 rounded border border-[#67efff] shrink-0">
                  {totalPassengers} Pax
                </span>
                <span className="shrink-0">•</span>
                <span className="text-slate-800 font-semibold shrink-0">{totalBags} Luggage</span>
                <span className="shrink-0">•</span>
                <span className="text-[#007c91] font-bold truncate">
                  {totalChildSeats > 0
                    ? `${totalChildSeats} Seat (+€${totalChildSeats * CHILD_SEAT_PRICE_EUR})`
                    : '+€5 Child Seat'}
                </span>
              </div>
            </div>

            <div className="flex items-center shrink-0 ml-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-1 rounded-lg bg-[#00f0ff] border border-[#00c8e8] text-slate-950 shadow-xs flex items-center gap-1 whitespace-nowrap">
                <span>{showPassengersLuggageSeats ? 'Close' : 'Choose / Edit'}</span>
                {showPassengersLuggageSeats ? (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                )}
              </span>
            </div>
          </button>

          {/* Expandable Panel: Passengers, Luggage, Child Seats */}
          {showPassengersLuggageSeats && (
            <div className="mt-2.5 p-2.5 sm:p-3 bg-white border border-[#67efff] rounded-2xl shadow-md space-y-2.5 transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                {/* Box 1: Passengers */}
                <div className="bg-[#f5feff] border border-[#9beeff] hover:border-[#00c8e8] rounded-xl p-2.5 flex flex-col justify-between shadow-2xs transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#008da1]" />
                        <span>Passengers</span>
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#e6fdff] text-[#042f40] border border-[#8ceeff]">
                        {totalPassengers} Pax
                      </span>
                    </div>

                    {/* Adults & Children Steppers */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-200/70">
                        <span className="text-slate-700 font-semibold text-[11px]">Adults (12+y)</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                            disabled={adults <= 1}
                            aria-label="Decrease adults"
                            className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-3.5 text-center font-extrabold text-slate-900 text-xs">{adults}</span>
                          <button
                            type="button"
                            onClick={() => setAdults((prev) => Math.min(8 - children, prev + 1))}
                            disabled={adults + children >= 8}
                            aria-label="Increase adults"
                            className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-700 font-semibold text-[11px]">Children (0–11y)</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(0, children - 1);
                              setChildren(next);
                              if (next === 0) {
                                setBabySeats(0);
                                setBoosterSeats(0);
                              }
                            }}
                            disabled={children <= 0}
                            aria-label="Decrease children"
                            className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-3.5 text-center font-extrabold text-slate-900 text-xs">{children}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(8 - adults, children + 1);
                              setChildren(next);
                              if (totalChildSeats === 0) {
                                if (childAgeGroup === '0-2') setBabySeats(1);
                                else setBoosterSeats(1);
                              }
                            }}
                            disabled={adults + children >= 8}
                            aria-label="Increase children"
                            className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Age pill if children > 0 */}
                    {children > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: '0-2', label: '0–2y' },
                            { id: '3-6', label: '3–6y' },
                            { id: '7-11', label: '7–11y' },
                          ].map((ag) => (
                            <button
                              key={ag.id}
                              type="button"
                              onClick={() => {
                                setChildAgeGroup(ag.id as any);
                                if (ag.id === '0-2' && babySeats === 0) {
                                  setBabySeats(1);
                                  setBoosterSeats(0);
                                } else if ((ag.id === '3-6' || ag.id === '7-11') && boosterSeats === 0) {
                                  setBoosterSeats(1);
                                  setBabySeats(0);
                                }
                              }}
                              className={`py-0.5 rounded text-center text-[9px] font-bold transition-all cursor-pointer ${
                                childAgeGroup === ag.id
                                  ? 'bg-[#00f0ff] border border-[#00c8e8] text-slate-950 font-extrabold shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {ag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Box 2: Luggage (Compact 2x2 grid) */}
                <div className="bg-[#f5feff] border border-[#9beeff] hover:border-[#00c8e8] rounded-xl p-2.5 flex flex-col justify-between shadow-2xs transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-[#008da1]" />
                        <span>Luggage</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowSizeChart(true)}
                          className="text-[9px] font-bold text-[#042f40] hover:text-slate-950 bg-[#e6fdff] border border-[#8ceeff] px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <span>📏 Guide</span>
                        </button>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#e6fdff] text-[#042f40] border border-[#8ceeff]">
                          {totalBags} Bags
                        </span>
                      </div>
                    </div>

                    {/* 4 Luggage types in 2 compact columns */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      {/* Large */}
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-200/70">
                        <span className="text-slate-700 font-semibold text-[10px] leading-tight">Large (75cm)</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setLargeBags((p) => Math.max(0, p - 1))}
                            disabled={largeBags <= 0}
                            className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-2 h-2" />
                          </button>
                          <span className="w-3 text-center font-extrabold text-slate-900 text-[11px]">{largeBags}</span>
                          <button
                            type="button"
                            onClick={() => setLargeBags((p) => Math.min(8, p + 1))}
                            disabled={checkInSuitcases >= 8}
                            className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-2 h-2" />
                          </button>
                        </div>
                      </div>

                      {/* Medium */}
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-200/70">
                        <span className="text-slate-700 font-semibold text-[10px] leading-tight">Medium (65cm)</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMediumBags((p) => Math.max(0, p - 1))}
                            disabled={mediumBags <= 0}
                            className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-2 h-2" />
                          </button>
                          <span className="w-3 text-center font-extrabold text-slate-900 text-[11px]">{mediumBags}</span>
                          <button
                            type="button"
                            onClick={() => setMediumBags((p) => Math.min(8, p + 1))}
                            disabled={checkInSuitcases >= 8}
                            className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-2 h-2" />
                          </button>
                        </div>
                      </div>

                      {/* Cabin */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-700 font-semibold text-[10px] leading-tight">Cabin (55cm)</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setHandCarryBags((p) => Math.max(0, p - 1))}
                            disabled={handCarryBags <= 0}
                            className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-2 h-2" />
                          </button>
                          <span className="w-3 text-center font-extrabold text-slate-900 text-[11px]">{handCarryBags}</span>
                          <button
                            type="button"
                            onClick={() => setHandCarryBags((p) => Math.min(8, p + 1))}
                            disabled={handCarryBags >= 8}
                            className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-2 h-2" />
                          </button>
                        </div>
                      </div>

                      {/* Backpack */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-700 font-semibold text-[10px] leading-tight">Backpack</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShoulderBags((p) => Math.max(0, p - 1))}
                            disabled={shoulderBags <= 0}
                            className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-2 h-2" />
                          </button>
                          <span className="w-3 text-center font-extrabold text-slate-900 text-[11px]">{shoulderBags}</span>
                          <button
                            type="button"
                            onClick={() => setShoulderBags((p) => Math.min(8, p + 1))}
                            disabled={shoulderBags >= 8}
                            className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-2 h-2" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 3: Child Seats */}
                <div className="bg-[#f5feff] border border-[#9beeff] hover:border-[#00c8e8] rounded-xl p-2.5 flex flex-col justify-between shadow-2xs transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <Baby className="w-3.5 h-3.5 text-[#008da1]" />
                        <span>Child Seats</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e6fdff] text-[#042f40] border border-[#8ceeff]">
                        +€{CHILD_SEAT_PRICE_EUR} / seat
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {/* Baby Seat */}
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-200/70">
                        <div>
                          <span className="text-slate-800 font-semibold text-[11px] leading-tight block">Baby Seat (0–2y)</span>
                          <span className="text-[9px] text-slate-400 block">Harness seat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setBabySeats((p) => Math.max(0, p - 1))}
                            disabled={babySeats <= 0}
                            className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-3.5 text-center font-extrabold text-slate-900 text-xs">{babySeats}</span>
                          <button
                            type="button"
                            onClick={() => setBabySeats((p) => Math.min(3, p + 1))}
                            disabled={totalChildSeats >= 4}
                            className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Booster Cushion */}
                      <div className="flex items-center justify-between py-0.5">
                        <div>
                          <span className="text-slate-800 font-semibold text-[11px] leading-tight block">Booster (3+y)</span>
                          <span className="text-[9px] text-slate-400 block">High/low cushion</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setBoosterSeats((p) => Math.max(0, p - 1))}
                            disabled={boosterSeats <= 0}
                            className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-3.5 text-center font-extrabold text-slate-900 text-xs">{boosterSeats}</span>
                          <button
                            type="button"
                            onClick={() => setBoosterSeats((p) => Math.min(4, p + 1))}
                            disabled={totalChildSeats >= 4}
                            className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 mt-1 italic flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#008da1] shrink-0" />
                    <span>Spanish law compliant · €{CHILD_SEAT_PRICE_EUR} extra per seat</span>
                  </p>
                </div>
              </div>

              {/* Done / Next button */}
              <div className="flex justify-end pt-1 border-t border-[#cff9ff]">
                <button
                  type="button"
                  onClick={() => setShowPassengersLuggageSeats(false)}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-[#00f0ff] hover:bg-[#00d8eb] border border-[#00c8e8] text-slate-950 font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>Done</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 1 Action Button: Get Price */}
        <div className="pt-2 border-t border-[#cff9ff]">
          {validationError && (
            <div className="p-2.5 mb-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <span>⚠️ {validationError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (!pickup.trim() || !dropoff.trim()) {
                setValidationError('Please enter or select both pickup and drop-off locations.');
                return;
              }
              setValidationError('');
              setCurrentStep('booking');
              const el = document.getElementById('calculator');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-[#00f0ff] hover:bg-[#00d8eb] border border-[#00c8e8] text-slate-950 font-extrabold text-base sm:text-lg shadow-[0_6px_20px_-4px_rgba(0,240,255,0.65)] hover:shadow-[0_10px_25px_-4px_rgba(0,240,255,0.8)] transition-all active:scale-[0.98] cursor-pointer font-display"
          >
            <Sparkles className="w-5 h-5 text-slate-950" />
            <span>Get Price</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>

          <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-2 flex-wrap mt-2">
            <span>✓ All-Inclusive Fixed Prices</span>
            <span>·</span>
            <span>✓ Free Flight Delay Tracking</span>
            <span>·</span>
            <span>✓ Free Cancellation up to 24h</span>
          </p>
        </div>
      </div>
    ) : currentStep === 'booking' ? (
      /* Step 2: Booking Details, Vehicle, Client Contact, Payment & Summary */
      <div className="p-4 sm:p-6 bg-[#f5feff] space-y-5">
        {/* Top Meta Quick Facts Chips Row (matching reference booking/details) */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#9beeff]">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#9beeff] text-[#042f40] shadow-2xs flex items-center gap-1">
            <Users className="w-3 h-3 text-[#008da1]" />
            {totalPassengers} {totalPassengers > 1 ? 'Passengers' : 'Passenger'}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#9beeff] text-[#042f40] shadow-2xs flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-[#008da1]" />
            {totalBags} Luggage
          </span>
          {totalChildSeats > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#9beeff] text-[#042f40] shadow-2xs flex items-center gap-1">
              <Baby className="w-3 h-3 text-[#008da1]" />
              {getSeatDetailsText()}
            </span>
          )}
          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-[#00f0ff] border border-[#00c8e8] text-slate-950 shadow-2xs flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-950" />
            {dateTime ? new Date(dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Flexible Date'}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#e6fdff] border border-[#67efff] text-[#042f40] ml-auto">
            {isRoundTrip ? 'Round Trip (-5% off)' : 'One Way Fixed'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column (lg:col-span-7): Vehicle, Flight, Client Contact & Payment */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Vehicle Selection */}
            <div className="bg-white rounded-2xl border border-[#8ceeff] p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-[#cff9ff]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#008da1] block">
                    1 · Choose Vehicle
                  </span>
                  <h3 className="font-display font-extrabold text-base text-slate-900">
                    Available Vehicles for Your Trip
                  </h3>
                  {quote?.matchedZone && (
                    <span className="text-[10px] font-bold text-[#007c91] block mt-0.5">
                      Zone {quote.matchedZone.zoneNumber} ({quote.matchedZone.district}) · All Supplements Included
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {quote?.distanceKm || 18} km · Approx. {quote?.durationText || '30 mins'}
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1. Standard Sedan */}
                {(() => {
                  const v = VEHICLES.find((item) => item.id === 'standard') || VEHICLES[0];
                  const vQuote = quote?.vehicles.find((q) => q.vehicleId === 'standard');
                  const price = vQuote
                    ? isRoundTrip
                      ? vQuote.roundTripTotal
                      : vQuote.totalPrice
                    : (isRoundTrip ? 98 : 50) + totalChildSeats * CHILD_SEAT_PRICE_EUR;
                  const isSelected = selectedVehicleId === 'standard';
                  const isDisabled = totalPassengers > 4 || checkInSuitcases > 3;
                  const isRecommended = totalPassengers <= 4 && checkInSuitcases <= 3;

                  return (
                    <div
                      key="standard"
                      onClick={() => {
                        if (!isDisabled) setSelectedVehicleId('standard');
                      }}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                          : isSelected
                          ? 'border-[#00c8e8] bg-[#e6fdff] shadow-xs ring-2 ring-[#00f0ff]/45 cursor-pointer'
                          : 'border-[#9beeff] hover:border-[#00c8e8] bg-white hover:bg-[#f0feff] cursor-pointer shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-[#042f40] bg-[#00f0ff]' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>

                        <div className="w-14 sm:w-16 h-10 sm:h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-[#9beeff] shadow-2xs">
                          <img src={v.photos[0]} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                              {v.name}
                            </h4>
                            {isRecommended && !isDisabled && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-[#00f0ff] border border-[#00c8e8] text-slate-950 uppercase tracking-tight">
                                Recommended
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3 text-slate-400" /> Max 4 Pax
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Briefcase className="w-3 h-3 text-slate-400" /> Max 3 Bags
                            </span>
                          </div>

                          {isDisabled && (
                            <p className="text-[10px] font-bold text-rose-600 mt-0.5">
                              Exceeds capacity (Max 4 pax / 3 bags)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-display font-extrabold text-base sm:text-lg text-slate-950 leading-tight tabular-nums">
                          €{price}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                          {isRoundTrip ? 'Total return' : 'All-inclusive'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Comfort Executive */}
                {(() => {
                  const v = VEHICLES.find((item) => item.id === 'comfort') || VEHICLES[1];
                  const vQuote = quote?.vehicles.find((q) => q.vehicleId === 'comfort');
                  const price = vQuote
                    ? isRoundTrip
                      ? vQuote.roundTripTotal
                      : vQuote.totalPrice
                    : (isRoundTrip ? 117 : 60) + totalChildSeats * CHILD_SEAT_PRICE_EUR;
                  const isSelected = selectedVehicleId === 'comfort';
                  const isDisabled = totalPassengers > 4 || checkInSuitcases > 4;
                  const isRecommended = totalPassengers <= 4 && checkInSuitcases === 4;

                  return (
                    <div
                      key="comfort"
                      onClick={() => {
                        if (!isDisabled) setSelectedVehicleId('comfort');
                      }}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                          : isSelected
                          ? 'border-[#00c8e8] bg-[#e6fdff] shadow-xs ring-2 ring-[#00f0ff]/45 cursor-pointer'
                          : 'border-[#9beeff] hover:border-[#00c8e8] bg-white hover:bg-[#f0feff] cursor-pointer shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-[#042f40] bg-[#00f0ff]' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>

                        <div className="w-14 sm:w-16 h-10 sm:h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-[#9beeff] shadow-2xs">
                          <img src={v.photos[0]} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                              {v.name}
                            </h4>
                            <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-[#e6fdff] text-[#042f40] border border-[#8ceeff]">
                              Executive
                            </span>
                            {isRecommended && !isDisabled && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-[#00f0ff] border border-[#00c8e8] text-slate-950 uppercase tracking-tight">
                                Recommended
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3 text-slate-400" /> Max 4 Pax
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Briefcase className="w-3 h-3 text-slate-400" /> Max 4 Bags
                            </span>
                          </div>

                          {isDisabled && (
                            <p className="text-[10px] font-bold text-rose-600 mt-0.5">
                              Exceeds capacity (Max 4 pax)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-display font-extrabold text-base sm:text-lg text-slate-950 leading-tight tabular-nums">
                          €{price}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                          {isRoundTrip ? 'Total return' : 'All-inclusive'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Minivan (8-Seater) */}
                {(() => {
                  const v = VEHICLES.find((item) => item.id === 'van') || VEHICLES[2];
                  const vQuote = quote?.vehicles.find((q) => q.vehicleId === 'van');
                  const price = vQuote
                    ? isRoundTrip
                      ? vQuote.roundTripTotal
                      : vQuote.totalPrice
                    : (isRoundTrip ? 137 : 70) + totalChildSeats * CHILD_SEAT_PRICE_EUR;
                  const isSelected = selectedVehicleId === 'van' || selectedVehicleId === 'minivan';
                  const isRecommended = totalPassengers >= 5 || checkInSuitcases >= 5;

                  return (
                    <div
                      key="minivan"
                      onClick={() => setSelectedVehicleId('van')}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#00c8e8] bg-[#e6fdff] shadow-xs ring-2 ring-[#00f0ff]/45 cursor-pointer'
                          : 'border-[#9beeff] hover:border-[#00c8e8] bg-white hover:bg-[#f0feff] cursor-pointer shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-[#042f40] bg-[#00f0ff]' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>

                        <div className="w-14 sm:w-16 h-10 sm:h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-[#9beeff] shadow-2xs">
                          <img src={v.photos[0]} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                              Minivan (8-Seater)
                            </h4>
                            {isRecommended && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-[#00f0ff] border border-[#00c8e8] text-slate-950 uppercase tracking-tight">
                                Recommended for your group
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3 text-slate-400" /> Max 8 Pax
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Briefcase className="w-3 h-3 text-slate-400" /> Max 8 Bags
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-display font-extrabold text-base sm:text-lg text-slate-950 leading-tight tabular-nums">
                          €{price}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                          {isRoundTrip ? 'Total return' : 'All-inclusive'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 2. Flight Details */}
            <div className="bg-white rounded-2xl border border-[#8ceeff] p-4 shadow-xs space-y-3">
              <div className="pb-2 border-b border-[#cff9ff] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#008da1] block">
                    2 · Flight Details
                  </span>
                  <h3 className="font-display font-extrabold text-base text-slate-900">
                    Flight Number (Optional)
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6fdff] border border-[#8ceeff] text-[#042f40]">
                  60m Free Waiting
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Plane className="w-3.5 h-3.5 text-[#008da1]" />
                  <span>Flight Number</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. VY1451, FR6302, U28574"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm font-medium bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none transition-all shadow-2xs"
                  />
                  <Plane className="w-4 h-4 text-[#008da1] absolute right-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  We monitor your flight live — if your flight is delayed, your chauffeur automatically adjusts pickup time.
                </p>
              </div>
            </div>

            {/* 3. Client Details & Driver Notes */}
            <div className="bg-white rounded-2xl border border-[#8ceeff] p-4 shadow-xs space-y-3.5">
              <div className="pb-2 border-b border-[#cff9ff]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#008da1] block">
                  3 · Client Details
                </span>
                <h3 className="font-display font-extrabold text-base text-slate-900">
                  Your Contact & Pickup Information
                </h3>
                <p className="text-[11px] text-slate-500">
                  Required so our chauffeur and dispatcher can send confirmation and meet you seamlessly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-[#008da1]" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => {
                      setPassengerName(e.target.value);
                      if (step2Error) setStep2Error('');
                    }}
                    placeholder="As shown on ID / Greeting sign"
                    required
                    className="w-full px-3 py-2.5 text-xs sm:text-sm font-medium bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-[#008da1]" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    value={passengerEmail}
                    onChange={(e) => {
                      setPassengerEmail(e.target.value);
                      if (step2Error) setStep2Error('');
                    }}
                    placeholder="name@example.com"
                    required
                    className="w-full px-3 py-2.5 text-xs sm:text-sm font-medium bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Phone Number with Searchable Country Code Picker */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-[#008da1]" />
                  <span>Phone / WhatsApp Number *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  {/* Searchable Country Code Picker */}
                  <div className="sm:col-span-5 relative" ref={countryPickerRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={countrySearch}
                        aria-label="Search country code"
                        placeholder="Search country or +code"
                        onFocus={() => {
                          setShowCountryList(true);
                          setCountrySearch('');
                        }}
                        onChange={(e) => {
                          setCountrySearch(e.target.value);
                          setShowCountryList(true);
                        }}
                        className="w-full pl-3 pr-8 py-2.5 text-xs sm:text-sm font-medium bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none transition-all shadow-2xs"
                      />
                      <Search className="w-3.5 h-3.5 text-[#008da1] absolute right-2.5 top-3 pointer-events-none" />
                    </div>

                    {showCountryList && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#8ceeff] rounded-xl shadow-xl z-40 max-h-52 overflow-y-auto divide-y divide-[#e6fdff] text-xs">
                        {COUNTRY_CODES.filter((c) => {
                          const q = countrySearch.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            c.name.toLowerCase().includes(q) ||
                            c.dialCode.includes(q) ||
                            c.iso2.toLowerCase().includes(q)
                          );
                        }).map((c) => (
                          <button
                            key={c.iso2}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setCountrySearch(`${c.flag} ${c.name} (${c.dialCode})`);
                              setShowCountryList(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#e6fdff] cursor-pointer transition-colors ${
                              selectedCountry.iso2 === c.iso2 ? 'bg-[#e6fdff] font-bold text-[#042f40]' : 'text-slate-800'
                            }`}
                          >
                            <span className="truncate">
                              {c.flag} {c.name}
                            </span>
                            <span className="font-bold text-[#008da1] ml-2 shrink-0">{c.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Local Phone Input */}
                  <div className="sm:col-span-7">
                    <input
                      type="tel"
                      value={passengerPhone}
                      onChange={(e) => {
                        setPassengerPhone(e.target.value);
                        if (step2Error) setStep2Error('');
                      }}
                      placeholder="6XX XXX XXX"
                      required
                      className="w-full px-3 py-2.5 text-xs sm:text-sm font-medium bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Driver Notes Toggle + Quick Accessibility/Bulky Luggage Options */}
              <div className="pt-2 border-t border-[#cff9ff] space-y-2.5">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addDriverNotes}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAddDriverNotes(checked);
                      if (!checked) {
                        setBulkyLuggage(false);
                        setWheelchairAccessible(false);
                        setDriverNotesText('');
                      }
                    }}
                    className="w-4 h-4 accent-[#00c8e8] rounded cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-[#042f40]">
                    Add notes for the driver
                  </span>
                </label>

                {addDriverNotes && (
                  <div className="space-y-2.5 pt-1">
                    <textarea
                      rows={3}
                      value={driverNotesText}
                      onChange={(e) => setDriverNotesText(e.target.value)}
                      placeholder="Type any extra instructions for your driver (hotel gate, cruise ship name, extra stop)..."
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none transition-all resize-none"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                          bulkyLuggage
                            ? 'bg-[#e6fdff] border-[#00c8e8] shadow-2xs'
                            : 'bg-[#f5feff] border-[#9beeff] hover:border-[#00c8e8]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={bulkyLuggage}
                          onChange={(e) => setBulkyLuggage(e.target.checked)}
                          className="w-4 h-4 mt-0.5 accent-[#00c8e8] rounded cursor-pointer shrink-0"
                        />
                        <div className="text-xs leading-tight">
                          <span className="font-bold text-slate-900 block">Bulky luggage</span>
                          <span className="text-[10px] text-slate-500">Bikes, snowboards, big boxes, golf bags</span>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                          wheelchairAccessible
                            ? 'bg-[#e6fdff] border-[#00c8e8] shadow-2xs'
                            : 'bg-[#f5feff] border-[#9beeff] hover:border-[#00c8e8]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={wheelchairAccessible}
                          onChange={(e) => setWheelchairAccessible(e.target.checked)}
                          className="w-4 h-4 mt-0.5 accent-[#00c8e8] rounded cursor-pointer shrink-0"
                        />
                        <div className="text-xs leading-tight">
                          <span className="font-bold text-slate-900 block">Wheelchair accessible vehicle</span>
                          <span className="text-[10px] text-slate-500">Spacious ramp / mobility space</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Payment Options (Card Payment, PayPal, Cash to Driver) */}
            <div className="bg-white rounded-2xl border border-[#8ceeff] p-4 shadow-xs space-y-3">
              <div className="pb-2 border-b border-[#cff9ff] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#008da1] block">
                    4 · Payment Options
                  </span>
                  <h3 className="font-display font-extrabold text-base text-slate-900">
                    Choose Payment Method
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#007c91] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Secure · 0 Booking Fee
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Card Payment Option */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#00c8e8] bg-[#e6fdff] ring-2 ring-[#00f0ff]/45 shadow-xs'
                      : 'border-[#9beeff] bg-[#f5feff] hover:bg-[#e6fdff]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentMethod === 'card' ? 'border-[#042f40] bg-[#00f0ff]' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CreditCard className="w-4 h-4 text-[#008da1]" />
                          <span className="font-display font-bold text-xs sm:text-sm text-slate-900">
                            Card Payment (Visa / Mastercard / Amex)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Pay securely by Credit/Debit Card or Apple Pay — online payment link or in-vehicle terminal.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white border border-[#9beeff] text-[#042f40]">
                        VISA
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white border border-[#9beeff] text-[#042f40]">
                        MC
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white border border-[#9beeff] text-[#042f40] hidden sm:inline">
                        AMEX
                      </span>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div
                      className="mt-2.5 pt-2.5 border-t border-[#9beeff] flex flex-wrap gap-2 pl-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setCardPreference('online')}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          cardPreference === 'online'
                            ? 'bg-[#00f0ff] border-[#00c8e8] text-slate-950 font-extrabold shadow-2xs'
                            : 'bg-white border-[#9beeff] text-slate-700 hover:bg-[#d8fbff]'
                        }`}
                      >
                        {cardPreference === 'online' && <Check className="w-3 h-3" />}
                        <span>Secure Online Card Link</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardPreference('vehicle')}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          cardPreference === 'vehicle'
                            ? 'bg-[#00f0ff] border-[#00c8e8] text-slate-950 font-extrabold shadow-2xs'
                            : 'bg-white border-[#9beeff] text-slate-700 hover:bg-[#d8fbff]'
                        }`}
                      >
                        {cardPreference === 'vehicle' && <Check className="w-3 h-3" />}
                        <span>Card Terminal in Vehicle</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* PayPal Option */}
                <div
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    paymentMethod === 'paypal'
                      ? 'border-[#00c8e8] bg-[#e6fdff] ring-2 ring-[#00f0ff]/45 shadow-xs'
                      : 'border-[#9beeff] bg-[#f5feff] hover:bg-[#e6fdff]/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'paypal' ? 'border-[#042f40] bg-[#00f0ff]' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {paymentMethod === 'paypal' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#008da1]" />
                        <span className="font-display font-bold text-xs sm:text-sm text-slate-900">
                          PayPal
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Receive an instant verified PayPal payment link after confirming your ride with Mr. Mir.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white border border-[#9beeff] text-[#042f40] shrink-0">
                    PayPal
                  </span>
                </div>

                {/* Cash to Driver Option */}
                <div
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    paymentMethod === 'cash'
                      ? 'border-[#00c8e8] bg-[#e6fdff] ring-2 ring-[#00f0ff]/45 shadow-xs'
                      : 'border-[#9beeff] bg-[#f5feff] hover:bg-[#e6fdff]/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'cash' ? 'border-[#042f40] bg-[#00f0ff]' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {paymentMethod === 'cash' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-[#008da1]" />
                        <span className="font-display font-bold text-xs sm:text-sm text-slate-900">
                          Cash to Chauffeur on Arrival
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Pay €{finalQuotedPrice} in Euros cash directly to your driver at drop-off. Zero advance charge.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white border border-[#9beeff] text-[#042f40] shrink-0">
                    € Cash
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (lg:col-span-5): Confirmation Details & Ride Summary (Sticky) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-[#8ceeff] p-4 sm:p-5 shadow-md space-y-4 sticky top-4">
              <div className="border-b border-[#cff9ff] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#008da1] block">
                    Review & Confirm
                  </span>
                  <h3 className="font-display font-extrabold text-base text-slate-900">
                    Ride & Payment Summary
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#00f0ff] border border-[#00c8e8] text-slate-950">
                  Fixed Fare
                </span>
              </div>

              {/* Route Visual Line */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00d4e6] mt-1 shrink-0"></span>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pick-up Location</span>
                    <span className="font-bold text-slate-800 break-words">{pickup}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Drop-off Destination</span>
                    <span className="font-bold text-slate-800 break-words">{dropoff}</span>
                  </div>
                </div>
              </div>

              {/* Date, Pax, Luggage, Distance, Child Seats Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f5feff] p-2.5 rounded-xl border border-[#cff9ff]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Date & Time</span>
                  <span className="font-bold text-slate-800">{dateTime || 'Flexible'}</span>
                </div>
                {isRoundTrip ? (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Return Date</span>
                    <span className="font-bold text-slate-800">{returnDateTime || 'Flexible'}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Distance</span>
                    <span className="font-bold text-slate-800">{quote?.distanceKm || 18} km · {quote?.durationText || '30 mins'}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px]">Passengers</span>
                  <span className="font-bold text-slate-800">{totalPassengers} Pax</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Luggage</span>
                  <span className="font-bold text-slate-800">{totalBags} Bags</span>
                </div>
                {totalChildSeats > 0 && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">
                      Child Seats (+€{totalChildSeats * CHILD_SEAT_PRICE_EUR})
                    </span>
                    <span className="font-bold text-[#007c91]">{getSeatDetailsText()}</span>
                  </div>
                )}
                {flightNumber.trim() && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Flight Number</span>
                    <span className="font-bold text-[#042f40]">{flightNumber.trim()}</span>
                  </div>
                )}
              </div>

              {/* Selected Vehicle & Price Breakdown Box */}
              <div className="bg-[#e6fdff] border border-[#67efff] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#007c91] block">
                      Selected Vehicle
                    </span>
                    <span className="font-display font-extrabold text-sm text-slate-900">
                      {activeVehicleData.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-[#042f40] font-display block tabular-nums">
                      €{finalQuotedPrice}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {isRoundTrip ? 'Round Trip Fare' : 'One Way Fixed'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 border-t border-[#9beeff] pt-1.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Base Transfer Fare:</span>
                    <span className="font-bold text-[#042f40]">
                      €{currentVehicleQuote?.basePrice ?? (activeVehicleData.id === 'van' ? 70 : activeVehicleData.id === 'comfort' ? 60 : 50)}
                    </span>
                  </div>
                  {totalChildSeats > 0 && (
                    <div className="flex justify-between">
                      <span>Extra Child Seats ({totalChildSeats} × €{CHILD_SEAT_PRICE_EUR}):</span>
                      <span className="font-bold text-[#007c91]">
                        +€{totalChildSeats * CHILD_SEAT_PRICE_EUR}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold text-[#042f40] text-right max-w-[60%] truncate">
                      {paymentMethod === 'card' ? 'Card (Visa/MC/Amex)' : paymentMethod === 'paypal' ? 'PayPal' : 'Cash to Driver'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>All Zone Supplements &amp; Tolls:</span>
                    <span className="font-bold text-[#007c91]">Included (€0)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Meet & Greet with Name Sign:</span>
                    <span className="font-bold text-[#007c91]">Included (€0)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flight Delay Monitoring:</span>
                    <span className="font-bold text-[#007c91]">Included (€0)</span>
                  </div>
                </div>
              </div>

              {/* Step 2 Validation Error if Contact Missing */}
              {step2Error && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700" role="alert">
                  ⚠️ {step2Error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={confirmingBooking}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00f0ff] hover:bg-[#00d8eb] border border-[#00c8e8] text-slate-950 font-extrabold text-sm sm:text-base shadow-[0_6px_20px_-4px_rgba(0,240,255,0.6)] transition-all active:scale-[0.98] cursor-pointer font-display disabled:opacity-70"
                >
                  {confirmingBooking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                      <span>Confirming Booking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-slate-950" />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleViewVoucher}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#e6fdff] hover:bg-[#ccfbff] text-[#042f40] font-bold text-xs border border-[#67efff] shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#008da1]" />
                  <span>View Official Printable Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={handleBookWhatsApp}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-[#f5feff] text-[#007c91] font-bold text-xs border border-[#9beeff] transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#008da1]" />
                  <span>Confirm Directly on WhatsApp</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-[#cff9ff] text-[10px] text-slate-500 space-y-1 text-center">
                <p className="flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#008da1]" />
                  <span>Instant Email & WhatsApp confirmation · 0 booking fee</span>
                </p>
                <p className="text-slate-400">
                  Free cancellation up to 24 hours before pickup
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      /* Step 3: Executive Boarding-Pass Booking Confirmed Screen */
      <div className="p-4 sm:p-8 bg-[#f5feff]">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#67efff] shadow-[0_14px_40px_-10px_rgba(0,180,216,0.2)] overflow-hidden">
          <div className="h-1.5 w-full bg-[#00f0ff]" />
          <div className="p-5 sm:p-7 space-y-5">
            {/* Header + Ref Badge */}
            <div className="text-center space-y-2 pb-4 border-b border-[#cff9ff]">
              <div className="w-12 h-12 rounded-2xl bg-[#00f0ff] border border-[#00c8e8] flex items-center justify-center mx-auto shadow-[0_6px_18px_-4px_rgba(0,240,255,0.6)]">
                <CheckCircle2 className="w-7 h-7 text-slate-950" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6fdff] border border-[#67efff] text-[11px] font-extrabold text-[#007c91]">
                <span>OFFICIAL REF: {confirmedBookingInfo?.bookingRef}</span>
              </div>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#042f40]">
                Transfer Confirmed, {passengerName}!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Your fixed-price chauffeur transfer is registered with 24/7 dispatch (Mr. Mir).
              </p>
            </div>

            {/* Route Visual Boarding Card */}
            <div className="rounded-xl bg-[#f5feff] border border-[#8ceeff] p-4 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00c8e8] mt-1 shrink-0 ring-4 ring-[#ccfaff]" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#007c91] block">Pickup Location</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#042f40] block">{pickup}</span>
                </div>
              </div>
              <div className="ml-1 pl-3 border-l-2 border-dashed border-[#67efff] py-0.5 text-[11px] font-semibold text-slate-500">
                {activeVehicleData.name} · {totalPassengers} Pax · {totalBags} Bags
                {flightNumber ? ` · Flight ${flightNumber}` : ''}
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#007c91] -ml-0.5 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#007c91] block">Drop-off Destination</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#042f40] block">{dropoff}</span>
                </div>
              </div>
            </div>

            {/* Delivery Cards: Email & Client WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email Confirmation Box */}
              <div className="p-3.5 rounded-xl bg-[#f5feff] border border-[#8ceeff] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#042f40] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#008da1]" />
                    <span>Email Confirmation</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#e6fdff] text-[#007c91] border border-[#67efff]">
                    {confirmedBookingInfo?.emailSent ? 'Sent Automatically ✓' : 'Voucher Ready ✓'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold break-all">{passengerEmail}</p>
                <p className="text-[11px] text-slate-500">
                  {confirmedBookingInfo?.emailSent
                    ? 'Sent automatically to your inbox — no extra step needed.'
                    : 'Booking confirmed & registered. Print or save your official boarding pass below.'}
                </p>
              </div>

              {/* WhatsApp Confirmation Box */}
              <div className="p-3.5 rounded-xl bg-[#f5feff] border border-[#8ceeff] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#042f40] flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#008da1]" />
                    <span>WhatsApp Dispatch</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#e6fdff] text-[#007c91] border border-[#67efff]">
                    {confirmedBookingInfo?.whatsappSent ? 'Sent Automatically ✓' : '24/7 Direct Line'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">{confirmedBookingInfo?.fullPhone}</p>
                <p className="text-[11px] text-slate-500">
                  {confirmedBookingInfo?.whatsappSent
                    ? 'Dispatched automatically to your WhatsApp & Mr. Mir.'
                    : 'Your booking is registered. Use the direct WhatsApp button anytime to chat with your driver.'}
                </p>
              </div>
            </div>

            {/* Fare & Payment Strip */}
            <div className="bg-[#e6fdff] border border-[#67efff] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#007c91] block">Total Guaranteed Fare</span>
                <span className="font-display font-extrabold text-2xl text-[#042f40] tabular-nums">€{finalQuotedPrice}</span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase text-[#007c91] block">Pickup Time & Payment</span>
                <span className="font-bold text-slate-900 block">
                  {dateTime ? new Date(dateTime).toLocaleString() : 'To be confirmed'}
                </span>
                <span className="text-[11px] font-semibold text-slate-700">{getPaymentMethodLabel()}</span>
              </div>
            </div>

            {/* Primary & Secondary Action Suite */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <a
                  href={confirmedBookingInfo?.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00f0ff] hover:bg-[#00d8eb] border border-[#00c8e8] text-slate-950 font-extrabold text-xs sm:text-sm shadow-[0_6px_20px_-4px_rgba(0,240,255,0.6)] transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>Message Chauffeur on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleViewVoucher}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#e6fdff] hover:bg-[#ccfbff] text-[#042f40] font-bold text-xs sm:text-sm border border-[#67efff] cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4 text-[#008da1]" />
                  <span>Print Official Voucher</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCalendar}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-[#f2feff] text-[#042f40] font-bold text-xs border border-[#9beeff] cursor-pointer transition-all"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#008da1]" />
                  <span>Add to Calendar (.ics)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyConfirmedSummary}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-[#f2feff] text-[#042f40] font-bold text-xs border border-[#9beeff] cursor-pointer transition-all"
                >
                  {copiedConfirmed ? <Check className="w-3.5 h-3.5 text-[#008da1]" /> : <Copy className="w-3.5 h-3.5 text-[#008da1]" />}
                  <span>{copiedConfirmed ? 'Copied Summary!' : 'Copy Confirmation'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('calculator')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Book Another Ride</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

            {/* 1-Click Luggage Size Chart Modal */}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-[#8ceeff] overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#cff9ff]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧳</span>
                <div>
                  <h3 className="font-display font-extrabold text-base sm:text-lg text-slate-900">
                    Real Luggage Sizes & Vehicle Guide
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Real photos & international airline measurements
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-[#e6fdff] transition-colors cursor-pointer"
                aria-label="Close size chart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real Bags Visual Comparison Photo - Clean Only */}
            <div className="rounded-xl overflow-hidden border border-[#9beeff] shadow-sm bg-white my-3">
              <img
                src="/images/luggage-guide.jpg"
                alt="Real luggage types: Backpack, Cabin 55cm, Medium 65cm, Large XXL 80cm"
                className="w-full h-auto object-cover max-h-72"
              />
              <div className="grid grid-cols-4 text-center py-2.5 bg-[#e6fdff] text-slate-900 text-[11px] sm:text-xs font-bold divide-x divide-[#9beeff] border-t border-[#9beeff]">
                <div className="px-1">
                  <span className="block text-[#042f40]">Backpack</span>
                  <span className="text-[9px] text-slate-500 font-normal">Personal Lap</span>
                </div>
                <div className="px-1">
                  <span className="block text-[#042f40]">55 cm</span>
                  <span className="text-[9px] text-slate-500 font-normal">Cabin / Hand</span>
                </div>
                <div className="px-1">
                  <span className="block text-[#042f40]">65 cm</span>
                  <span className="text-[9px] text-slate-500 font-normal">Medium Check-in</span>
                </div>
                <div className="px-1">
                  <span className="block text-[#042f40]">75–80 cm</span>
                  <span className="text-[9px] text-slate-500 font-normal">Large / XXL</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#cff9ff] flex justify-end">
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#00f0ff] hover:bg-[#00d8eb] border border-[#00c8e8] text-slate-950 font-extrabold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Got It / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
