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
  ExternalLink,
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
} from 'lucide-react';
import {
  QUICK_LOCATIONS,
  VEHICLES,
  TRANSLATIONS,
  BUSINESS_INFO,
  QuickLocation,
} from '../data/transferData';
import {
  calculateQuote,
  calculateHaversineKm,
  generateWhatsAppLink,
  QuoteResult,
} from '../utils/pricing';

interface AutocompleteItem {
  label: string;
  lat: number;
  lon: number;
}

interface BookingCalculatorProps {
  language: 'en' | 'es' | 'ca' | 'ur';
  prefilledRoute?: { pickup: string; dropoff: string } | null;
  onOpenVoucher: (bookingData: any) => void;
}

export const BookingCalculator: React.FC<BookingCalculatorProps> = ({
  language,
  prefilledRoute,
  onOpenVoucher,
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
  const [flightNumber, setFlightNumber] = useState('');
  const [passengerName, setPassengerName] = useState('');

  // Detailed Passenger State
  const [adults, setAdults] = useState(0);
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

  // Booking flow step: 'calculator' (initial) or 'booking' (vehicle selection & confirmation page)
  const [currentStep, setCurrentStep] = useState<'calculator' | 'booking'>('calculator');

  // Selected Vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('standard');

  // Autocomplete UI state
  const [pickupSuggestions, setPickupSuggestions] = useState<AutocompleteItem[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<AutocompleteItem[]>([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDropoffList, setShowDropoffList] = useState(false);
  const pickupTimeout = useRef<any>(null);
  const dropoffTimeout = useRef<any>(null);

  // Route & Quote calculation state
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [priceRevealed, setPriceRevealed] = useState(false);

  // Airport terminal toggles & matchers for Pickup & Dropoff
  const [showPickupAirportTerminals, setShowPickupAirportTerminals] = useState(false);
  const [showDropoffAirportTerminals, setShowDropoffAirportTerminals] = useState(false);

  const isPickupAirportT1 = pickup.toLowerCase().includes('terminal 1') || pickup.toLowerCase().includes('t1');
  const isPickupAirportT2 = pickup.toLowerCase().includes('terminal 2') || pickup.toLowerCase().includes('t2');
  const isPickupAirport = isPickupAirportT1 || isPickupAirportT2 || pickup.toLowerCase().includes('airport');

  const isDropoffAirportT1 = dropoff.toLowerCase().includes('terminal 1') || dropoff.toLowerCase().includes('t1');
  const isDropoffAirportT2 = dropoff.toLowerCase().includes('terminal 2') || dropoff.toLowerCase().includes('t2');
  const isDropoffAirport = isDropoffAirportT1 || isDropoffAirportT2 || dropoff.toLowerCase().includes('airport');

  const otherQuickLocations = QUICK_LOCATIONS.filter(
    (loc) => loc.id === 'port' || loc.id === 'sants'
  );

  // Toggle for merged Passengers + Luggage + Child Seats button
  const [showPassengersLuggageSeats, setShowPassengersLuggageSeats] = useState(false);

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

  const matchCoordinatesForAddresses = (pText: string, dText: string) => {
    const pMatch = QUICK_LOCATIONS.find((q) =>
      pText.toLowerCase().includes(q.shortLabel.toLowerCase()) ||
      pText.toLowerCase().includes(q.name.toLowerCase())
    );
    if (pMatch) setPickupCoords({ lat: pMatch.lat, lon: pMatch.lon });

    const dMatch = QUICK_LOCATIONS.find((q) =>
      dText.toLowerCase().includes(q.shortLabel.toLowerCase()) ||
      dText.toLowerCase().includes(q.name.toLowerCase())
    );
    if (dMatch) setDropoffCoords({ lat: dMatch.lat, lon: dMatch.lon });
  };

  // Autocomplete search via Photon Komoot (OpenStreetMap)
  const fetchAddressSuggestions = async (
    query: string,
    setList: (items: AutocompleteItem[]) => void,
    setShow: (val: boolean) => void
  ) => {
    if (!query || query.length < 3) {
      setList([]);
      setShow(false);
      return;
    }

    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?limit=5&lang=en&lat=41.39&lon=2.17&q=${encodeURIComponent(query)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const items: AutocompleteItem[] = (data.features || [])
        .filter((f: any) => /^(ES|AD|FR)$/i.test(f.properties?.countrycode || 'ES'))
        .map((f: any) => {
          const p = f.properties || {};
          const parts = [
            p.name,
            p.street ? `${p.street} ${p.housenumber || ''}`.trim() : null,
            p.city || p.town || p.village,
            p.postcode,
          ].filter(Boolean);
          const uniqueParts = Array.from(new Set(parts));
          return {
            label: uniqueParts.join(', '),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
          };
        })
        .filter((item: AutocompleteItem) => item.label.length > 0);

      setList(items);
      setShow(items.length > 0);
    } catch (err) {
      console.warn('Photon autocomplete error:', err);
    }
  };

  const handlePickupChange = (val: string) => {
    setPickup(val);
    setPickupCoords(null);
    setValidationError('');
    clearTimeout(pickupTimeout.current);
    pickupTimeout.current = setTimeout(() => {
      fetchAddressSuggestions(val, setPickupSuggestions, setShowPickupList);
    }, 300);
  };

  const handleDropoffChange = (val: string) => {
    setDropoff(val);
    setDropoffCoords(null);
    setValidationError('');
    clearTimeout(dropoffTimeout.current);
    dropoffTimeout.current = setTimeout(() => {
      fetchAddressSuggestions(val, setDropoffSuggestions, setShowDropoffList);
    }, 300);
  };

  // Quick Pick Chips
  const applyQuickLocation = (loc: QuickLocation, field: 'pickup' | 'dropoff') => {
    setValidationError('');
    if (field === 'pickup') {
      setPickup(loc.name);
      setPickupCoords({ lat: loc.lat, lon: loc.lon });
      setShowPickupList(false);
    } else {
      setDropoff(loc.name);
      setDropoffCoords({ lat: loc.lat, lon: loc.lon });
      setShowDropoffList(false);
    }
  };

  // Swap locations
  const handleSwap = () => {
    const tempP = pickup;
    const tempPCoords = pickupCoords;
    setPickup(dropoff);
    setPickupCoords(dropoffCoords);
    setDropoff(tempP);
    setDropoffCoords(tempPCoords);
  };

  // Geocode address fallback via Nominatim
  const geocodeAddress = async (addr: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const q = addr.toLowerCase().includes('spain') ? addr : `${addr}, Spain`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es,ad,fr&q=${encodeURIComponent(
          q
        )}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      if (json && json.length > 0) {
        return { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) };
      }
    } catch {
      // fallback
    }
    return null;
  };

  // Calculate Route & Price
  const runRouteCalculation = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setQuote(null);
      return;
    }

    setCalculating(true);
    let pCoords = pickupCoords;
    let dCoords = dropoffCoords;

    if (!pCoords) {
      pCoords = await geocodeAddress(pickup);
      if (pCoords) setPickupCoords(pCoords);
    }
    if (!dCoords) {
      dCoords = await geocodeAddress(dropoff);
      if (dCoords) setDropoffCoords(dCoords);
    }

    let distKm = 20; // safe baseline
    let durationMins = 30;

    if (pCoords && dCoords) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pCoords.lon},${pCoords.lat};${dCoords.lon},${dCoords.lat}?overview=false`;
        const res = await fetch(osrmUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            distKm = data.routes[0].distance / 1000;
            durationMins = Math.round(data.routes[0].duration / 60);
          } else {
            distKm = calculateHaversineKm(pCoords.lat, pCoords.lon, dCoords.lat, dCoords.lon);
            durationMins = Math.max(15, Math.round(distKm * 1.3));
          }
        } else {
          distKm = calculateHaversineKm(pCoords.lat, pCoords.lon, dCoords.lat, dCoords.lon);
          durationMins = Math.max(15, Math.round(distKm * 1.3));
        }
      } catch {
        distKm = calculateHaversineKm(pCoords.lat, pCoords.lon, dCoords.lat, dCoords.lon);
        durationMins = Math.max(15, Math.round(distKm * 1.3));
      }
    }

    const calculatedQuote = calculateQuote(
      pickup,
      dropoff,
      distKm,
      durationMins,
      totalPassengers,
      checkInSuitcases,
      totalChildSeats,
      isRoundTrip
    );

    setQuote(calculatedQuote);
    setCalculating(false);
  };

  // Recalculate when pickup, dropoff, or vehicle params change
  useEffect(() => {
    if (pickup.trim() && dropoff.trim()) {
      runRouteCalculation();
    }
  }, [pickup, dropoff, totalPassengers, checkInSuitcases, totalChildSeats, isRoundTrip]);

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
    : activeVehicleData.id === 'van' ? 59 : activeVehicleData.id === 'comfort' ? 47 : 39;

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

  // Handle WhatsApp Book
  const handleBookWhatsApp = () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setValidationError('Please enter or select both pickup and drop-off locations.');
      return;
    }
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
      flightNumber,
      passengerName,
      distanceKm: quote?.distanceKm,
    });
    setPriceRevealed(true);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  // Open Voucher Modal
  const handleViewVoucher = () => {
    setPriceRevealed(true);
    if (!pickup.trim() || !dropoff.trim()) {
      setValidationError('Please enter or select both pickup and drop-off locations.');
      return;
    }
    onOpenVoucher({
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
      flightNumber,
      passengerName,
      distanceKm: quote?.distanceKm,
      durationText: quote?.durationText,
    });
  };

  // Google Maps directions URL for iframe & link
  const originQuery = pickupCoords
    ? `${pickupCoords.lat},${pickupCoords.lon}`
    : encodeURIComponent(pickup);
  const destQuery = dropoffCoords
    ? `${dropoffCoords.lat},${dropoffCoords.lon}`
    : encodeURIComponent(dropoff);
  const googleMapsEmbedUrl = `https://maps.google.com/maps?f=d&hl=en&saddr=${originQuery}&daddr=${destQuery}&output=embed`;
  const googleMapsExternalUrl = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${originQuery}&destination=${destQuery}`;

  return (
    <div
      id="calculator"
      className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400/80 overflow-hidden transition-all text-slate-900 ring-1 ring-amber-400/30"
    >
      {/* Calculator Header Bar */}
      {currentStep === 'booking' ? (
        <div className="bg-[#0e2438] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2.5 border-b-2 border-amber-400">
          <button
            type="button"
            onClick={() => {
              setCurrentStep('calculator');
              const el = document.getElementById('calculator');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-amber-400/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Modify Route / Back</span>
          </button>

          <div className="text-right">
            <span className="text-[10px] sm:text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
              Step 2 of 2
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              Select Vehicle & Confirm
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-[#0e2438] text-white px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b-2 border-amber-400/70">
          <div className="flex items-center gap-2">
            <h2 className="flex items-center gap-2 m-0">
              <span className="text-[13px] sm:text-sm font-bold font-display">{t.calcTitle}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                Fixed Rates
              </span>
            </h2>
          </div>

          {/* Trip Mode Switch with 1-line compact "Private transfers from Barcelona to anywhere in Spain" above it */}
          <div className="flex flex-col sm:items-end gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-300 whitespace-nowrap tracking-tight">
              Private transfers from Barcelona to anywhere in Spain
            </span>
            <div className="flex items-center gap-1 bg-[#112331] p-1 rounded-lg border-2 border-amber-400/70 text-xs font-semibold self-start sm:self-end">
              <button
                type="button"
                onClick={() => setIsRoundTrip(false)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  !isRoundTrip
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => setIsRoundTrip(true)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  isRoundTrip
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Round Trip (-5%)
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'calculator' ? (
        <div className="p-4 sm:p-6 space-y-4">
        {/* Step 1: Pickup and Drop-off with Quick Chips */}
        <div className="space-y-2.5">
          {/* Pickup Input */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.pickupLabel}</span>
              </label>
              <span className="text-[11px] text-slate-500">Terminal, hotel, or address</span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={pickup}
                onChange={(e) => handlePickupChange(e.target.value)}
                onFocus={() => pickupSuggestions.length > 0 && setShowPickupList(true)}
                placeholder={t.pickupPlaceholder}
                className="w-full pl-3.5 pr-10 py-2.5 text-sm font-medium bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none transition-all shadow-xs"
              />
              <span className="absolute right-3 top-3 text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-500" />
              </span>

              {/* Suggestions Dropdown */}
              {showPickupList && pickupSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-amber-400/60 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {pickupSuggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onMouseDown={() => {
                        setPickup(item.label);
                        setPickupCoords({ lat: item.lat, lon: item.lon });
                        setShowPickupList(false);
                      }}
                      className="px-3.5 py-2.5 hover:bg-amber-50 cursor-pointer flex items-center gap-2 text-slate-800"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Terminal Selector Bar above Quick Chips */}
            {showPickupAirportTerminals && (
              <div className="mt-2 p-1.5 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-center justify-between gap-1.5 shadow-xs animate-fadeIn">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 pl-1 shrink-0">
                  <Plane className="w-3.5 h-3.5 text-amber-600" />
                  <span>Terminal:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const loc = QUICK_LOCATIONS.find((l) => l.id === 'bcn_t1');
                      if (loc) applyQuickLocation(loc, 'pickup');
                      setShowPickupAirportTerminals(false);
                    }}
                    className={`text-[11px] px-3 py-1 rounded-lg font-bold border-2 transition-all cursor-pointer flex items-center gap-1 ${
                      isPickupAirportT1
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white border-amber-300 hover:bg-amber-100 text-slate-800'
                    }`}
                  >
                    <span>Terminal 1</span>
                    {isPickupAirportT1 && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const loc = QUICK_LOCATIONS.find((l) => l.id === 'bcn_t2');
                      if (loc) applyQuickLocation(loc, 'pickup');
                      setShowPickupAirportTerminals(false);
                    }}
                    className={`text-[11px] px-3 py-1 rounded-lg font-bold border-2 transition-all cursor-pointer flex items-center gap-1 ${
                      isPickupAirportT2
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white border-amber-300 hover:bg-amber-100 text-slate-800'
                    }`}
                  >
                    <span>Terminal 2</span>
                    {isPickupAirportT2 && <span className="text-[10px]">✓</span>}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Pick Chips for Pickup - 1 Single Row */}
            <div className="flex items-center gap-1.5 flex-nowrap sm:flex-wrap mt-2 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-600 mr-1 shrink-0">Quick:</span>

              <button
                type="button"
                onClick={() => {
                  setShowPickupAirportTerminals((prev) => !prev);
                  if (!isPickupAirport) {
                    const loc = QUICK_LOCATIONS.find((l) => l.id === 'bcn_t1');
                    if (loc) applyQuickLocation(loc, 'pickup');
                  }
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isPickupAirport
                    ? 'bg-amber-400 border-2 border-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-white hover:bg-amber-50 text-slate-800 border border-amber-400/60 hover:border-amber-400 shadow-xs'
                }`}
                title="Click to select Airport Terminal 1 or Terminal 2"
              >
                <Plane className="w-3.5 h-3.5 text-slate-900" />
                <span>{isPickupAirportT1 ? 'Airport (T1)' : isPickupAirportT2 ? 'Airport (T2)' : 'Airport'}</span>
                <ChevronDown className={`w-3 h-3 text-slate-700 transition-transform ${showPickupAirportTerminals ? 'rotate-180' : ''}`} />
              </button>

              {/* Other Quick Locations (Cruise Port & Sants Station on same 1 row) */}
              {otherQuickLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    applyQuickLocation(loc, 'pickup');
                    setShowPickupAirportTerminals(false);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer shrink-0 ${
                    pickup.toLowerCase().includes(loc.shortLabel.toLowerCase())
                      ? 'bg-amber-400 border-2 border-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-slate-800 border border-amber-400/60 hover:border-amber-400 shadow-xs'
                  }`}
                >
                  {loc.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Drop-off Input */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.dropoffLabel}</span>
              </label>
              <span className="text-[11px] text-slate-500">Destination city or resort</span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={dropoff}
                onChange={(e) => handleDropoffChange(e.target.value)}
                onFocus={() => dropoffSuggestions.length > 0 && setShowDropoffList(true)}
                placeholder={t.dropoffPlaceholder}
                className="w-full pl-3.5 pr-10 py-2.5 text-sm font-medium bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none transition-all shadow-xs"
              />
              <span className="absolute right-3 top-3 text-slate-400">
                <Navigation className="w-4 h-4 text-amber-500" />
              </span>

              {/* Suggestions Dropdown */}
              {showDropoffList && dropoffSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-amber-400/60 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {dropoffSuggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onMouseDown={() => {
                        setDropoff(item.label);
                        setDropoffCoords({ lat: item.lat, lon: item.lon });
                        setShowDropoffList(false);
                      }}
                      className="px-3.5 py-2.5 hover:bg-amber-50 cursor-pointer flex items-center gap-2 text-slate-800"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Terminal Selector Bar above Quick Chips */}
            {showDropoffAirportTerminals && (
              <div className="mt-2 p-1.5 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-center justify-between gap-1.5 shadow-xs animate-fadeIn">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 pl-1 shrink-0">
                  <Plane className="w-3.5 h-3.5 text-amber-600" />
                  <span>Terminal:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const loc = QUICK_LOCATIONS.find((l) => l.id === 'bcn_t1');
                      if (loc) applyQuickLocation(loc, 'dropoff');
                      setShowDropoffAirportTerminals(false);
                    }}
                    className={`text-[11px] px-3 py-1 rounded-lg font-bold border-2 transition-all cursor-pointer flex items-center gap-1 ${
                      isDropoffAirportT1
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white border-amber-300 hover:bg-amber-100 text-slate-800'
                    }`}
                  >
                    <span>Terminal 1</span>
                    {isDropoffAirportT1 && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const loc = QUICK_LOCATIONS.find((l) => l.id === 'bcn_t2');
                      if (loc) applyQuickLocation(loc, 'dropoff');
                      setShowDropoffAirportTerminals(false);
                    }}
                    className={`text-[11px] px-3 py-1 rounded-lg font-bold border-2 transition-all cursor-pointer flex items-center gap-1 ${
                      isDropoffAirportT2
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white border-amber-300 hover:bg-amber-100 text-slate-800'
                    }`}
                  >
                    <span>Terminal 2</span>
                    {isDropoffAirportT2 && <span className="text-[10px]">✓</span>}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Pick Chips for Drop-off - 1 Single Row */}
            <div className="flex items-center gap-1.5 flex-nowrap sm:flex-wrap mt-2 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-600 mr-1 shrink-0">Quick:</span>

              <button
                type="button"
                onClick={() => {
                  setShowDropoffAirportTerminals((prev) => !prev);
                  if (!isDropoffAirport) {
                    const loc = QUICK_LOCATIONS.find((l) => l.id === 'bcn_t1');
                    if (loc) applyQuickLocation(loc, 'dropoff');
                  }
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isDropoffAirport
                    ? 'bg-amber-400 border-2 border-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-white hover:bg-amber-50 text-slate-800 border border-amber-400/60 hover:border-amber-400 shadow-xs'
                }`}
                title="Click to select Airport Terminal 1 or Terminal 2"
              >
                <Plane className="w-3.5 h-3.5 text-slate-900" />
                <span>{isDropoffAirportT1 ? 'Airport (T1)' : isDropoffAirportT2 ? 'Airport (T2)' : 'Airport'}</span>
                <ChevronDown className={`w-3 h-3 text-slate-700 transition-transform ${showDropoffAirportTerminals ? 'rotate-180' : ''}`} />
              </button>

              {/* Other Quick Locations (Cruise Port & Sants Station on same 1 row) */}
              {otherQuickLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    applyQuickLocation(loc, 'dropoff');
                    setShowDropoffAirportTerminals(false);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer shrink-0 ${
                    dropoff.toLowerCase().includes(loc.shortLabel.toLowerCase())
                      ? 'bg-amber-400 border-2 border-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-slate-800 border border-amber-400/60 hover:border-amber-400 shadow-xs'
                  }`}
                >
                  {loc.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date, Time & Flight Info - 1 Single Row (2 Boxes side by side) */}
        <div className="pt-2 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Box 1: Pickup Date & Time */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Pickup Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none shadow-xs transition-all font-medium"
              />
            </div>

            {/* Box 2: Flight Number (or Return Date & Time if Round Trip) */}
            {isRoundTrip ? (
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Return Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={returnDateTime}
                  onChange={(e) => setReturnDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none shadow-xs transition-all font-medium"
                />
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Plane className="w-3.5 h-3.5 text-amber-500" />
                  <span>Flight Number (Optional)</span>
                </label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. VY6204, BA478"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none shadow-xs transition-all font-medium"
                />
              </div>
            )}
          </div>

          {/* Optional flight number if round trip */}
          {isRoundTrip && (
            <div className="mt-2">
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="Flight Number (Optional, e.g. VY6204)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-amber-400/60 rounded-lg outline-none shadow-xs"
              />
            </div>
          )}
        </div>

        {/* Merged Option Button: Passengers + Luggage + Child Seat */}
        <div className="pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowPassengersLuggageSeats((prev) => !prev)}
            className={`w-full p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-xs ${
              showPassengersLuggageSeats
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30'
                : 'bg-slate-50 hover:bg-amber-50/60 border-amber-400/70 hover:border-amber-400'
            }`}
          >
            <div className="text-left min-w-0 pr-2">
              <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Passengers + Luggage + Child Seat
              </div>
              <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5 truncate">
                <span className="text-slate-950 font-bold bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                  {totalPassengers} Pax
                </span>
                <span>•</span>
                <span className="text-slate-800 font-semibold">{totalBags} Luggage</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">
                  {totalChildSeats > 0 ? `${totalChildSeats} Child Seats` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-400 text-slate-950 border border-amber-500 shadow-xs flex items-center gap-1">
                <span>{showPassengersLuggageSeats ? 'Close' : 'Choose / Edit'}</span>
                {showPassengersLuggageSeats ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </div>
          </button>

          {/* Expandable Panel: Passengers, Luggage, Child Seats */}
          {showPassengersLuggageSeats && (
            <div className="mt-2.5 p-2.5 sm:p-3 bg-white border-2 border-amber-400/80 rounded-2xl shadow-lg space-y-2.5 transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                {/* Box 1: Passengers */}
                <div className="bg-slate-50 border border-amber-400/60 hover:border-amber-400 rounded-xl p-2.5 flex flex-col justify-between shadow-xs transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-600" />
                        <span>Passengers</span>
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
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
                                  ? 'bg-[#0e5c73] text-white shadow-xs'
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
                <div className="bg-slate-50 border border-amber-400/60 hover:border-amber-400 rounded-xl p-2.5 flex flex-col justify-between shadow-xs transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                        <span>Luggage</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowSizeChart(true)}
                          className="text-[9px] font-bold text-[#0e5c73] hover:text-[#0b4859] bg-sky-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>📏 Guide</span>
                        </button>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
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
                <div className="bg-slate-50 border border-amber-400/60 hover:border-amber-400 rounded-xl p-2.5 flex flex-col justify-between shadow-xs transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <Baby className="w-3.5 h-3.5 text-slate-600" />
                        <span>Child Seats</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Free
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
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span>Spanish law compliant · Free</span>
                  </p>
                </div>
              </div>

              {/* Done / Next button */}
              <div className="flex justify-end pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPassengersLuggageSeats(false)}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs border border-amber-500 shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>Done</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 1 Action Button: Get Price */}
        <div className="pt-2 border-t border-slate-200">
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
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl bg-[#f5b301] hover:bg-[#e5a700] text-slate-950 font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer border-2 border-amber-500 font-display"
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
    ) : (
      /* Step 2: Available Vehicles & Confirmation (QuickPickups style) */
      <div className="p-4 sm:p-6 lg:p-7 bg-slate-50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column (lg:col-span-7): Available Vehicles with Prices */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1 border-b border-slate-200">
              <div>
                <h3 className="font-display font-extrabold text-base sm:text-lg text-slate-900">
                  Available Vehicles for Your Trip
                </h3>
                <p className="text-xs text-slate-500">
                  {quote?.distanceKm || 18} km · Approx. {quote?.durationText || '30 mins'} · Fixed prices, tolls included
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full self-start sm:self-auto">
                {isRoundTrip ? 'Round Trip (-5% off)' : 'One Way'}
              </span>
            </div>

            {/* Vehicle Cards List */}
            <div className="space-y-3">
              {/* 1. Standard Sedan */}
              {(() => {
                const v = VEHICLES.find((item) => item.id === 'standard') || VEHICLES[0];
                const vQuote = quote?.vehicles.find((q) => q.vehicleId === 'standard');
                const price = vQuote ? (isRoundTrip ? vQuote.roundTripTotal : vQuote.totalPrice) : (isRoundTrip ? 74 : 39);
                const isSelected = selectedVehicleId === 'standard';
                const isDisabled = totalPassengers > 4 || checkInSuitcases > 3;

                return (
                  <div
                    key="standard"
                    onClick={() => {
                      if (!isDisabled) setSelectedVehicleId('standard');
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all relative ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                        : isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-400 cursor-pointer'
                        : 'border-slate-200 hover:border-amber-400 bg-white hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-3.5 sm:items-center">
                      <div className="w-full sm:w-36 h-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 relative border border-slate-200 shrink-0">
                        <img
                          src={v.photos[0]}
                          alt={v.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-tight">
                              {v.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                              Skoda Superb, VW Passat, Toyota Prius+ or equivalent
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg sm:text-xl font-extrabold text-slate-950 font-display block">
                              €{price}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {isRoundTrip ? 'Total return' : 'All-inclusive'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 my-1.5 flex-wrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>Max 4 Passengers</span>
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-500" />
                            <span>Max 3 Bags</span>
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                            Free Meet & Greet
                          </span>
                        </div>

                        {isDisabled ? (
                          <p className="text-[11px] font-bold text-rose-600 mt-1">
                            ⚠️ Your group exceeds sedan capacity (Minivan required for 5+ pax/suitcases)
                          </p>
                        ) : (
                          <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-500">
                              Air conditioning · Flight tracking · 60m free waiting
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950 border border-amber-500'
                                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? 'Selected ✓' : 'Select'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Comfort Executive */}
              {(() => {
                const v = VEHICLES.find((item) => item.id === 'comfort') || VEHICLES[1];
                const vQuote = quote?.vehicles.find((q) => q.vehicleId === 'comfort');
                const price = vQuote ? (isRoundTrip ? vQuote.roundTripTotal : vQuote.totalPrice) : (isRoundTrip ? 90 : 47);
                const isSelected = selectedVehicleId === 'comfort';
                const isDisabled = totalPassengers > 4 || checkInSuitcases > 4;

                return (
                  <div
                    key="comfort"
                    onClick={() => {
                      if (!isDisabled) setSelectedVehicleId('comfort');
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all relative ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                        : isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-400 cursor-pointer'
                        : 'border-slate-200 hover:border-amber-400 bg-white hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-3.5 sm:items-center">
                      <div className="w-full sm:w-36 h-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 relative border border-slate-200 shrink-0">
                        <img
                          src={v.photos[0]}
                          alt={v.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-tight">
                              {v.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                              Mercedes-Benz E-Class, BMW 5 Series, Audi A6 or equivalent
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg sm:text-xl font-extrabold text-slate-950 font-display block">
                              €{price}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {isRoundTrip ? 'Total return' : 'All-inclusive'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 my-1.5 flex-wrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>Max 4 Passengers</span>
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-500" />
                            <span>Max 4 Bags</span>
                          </span>
                          <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-300">
                            Executive Chauffeur
                          </span>
                        </div>

                        {isDisabled ? (
                          <p className="text-[11px] font-bold text-rose-600 mt-1">
                            ⚠️ Your group exceeds capacity (Minivan required for 5+ pax)
                          </p>
                        ) : (
                          <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-500">
                              Leather seats · Water & Wi-Fi · Professional suit chauffeur
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950 border border-amber-500'
                                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? 'Selected ✓' : 'Select'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Minivan (8-Seater) */}
              {(() => {
                const v = VEHICLES.find((item) => item.id === 'van') || VEHICLES[2];
                const vQuote = quote?.vehicles.find((q) => q.vehicleId === 'van');
                const price = vQuote ? (isRoundTrip ? vQuote.roundTripTotal : vQuote.totalPrice) : (isRoundTrip ? 112 : 59);
                const isSelected = selectedVehicleId === 'van' || selectedVehicleId === 'minivan';
                const isRecommended = totalPassengers >= 5 || checkInSuitcases >= 5;

                return (
                  <div
                    key="minivan"
                    onClick={() => setSelectedVehicleId('van')}
                    className={`p-3.5 rounded-2xl border-2 transition-all relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-400 cursor-pointer'
                        : 'border-slate-200 hover:border-amber-400 bg-white hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 right-4 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider shadow-xs border border-amber-500">
                        Recommended for your group
                      </span>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3.5 sm:items-center">
                      <div className="w-full sm:w-36 h-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 relative border border-slate-200 shrink-0">
                        <img
                          src={v.photos[0]}
                          alt={v.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-tight">
                              Minivan (8-Seater)
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                              Mercedes-Benz V-Class, Vito or equivalent 8-passenger van
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg sm:text-xl font-extrabold text-slate-950 font-display block">
                              €{price}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {isRoundTrip ? 'Total return' : 'All-inclusive'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 my-1.5 flex-wrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>Max 8 Passengers</span>
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-500" />
                            <span>Max 8 Large Bags</span>
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                            Huge Trunk & Free Child Seats
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100">
                          <span className="text-[10px] text-slate-500">
                            Dual climate control · Extra legroom · Cruise port luggage capacity
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border border-amber-500'
                                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'Selected ✓' : 'Select'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column (lg:col-span-5): Confirmation Details & Trip Summary (Sticky) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border-2 border-amber-400 p-4 sm:p-5 shadow-lg space-y-4 sticky top-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 block">
                  Confirmation Details
                </span>
                <h3 className="font-display font-extrabold text-base text-slate-900">
                  Your Trip Summary
                </h3>
              </div>

              {/* Route Visual Line */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
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

              {/* Date, Pax, Luggage Pill Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Date & Time</span>
                  <span className="font-bold text-slate-800">{dateTime || 'Flexible'}</span>
                </div>
                {isRoundTrip && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Return Date</span>
                    <span className="font-bold text-slate-800">{returnDateTime || 'Flexible'}</span>
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
                    <span className="text-slate-400 block text-[10px]">Child Seats (Free)</span>
                    <span className="font-bold text-emerald-700">{getSeatDetailsText()}</span>
                  </div>
                )}
              </div>

              {/* Selected Vehicle & Price Breakdown Box */}
              <div className="bg-amber-50/80 border-2 border-amber-400/90 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Selected Vehicle
                    </span>
                    <span className="font-display font-extrabold text-sm text-slate-900">
                      {activeVehicleData.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-slate-950 font-display block">
                      €{finalQuotedPrice}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {isRoundTrip ? 'Round Trip Fare' : 'One Way Fixed'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 border-t border-amber-200/70 pt-1.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Highway Tolls & Airport Taxes:</span>
                    <span className="font-bold text-emerald-700">Included (€0)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Meet & Greet with Name Sign:</span>
                    <span className="font-bold text-emerald-700">Included (€0)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flight Delay Monitoring:</span>
                    <span className="font-bold text-emerald-700">Included (€0)</span>
                  </div>
                </div>
              </div>

              {/* Lead Passenger Name Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Lead Passenger Name (Arrival Signboard)
                </label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleBookWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#f5b301] hover:bg-[#e5a700] text-slate-950 font-extrabold text-sm sm:text-base shadow-md transition-all active:scale-[0.98] cursor-pointer border border-amber-500 font-display"
                >
                  <MessageCircle className="w-5 h-5 fill-slate-950" />
                  <span>Confirm Booking on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleViewVoucher}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Official Printable Voucher</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-1 text-center">
                <p className="flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pay driver directly in cash or card · 0 booking fee</span>
                </p>
                <p className="text-slate-400">
                  Free cancellation up to 24 hours before pickup
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

            {/* 1-Click Luggage Size Chart Modal */}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-200 overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close size chart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real Bags Visual Comparison Photo - Clean Only */}
            <div className="rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-md bg-white my-3">
              <img
                src="/images/luggage-guide.jpg"
                alt="Real luggage types: Backpack, Cabin 55cm, Medium 65cm, Large XXL 80cm"
                className="w-full h-auto object-cover max-h-72"
              />
              <div className="grid grid-cols-4 text-center py-2.5 bg-slate-900 text-white text-[11px] sm:text-xs font-bold divide-x divide-slate-800">
                <div className="px-1">
                  <span className="block text-amber-400">Backpack</span>
                  <span className="text-[9px] text-slate-300 font-normal">Personal Lap</span>
                </div>
                <div className="px-1">
                  <span className="block text-amber-400">55 cm</span>
                  <span className="text-[9px] text-slate-300 font-normal">Cabin / Hand</span>
                </div>
                <div className="px-1">
                  <span className="block text-amber-400">65 cm</span>
                  <span className="text-[9px] text-slate-300 font-normal">Medium Check-in</span>
                </div>
                <div className="px-1">
                  <span className="block text-amber-400">75–80 cm</span>
                  <span className="text-[9px] text-slate-300 font-normal">Large / XXL</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs border border-amber-500 shadow-xs cursor-pointer"
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
