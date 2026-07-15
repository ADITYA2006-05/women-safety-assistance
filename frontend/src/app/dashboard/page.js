'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Shield, Plus, Trash2, Phone, AlertTriangle, Users, Compass, Eye, X, Check, Bell } from 'lucide-react';
import useSocket from '@/hooks/useSocket';
import { API_BASE_URL } from '@/config';

// Dynamically import Leaflet Map to avoid SSR errors
const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false });

export default function UserDashboard() {
  const router = useRouter();
  const { registerEvent, emitEvent, isConnected, isPolling } = useSocket();

  // Authentication State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Profile / Contacts State
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

  // Map & Location State
  const [coords, setCoords] = useState([12.9716, 77.5946]); // default Bangalore centroid
  const [mapMarkers, setMapMarkers] = useState([]);

  // SOS Distress State
  const [isDistressActive, setIsDistressActive] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [countdownActive, setCountdownActive] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Volunteers tracking list
  const [responders, setResponders] = useState({});

  useEffect(() => {
    // Auth validation
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (!storedUser || !storedToken) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'User') {
      router.push(parsedUser.role === 'Volunteer' ? '/volunteer' : '/admin');
      return;
    }

    setUser(parsedUser);
    setToken(storedToken);

    // Get current location using Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords([latitude, longitude]);
        },
        (error) => {
          console.warn('Geolocation access denied, using mock coordinates.');
        }
      );
    }
  }, [router]);

  // Fetch Profile and Contacts
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoadingContacts(true);
      setLoadingHistory(true);
      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (profileRes.ok) {
          setContacts(profileData.emergencyContacts || []);
        }

        const historyRes = await fetch(`${API_BASE_URL}/api/alerts/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        if (historyRes.ok) {
          setAlertHistory(historyData);
        }
      } catch (err) {
        console.error('Error fetching dashboard details:', err);
      } finally {
        setLoadingContacts(false);
        setLoadingHistory(false);
      }
    };

    fetchData();
  }, [token]);

  // Handle countdown for cancelable SOS
  useEffect(() => {
    let timer;
    if (countdownActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdownActive && countdown === 0) {
      setCountdownActive(false);
      triggerSOSEvent();
    }
    return () => clearTimeout(timer);
  }, [countdown, countdownActive]);

  // Websocket listeners for live responder updates
  useEffect(() => {
    if (!currentAlert) return;

    // Join room for this specific alert
    emitEvent('join-alert-room', { alertId: currentAlert._id });

    // Listen to volunteer accept updates
    const removeAlertUpdated = registerEvent('alert-updated', (updatedAlert) => {
      if (updatedAlert._id === currentAlert._id) {
        setCurrentAlert(updatedAlert);
        if (updatedAlert.status === 'Resolved' || updatedAlert.status === 'Cancelled') {
          setIsDistressActive(false);
          setCurrentAlert(null);
          setResponders({});
          // Refresh history
          fetchHistory();
        }
      }
    });

    // Listen to volunteer location shares
    const removeVolLocation = registerEvent('volunteer-location-update', (volData) => {
      setResponders(prev => ({
        ...prev,
        [volData.volunteerId]: {
          name: volData.name,
          phone: volData.phone,
          coords: volData.coords
        }
      }));
    });

    return () => {
      emitEvent('leave-alert-room', { alertId: currentAlert._id });
      removeAlertUpdated();
      removeVolLocation();
    };
  }, [currentAlert]);

  // HTTP Polling fallback when socket is disconnected
  useEffect(() => {
    if (!currentAlert || isConnected) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts/${currentAlert._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const updatedAlert = await res.json();
          setCurrentAlert(updatedAlert);
          
          if (updatedAlert.status === 'Resolved' || updatedAlert.status === 'Cancelled') {
            setIsDistressActive(false);
            setCurrentAlert(null);
            setResponders({});
            fetchHistory();
          } else if (updatedAlert.status === 'Accepted' && updatedAlert.responderId) {
            // Update responders mapping on map with coordinates from DB
            setResponders(prev => ({
              ...prev,
              [updatedAlert.responderId]: {
                name: updatedAlert.responderName,
                phone: updatedAlert.responderPhone,
                coords: updatedAlert.responderLocation ? updatedAlert.responderLocation.coordinates : (prev[updatedAlert.responderId]?.coords || [12.9725, 77.5950])
              }
            }));
          }
        }
      } catch (err) {
        console.error('Error polling alert status:', err);
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [currentAlert, isConnected, token]);

  // Build Map Markers dynamically
  useEffect(() => {
    const markers = [];
    
    // User marker
    markers.push({
      id: 'distress-user',
      position: coords,
      type: 'User',
      label: user?.name || 'You',
      details: 'Distress Beacon Location'
    });

    // Responders markers
    Object.keys(responders).forEach(id => {
      const resp = responders[id];
      markers.push({
        id: `responder-${id}`,
        position: [resp.coords[1], resp.coords[0]], // [lat, lng]
        type: 'Volunteer',
        label: resp.name,
        details: `Active Responder: ${resp.phone}`
      });
    });

    setMapMarkers(markers);
  }, [coords, responders, user]);

  const fetchHistory = async () => {
    try {
      const historyRes = await fetch(`${API_BASE_URL}/api/alerts/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      if (historyRes.ok) setAlertHistory(historyData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone || !newContact.relationship) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newContact)
      });
      const data = await res.json();
      if (res.ok || res.status === 211) {
        setContacts(prev => [...prev, data]);
        setNewContact({ name: '', phone: '', relationship: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setContacts(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // SOS button lifecycle
  const startSOSCountdown = () => {
    setCountdown(3);
    setCountdownActive(true);
    setIsDistressActive(true);
  };

  const cancelSOSCountdown = () => {
    setCountdownActive(false);
    setIsDistressActive(false);
  };

  const triggerSOSEvent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          longitude: coords[1],
          latitude: coords[0]
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentAlert(data.alert);
        
        // Mock simulation of an active volunteer accepting the alert and moving towards user after 5 seconds!
        setTimeout(() => {
          simulateVolunteerMovement(data.alert._id);
        }, 5000);

      } else {
        setIsDistressActive(false);
        alert(data.error || 'Failed to trigger SOS');
      }
    } catch (err) {
      setIsDistressActive(false);
      console.error(err);
    }
  };

  const resolveCurrentAlert = async (statusVal) => {
    if (!currentAlert) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts/${currentAlert._id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusVal })
      });
      if (res.ok) {
        setIsDistressActive(false);
        setCurrentAlert(null);
        setResponders({});
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mock volunteer responder helper moving live on map
  const simulateVolunteerMovement = (alertId) => {
    let currentVolCoords = [coords[1] + 0.008, coords[0] + 0.008]; // start 1km away NE
    const steps = 10;
    let stepCount = 0;

    // Trigger fake volunteer acceptance details
    const interval = setInterval(() => {
      if (stepCount >= steps) {
        clearInterval(interval);
        return;
      }
      
      // Crawl closer to user coordinates
      const lngDiff = (coords[1] - currentVolCoords[0]) / (steps - stepCount);
      const latDiff = (coords[0] - currentVolCoords[1]) / (steps - stepCount);

      currentVolCoords = [currentVolCoords[0] + lngDiff, currentVolCoords[1] + latDiff];
      stepCount++;

      // Broadcast location share or update state locally if socket is offline
      if (isConnected) {
        emitEvent('volunteer-location-share', {
          alertId,
          volunteerId: 'simulated_vol_1',
          name: 'Amit Patel (Proximity Responder)',
          phone: '+91 9123456780',
          coords: currentVolCoords
        });
      } else {
        setResponders(prev => ({
          ...prev,
          'simulated_vol_1': {
            name: 'Amit Patel (Proximity Responder)',
            phone: '+91 9123456780',
            coords: currentVolCoords
          }
        }));
      }
    }, 2500);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 w-full">
      
      {/* LEFT COL: SOS Panel & Profile details */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* SOS Panic Trigger Card */}
        <div className="glass-panel p-8 rounded-3xl border border-gray-800 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
          
          {!isDistressActive ? (
            <>
              {/* Pulsing ring background */}
              <div className="absolute w-56 h-56 rounded-full border border-red-500/10 radar-wave -z-10"></div>
              <div className="absolute w-72 h-72 rounded-full border border-red-500/5 radar-wave-delayed -z-10"></div>

              <button
                onClick={startSOSCountdown}
                className="w-44 h-44 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 distress-pulse-btn border-4 border-white/20 text-white flex flex-col items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-[1.02] active:scale-95 transition-transform"
              >
                <Shield className="h-14 w-14 mb-1 animate-pulse" />
                <span className="font-outfit font-black text-2xl tracking-widest uppercase">
                  SOS
                </span>
                <span className="text-[10px] tracking-wider font-bold uppercase opacity-85 mt-0.5">
                  Press to Alert
                </span>
              </button>

              <div className="mt-6">
                <h4 className="font-outfit font-bold text-gray-200">Instant SOS Assistance</h4>
                <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed mx-auto">
                  Alerts nearby verified volunteers, notify emergency contacts via simulated SMS, and share live location instantly.
                </p>
              </div>
            </>
          ) : (
            // Distress Alarm State
            <div className="w-full flex flex-col items-center">
              {countdownActive ? (
                // Countdown cancelable screen
                <div className="flex flex-col items-center animate-pulse">
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-full mb-4 text-red-400">
                    <AlertTriangle className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-white">Triggering Distress SOS...</h3>
                  <div className="text-7xl font-extrabold font-outfit text-red-500 my-6">{countdown}</div>
                  <button
                    onClick={cancelSOSCountdown}
                    className="px-6 py-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 font-outfit font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Cancel Alert
                  </button>
                </div>
              ) : (
                // SOS Active tracking panel
                <div className="w-full space-y-5">
                  <div className="flex justify-center">
                    <div className="relative flex items-center justify-center w-20 h-20 bg-red-600/10 border border-red-500/30 rounded-full distress-pulse-btn text-red-500">
                      <Bell className="h-9 w-9 animate-bounce" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black font-outfit text-red-400 uppercase tracking-widest animate-pulse">
                      SOS Active
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Live tracking is broadcasting to nearest responders</p>
                  </div>

                  {/* Active Responder Alert */}
                  {currentAlert?.status === 'Accepted' ? (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 text-left neon-glow-cyan">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold bg-cyan-500 text-white px-2 py-0.5 rounded">
                        Assistance En Route
                      </span>
                      <p className="text-sm font-bold text-gray-200 mt-2">
                        {currentAlert.responderName || 'Volunteer'} is on the way!
                      </p>
                      <a
                        href={`tel:${currentAlert.responderPhone}`}
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold mt-1"
                      >
                        <Phone className="h-3 w-3" />
                        Call Responder ({currentAlert.responderPhone})
                      </a>
                    </div>
                  ) : (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-xs text-gray-400">
                      <Loader2Icon />
                      Waiting for volunteer matching...
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveCurrentAlert('Resolved')}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-outfit font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <Check className="h-4 w-4" /> I am Safe
                    </button>
                    <button
                      onClick={() => resolveCurrentAlert('Cancelled')}
                      className="flex-1 py-3 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 font-outfit font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Emergency Contacts Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-outfit font-bold text-lg text-white">Emergency Contacts</h3>
            <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-900 border border-gray-800 px-2 py-1 rounded">
              {contacts.length} Contacts
            </span>
          </div>

          {/* Contact Addition Form */}
          <form onSubmit={handleAddContact} className="grid grid-cols-12 gap-2.5 mb-4">
            <div className="col-span-5">
              <input
                type="text"
                required
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60"
              />
            </div>
            <div className="col-span-4">
              <input
                type="tel"
                required
                placeholder="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60"
              />
            </div>
            <div className="col-span-3 flex gap-1">
              <input
                type="text"
                required
                placeholder="Rel"
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                className="w-full px-2 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60"
              />
              <button
                type="submit"
                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all"
                title="Add Contact"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>
          </form>

          {/* List of Contacts */}
          {loadingContacts ? (
            <div className="text-center py-4 text-xs text-gray-500">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-800 rounded-2xl text-xs text-gray-500">
              No contacts registered. Please add contacts to notify during SOS.
            </div>
          ) : (
            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between p-3 bg-gray-950/40 border border-gray-900 rounded-xl"
                >
                  <div>
                    <h5 className="text-xs font-bold text-gray-200">{contact.name}</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5">{contact.phone} • {contact.relationship}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact._id)}
                    className="p-1.5 hover:bg-red-950/20 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COL: Leaflet interactive Map & History log */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Interactive Safety Map */}
        <div className="glass-panel p-4 rounded-3xl border border-gray-800 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h3 className="font-outfit font-bold text-sm text-gray-200 flex items-center gap-1.5">
                <Compass className="h-4.5 w-4.5 text-cyan-400" />
                Live Incident Tracking Map
              </h3>
            </div>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {coords ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}` : 'Detecting GPS...'}
            </span>
          </div>

          <div className="flex-1 w-full relative">
            <LeafletMap
              center={coords}
              zoom={14}
              markers={mapMarkers}
            />
          </div>
        </div>

        {/* SOS History logs */}
        <div className="glass-panel p-6 rounded-3xl border border-gray-800">
          <h3 className="font-outfit font-bold text-base text-white mb-4">Alert Broadcast History</h3>

          {loadingHistory ? (
            <div className="text-center py-4 text-xs text-gray-500">Loading history...</div>
          ) : alertHistory.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-800 rounded-2xl text-xs text-gray-500">
              No alert history found. Safety status is clear.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {alertHistory.map((history) => (
                <div
                  key={history._id}
                  className="flex items-center justify-between p-3.5 bg-gray-950/40 border border-gray-900 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      history.status === 'Resolved'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : history.status === 'Cancelled'
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-200">SOS Distress Broadcast</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          history.status === 'Resolved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : history.status === 'Cancelled'
                            ? 'bg-gray-800 text-gray-500'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {history.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Triggered on {new Date(history.createdAt).toLocaleString()}
                      </p>
                      {history.responderName && (
                        <p className="text-[10px] text-cyan-400 font-medium mt-0.5">
                          Responder: {history.responderName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

function Loader2Icon() {
  return (
    <div className="flex items-center gap-2 mb-2 font-medium text-white justify-center">
      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-500"></div>
      Searching for nearest volunteers...
    </div>
  );
}
