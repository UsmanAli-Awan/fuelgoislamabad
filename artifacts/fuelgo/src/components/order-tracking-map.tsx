import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const pumpIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const STATUS_STEPS = [
  { key: 'pending',          label: 'Placed' },
  { key: 'accepted',         label: 'Accepted' },
  { key: 'preparing',        label: 'Preparing' },
  { key: 'out_for_delivery', label: 'On the Way' },
  { key: 'delivered',        label: 'Delivered' },
];

interface OrderTrackingMapProps {
  deliveryLat: number;
  deliveryLng: number;
  pumpLat?: number | null;
  pumpLng?: number | null;
  pumpName?: string | null;
  status: string;
}

export function OrderTrackingMap({
  deliveryLat,
  deliveryLng,
  pumpLat,
  pumpLng,
  pumpName,
  status,
}: OrderTrackingMapProps) {
  const hasPump = pumpLat != null && pumpLng != null;

  const center: [number, number] = hasPump
    ? [(deliveryLat + pumpLat!) / 2, (deliveryLng + pumpLng!) / 2]
    : [deliveryLat, deliveryLng];

  const currentStep = STATUS_STEPS.findIndex(s => s.key === status);
  const isRejected = status === 'rejected';
  const isCancelled = status === 'cancelled';
  const isTerminal = isRejected || isCancelled;

  return (
    <div className="space-y-3">
      {!isTerminal && (
        <div className="relative flex items-start justify-between px-1">
          <div className="absolute top-3 left-6 right-6 h-0.5 bg-muted z-0" />
          <div
            className="absolute top-3 left-6 h-0.5 bg-primary z-0 transition-all duration-500"
            style={{
              width: currentStep <= 0
                ? '0%'
                : `${(Math.min(currentStep, STATUS_STEPS.length - 1) / (STATUS_STEPS.length - 1)) * 100}%`,
            }}
          />
          {STATUS_STEPS.map((step, i) => {
            const done = currentStep >= i;
            const active = currentStep === i;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1 z-10 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done
                      ? 'bg-primary border-primary text-white'
                      : 'bg-background border-muted-foreground/30 text-muted-foreground'
                  } ${active ? 'ring-2 ring-primary/30 ring-offset-1 scale-110' : ''}`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] text-center leading-tight font-medium ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isTerminal && (
        <div className={`text-center py-2 rounded-lg text-sm font-medium ${
          isCancelled ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'
        }`}>
          {isCancelled ? 'Order Cancelled' : 'Order Rejected by Pump'}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border h-52 shadow-sm">
        <MapContainer
          center={center}
          zoom={hasPump ? 12 : 14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
          />

          <Marker position={[deliveryLat, deliveryLng]}>
            <Popup>📍 Your delivery location</Popup>
          </Marker>

          {hasPump && (
            <>
              <Marker position={[pumpLat!, pumpLng!]} icon={pumpIcon}>
                <Popup>⛽ {pumpName || 'Petrol Pump'}</Popup>
              </Marker>
              <Polyline
                positions={[[pumpLat!, pumpLng!], [deliveryLat, deliveryLng]]}
                pathOptions={{ color: '#f97316', weight: 3, dashArray: '6 10', opacity: 0.8 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        {hasPump && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> {pumpName || 'Pump'}</span>}
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Your location</span>
      </div>
    </div>
  );
}
