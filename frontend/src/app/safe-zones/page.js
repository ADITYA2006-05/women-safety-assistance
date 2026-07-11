'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, Phone, Navigation, Compass, ShieldAlert, HeartPulse } from 'lucide-react';
import { API_BASE_URL } from '@/config';

const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false });

export default function SafeZonesPage() {
  const [token, setToken] = useState(null);

  // Search and resources state
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All' | 'SafeZone' | 'PoliceStation' | 'Hospital'
  const [userCoords, setUserCoords] = useState([12.9716, 77.5946]); // default Bangalore centroid
  const [selectedCenter, setSelectedCenter] = useState([12.9716, 77.5946]);
  const [mapMarkers, setMapMarkers] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) setToken(storedToken);

    // Get current position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(c);
        setSelectedCenter(c);
      });
    }

    fetchResources(storedToken);
  }, []);

  const fetchResources = async (authToken) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/resources`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (res.ok) {
        setResources(data);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build markers for map dynamically based on filters
  useEffect(() => {
    const markers = [];

    // Add user marker
    markers.push({
      id: 'current-user-pos',
      position: userCoords,
      type: 'User',
      label: 'Your Current Position',
      details: 'GPS Coordinates'
    });

    // Add resource markers
    resources.forEach((res) => {
      if (filterType !== 'All' && res.type !== filterType) return;
      if (searchQuery && !res.name.toLowerCase().includes(searchQuery.toLowerCase())) return;

      const [lng, lat] = res.location.coordinates;
      markers.push({
        id: res._id,
        position: [lat, lng],
        type: res.type,
        label: res.name,
        details: `${res.address} | Call: ${res.phone}`
      });
    });

    setMapMarkers(markers);
  }, [resources, filterType, searchQuery, userCoords]);

  // Center map on a specific resource
  const focusOnResource = (coordsArray) => {
    setSelectedCenter(coordsArray);
  };

  const filteredResources = resources.filter((res) => {
    const matchesFilter = filterType === 'All' || res.type === filterType;
    const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || res.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="grid lg:grid-cols-12 gap-6 w-full">
      
      {/* LEFT COL: Search Directory */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        
        {/* Search Header Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-4">
          <div>
            <h2 className="font-outfit font-extrabold text-xl text-white">Safe Directory Search</h2>
            <p className="text-xs text-gray-400 mt-1">Locate safety checkpoints, stations, and emergency rooms</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by zone name or street address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-950/60 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
            />
          </div>

          {/* Directory tabs */}
          <div className="grid grid-cols-4 gap-1.5 bg-gray-950/60 p-1.5 rounded-xl border border-gray-900">
            {['All', 'SafeZone', 'PoliceStation', 'Hospital'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                  filterType === tab
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'All' ? 'All' : tab === 'SafeZone' ? 'Safe Zone' : tab === 'PoliceStation' ? 'Police' : 'Hospital'}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results List */}
        <div className="glass-panel p-6 rounded-3xl border border-gray-800 flex-1 flex flex-col min-h-[350px]">
          <h3 className="font-outfit font-bold text-sm text-gray-300 mb-3 px-1">
            Registered Safety Points ({filteredResources.length})
          </h3>

          {loading ? (
            <div className="text-center py-10 text-xs text-gray-500">Loading safety directory...</div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500 border border-dashed border-gray-800 rounded-2xl">
              No matching safety zones or contacts located.
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-1 flex-1">
              {filteredResources.map((res) => (
                <div
                  key={res._id}
                  onClick={() => focusOnResource([res.location.coordinates[1], res.location.coordinates[0]])}
                  className="p-3.5 bg-gray-950/30 border border-gray-900 hover:border-gray-800 hover:bg-gray-950/50 rounded-2xl cursor-pointer transition-all flex items-start justify-between group"
                >
                  <div className="flex gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      res.type === 'PoliceStation'
                        ? 'bg-blue-500/10 text-blue-400'
                        : res.type === 'Hospital'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {res.type === 'PoliceStation' ? (
                        <ShieldAlert className="h-4.5 w-4.5" />
                      ) : res.type === 'Hospital' ? (
                        <HeartPulse className="h-4.5 w-4.5" />
                      ) : (
                        <MapPin className="h-4.5 w-4.5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors">
                        {res.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1">{res.address}</p>
                      <a
                        href={`tel:${res.phone}`}
                        className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-400 font-bold mt-1.5 transition-colors"
                        onClick={(e) => e.stopPropagation()} // prevent centering
                      >
                        <Phone className="h-3 w-3" /> Call: {res.phone}
                      </a>
                    </div>
                  </div>

                  <button
                    className="p-1.5 rounded-lg border border-transparent group-hover:border-gray-800 group-hover:bg-gray-900 text-gray-600 group-hover:text-cyan-400 transition-all"
                    title="Center on Map"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COL: Map Canvas */}
      <div className="lg:col-span-7 h-[580px] glass-panel p-4 rounded-3xl border border-gray-800 flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="font-outfit font-bold text-sm text-gray-200 flex items-center gap-1.5">
              <Compass className="h-4.5 w-4.5 text-cyan-400" />
              Safety Directory Proximity Map
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Proximity Filter Active
          </span>
        </div>

        <div className="flex-1 w-full relative">
          <LeafletMap
            center={selectedCenter}
            zoom={14}
            markers={mapMarkers}
          />
        </div>
      </div>

    </div>
  );
}
