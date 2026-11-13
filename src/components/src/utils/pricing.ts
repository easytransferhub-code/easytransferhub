import { POPULAR_ROUTES, DISTANCE_TIERS, VEHICLES, BUSINESS_INFO } from '../data/transferData';

export interface LocationPoint {
  label: string;
  lat: number;
  lon: number;
}

export interface QuoteResult {
  distanceKm: number;
  durationText: string;
  isFixedPopularRoute: boolean;
  routeName?: string;
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
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
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

// Compute prices based on distance and route match
export function calculateQuote(
  pickup: string,
  dropoff: string,
  distanceKm: number,
  durationMinutes: number,
  passengers: number,
  luggage: number,
  childSeats: number,
  isRoundTrip: boolean
): QuoteResult {
  const fixedRoute = findFixedRoute(pickup, dropoff);
  const durationText =
    durationMinutes >= 90
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
      : `${Math.round(durationMinutes)} mins`;

  const childFeePerSeat = 5;
  const childSeatCost = childSeats * childFeePerSeat;

  const vehicleQuotes = VEHICLES.map((v) => {
    let basePrice = 39;

    if (fixedRoute) {
      if (v.id === 'standard') basePrice = fixedRoute.prices.standard;
      else if (v.id === 'comfort') basePrice = fixedRoute.prices.comfort;
      else basePrice = fixedRoute.prices.van;
    } else {
      // Find tier
      const tier =
        DISTANCE_TIERS.find((t) => distanceKm <= t.maxKm) ||
        DISTANCE_TIERS[DISTANCE_TIERS.length - 1];

      if (v.id === 'standard') basePrice = tier.prices.standard;
      else if (v.id === 'comfort') basePrice = tier.prices.comfort;
      else basePrice = tier.prices.van;
    }

    const oneWayTotal = basePrice + childSeatCost;
    // 5% discount on round trip return leg
    const roundTripTotal = isRoundTrip
      ? Math.round(oneWayTotal * 1.95)
      : oneWayTotal;

    // Recommended logic:
    // If passengers > 4 or luggage > 4 -> Minivan
    // If passengers <= 4 and luggage <= 3 -> Standard or Comfort
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
    isFixedPopularRoute: !!fixedRoute,
    routeName: fixedRoute?.name,
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
    lines.push(`👤 *Passenger Name (Greeting Sign):* ${details.passengerName}`);
  }

  const paxText = details.adults !== undefined && details.children !== undefined
    ? `${details.passengers} total (${details.adults} Adults${details.children > 0 ? `, ${details.children} Child${details.childAge ? ` [${details.childAge}]` : ''}` : ''})`
    : `${details.passengers}`;

  lines.push(`👥 *Passengers:* ${paxText}`);

  if (details.luggageDetails) {
    lines.push(`🧳 *Luggage:* ${details.luggage} bags (${details.luggageDetails})`);
  } else {
    lines.push(`🧳 *Luggage:* ${details.luggage} bags`);
  }

  if (details.childSeats > 0 && details.childSeatsDetails) {
    lines.push(`👶 *Child Safety Seats:* ${details.childSeats} (${details.childSeatsDetails})`);
  } else if (details.childSeats > 0) {
    lines.push(`👶 *Child / Baby Seats:* ${details.childSeats}`);
  }

  lines.push(
    `🚗 *Vehicle:* ${details.vehicleName}`,
    `💰 *Quoted Price:* €${details.quotedPrice} ${details.isRoundTrip ? '(Round Trip)' : '(One Way)'}`
  );

  if (details.distanceKm) {
    lines.push(`📏 *Approx Distance:* ~${details.distanceKm} km`);
  }

  lines.push(
    ``,
    `Please confirm driver availability. Thank you!`
  );

  const message = lines.join('\n');
  return `https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
