import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { BARCELONA_PLACAS, BARCELONA_ZONES, QUICK_LOCATIONS } from '../data/transferData';

export interface SelectedPlaceValue {
  label: string;
  coords: { lat: number; lon: number } | null;
}

interface GooglePlacesInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: SelectedPlaceValue) => void;
  placeholder: string;
  iconType: 'pickup' | 'dropoff';
  mapsEnabled: boolean;
  inputId?: string;
}

interface LocalSuggestion {
  key: string;
  primary: string;
  secondary?: string;
  fullLabel: string;
  coords?: { lat: number; lon: number };
  prediction?: google.maps.places.AutocompleteSuggestion;
}

function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`]/g, "'")
    .trim();
}

function normalizeForApiQuery(input: string): string {
  return input
    .replace(/\bplaca\b/gi, 'Plaça')
    .replace(/\bplaza\b/gi, 'Plaça')
    .trim();
}

function isQuotaError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '');
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('429') ||
    msg.includes('Quota')
  );
}

export const GooglePlacesInput: React.FC<GooglePlacesInputProps> = ({
  value,
  onChangeText,
  onSelectPlace,
  placeholder,
  iconType,
  mapsEnabled,
  inputId,
}) => {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSelectedRef = useRef(false);

  const [suggestions, setSuggestions] = useState<LocalSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const buildLocalFallbackSuggestions = useCallback((query: string): LocalSuggestion[] => {
    const qNorm = normalizeSearch(query);
    if (qNorm.length < 2) return [];

    // Treat "placa" and "plaza" interchangeably
    const qAlt = qNorm.replace(/\bplaza\b/g, 'placa');
    const results: LocalSuggestion[] = [];
    const seen = new Set<string>();

    const pushUnique = (item: LocalSuggestion) => {
      const k = normalizeSearch(item.primary);
      if (seen.has(k)) return;
      seen.add(k);
      results.push(item);
    };

    // 1. Prioritize Barcelona Plaças when searching placa / plaza / Plaça
    for (const p of BARCELONA_PLACAS) {
      const hay = normalizeSearch(`${p.name} ${p.district} ${p.address}`).replace(/\bplaza\b/g, 'placa');
      if (hay.includes(qNorm) || hay.includes(qAlt)) {
        pushUnique({
          key: `placa-${p.id}`,
          primary: p.name,
          secondary: `${p.district}, ${p.postalCode} Barcelona, Spain`,
          fullLabel: p.address,
          coords: { lat: p.lat, lon: p.lon },
        });
      }
    }

    // 2. Match major Barcelona hubs & landmarks
    for (const loc of QUICK_LOCATIONS) {
      const hay = normalizeSearch(`${loc.name} ${loc.address} ${loc.shortLabel}`).replace(/\bplaza\b/g, 'placa');
      if (hay.includes(qNorm) || hay.includes(qAlt)) {
        pushUnique({
          key: `ql-${loc.id}`,
          primary: loc.name,
          secondary: loc.address,
          fullLabel: loc.address,
          coords: { lat: loc.lat, lon: loc.lon },
        });
      }
    }

    // 3. Match Barcelona districts, areas & postal codes
    for (const zone of BARCELONA_ZONES) {
      const areaHit = zone.mainAreas.find((a) => normalizeSearch(a).includes(qNorm));
      const districtHit = normalizeSearch(zone.district).includes(qNorm);
      const postalHit = zone.postalCodes.some((pc) => pc.includes(qNorm));
      if (districtHit || areaHit || postalHit) {
        const areaName = areaHit || zone.district;
        pushUnique({
          key: `zone-${zone.zone}-${areaName}`,
          primary: `${areaName}, ${zone.district}`,
          secondary: `${zone.postalCodes[0]} Barcelona, Spain`,
          fullLabel: `${areaName}, ${zone.district}, ${zone.postalCodes[0]} Barcelona, Spain`,
          coords: { lat: zone.center.lat, lon: zone.center.lng },
        });
      }
    }

    return results.slice(0, 8);
  }, []);

  const fetchPredictions = useCallback(
    async (inputString: string) => {
      const trimmed = inputString.trim();
      if (trimmed.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      const localItems = buildLocalFallbackSuggestions(trimmed);

      // Use Places API (New) AutocompleteSuggestion when Maps JS library is loaded
      if (mapsEnabled && placesLib?.AutocompleteSuggestion && placesLib?.AutocompleteSessionToken) {
        try {
          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
          }

          setIsLoading(true);
          const normalizedQuery = normalizeForApiQuery(trimmed);
          const request: google.maps.places.AutocompleteRequest = {
            input: normalizedQuery,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['es', 'ad', 'fr'],
            locationBias: {
              center: { lat: 41.3874, lng: 2.1686 },
              radius: 50000,
            },
          };

          const { suggestions: rawSuggestions } =
            await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

          const apiMapped: LocalSuggestion[] = (rawSuggestions || [])
            .filter((s) => Boolean(s.placePrediction))
            .slice(0, 6)
            .map((s, idx) => {
              const pred = s.placePrediction!;
              const mainText = pred.mainText?.text || pred.text.text;
              const secondaryText = pred.secondaryText?.text || '';
              return {
                key: pred.placeId || `gmp-${idx}`,
                primary: mainText,
                secondary: secondaryText,
                fullLabel: pred.text.text,
                prediction: s,
              };
            });

          // Merge instant local Barcelona Plaças/landmarks + live Google Places suggestions without duplicates
          const merged: LocalSuggestion[] = [];
          const seen = new Set<string>();
          const isPlacaSearch = /\bpla[cçz]a\b/i.test(normalizeSearch(trimmed));

          const primaryOrder = isPlacaSearch
            ? [...localItems, ...apiMapped]
            : [...apiMapped, ...localItems];

          for (const item of primaryOrder) {
            const normPrimary = normalizeSearch(item.primary);
            if (!seen.has(normPrimary)) {
              seen.add(normPrimary);
              merged.push(item);
            }
          }

          if (merged.length > 0) {
            setSuggestions(merged.slice(0, 8));
            setIsOpen(true);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          if (isQuotaError(err)) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          } else {
            console.warn('Google Places Autocomplete fallback:', err);
          }
        } finally {
          setIsLoading(false);
        }
      }

      setSuggestions(localItems);
      setIsOpen(localItems.length > 0);
      setIsLoading(false);
    },
    [mapsEnabled, placesLib, buildLocalFallbackSuggestions]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    justSelectedRef.current = false;
    onChangeText(val);

    // Show local Plaça / Barcelona landmark matches immediately (0ms)
    const instantLocal = buildLocalFallbackSuggestions(val);
    if (instantLocal.length > 0) {
      setSuggestions(instantLocal);
      setIsOpen(true);
    } else if (val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPredictions(val);
    }, 180);
  };

  const handleSelectItem = async (item: LocalSuggestion) => {
    justSelectedRef.current = true;
    setIsOpen(false);

    if (item.prediction?.placePrediction && placesLib) {
      try {
        setIsLoading(true);
        const place = item.prediction.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });

        const loc = place.location;
        const coords = loc ? { lat: loc.lat(), lon: loc.lng() } : null;

        // Keep postal code & neighborhood inside address text for silent zone matching
        const postalComponent = place.addressComponents?.find((c) =>
          c.types.includes('postal_code')
        )?.longText;
        const neighborhoodComponent = place.addressComponents?.find(
          (c) =>
            c.types.includes('sublocality_level_1') ||
            c.types.includes('neighborhood')
        )?.longText;

        const baseAddress = place.formattedAddress || item.fullLabel;
        const displayName = place.displayName || item.primary;
        let finalLabel =
          displayName && !baseAddress.toLowerCase().includes(displayName.toLowerCase())
            ? `${displayName}, ${baseAddress}`
            : baseAddress;

        if (postalComponent && !finalLabel.includes(postalComponent)) {
          finalLabel = `${finalLabel} (${postalComponent})`;
        } else if (
          neighborhoodComponent &&
          !finalLabel.toLowerCase().includes(neighborhoodComponent.toLowerCase())
        ) {
          finalLabel = `${finalLabel} · ${neighborhoodComponent}`;
        }

        resetSession();
        onSelectPlace({ label: finalLabel, coords });
        return;
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        resetSession();
      } finally {
        setIsLoading(false);
      }
    }

    onSelectPlace({
      label: item.fullLabel,
      coords: item.coords || null,
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        id={inputId}
        type="text"
        value={value}
        autoComplete="off"
        onChange={handleInputChange}
        onFocus={() => {
          if (!justSelectedRef.current) {
            if (suggestions.length > 0) {
              setIsOpen(true);
            } else if (value.trim().length >= 2) {
              const instantLocal = buildLocalFallbackSuggestions(value);
              if (instantLocal.length > 0) {
                setSuggestions(instantLocal);
                setIsOpen(true);
              }
            }
          }
        }}
        placeholder={placeholder}
        className="w-full pl-3.5 pr-10 py-2.5 text-sm font-medium bg-[#f5feff] hover:bg-white focus:bg-white border border-[#9beeff] focus:border-[#00b8cc] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/35 outline-none transition-all shadow-2xs"
      />

      <span className="absolute right-3 top-3 text-slate-400 pointer-events-none">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-[#008da1] animate-spin" />
        ) : iconType === 'pickup' ? (
          <MapPin className="w-4 h-4 text-[#008da1]" />
        ) : (
          <Navigation className="w-4 h-4 text-[#008da1]" />
        )}
      </span>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#67efff] rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto divide-y divide-[#e6fdff] text-xs">
          {suggestions.map((item) => (
            <li
              key={item.key}
              onMouseDown={(e) => {
                e.preventDefault();
                void handleSelectItem(item);
              }}
              className="px-3.5 py-2.5 hover:bg-[#e6fdff] cursor-pointer flex items-start gap-2.5 text-slate-800 transition-colors"
            >
              {iconType === 'pickup' ? (
                <MapPin className="w-3.5 h-3.5 text-[#008da1] shrink-0 mt-0.5" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-[#008da1] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-900 block truncate">{item.primary}</span>
                {item.secondary && (
                  <span className="text-[11px] text-slate-500 block truncate">{item.secondary}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
