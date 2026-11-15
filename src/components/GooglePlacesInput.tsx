import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { BARCELONA_ZONES, QUICK_LOCATIONS } from '../data/transferData';
import { detectBarcelonaZone } from '../utils/pricing';

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
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const results: LocalSuggestion[] = [];

    for (const loc of QUICK_LOCATIONS) {
      if (
        loc.name.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        loc.shortLabel.toLowerCase().includes(q)
      ) {
        results.push({
          key: `ql-${loc.id}`,
          primary: loc.name,
          secondary: loc.address,
          fullLabel: loc.address,
          coords: { lat: loc.lat, lon: loc.lon },
        });
      }
    }

    for (const zone of BARCELONA_ZONES) {
      const areaHit = zone.mainAreas.find((a) => a.toLowerCase().includes(q));
      const districtHit = zone.district.toLowerCase().includes(q);
      if (districtHit || areaHit) {
        const areaName = areaHit || zone.district;
        results.push({
          key: `zone-${zone.zone}-${areaName}`,
          primary: `${areaName}, ${zone.district} (Zone ${zone.zone})`,
          secondary: `${zone.postalCodes[0]} Barcelona · Airport fixed: €${zone.prices.standard}/€${zone.prices.comfort}/€${zone.prices.van}`,
          fullLabel: `${areaName}, ${zone.district}, ${zone.postalCodes[0]} Barcelona, Spain`,
          coords: { lat: zone.center.lat, lon: zone.center.lng },
        });
      }
    }

    return results.slice(0, 6);
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

      // Use Places API (New) AutocompleteSuggestion when Maps JS library is loaded
      if (mapsEnabled && placesLib?.AutocompleteSuggestion && placesLib?.AutocompleteSessionToken) {
        try {
          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
          }

          setIsLoading(true);
          const request: google.maps.places.AutocompleteRequest = {
            input: trimmed,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['es', 'ad', 'fr'],
            locationBias: {
              center: { lat: 41.3874, lng: 2.1686 },
              radius: 50000,
            },
            language: 'en',
          };

          const { suggestions: rawSuggestions } =
            await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

          const mapped: LocalSuggestion[] = (rawSuggestions || [])
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

          if (mapped.length > 0) {
            setSuggestions(mapped);
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

      // Graceful local zone / landmark fallback if Places lib unavailable or zero API matches
      const localItems = buildLocalFallbackSuggestions(trimmed);
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

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPredictions(val);
    }, 240);
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

        // Extract postal code or neighborhood from addressComponents for rich display & exact zone matching
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

  const zonePreview = value.trim() ? detectBarcelonaZone(value) : null;

  return (
    <div className="relative" ref={containerRef}>
      <input
        id={inputId}
        type="text"
        value={value}
        autoComplete="off"
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0 && !justSelectedRef.current) {
            setIsOpen(true);
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

      {/* Subtle detected zone chip inside field corner when text matches a district */}
      {zonePreview && !isOpen && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-[#007c91]">
          <span className="px-1.5 py-0.5 rounded bg-[#e6fdff] border border-[#8ceeff]">
            Zone {zonePreview.zone.zone}: {zonePreview.zone.district}
          </span>
          <span className="text-slate-500 font-medium">
            Airport rate €{zonePreview.zone.prices.standard} / €{zonePreview.zone.prices.comfort} / €{zonePreview.zone.prices.van}
          </span>
        </div>
      )}

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
