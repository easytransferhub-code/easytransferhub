import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  ArrowRightLeft,
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
  const [largeBags, setLargeBags] = useState(0); // XXL / Large (75-80cm)
  const [mediumBags, setMediumBags] = useState(0); // Medium (65cm)
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
    (loc) => loc.id !== 'bcn_t1' && loc.id !== 'bcn_t2' && loc.id !== 'sitges' && loc.id !== 'montserrat' && loc.id !== 'girona'
  );

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

      <div className="p-5 sm:p-7 space-y-5">
        {/* Step 1: Pickup and Drop-off with Quick Chips */}
        <div className="space-y-4">
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

            {/* Quick Pick Chips for Pickup */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] font-bold text-slate-600 mr-1">Quick:</span>

              {/* Unified Airport Button */}
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPickupAirportTerminals((prev) => !prev)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isPickupAirport
                      ? 'bg-amber-400 border-2 border-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-slate-800 border border-amber-400/60 hover:border-amber-400 shadow-xs'
                  }`}
                  title="Click to select Airport Terminal 1 or Terminal 2"
                >
                  <Plane className="w-3.5 h-3.5 text-slate-900" />
                  <span>Airport</span>
                </button>

                {/* Sub-options for Terminal 1 and Terminal 2 */}
                {(showPickupAirportTerminals || isPickupAirport) && (
                  <div className="inline-flex items-center p-0.5 bg-amber-50 border-2 border-amber-400 rounded-lg gap-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const loc = QUICK_LOCATIONS.find((l) => l.id === 'bcn_t1');
                        if (loc) applyQuickLocation(loc, 'pickup');
                        setShowPickupAirportTerminals(true);
                      }}
                      className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        isPickupAirportT1
                          ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
                          : 'text-slate-700 hover:bg-amber-200/70 hover:text-slate-950 border border-transparent'
                      }`}
                    >
                      Terminal 1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const loc = QUICK_LOCATIONS.find((l) => l.id === 'bcn_t2');
                        if (loc) applyQuickLocation(loc, 'pickup');
                        setShowPickupAirportTerminals(true);
                      }}
                      className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        isPickupAirportT2
                          ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
                          : 'text-slate-700 hover:bg-amber-200/70 hover:text-slate-950 border border-transparent'
                      }`}
                    >
                      Terminal 2
                    </button>
                  </div>
                )}
              </div>

              {/* Other Quick Locations */}
              {otherQuickLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    applyQuickLocation(loc, 'pickup');
                    setShowPickupAirportTerminals(false);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
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

          {/* Swap Button Divider */}
          <div className="flex items-center justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className="p-1.5 rounded-full bg-white hover:bg-amber-100 hover:text-amber-700 text-slate-700 border-2 border-amber-400/70 transition-transform active:rotate-180 shadow-xs cursor-pointer"
              title="Swap pickup and drop-off"
              aria-label="Swap pickup and drop-off"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            </button>
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

            {/* Quick Pick Chips for Drop-off */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] font-bold text-slate-600 mr-1">Quick:</span>
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => applyQuickLocation(loc, 'dropoff')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
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

        {/* Date, Time, Flight & Sign Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.dateTimeLabel}</span>
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none shadow-xs transition-all"
            />
          </div>

          {isRoundTrip ? (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.returnDateLabel}</span>
              </label>
              <input
                type="datetime-local"
                value={returnDateTime}
                onChange={(e) => setReturnDateTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none shadow-xs transition-all"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Plane className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.flightLabel}</span>
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder={t.flightPlaceholder}
                className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none shadow-xs transition-all"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>Greeting Signboard Name</span>
            </label>
            <input
              type="text"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="Driver holds sign with this name at arrivals (e.g. John Smith)"
              className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border-2 border-amber-400/70 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 outline-none shadow-xs transition-all"
            />
          </div>
        </div>

        {/* 1-Row Compact Options: Passengers, Luggage, Child Seats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-200">
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

        {/* Vehicles Selection: Sedan & Comfort in 1 line (2 folders) + Minivan big card underneath */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
              Choose Vehicle Class
            </label>
            {totalPassengers >= 5 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                5+ passengers: Minivan selected
              </span>
            )}
            {checkInSuitcases >= 5 && totalPassengers < 5 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                5+ suitcases: Minivan trunk required
              </span>
            )}
          </div>

          {/* Row 1: Sedan & Comfort Cars in 1 line (2 folders) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Folder 1: Standard Sedan */}
            {(() => {
              const v = VEHICLES.find((item) => item.id === 'standard') || VEHICLES[0];
              const vQuote = quote?.vehicles.find((q) => q.vehicleId === v.id);
              const price = vQuote
                ? isRoundTrip
                  ? vQuote.roundTripTotal
                  : vQuote.totalPrice
                : 39;
              const isSelected = selectedVehicleId === 'standard';
              const isDisabled = totalPassengers > 4 || checkInSuitcases > 3;

              return (
                <div
                  key="standard"
                  onClick={() => {
                    if (!isDisabled) setSelectedVehicleId('standard');
                  }}
                  className={`relative p-2.5 rounded-xl border-2 transition-all ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                      : isSelected
                      ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400 cursor-pointer'
                      : 'border-amber-400/60 hover:border-amber-400 bg-white hover:shadow-xs cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {v.name}
                    </span>
                    {priceRevealed && (
                      <span className="font-extrabold text-xs sm:text-sm text-slate-950 font-display shrink-0 ml-1">
                        €{price}
                      </span>
                    )}
                  </div>

                  <div className="w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-slate-100 mb-1.5 relative border border-amber-400/40">
                    <img
                      src={v.photos[0]}
                      alt={v.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                    <span>Max 4 Pax</span>
                    <span>·</span>
                    <span>Max 3 Bags</span>
                  </div>
                </div>
              );
            })()}

            {/* Folder 2: Comfort Executive */}
            {(() => {
              const v = VEHICLES.find((item) => item.id === 'comfort') || VEHICLES[1];
              const vQuote = quote?.vehicles.find((q) => q.vehicleId === v.id);
              const price = vQuote
                ? isRoundTrip
                  ? vQuote.roundTripTotal
                  : vQuote.totalPrice
                : 47;
              const isSelected = selectedVehicleId === 'comfort';
              const isDisabled = totalPassengers > 4 || checkInSuitcases > 4;

              return (
                <div
                  key="comfort"
                  onClick={() => {
                    if (!isDisabled) setSelectedVehicleId('comfort');
                  }}
                  className={`relative p-2.5 rounded-xl border-2 transition-all ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                      : isSelected
                      ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400 cursor-pointer'
                      : 'border-amber-400/60 hover:border-amber-400 bg-white hover:shadow-xs cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {v.name}
                    </span>
                    {priceRevealed && (
                      <span className="font-extrabold text-xs sm:text-sm text-slate-950 font-display shrink-0 ml-1">
                        €{price}
                      </span>
                    )}
                  </div>

                  <div className="w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-slate-100 mb-1.5 relative border border-amber-400/40">
                    <img
                      src={v.photos[0]}
                      alt={v.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                    <span>Max 4 Pax</span>
                    <span>·</span>
                    <span>Max 4 Bags</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Row 2: Minivan - Un k niche minivan wese hi aae bari (Full-width wide card) */}
          {(() => {
            const v = VEHICLES.find((item) => item.id === 'minivan') || VEHICLES[2];
            const vQuote = quote?.vehicles.find((q) => q.vehicleId === v.id);
            const price = vQuote
              ? isRoundTrip
                ? vQuote.roundTripTotal
                : vQuote.totalPrice
              : 59;
            const isSelected = selectedVehicleId === 'minivan';
            const isRecommended = totalPassengers >= 5 || checkInSuitcases >= 5;

            return (
              <div
                key="minivan"
                onClick={() => setSelectedVehicleId('minivan')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400'
                    : 'border-amber-400/60 hover:border-amber-400 bg-white hover:shadow-xs'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-2 right-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider shadow-xs border border-amber-500">
                    Recommended for your group
                  </span>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-full sm:w-40 h-20 sm:h-22 rounded-lg overflow-hidden bg-slate-100 relative border border-amber-400/40 shrink-0">
                    <img
                      src={v.photos[0]}
                      alt={v.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-extrabold text-slate-900 text-sm sm:text-base">
                        {v.name} (8-Seater Van)
                      </span>
                      {priceRevealed && (
                        <span className="font-extrabold text-sm sm:text-base text-slate-950 font-display shrink-0 ml-2">
                          €{price}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mb-1.5 leading-snug">
                      Spacious luxury van for families, groups, ski gear, cruise port luggage & child seats.
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-700 font-semibold flex-wrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">Max 8 Passengers</span>
                      <span>·</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">Max 8 Large Bags</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-bold">Huge Trunk & Extra Legroom</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Booking Action Buttons - DIRECTLY BELOW VEHICLE & CHILD SEATS */}
        <div className="pt-2 border-t border-slate-200 space-y-2.5">
          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <span>⚠️ {validationError}</span>
            </div>
          )}

          {/* Price Revealed Highlight Card (Appears as soon as client clicks booking button) */}
          {priceRevealed && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-white border-2 border-amber-400/90 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Guaranteed Fixed Fare ({isRoundTrip ? 'Round Trip' : 'One Way'})
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-display">
                    €{finalQuotedPrice}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {activeVehicleData.name} · All highway tolls & parking included
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Cancellation Fee up to 24h</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleBookWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#f5b301] hover:bg-[#e5a700] text-slate-950 font-extrabold text-sm sm:text-base shadow-md transition-all active:scale-[0.98] cursor-pointer border border-amber-500"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>
                {priceRevealed
                  ? `Book on WhatsApp (€${finalQuotedPrice})`
                  : 'Book on WhatsApp (Click to see Price & Reserve)'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleViewVoucher}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base border border-slate-800 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{t.viewSummary}</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-2 flex-wrap">
            <span>✓ Fixed Price Guarantee</span>
            <span>·</span>
            <span>✓ Pay Cash or Card to Chauffeur</span>
            <span>·</span>
            <span>✓ Free Cancellation up to 24h</span>
          </p>
        </div>
      </div>

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

            {/* Real Bags Visual Comparison Photo */}
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white my-3">
              <img
                src="/images/luggage-guide.jpg"
                alt="Real luggage types: Backpack, Cabin 55cm, Medium 65cm, Large XXL 80cm"
                className="w-full h-auto object-cover max-h-56"
              />
              <div className="grid grid-cols-4 text-center py-2 bg-slate-900 text-white text-[10px] sm:text-xs font-bold divide-x divide-slate-800">
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

            {/* Bag Types List */}
            <div className="space-y-2 py-2 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sm font-bold text-[#0e5c73] shrink-0">
                  🎒
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Shoulder Bag / Backpack</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Personal Item</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Fits on passenger lap or footwell. Handbag, laptop bag, small school bag. Does not occupy trunk space.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-800 shrink-0">
                  🧳
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Hand Carry / Cabin Bag (Small)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">~55 × 40 × 20 cm</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Up to 10 kg. Standard airline cabin trolley. Fits easily in Sedan trunk or above.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-800 shrink-0">
                  🧳
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Medium Suitcase</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">~65 × 45 × 26 cm</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Standard check-in (15–20 kg). Fits up to 3 bags in Sedan trunk, or 4 in Comfort estate wagon.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-800 shrink-0">
                  🧳
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Large / XXL Suitcase</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900 font-bold">~75–82 × 52 × 32 cm</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Long-haul heavy check-in (23–32 kg). Takes substantial trunk space.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Vehicle Capacity Matrix */}
            <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Vehicle Trunk Capacity Rule:</span>
              <ul className="space-y-0.5 list-disc list-inside">
                <li><b>Sedan</b>: Up to 4 passengers & max 3 suitcases.</li>
                <li><b>Comfort (Ford Mondeo / Skoda Superb)</b>: 4 passengers & 4 suitcases.</li>
                <li><b>Minivan (Mercedes / Caravelle)</b>: 5 to 8 passengers & 6 to 8 suitcases.</li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
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
