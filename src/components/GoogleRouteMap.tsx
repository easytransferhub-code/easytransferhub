import React, { useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { calculateHaversineKm } from '../utils/pricing';

interface Coords {
  lat: number;
  lon: number;
}

interface GoogleRouteMapProps {
  pickup: string;
  dropoff: string;
  pickupCoords: Coords | null;
  dropoffCoords: Coords | null;
  mapsEnabled: boolean;
  onRouteMetrics?: (metrics: { distanceKm: number; durationMinutes: number }) => void;
}

// Session-level flag so repeated 403/suspension errors fall back immediately to free OSRM routing
let googleRoutesUnavailableForSession = false;

async function fetchOsrmRouteMetrics(
  pickupCoords: Coords,
  dropoffCoords: Coords,
  signal?: AbortSignal
): Promise<{ distanceKm: number; durationMinutes: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lon},${pickupCoords.lat};${dropoffCoords.lon},${dropoffCoords.lat}?overview=false`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const route = Array.isArray(data?.routes) ? data.routes[0] : null;
    if (!route || typeof route.distance !== 'number') return null;

    const distanceKm = Math.max(5, Math.round(route.distance / 1000));
    const durationMinutes = Math.max(10, Math.round((route.duration || 1500) / 60));
    return { distanceKm, durationMinutes };
  } catch {
    return null;
  }
}

/** Headless Google Routes API + Free OSRM fallback distance calculator (no visible map UI) */
export const GoogleRouteDistanceSync: React.FC<GoogleRouteMapProps> = ({
  pickup,
  dropoff,
  pickupCoords,
  dropoffCoords,
  mapsEnabled,
  onRouteMetrics,
}) => {
  const routesLib = useMapsLibrary('routes');
  const lastSignatureRef = useRef<string>('');
  const onRouteMetricsRef = useRef(onRouteMetrics);
  onRouteMetricsRef.current = onRouteMetrics;

  useEffect(() => {
    if (!pickup.trim() || !dropoff.trim()) return;

    const controller = new AbortController();
    let cancelled = false;

    const runOsrmOrHaversineFallback = async (sig: string) => {
      if (!pickupCoords || !dropoffCoords) return;

      const osrm = await fetchOsrmRouteMetrics(pickupCoords, dropoffCoords, controller.signal);
      if (cancelled) return;

      if (osrm) {
        lastSignatureRef.current = sig;
        onRouteMetricsRef.current?.(osrm);
        return;
      }

      const fallbackKm = calculateHaversineKm(
        pickupCoords.lat,
        pickupCoords.lon,
        dropoffCoords.lat,
        dropoffCoords.lon
      );
      lastSignatureRef.current = sig;
      onRouteMetricsRef.current?.({
        distanceKm: fallbackKm,
        durationMinutes: Math.max(15, Math.round(fallbackKm * 1.35)),
      });
    };

    const originVal: { lat: number; lng: number } | string = pickupCoords
      ? { lat: pickupCoords.lat, lng: pickupCoords.lon }
      : pickup.includes('Spain')
      ? pickup
      : `${pickup}, Barcelona, Spain`;

    const destVal: { lat: number; lng: number } | string = dropoffCoords
      ? { lat: dropoffCoords.lat, lng: dropoffCoords.lon }
      : dropoff.includes('Spain')
      ? dropoff
      : `${dropoff}, Barcelona, Spain`;

    const signature = JSON.stringify([originVal, destVal]);
    if (lastSignatureRef.current === signature) return;

    const RouteClass = (routesLib as any)?.Route;
    const canTryGoogle =
      mapsEnabled &&
      !googleRoutesUnavailableForSession &&
      Boolean(RouteClass?.computeRoutes);

    if (!canTryGoogle) {
      void runOsrmOrHaversineFallback(signature);
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    RouteClass.computeRoutes({
      origin: originVal,
      destination: destVal,
      travelMode: 'DRIVING',
      fields: ['distanceMeters', 'durationMillis'],
    })
      .then(({ routes }: { routes: any[] }) => {
        if (cancelled || !routes || routes.length === 0) return;
        lastSignatureRef.current = signature;
        const primaryRoute = routes[0];
        const distKm = Math.max(
          5,
          Math.round(((primaryRoute.distanceMeters ?? 18000) as number) / 1000)
        );
        const durationMinutes = Math.max(
          10,
          Math.round(((primaryRoute.durationMillis ?? 1500000) as number) / 60000)
        );
        onRouteMetricsRef.current?.({ distanceKm: distKm, durationMinutes });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isQuotaError(err)) {
          googleRoutesUnavailableForSession = true;
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        } else if (isPermissionOrAuthError(err)) {
          googleRoutesUnavailableForSession = true;
        }
        void runOsrmOrHaversineFallback(signature);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [mapsEnabled, routesLib, pickup, dropoff, pickupCoords, dropoffCoords]);

  return null;
};

const BARCELONA_CENTER = { lat: 41.36, lng: 2.135 };

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

interface RouteOverlayProps {
  pickup: string;
  dropoff: string;
  pickupCoords: Coords | null;
  dropoffCoords: Coords | null;
  onRouteMetrics?: (metrics: { distanceKm: number; durationMinutes: number }) => void;
}

const RouteOverlay: React.FC<RouteOverlayProps> = ({
  pickup,
  dropoff,
  pickupCoords,
  dropoffCoords,
  onRouteMetrics,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<any[]>([]);
  const lastSignatureRef = useRef<string>('');
  const onRouteMetricsRef = useRef(onRouteMetrics);
  onRouteMetricsRef.current = onRouteMetrics;

  useEffect(() => {
    if (!map) return;

    // If only one endpoint coordinate exists, center on it
    if (pickupCoords && !dropoffCoords) {
      map.panTo({ lat: pickupCoords.lat, lng: pickupCoords.lon });
      map.setZoom(13);
    } else if (!pickupCoords && dropoffCoords) {
      map.panTo({ lat: dropoffCoords.lat, lng: dropoffCoords.lon });
      map.setZoom(13);
    }
  }, [map, pickupCoords, dropoffCoords]);

  useEffect(() => {
    if (!map || !routesLib || !pickup.trim() || !dropoff.trim()) {
      return;
    }

    const originVal: { lat: number; lng: number } | string = pickupCoords
      ? { lat: pickupCoords.lat, lng: pickupCoords.lon }
      : pickup.includes('Spain')
      ? pickup
      : `${pickup}, Barcelona, Spain`;

    const destVal: { lat: number; lng: number } | string = dropoffCoords
      ? { lat: dropoffCoords.lat, lng: dropoffCoords.lon }
      : dropoff.includes('Spain')
      ? dropoff
      : `${dropoff}, Barcelona, Spain`;

    const signature = JSON.stringify([originVal, destVal]);
    if (lastSignatureRef.current === signature && polylinesRef.current.length > 0) {
      return;
    }

    let cancelled = false;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const request = {
      origin: originVal,
      destination: destVal,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    const RouteClass = (routesLib as any).Route;
    if (!RouteClass?.computeRoutes) {
      return;
    }

    RouteClass.computeRoutes(request)
      .then(({ routes }: { routes: any[] }) => {
        if (cancelled || !routes || routes.length === 0) return;
        lastSignatureRef.current = signature;
        const primaryRoute = routes[0];

        if (typeof primaryRoute.createPolylines === 'function') {
          const newPolylines = primaryRoute.createPolylines();
          newPolylines.forEach((polyline: any) => {
            polyline.setOptions({
              strokeColor: '#008da1',
              strokeWeight: 5,
              strokeOpacity: 0.9,
            });
            polyline.setMap(map);
          });
          polylinesRef.current = newPolylines;
        }

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        const distKm = Math.max(
          5,
          Math.round(((primaryRoute.distanceMeters ?? 18000) as number) / 1000)
        );
        const durationMinutes = Math.max(
          10,
          Math.round(((primaryRoute.durationMillis ?? 1500000) as number) / 60000)
        );

        onRouteMetricsRef.current?.({ distanceKm: distKm, durationMinutes });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        // Fallback distance using coordinates if Routes API unavailable
        if (pickupCoords && dropoffCoords) {
          const fallbackKm = calculateHaversineKm(
            pickupCoords.lat,
            pickupCoords.lon,
            dropoffCoords.lat,
            dropoffCoords.lon
          );
          onRouteMetricsRef.current?.({
            distanceKm: fallbackKm,
            durationMinutes: Math.max(15, Math.round(fallbackKm * 1.35)),
          });

          const gm = (window as any).google?.maps;
          if (gm?.LatLngBounds) {
            const bounds = new gm.LatLngBounds();
            bounds.extend({ lat: pickupCoords.lat, lng: pickupCoords.lon });
            bounds.extend({ lat: dropoffCoords.lat, lng: dropoffCoords.lon });
            map.fitBounds(bounds);
          }
        }
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, pickup, dropoff, pickupCoords, dropoffCoords]);

  return null;
};

export const GoogleRouteMap: React.FC<GoogleRouteMapProps> = ({
  pickup,
  dropoff,
  pickupCoords,
  dropoffCoords,
  mapsEnabled,
  onRouteMetrics,
}) => {
  const [mapExpanded, setMapExpanded] = useState(true);

  const originQuery = pickupCoords
    ? `${pickupCoords.lat},${pickupCoords.lon}`
    : encodeURIComponent(pickup || 'Barcelona Airport');
  const destQuery = dropoffCoords
    ? `${dropoffCoords.lat},${dropoffCoords.lon}`
    : encodeURIComponent(dropoff || 'Barcelona City Center');
  const googleMapsExternalUrl = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${originQuery}&destination=${destQuery}`;

  if (!pickup.trim() && !dropoff.trim()) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#8ceeff] bg-[#f5feff] overflow-hidden shadow-2xs">
      <div className="px-3 py-2 bg-[#e6fdff] border-b border-[#9beeff] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#042f40]">
          <MapPin className="w-3.5 h-3.5 text-[#008da1]" />
          <span>Google Maps Route Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={googleMapsExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-[#007c91] hover:text-[#042f40] flex items-center gap-1"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={() => setMapExpanded((prev) => !prev)}
            className="text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-[#9beeff] text-[#042f40] hover:bg-[#d8fbff] cursor-pointer"
          >
            {mapExpanded ? 'Hide Map' : 'Show Map'}
          </button>
        </div>
      </div>

      {mapExpanded && (
        <div className="relative w-full h-[210px] sm:h-[240px] bg-[#e6fdff]">
          {mapsEnabled ? (
            <GoogleMap
              mapId="DEMO_MAP_ID"
              defaultCenter={BARCELONA_CENTER}
              defaultZoom={11}
              gestureHandling="cooperative"
              disableDefaultUI={false}
              streetViewControl={false}
              mapTypeControl={false}
              fullscreenControl={true}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="w-full h-full"
            >
              {pickupCoords && (
                <AdvancedMarker
                  position={{ lat: pickupCoords.lat, lng: pickupCoords.lon }}
                  title={`Pickup: ${pickup}`}
                >
                  <Pin
                    background="#00f0ff"
                    borderColor="#042f40"
                    glyphColor="#042f40"
                    glyphText="A"
                  />
                </AdvancedMarker>
              )}

              {dropoffCoords && (
                <AdvancedMarker
                  position={{ lat: dropoffCoords.lat, lng: dropoffCoords.lon }}
                  title={`Drop-off: ${dropoff}`}
                >
                  <Pin
                    background="#042f40"
                    borderColor="#00f0ff"
                    glyphColor="#00f0ff"
                    glyphText="B"
                  />
                </AdvancedMarker>
              )}

              <RouteOverlay
                pickup={pickup}
                dropoff={dropoff}
                pickupCoords={pickupCoords}
                dropoffCoords={dropoffCoords}
                onRouteMetrics={onRouteMetrics}
              />
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#042f40]">
                <Navigation className="w-4 h-4 text-[#008da1]" />
                <span>
                  {pickup || 'Pickup'} → {dropoff || 'Drop-off'}
                </span>
              </div>
              <a
                href={googleMapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f0ff] border border-[#00c8e8] text-slate-950 font-bold text-xs shadow-2xs"
              >
                <span>View Route on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
