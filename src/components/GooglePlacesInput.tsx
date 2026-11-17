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
  prediction?: any;
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

function isPermissionOrAuthError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '').toLowerCase();
  return (
    msg.includes('permission denied') ||
    msg.includes('permission_denied') ||
    msg.includes('403') ||
    msg.includes('suspended') ||
    msg.includes('not activated') ||
    msg.includes('api key') ||
    msg.includes('billing') ||
    msg.includes('request_denied')
  );
}

// Session-level flag so repeated 403/suspension errors fall back immediately to free OpenStreetMap/Photon
let googlePlacesUnavailableForSession = false;

async function fetchPhotonSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<LocalSuggestion[]> {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      query
    )}&lat=41.3874&lon=2.1686&limit=10&lang=en`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const features: any[] = Array.isArray(data?.features) ? data.features : [];

    const allowedCountries = new Set(['ES', 'AD', 'FR']);
    const mapped: LocalSuggestion[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      const props = f?.properties || {};
      const coordsArr = f?.geometry?.coordinates;
      if (!Array.isArray(coordsArr) || coordsArr.length < 2) continue;

      const countryCode = String(props.countrycode || '').toUpperCase();
      if (countryCode && !allowedCountries.has(countryCode)) continue;

      const lon = Number(coordsArr[0]);
      const lat = Number(coordsArr[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      const streetLine = [props.street, props.housenumber].filter(Boolean).join(' ').trim();
      const primary =
        String(props.name || '').trim() ||
        streetLine ||
        String(props.city || props.town || props.village || props.district || '').trim();
      if (!primary) continue;

      const cityOrTown = props.city || props.town || props.village || props.county || '';
      const countryLabel =
        countryCode === 'ES' ? 'Spain' : countryCode === 'AD' ? 'Andorra' : countryCode === 'FR' ? 'France' : props.country || '';

      const secondaryParts = [
        props.name && streetLine ? streetLine : '',
        props.district && props.district !== primary ? props.district : '',
        [props.postcode, cityOrTown].filter(Boolean).join(' ').trim(),
        countryLabel,
      ].filter((p) => Boolean(p && p.trim()));

      // Deduplicate repeated parts in secondary
      const uniqueSecondary: string[] = [];
      for (const part of secondaryParts) {
        if (!uniqueSecondary.some((x) => x.toLowerCase() === part.toLowerCase())) {
          uniqueSecondary.push(part);
        }
      }

      const secondary = uniqueSecondary.join(', ');
      const fullLabel = secondary ? `${primary}, ${secondary}` : primary;
      const dedupeKey = normalizeSearch(`${primary}|${cityOrTown}|${props.postcode || ''}`);
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      mapped.push({
        key: `osm-${props.osm_type || 'N'}-${props.osm_id || i}`,
        primary,
        secondary,
        fullLabel,
        coords: { lat, lon },
      });

      if (mapped.length >= 6) break;
    }

    return mapped;
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('Photon fallback lookup skipped:', err);
    }
    return [];
  }
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
  const sessionTokenRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
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
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
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

  const mergeSuggestions = useCallback(
    (primaryList: LocalSuggestion[], secondaryList: LocalSuggestion[], trimmed: string) => {
      const merged: LocalSuggestion[] = [];
      const seen = new Set<string>();
      const isPlacaSearch = /\bpla[cçz]a\b/i.test(normalizeSearch(trimmed));

      const ordered = isPlacaSearch
        ? [...secondaryList, ...primaryList]
        : [...primaryList, ...secondaryList];

      for (const item of ordered) {
        const normPrimary = normalizeSearch(item.primary);
        if (!seen.has(normPrimary)) {
          seen.add(normPrimary);
          merged.push(item);
        }
      }
      return merged.slice(0, 8);
    },
    []
  );

  const fetchPredictions = useCallback(
    async (inputString: string) => {
      const trimmed = inputString.trim();
      if (trimmed.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const localItems = buildLocalFallbackSuggestions(trimmed);
      const normalizedQuery = normalizeForApiQuery(trimmed);

      // 1. Primary: Google Places API (New) AutocompleteSuggestion when available & not blocked
      if (
        mapsEnabled &&
        !googlePlacesUnavailableForSession &&
        placesLib?.AutocompleteSuggestion &&
        placesLib?.AutocompleteSessionToken
      ) {
        try {
          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
          }

          setIsLoading(true);
          const request = {
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

          if (controller.signal.aborted) return;

          const apiMapped: LocalSuggestion[] = (rawSuggestions || [])
            .filter((s: any) => Boolean(s.placePrediction))
            .slice(0, 6)
            .map((s: any, idx: number) => {
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

          const merged = mergeSuggestions(apiMapped, localItems, trimmed);
          if (merged.length > 0) {
            setSuggestions(merged);
            setIsOpen(true);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          if (isQuotaError(err)) {
            googlePlacesUnavailableForSession = true;
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          } else if (isPermissionOrAuthError(err)) {
            googlePlacesUnavailableForSession = true;
          } else {
            console.warn('Google Places Autocomplete fallback:', err);
          }
        }
      }

      // 2. Seamless Free OpenStreetMap / Photon Fallback (works 24/7 with zero API key required)
      if (!controller.signal.aborted) {
        setIsLoading(true);
        const photonItems = await fetchPhotonSuggestions(normalizedQuery, controller.signal);
        if (controller.signal.aborted) return;

        const mergedFallback = mergeSuggestions(photonItems, localItems, trimmed);
        setSuggestions(mergedFallback);
        setIsOpen(mergedFallback.length > 0);
        setIsLoading(false);
      }
    },
    [mapsEnabled, placesLib, buildLocalFallbackSuggestions, mergeSuggestions]
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
        const postalComponent = place.addressComponents?.find((c: any) =>
          c.types.includes('postal_code')
        )?.longText;
        const neighborhoodComponent = place.addressComponents?.find(
          (c: any) =>
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
