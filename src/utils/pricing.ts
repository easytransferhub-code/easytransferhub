import {
  BARCELONA_ZONES,
  BarcelonaZone,
  BUSINESS_INFO,
  CHILD_SEAT_PRICE_EUR,
  DISTANCE_TIERS,
  POPULAR_ROUTES,
  VEHICLES,
} from '../data/transferData';

export interface LocationPoint {
  label: string;
  lat: number;
  lon: number;
}

export interface ZoneMatchInfo {
  zoneNumber: number;
  district: string;
  mainAreas: string[];
  tierGroup: '1-6' | '7-10';
  matchedBy: 'keyword' | 'postal' | 'boundary' | 'city-default';
}

export interface QuoteResult {
  distanceKm: number;
  durationText: string;
  isFixedPopularRoute: boolean;
  routeName?: string;
  matchedZone?: ZoneMatchInfo;
  vehicles: {
    vehicleId: string;
    vehicleName: string;
    basePrice: number;
    childSeatFee: number;
    totalPrice: number;
    roundTripTotal: number;
    isRecommended: boolean;
  }[];
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`]/g, "'")
    .trim();
}

// Point-in-polygon ray casting for district boundary matching
function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function squaredDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return dLat * dLat + dLng * dLng;
}

export function isBarcelonaAirportLocation(
  text: string,
  coords?: { lat: number; lon: number } | null
): boolean {
  const norm = normalizeText(text);
  const airportKeywords = [
    'airport',
    'aeroport',
    'aeropuerto',
    'el prat',
    'bcn',
    'terminal 1',
    'terminal 2',
    't1',
    't2',
    '08820',
  ];
  if (airportKeywords.some((kw) => norm.includes(kw))) {
    // Make sure "bcn" alone isn't confused with an external city when text explicitly names outside destination without airport words
    if (
      norm.includes('airport') ||
      norm.includes('aeroport') ||
      norm.includes('aeropuerto') ||
      norm.includes('el prat') ||
      norm.includes('terminal 1') ||
      norm.includes('terminal 2') ||
      /\bbcn\b/.test(norm) ||
      norm.includes('08820')
    ) {
      return true;
    }
  }

  if (coords) {
    // Josep Tarradellas Barcelona-El Prat Airport approximate area (~41.2974, 2.0833)
    const distFromAirportKm =
      Math.sqrt(squaredDist(coords.lat, coords.lon, 41.2974, 2.0833)) * 111;
    if (distFromAirportKm <= 4.0) return true;
  }

  return false;
}

const OUTSIDE_BARCELONA_CITY_KEYWORDS = [
  'sitges',
  'montserrat',
  'salou',
  'portaventura',
  'cambrils',
  'tarragona',
  'girona',
  'costa brava',
  'lloret',
  'platja d\'aro',
  'andorra',
  'valencia',
  'madrid',
  'zaragoza',
  'castelldefels',
  'gava',
  'viladecans',
  'badalona',
  'santa coloma',
  'hospitalet',
  'cornella',
  'esplugues',
  'sant cugat',
  'sabadell',
  'terrassa',
  'mataro',
  'blanes',
  'toss',
  'figueres',
  'reus',
];

export function detectBarcelonaZone(
  text: string,
  coords?: { lat: number; lon: number } | null
): { zone: BarcelonaZone; matchedBy: 'keyword' | 'postal' | 'boundary' | 'city-default' } | null {
  const norm = normalizeText(text);
  if (!norm && !coords) return null;

  // Do not classify Airport itself or out-of-city towns as a Barcelona city zone
  if (isBarcelonaAirportLocation(text, coords)) return null;
  if (OUTSIDE_BARCELONA_CITY_KEYWORDS.some((kw) => norm.includes(kw))) {
    return null;
  }

  // 1. Check explicit postal code (08001 - 08042)
  const postalMatch = norm.match(/\b(080\d{2})\b/);
  if (postalMatch) {
    const postal = postalMatch[1];
    const byPostal = BARCELONA_ZONES.find((z) => z.postalCodes.includes(postal));
    if (byPostal) return { zone: byPostal, matchedBy: 'postal' };
  }

  // 2. Check district & area keywords (prefer longest/most specific keyword match)
  let bestKeywordZone: BarcelonaZone | null = null;
  let bestKeywordLen = 0;
  for (const z of BARCELONA_ZONES) {
    for (const kw of z.keywords) {
      const kwNorm = normalizeText(kw);
      if (norm.includes(kwNorm) && kwNorm.length > bestKeywordLen) {
        bestKeywordZone = z;
        bestKeywordLen = kwNorm.length;
      }
    }
  }
  if (bestKeywordZone) {
    return { zone: bestKeywordZone, matchedBy: 'keyword' };
  }

  // 3. Coordinate boundary matching inside Barcelona municipality
  if (coords) {
    const { lat, lon } = coords;
    // Municipality rough envelope: lat [41.320..41.468], lng [2.085..2.232]
    if (lat >= 41.32 && lat <= 41.468 && lon >= 2.085 && lon <= 2.232) {
      for (const z of BARCELONA_ZONES) {
        if (isPointInPolygon(lat, lon, z.boundary)) {
          return { zone: z, matchedBy: 'boundary' };
        }
      }

      // Nearest district boundary centroid within ~3.5 km
      let nearestZone: BarcelonaZone | null = null;
      let nearestSq = Infinity;
      for (const z of BARCELONA_ZONES) {
        const d = squaredDist(lat, lon, z.center.lat, z.center.lng);
        if (d < nearestSq) {
          nearestSq = d;
          nearestZone = z;
        }
      }
      if (nearestZone && Math.sqrt(nearestSq) * 111 <= 4.0) {
        return { zone: nearestZone, matchedBy: 'boundary' };
      }
    }
  }

  // 4. Generic "Barcelona City Center / Barcelona" mention without specific district
  if (
    norm.includes('barcelona') ||
    norm.includes('city center') ||
    norm.includes('city centre') ||
    norm.includes('hotel')
  ) {
    // Zone 2 Eixample / Plaza Catalunya default (Zones 1-6: €50 / €60 / €70)
    return { zone: BARCELONA_ZONES[1], matchedBy: 'city-default' };
  }

  return null;
}

// Fallback Haversine road distance calculation
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;
  // Road curvature factor in Spain ~ 1.28x
  return Math.max(5, Math.round(directDistance * 1.28));
}

// Check if textual search matches keywords
function matchKeywords(text: string, keywords: string[]): boolean {
  const lower = normalizeText(text);
  return keywords.some((kw) => lower.includes(normalizeText(kw)));
}

// Find fixed route if matches
export function findFixedRoute(pickup: string, dropoff: string) {
  for (const route of POPULAR_ROUTES) {
    const forward =
      matchKeywords(pickup, route.pickupKeywords) && matchKeywords(dropoff, route.dropoffKeywords);
    const reverse =
      matchKeywords(dropoff, route.pickupKeywords) && matchKeywords(pickup, route.dropoffKeywords);
    if (forward || reverse) {
      return route;
    }
  }
  return null;
}

// Compute prices based on Barcelona 10-Zone rules, fixed routes, distance tiers, and +€5 child seat fee
export function calculateQuote(
  pickup: string,
  dropoff: string,
  distanceKm: number,
  durationMinutes: number,
  passengers: number,
  luggage: number,
  childSeats: number,
  isRoundTrip: boolean,
  pickupCoords?: { lat: number; lon: number } | null,
  dropoffCoords?: { lat: number; lon: number } | null
): QuoteResult {
  const durationText =
    durationMinutes >= 90
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
      : `${Math.round(durationMinutes)} mins`;

  const childSeatCost = Math.max(0, childSeats) * CHILD_SEAT_PRICE_EUR;

  const pAirport = isBarcelonaAirportLocation(pickup, pickupCoords);
  const dAirport = isBarcelonaAirportLocation(dropoff, dropoffCoords);
  const pZone = detectBarcelonaZone(pickup, pickupCoords);
  const dZone = detectBarcelonaZone(dropoff, dropoffCoords);

  // Rule 1: Barcelona Airport <-> Any Barcelona Zone (1-10), bidirectional, all supplements included
  let matchedZone: ZoneMatchInfo | undefined;
  let zonePrices: { standard: number; comfort: number; van: number } | null = null;
  let zoneRouteName: string | undefined;

  if ((pAirport && dZone) || (dAirport && pZone)) {
    const active = pAirport ? dZone! : pZone!;
    zonePrices = active.zone.prices;
    matchedZone = {
      zoneNumber: active.zone.zone,
      district: active.zone.district,
      mainAreas: active.zone.mainAreas,
      tierGroup: active.zone.tierGroup,
      matchedBy: active.matchedBy,
    };
    zoneRouteName = `Airport (BCN) ↔ Zone ${active.zone.zone}: ${active.zone.district}`;
  } else if (pZone && dZone) {
    // Intra-city transfer across Barcelona zones uses higher zone tier (1-6 => 50/60/70, 7-10 => 60/70/80)
    const higherZone =
      pZone.zone.tierGroup === '7-10' ? pZone : dZone.zone.tierGroup === '7-10' ? dZone : dZone;
    zonePrices = higherZone.zone.prices;
    matchedZone = {
      zoneNumber: higherZone.zone.zone,
      district: higherZone.zone.district,
      mainAreas: higherZone.zone.mainAreas,
      tierGroup: higherZone.zone.tierGroup,
      matchedBy: higherZone.matchedBy,
    };
    zoneRouteName = `Barcelona City · Zone ${pZone.zone.zone} ↔ Zone ${dZone.zone.zone}`;
  }

  const fixedRoute = zonePrices ? null : findFixedRoute(pickup, dropoff);

  const vehicleQuotes = VEHICLES.map((v) => {
    let basePrice = 50;

    if (zonePrices) {
      if (v.id === 'standard') basePrice = zonePrices.standard;
      else if (v.id === 'comfort') basePrice = zonePrices.comfort;
      else basePrice = zonePrices.van;
    } else if (fixedRoute) {
      if (v.id === 'standard') basePrice = fixedRoute.prices.standard;
      else if (v.id === 'comfort') basePrice = fixedRoute.prices.comfort;
      else basePrice = fixedRoute.prices.van;
    } else {
      const tier =
        DISTANCE_TIERS.find((t) => distanceKm <= t.maxKm) ||
        DISTANCE_TIERS[DISTANCE_TIERS.length - 1];

      if (v.id === 'standard') basePrice = tier.prices.standard;
      else if (v.id === 'comfort') basePrice = tier.prices.comfort;
      else basePrice = tier.prices.van;
    }

    const oneWayTotal = basePrice + childSeatCost;
    // 5% discount on round trip
    const roundTripTotal = isRoundTrip ? Math.round(oneWayTotal * 1.95) : oneWayTotal;

    let isRecommended = false;
    if (passengers > 4 || luggage > 4) {
      isRecommended = v.id === 'van';
    } else if (v.id === 'standard') {
      isRecommended = true;
    }

    return {
      vehicleId: v.id,
      vehicleName: v.name,
      basePrice,
      childSeatFee: childSeatCost,
      totalPrice: oneWayTotal,
      roundTripTotal,
      isRecommended,
    };
  });

  return {
    distanceKm: Math.round(distanceKm),
    durationText: fixedRoute?.duration || durationText,
    isFixedPopularRoute: !!(zonePrices || fixedRoute),
    routeName: zoneRouteName || fixedRoute?.name,
    matchedZone,
    vehicles: vehicleQuotes,
  };
}

export function generateWhatsAppLink(details: {
  pickup: string;
  dropoff: string;
  dateTime: string;
  isRoundTrip: boolean;
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
  passengerName?: string;
  email?: string;
  phone?: string;
  paymentMethod?: string;
  driverNotes?: string;
  distanceKm?: number;
}): string {
  const lines = [
    `*Hello ${BUSINESS_INFO.name} / Mr. Mir,*`,
    `I would like to book a private transfer:`,
    ``,
    `📍 *Pickup:* ${details.pickup}`,
    `🏁 *Drop-off:* ${details.dropoff}`,
    `📅 *Date & Time:* ${details.dateTime || 'To be confirmed'}`,
  ];

  if (details.isRoundTrip && details.returnDateTime) {
    lines.push(`🔄 *Return Date & Time:* ${details.returnDateTime}`);
  }

  if (details.flightNumber) {
    lines.push(`✈️ *Flight Number:* ${details.flightNumber}`);
  }

  if (details.passengerName) {
    lines.push(`👤 *Client Name (Signboard):* ${details.passengerName}`);
  }

  if (details.phone) {
    lines.push(`📞 *Phone / WhatsApp:* ${details.phone}`);
  }

  if (details.email) {
    lines.push(`📧 *Email:* ${details.email}`);
  }

  const paxText =
    details.adults !== undefined && details.children !== undefined
      ? `${details.passengers} total (${details.adults} Adults${
          details.children > 0
            ? `, ${details.children} Child${details.childAge ? ` [${details.childAge}]` : ''}`
            : ''
        })`
      : `${details.passengers}`;

  lines.push(`👥 *Passengers:* ${paxText}`);

  if (details.luggageDetails) {
    lines.push(`🧳 *Luggage:* ${details.luggage} bags (${details.luggageDetails})`);
  } else {
    lines.push(`🧳 *Luggage:* ${details.luggage} bags`);
  }

  if (details.childSeats > 0) {
    const seatExtra = details.childSeats * CHILD_SEAT_PRICE_EUR;
    lines.push(
      `👶 *Child Safety Seats:* ${details.childSeats} (+€${seatExtra}${
        details.childSeatsDetails ? ` · ${details.childSeatsDetails}` : ''
      })`
    );
  }

  lines.push(
    `🚗 *Vehicle:* ${details.vehicleName}`,
    `💰 *Quoted Price:* €${details.quotedPrice} ${details.isRoundTrip ? '(Round Trip)' : '(One Way)'}`
  );

  if (details.paymentMethod) {
    lines.push(`💳 *Preferred Payment:* ${details.paymentMethod}`);
  }

  if (details.driverNotes) {
    lines.push(`📝 *Driver Notes:* ${details.driverNotes}`);
  }

  if (details.distanceKm) {
    lines.push(`📏 *Approx Distance:* ~${details.distanceKm} km`);
  }

  lines.push(``, `Please confirm driver availability. Thank you!`);

  const message = lines.join('\n');
  return `https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
