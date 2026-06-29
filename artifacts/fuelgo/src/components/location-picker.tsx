import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

const ISLAMABAD: [number, number] = [33.6844, 73.0479];

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (val: PickedLocation) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 15); }, [lat, lng, map]);
  return null;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [geocoding, setGeocoding] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handlePick = async (lat: number, lng: number) => {
    setGeocoding(true);
    const address = await reverseGeocode(lat, lng);
    onChange({ lat, lng, address });
    setGeocoding(false);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handlePick(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    );
  };

  const center: [number, number] = value ? [value.lat, value.lng] : ISLAMABAD;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Delivery Location</span>
        <Button type="button" variant="outline" size="sm" onClick={handleGPS} disabled={gpsLoading || geocoding}>
          {gpsLoading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Navigation className="w-3 h-3 mr-1.5" />}
          Use My Location
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border-2 border-border h-56 relative shadow-sm">
        <MapContainer
          center={center}
          zoom={value ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
          />
          <ClickHandler onPick={handlePick} />
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} />
              <RecenterMap lat={value.lat} lng={value.lng} />
            </>
          )}
        </MapContainer>

        {(geocoding || gpsLoading) && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Getting address…</span>
            </div>
          </div>
        )}

        {!value && !geocoding && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary" />
              Tap on the map to set your delivery pin
            </div>
          </div>
        )}
      </div>

      {value && (
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span className="text-sm text-muted-foreground leading-snug">{value.address}</span>
        </div>
      )}
    </div>
  );
}
