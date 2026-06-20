'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet asset path issues
const setupLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Custom Tailwind markers using L.divIcon
const createHtmlIcon = (color, iconMarkup) => {
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg bg-${color}-500 text-white transform transition-transform hover:scale-110">
            ${iconMarkup}
            <div class="absolute -bottom-1 w-2.5 h-2.5 bg-${color}-500 rotate-45 border-r border-b border-white"></div>
           </div>`,
    className: 'custom-leaflet-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Predefined modern SVG icons inside markers
const icons = {
  User: createHtmlIcon('red', `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="distress-pulse-btn"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`),
  Volunteer: createHtmlIcon('cyan', `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`),
  SafeZone: createHtmlIcon('emerald', `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`),
  PoliceStation: createHtmlIcon('blue', `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`),
  Hospital: createHtmlIcon('rose', `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`)
};

// Component to dynamically re-center map when props update
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function Map({ center = [12.9716, 77.5946], zoom = 14, markers = [], polyLine = null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setupLeafletIcons();
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-400 border border-gray-800 rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
          <p className="font-outfit text-sm">Loading interactive safety map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <RecenterMap center={center} />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={icons[marker.type] || L.Icon.Default}
        >
          <Popup>
            <div className="text-gray-950 p-1">
              <h4 className="font-bold font-outfit text-sm m-0">{marker.label}</h4>
              {marker.details && <p className="text-xs m-1 text-gray-700">{marker.details}</p>}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white bg-${marker.type === 'User' ? 'red' : marker.type === 'Volunteer' ? 'cyan' : 'emerald'}-500`}>
                  {marker.type}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {polyLine && (
        <Polyline
          positions={polyLine}
          color="#06b6d4"
          weight={4}
          dashArray="5, 10"
        />
      )}
    </MapContainer>
  );
}
