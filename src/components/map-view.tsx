'use client';

import { useState, useMemo, useCallback } from 'react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { Property } from '@/lib/types';
import { MapPin } from 'lucide-react';

interface MapViewProps {
  properties: Property[] | null;
  onBoundsChange: (bounds: google.maps.LatLngBounds | null) => void;
  mapId?: string;
}

export function MapView({ properties, onBoundsChange, mapId }: MapViewProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const center = useMemo(() => {
    if (!properties || properties.length === 0) {
      return { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco
    }
    const { lat, lng } = properties.reduce(
      (acc, p) => ({
        lat: acc.lat + p.latitude,
        lng: acc.lng + p.longitude,
      }),
      { lat: 0, lng: 0 }
    );
    return { lat: lat / properties.length, lng: lng / properties.length };
  }, [properties]);
  
  const handleMarkerClick = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };
  
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId || !properties) return null;
    return properties.find(p => p.id === selectedPropertyId);
  }, [selectedPropertyId, properties]);
  
  const handleCameraChange = useCallback((ev: { detail: { bounds: google.maps.LatLngBounds; }; }) => {
    onBoundsChange(ev.detail.bounds);
  }, [onBoundsChange]);

  return (
    <Map
      mapId={mapId}
      style={{ width: '100%', height: '100%' }}
      defaultCenter={center}
      defaultZoom={11}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
      onCameraChanged={handleCameraChange}
    >
      {properties?.map((property) => (
        <AdvancedMarker
          key={property.id}
          position={{ lat: property.latitude, lng: property.longitude }}
          onClick={() => handleMarkerClick(property.id)}
        >
          <MapPin className="h-6 w-6 text-primary" style={{ transform: 'translate(-50%, -100%)' }} />
        </AdvancedMarker>
      ))}

      {selectedProperty && (
        <InfoWindow
          position={{ lat: selectedProperty.latitude, lng: selectedProperty.longitude }}
          onCloseClick={() => setSelectedPropertyId(null)}
          pixelOffset={new google.maps.Size(0, -30)}
        >
          <div className="p-2">
            <h3 className="font-semibold text-sm">{selectedProperty.address}</h3>
            <p className="text-xs text-muted-foreground">
              Sale Price: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedProperty.sale_price)}
            </p>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}
