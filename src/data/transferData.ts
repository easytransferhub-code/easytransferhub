export interface Vehicle {
  id: string;
  name: string;
  category: string;
  seats: string;
  maxPassengers: number;
  maxLuggage: number;
  description: string;
  photos: string[];
  features: string[];
}

export interface FixedRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  duration: string;
  distanceKm: number;
  prices: {
    standard: number;
    comfort: number;
    van: number;
  };
  pickupKeywords: string[];
  dropoffKeywords: string[];
  highlight?: boolean;
}

export interface QuickLocation {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  address: string;
  lat: number;
  lon: number;
}

export const BUSINESS_INFO = {
  name: "Easytransferhub",
  owner: "Mr. Mir",
  phoneDisplay: "+34 663 958 889",
  whatsappNumber: "34663958889",
  email: "easytransferhub@gmail.com",
  city: "Barcelona, Spain",
  address: "Barcelona, Catalonia, Spain",
  serviceArea: "Barcelona, Catalonia & all regions across Spain, Andorra & Southern France",
  operatingHours: "24 Hours / 7 Days a Week",
};

export const QUICK_LOCATIONS: QuickLocation[] = [
  {
    id: "bcn_t1",
    name: "Barcelona Airport (BCN) - Terminal 1",
    shortLabel: "Airport T1",
    icon: "Plane",
    address: "Barcelona Airport (BCN) Terminal 1, El Prat de Llobregat, Spain",
    lat: 41.2882,
    lon: 2.0734,
  },
  {
    id: "bcn_t2",
    name: "Barcelona Airport (BCN) - Terminal 2",
    shortLabel: "Airport T2",
    icon: "Plane",
    address: "Barcelona Airport (BCN) Terminal 2, El Prat de Llobregat, Spain",
    lat: 41.3032,
    lon: 2.0745,
  },
  {
    id: "port",
    name: "Barcelona Cruise Port (Port de Barcelona)",
    shortLabel: "Cruise Port",
    icon: "Anchor",
    address: "Port de Barcelona Cruise Terminal, Moll Adossat, Barcelona, Spain",
    lat: 41.3545,
    lon: 2.1667,
  },
  {
    id: "sants",
    name: "Barcelona Sants Train Station",
    shortLabel: "Sants Station",
    icon: "Train",
    address: "Estació de Barcelona Sants, Plaça dels Països Catalans, Barcelona, Spain",
    lat: 41.3791,
    lon: 2.1401,
  },
  {
    id: "city",
    name: "Barcelona City Centre (Plaza Catalunya)",
    shortLabel: "City Center",
    icon: "Building2",
    address: "Plaça de Catalunya, 08002 Barcelona, Spain",
    lat: 41.3870,
    lon: 2.1700,
  },
 
 

];

export const VEHICLES: Vehicle[] = [
  {
    id: "standard",
    name: "Standard Sedan",
    category: "Sedan / Saloon",
    seats: "1–4 Passengers",
    maxPassengers: 4,
    maxLuggage: 3,
    description: "Comfortable modern sedan with ample boot space. Ideal for solo travelers, couples, or small families arriving in Barcelona.",
    photos: ["/images/standard.jpg"],
    features: [
      "Up to 4 passengers",
      "Up to 3 standard suitcases (65cm)",
      "Air conditioning & climate control",
      "Complimentary bottled water",
      "Mobile phone charging cables",
      "Flight delay tracking",
    ],
  },
  {
    id: "comfort",
    name: "Comfort Executive",
    category: "Executive Chauffeur",
    seats: "1–4 Passengers",
    maxPassengers: 4,
    maxLuggage: 4,
    description: "High-spec executive vehicle (Mercedes-Benz E-Class or equivalent) with leather seating, generous rear legroom, and premium sound.",
    photos: ["/images/comfort.png"],
    features: [
      "Up to 4 passengers",
      "Up to 4 standard suitcases",
      "Generous executive legroom",
      "Quiet luxury leather cabin",
      "Complimentary high-speed Wi-Fi",
      "Meet & Greet with personalized signboard",
    ],
  },
  {
    id: "van",
    name: "Minivan / Passenger Van",
    category: "Spacious Multi-Van",
    seats: "5–8 Passengers",
    maxPassengers: 8,
    maxLuggage: 8,
    description: "Spacious Mercedes-Benz V-Class / Vito or equivalent minivan. Perfect for larger families, cruise passengers, sports gear, and groups.",
    photos: ["/images/minivan.jpg", "/images/ford.jpg"],
    features: [
      "Up to 8 passengers comfortably",
      "Huge luggage capacity (up to 8 large bags)",
      "Child & baby safety seats on request",
      "Dual rear climate zones",
      "Extra room for golf bags, strollers, surfboards",
      "Ideal for cruise terminal transfers",
    ],
  },
];

export const POPULAR_ROUTES: FixedRoute[] = [
  {
    id: "bcn-city",
    name: "Barcelona Airport ↔ City Center",
    from: "Barcelona Airport (BCN T1/T2)",
    to: "Barcelona City Center / Hotels",
    duration: "25–35 min",
    distanceKm: 18,
    prices: { standard: 39, comfort: 47, van: 59 },
    pickupKeywords: ["airport", "bcn", "el prat", "aeropuerto"],
    dropoffKeywords: ["city", "barcelona", "centre", "catalunya", "hotel"],
    highlight: true,
  },
  {
    id: "bcn-port",
    name: "Barcelona Airport ↔ Cruise Port",
    from: "Barcelona Airport (BCN)",
    to: "Barcelona Cruise Port (Moll Adossat)",
    duration: "20–30 min",
    distanceKm: 16,
    prices: { standard: 43, comfort: 52, van: 65 },
    pickupKeywords: ["airport", "bcn", "el prat"],
    dropoffKeywords: ["cruise", "port", "moll adossat", "puerto"],
    highlight: true,
  },
  {
    id: "city-sitges",
    name: "Barcelona ↔ Sitges",
    from: "Barcelona / BCN Airport",
    to: "Sitges Coastal Resort",
    duration: "35–45 min",
    distanceKm: 38,
    prices: { standard: 74, comfort: 89, van: 112 },
    pickupKeywords: ["barcelona", "bcn", "airport"],
    dropoffKeywords: ["sitges"],
    highlight: true,
  },
  {
    id: "bcn-montserrat",
    name: "Barcelona ↔ Montserrat",
    from: "Barcelona City / Airport",
    to: "Montserrat Royal Monastery",
    duration: "55–65 min",
    distanceKm: 62,
    prices: { standard: 89, comfort: 105, van: 130 },
    pickupKeywords: ["barcelona", "bcn"],
    dropoffKeywords: ["montserrat"],
  },
  {
    id: "bcn-salou",
    name: "Barcelona ↔ Salou / PortAventura",
    from: "Barcelona / BCN Airport",
    to: "Salou / PortAventura Theme Park",
    duration: "1h 15 min",
    distanceKm: 108,
    prices: { standard: 164, comfort: 197, van: 246 },
    pickupKeywords: ["barcelona", "bcn"],
    dropoffKeywords: ["salou", "portaventura", "cambrils"],
  },
  {
    id: "bcn-tarragona",
    name: "Barcelona ↔ Tarragona",
    from: "Barcelona / BCN Airport",
    to: "Tarragona Roman City",
    duration: "1h 10 min",
    distanceKm: 98,
    prices: { standard: 164, comfort: 197, van: 246 },
    pickupKeywords: ["barcelona", "bcn"],
    dropoffKeywords: ["tarragona"],
  },
  {
    id: "bcn-girona",
    name: "Barcelona ↔ Girona / Costa Brava",
    from: "Barcelona / BCN Airport",
    to: "Girona Old Town / Costa Brava",
    duration: "1h 20 min",
    distanceKm: 104,
    prices: { standard: 189, comfort: 227, van: 284 },
    pickupKeywords: ["barcelona", "bcn"],
    dropoffKeywords: ["girona", "costa brava", "lloret de mar", "platja d'aro"],
  },
  {
    id: "bcn-andorra",
    name: "Barcelona ↔ Andorra",
    from: "Barcelona / BCN Airport",
    to: "Andorra la Vella / Grandvalira",
    duration: "2h 45 min",
    distanceKm: 200,
    prices: { standard: 284, comfort: 341, van: 426 },
    pickupKeywords: ["barcelona", "bcn"],
    dropoffKeywords: ["andorra", "pas de la casa", "soldeu"],
  },
  {
    id: "bcn-valencia",
    name: "Barcelona ↔ Valencia",
    from: "Barcelona",
    to: "Valencia City",
    duration: "3h 45 min",
    distanceKm: 350,
    prices: { standard: 399, comfort: 479, van: 599 },
    pickupKeywords: ["barcelona"],
    dropoffKeywords: ["valencia"],
  },
  {
    id: "bcn-madrid",
    name: "Barcelona ↔ Madrid",
    from: "Barcelona",
    to: "Madrid City Center / Barajas",
    duration: "6h 00 min",
    distanceKm: 620,
    prices: { standard: 650, comfort: 780, van: 975 },
    pickupKeywords: ["barcelona"],
    dropoffKeywords: ["madrid"],
  },
];

export const DISTANCE_TIERS = [
  { maxKm: 25, label: "Up to 25 km", prices: { standard: 39, comfort: 47, van: 59 } },
  { maxKm: 60, label: "26 – 60 km", prices: { standard: 74, comfort: 89, van: 112 } },
  { maxKm: 130, label: "61 – 130 km", prices: { standard: 164, comfort: 197, van: 246 } },
  { maxKm: 220, label: "131 – 220 km", prices: { standard: 284, comfort: 341, van: 426 } },
  { maxKm: 380, label: "221 – 380 km", prices: { standard: 399, comfort: 479, van: 599 } },
  { maxKm: 99999, label: "Over 380 km", prices: { standard: 650, comfort: 780, van: 975 } },
];

export const FAQS = [
  {
    question: "What happens if my flight to Barcelona is delayed?",
    answer: "We continuously track your flight using live flight radar. If your arrival is delayed or lands early, your chauffeur automatically adjusts the schedule. 60 minutes of complimentary waiting time after actual landing is included with every airport pickup.",
  },
  {
    question: "Where will I meet my driver at Barcelona Airport?",
    answer: "Your driver will be waiting in the arrival hall right after baggage claim holding a personalized signboard with your name or company. You will also receive the driver's direct mobile and WhatsApp number prior to arrival.",
  },
  {
    question: "Is the price fixed or will there be extra fees for traffic/tolls?",
    answer: "Our prices are 100% fixed and all-inclusive. All highway motorway tolls (autopistas), airport parking surcharges, and luggage handling are already included. You will never pay more than the quoted fare.",
  },
  {
    question: "How and when do I pay for my transfer?",
    answer: "You can pay comfortably in cash (Euros) directly to the chauffeur upon arrival at your destination, or pay securely by credit/debit card (Visa, Mastercard, Amex). Online payment can also be arranged in advance.",
  },
  {
    question: "Do you supply child safety and baby seats?",
    answer: "Yes, certified baby seats (Group 0+), toddler seats (Group 1), and booster seats (Group 2/3) are available upon request. Please specify the number of children and their approximate ages when booking.",
  },
  {
    question: "Can I cancel or modify my reservation for free?",
    answer: "Yes, you can cancel or amend your transfer for free up to 24 hours before your scheduled pickup time with no penalty. Just message us on WhatsApp.",
  },
  {
    question: "Do you provide transfers to cruise ships and cruise terminals?",
    answer: "Absolutely! We provide direct door-to-door transfers to all Barcelona Cruise Terminals at Moll Adossat (Terminals A, B, C, D, E and World Trade Center). Drivers drop you right next to your ship's baggage drop.",
  },
];

export const TRANSLATIONS = {
  en: {
    navHow: "How It Works",
    navPrices: "Pricing",
    navFleet: "Vehicles",
    navRoutes: "Popular Routes",
    navFaq: "FAQ",
    navContact: "Contact",
    heroTitle: "Private transfers from Barcelona to anywhere in Spain",
    heroSubtitle: "Airport pickups, cruise port connections, and long-distance chauffeur rides. 100% fixed prices, flight tracking, and 24/7 personalized WhatsApp service.",
    calcTitle: "Calculate Price & Book Instantly",
    pickupLabel: "Pickup Location",
    pickupPlaceholder: "e.g. Barcelona Airport T1 or Hotel name",
    dropoffLabel: "Drop-off Location",
    dropoffPlaceholder: "e.g. Sitges, Montserrat, Hotel address",
    dateTimeLabel: "Pickup Date & Time",
    flightLabel: "Flight Number (Optional for airport pickup)",
    flightPlaceholder: "e.g. VY6102, BA478",
    passengersLabel: "Passengers",
    luggageLabel: "Luggage (Suitcases)",
    childSeatsLabel: "Child / Baby Seats",
    calculateBtn: "Calculate Route & Price",
    bookWhatsApp: "Book on WhatsApp",
    viewSummary: "View Booking Voucher",
    roundTrip: "Add Return Trip",
    returnDateLabel: "Return Date & Time",
  },
  es: {
    navHow: "Cómo Funciona",
    navPrices: "Tarifas",
    navFleet: "Vehículos",
    navRoutes: "Rutas Populares",
    navFaq: "Preguntas",
    navContact: "Contacto",
    heroTitle: "Traslados privados desde Barcelona a cualquier punto de España",
    heroSubtitle: "Recogidas en aeropuerto, traslados al puerto de cruceros y viajes de larga distancia. Precios fijos, seguimiento de vuelos y atención 24/7 por WhatsApp.",
    calcTitle: "Calcula tu Tarifa y Reserva al Instante",
    pickupLabel: "Lugar de Recogida",
    pickupPlaceholder: "Ej: Aeropuerto Barcelona T1 o nombre del hotel",
    dropoffLabel: "Lugar de Destino",
    dropoffPlaceholder: "Ej: Sitges, Montserrat, dirección del hotel",
    dateTimeLabel: "Fecha y Hora de Recogida",
    flightLabel: "Número de Vuelo (Opcional)",
    flightPlaceholder: "Ej: VY6102, IB2600",
    passengersLabel: "Pasajeros",
    luggageLabel: "Maletas",
    childSeatsLabel: "Sillas de Niño / Bebé",
    calculateBtn: "Calcular Ruta y Precio",
    bookWhatsApp: "Reservar por WhatsApp",
    viewSummary: "Ver Comprobante",
    roundTrip: "Añadir Viaje de Vuelta",
    returnDateLabel: "Fecha y Hora de Vuelta",
  },
  ca: {
    navHow: "Com Funciona",
    navPrices: "Preus",
    navFleet: "Vehicles",
    navRoutes: "Rutes Populars",
    navFaq: "Preguntes",
    navContact: "Contacte",
    heroTitle: "Trasllats privats des de Barcelona a qualsevol punt d'Espanya",
    heroSubtitle: "Recollides a l'aeroport, connexions al port de creuers i viatges de llarga distància. Preus fixos, seguiment de vols i servei 24/7 per WhatsApp.",
    calcTitle: "Calcula el teu Preu i Reserva a l'Instant",
    pickupLabel: "Lloc de Recollida",
    pickupPlaceholder: "Ex: Aeroport de Barcelona T1 o nom d'hotel",
    dropoffLabel: "Lloc de Destinació",
    dropoffPlaceholder: "Ex: Sitges, Montserrat, adreça d'hotel",
    dateTimeLabel: "Data i Hora de Recollida",
    flightLabel: "Número de Vol (Opcional)",
    flightPlaceholder: "Ex: VY6102",
    passengersLabel: "Passatgers",
    luggageLabel: "Maletes",
    childSeatsLabel: "Cadires d'Infant / Nadó",
    calculateBtn: "Calcular Ruta i Preu",
    bookWhatsApp: "Reservar per WhatsApp",
    viewSummary: "Veure Comprovant",
    roundTrip: "Afegir Viatge de Tornada",
    returnDateLabel: "Data i Hora de Tornada",
  },
  ur: {
    navHow: "کیسے کام کرتا ہے",
    navPrices: "کرایہ",
    navFleet: "گاڑیاں",
    navRoutes: "مشہور راستے",
    navFaq: "سوالات",
    navContact: "رابطہ",
    heroTitle: "بارسلونا سے پورے اسپین کیلئے پرائیویٹ ٹرانسفر سروس",
    heroSubtitle: "ایئرپورٹ پک اپ، کروز پورٹ اور شہر سے شہر سفر۔ فکسڈ ریٹ، فلائٹ ٹریکنگ اور مسٹر میر سے واٹس ایپ پر فوری بکنگ۔",
    calcTitle: "کرایہ چیک کریں اور واٹس ایپ پر بک کریں",
    pickupLabel: "کہاں سے پک اپ کرنا ہے؟",
    pickupPlaceholder: "مثلاً بارسلونا ایئرپورٹ T1 یا ہوٹل کا پتہ",
    dropoffLabel: "کہاں جانا ہے؟",
    dropoffPlaceholder: "مثلاً سٹجس، مونٹسیراٹ، بارسلونا سٹی",
    dateTimeLabel: "تاریخ اور وقت",
    flightLabel: "فلائٹ نمبر (اگر ایئرپورٹ پک اپ ہے)",
    flightPlaceholder: "مثلاً PK789 یا VY6102",
    passengersLabel: "سواریوں کی تعداد",
    luggageLabel: "سامان / بیگز",
    childSeatsLabel: "بچوں کی سیٹ",
    calculateBtn: "روٹ اور قیمت معلوم کریں",
    bookWhatsApp: "واٹس ایپ پر بک کریں",
    viewSummary: "واؤچر دیکھیں",
    roundTrip: "واپسی کا سفر شامل کریں",
    returnDateLabel: "واپسی کی تاریخ اور وقت",
  },
};
