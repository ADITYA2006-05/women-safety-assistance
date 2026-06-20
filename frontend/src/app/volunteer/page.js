'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Shield, ToggleLeft, ToggleRight, AlertOctagon, User, Phone, Check, MapPin, Compass, AlertCircle, FileText, Send, HelpCircle } from 'lucide-react';
import useSocket from '@/hooks/useSocket';

const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false });

export default function VolunteerDashboard() {
  const router = useRouter();
  const { registerEvent, emitEvent } = useSocket();

  // Auth State
  const [volunteer, setVolunteer] = useState(null);
  const [token, setToken] = useState(null);
  const [profileStatus, setProfileStatus] = useState(null);

  // Status & Location
  const [isOnline, setIsOnline] = useState(false);
  const [coords, setCoords] = useState([12.9725, 77.5950]); // initial volunteer coordinates close to Bangalore centroid

  // Alerts Management
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [currentActiveIncident, setCurrentActiveIncident] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);

  // Incident reporting
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const [reportSeverity, setReportSeverity] = useState('Medium');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (!storedUser || !storedToken) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'Volunteer') {
      router.push(parsedUser.role === 'Admin' ? '/admin' : '/dashboard');
      return;
    }

    setVolunteer(parsedUser);
    setToken(storedToken);

    // Fetch initial profile status
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/volunteers/status', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        const data = await res.json();
        if (res.ok) {
          setProfileStatus(data);
          setIsOnline(data.isOnline);
          if (data.currentLocation?.coordinates) {
            setCoords([data.currentLocation.coordinates[1], data.currentLocation.coordinates[0]]);
          }
        }
      } catch (err) {
        console.error('Error fetching volunteer status:', err);
      }
    };

    fetchStatus();
    fetchActiveAlerts(storedToken);
  }, [router]);

  const fetchActiveAlerts = async (authToken) => {
    try {
      const res = await fetch('http://localhost:5000/api/alerts/active', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActiveAlerts(data);
        // Find if there is an accepted alert by this volunteer
        const myActive = data.find(
          a => a.status === 'Accepted' && a.responderId === volunteer?.id
        );
        if (myActive) {
          setCurrentActiveIncident(myActive);
        }
      }
    } catch (err) {
      console.error('Error fetching active alerts:', err);
    }
  };

  // Websocket listeners for alerts
  useEffect(() => {
    // Listen for new SOS broadcasts
    const removeNewSOS = registerEvent('new-sos-alert', ({ alert }) => {
      // Add alert to local list if it doesn't exist
      setActiveAlerts(prev => {
        if (prev.some(p => p._id === alert._id)) return prev;
        return [alert, ...prev];
      });
    });

    // Listen for alert updates
    const removeAlertUpdated = registerEvent('alert-updated', (updatedAlert) => {
      // Update local list
      setActiveAlerts(prev => prev.map(a => a._id === updatedAlert._id ? updatedAlert : a));

      // Check if it's our active incident
      if (currentActiveIncident && updatedAlert._id === currentActiveIncident._id) {
        if (updatedAlert.status === 'Resolved' || updatedAlert.status === 'Cancelled') {
          setCurrentActiveIncident(null);
          alert(`Incident has been marked as ${updatedAlert.status} by the user.`);
          fetchActiveAlerts(token);
        } else {
          setCurrentActiveIncident(updatedAlert);
        }
      }
    });

    return () => {
      removeNewSOS();
      removeAlertUpdated();
    };
  }, [currentActiveIncident, token, volunteer]);

  // Join/Leave alert room when active incident changes
  useEffect(() => {
    if (currentActiveIncident) {
      emitEvent('join-alert-room', { alertId: currentActiveIncident._id });
    }
    return () => {
      if (currentActiveIncident) {
        emitEvent('leave-alert-room', { alertId: currentActiveIncident._id });
      }
    };
  }, [currentActiveIncident]);

  // Build markers for map
  useEffect(() => {
    const markers = [];

    // Volunteer marker
    markers.push({
      id: 'vol-marker',
      position: coords,
      type: 'Volunteer',
      label: volunteer?.name || 'You',
      details: 'Your Current Location'
    });

    // Active Incident target marker
    if (currentActiveIncident) {
      const [lng, lat] = currentActiveIncident.location.coordinates;
      markers.push({
        id: 'distress-user-marker',
        position: [lat, lng],
        type: 'User',
        label: currentActiveIncident.userName,
        details: `Distress Call: ${currentActiveIncident.userPhone}`
      });
    }

    setMapMarkers(markers);
  }, [coords, currentActiveIncident, volunteer]);

  // Toggle Online Status
  const handleToggleOnline = async () => {
    const nextStatus = !isOnline;
    try {
      const res = await fetch('http://localhost:5000/api/volunteers/toggle-online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isOnline: nextStatus })
      });
      if (res.ok) {
        setIsOnline(nextStatus);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept Distress SOS Alert
  const acceptIncident = async (alertId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${alertId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentActiveIncident(data.alert);
        // Remove from list or update it
        fetchActiveAlerts(token);
      } else {
        alert(data.error || 'Failed to accept alert');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve/Close Incident
  const resolveIncident = async (statusVal) => {
    if (!currentActiveIncident) return;
    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${currentActiveIncident._id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusVal })
      });
      if (res.ok) {
        setShowReportForm(true); // show post-incident report notes form
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Post Incident Report Form
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!currentActiveIncident || !reportNotes) return;

    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${currentActiveIncident._id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: reportNotes,
          severity: reportSeverity
        })
      });
      if (res.ok) {
        setShowReportForm(false);
        setReportNotes('');
        setCurrentActiveIncident(null);
        fetchActiveAlerts(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate stepping closer to user
  const simulateStepCloser = async () => {
    if (!currentActiveIncident) return;

    const [userLng, userLat] = currentActiveIncident.location.coordinates;
    const volLat = coords[0];
    const volLng = coords[1];

    // Compute delta step (approx 15% closer)
    const nextLat = volLat + (userLat - volLat) * 0.2;
    const nextLng = volLng + (userLng - volLng) * 0.2;

    setCoords([nextLat, nextLng]);

    try {
      // 1. Post to backend to update location
      await fetch('http://localhost:5000/api/volunteers/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ longitude: nextLng, latitude: nextLat })
      });

      // 2. Emit via socket to client room
      emitEvent('volunteer-location-share', {
        alertId: currentActiveIncident._id,
        volunteerId: volunteer.id,
        name: volunteer.name,
        phone: volunteer.phone,
        coords: [nextLng, nextLat]
      });

    } catch (err) {
      console.error('Error updating location:', err);
    }
  };

  // Check if volunteer is pending verification
  const isApproved = profileStatus?.verificationStatus === 'Approved';

  return (
    <div className="grid lg:grid-cols-12 gap-6 w-full">
      
      {/* LEFT COL: Control Panel & Active Request Feed */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Toggle Online & Status Header */}
        <div className="glass-panel p-6 rounded-3xl border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-outfit font-extrabold text-xl text-white">Responder Console</h2>
              <p className="text-xs text-gray-400 mt-1">Manage your online status and active responses</p>
            </div>
            
            <button
              onClick={handleToggleOnline}
              disabled={!isApproved}
              className={`p-1 rounded-full transition-colors ${
                !isApproved ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {isOnline ? (
                <ToggleRight className="h-10 w-10 text-cyan-400" />
              ) : (
                <ToggleLeft className="h-10 w-10 text-gray-600" />
              )}
            </button>
          </div>

          {/* Verification Status Banner */}
          <div className={`mt-5 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
            isApproved
              ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400'
              : profileStatus?.verificationStatus === 'Rejected'
              ? 'bg-red-500/5 border-red-500/20 text-red-400'
              : 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400'
          }`}>
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Verification Status: {profileStatus?.verificationStatus || 'Checking...'}
              </p>
              <p className="mt-1 opacity-80 leading-normal">
                {isApproved
                  ? 'You are verified and online. You will receive active proximity alerts.'
                  : 'Your account is under admin review. Verification is required to respond to SOS requests.'}
              </p>
            </div>
          </div>
        </div>

        {/* Active Distress SOS Alerts Feed */}
        {!currentActiveIncident && !showReportForm && (
          <div className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-4">
            <h3 className="font-outfit font-bold text-base text-white flex items-center justify-between">
              <span>Nearby Emergency Feed</span>
              <span className="text-[10px] text-gray-500 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded font-bold uppercase">
                {activeAlerts.filter(a => a.status === 'Active').length} Active
              </span>
            </h3>

            {activeAlerts.filter(a => a.status === 'Active').length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl text-xs text-gray-500 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-950 flex items-center justify-center text-gray-700">
                  <Shield className="h-5 w-5" />
                </div>
                <p>No active emergencies nearby. Stay alert.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.filter(a => a.status === 'Active').map((alertItem) => (
                  <div
                    key={alertItem._id}
                    className="p-4 bg-red-600/5 border border-red-500/30 rounded-2xl space-y-3 neon-glow-red"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2.5">
                        <div className="bg-red-500/10 p-2 rounded-xl text-red-400 h-fit shrink-0">
                          <AlertOctagon className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-none">
                            Distress SOS: {alertItem.userName}
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            Triggered {new Date(alertItem.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => acceptIncident(alertItem._id)}
                      disabled={!isApproved || !isOnline}
                      className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold font-outfit shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Accept SOS Request &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current accepted incident status tracking */}
        {currentActiveIncident && (
          <div className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-4 neon-glow-cyan">
            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-cyan-500 text-white px-2.5 py-0.5 rounded">
              Active Rescue Operation
            </span>

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-950 flex items-center justify-center text-gray-400 shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">{currentActiveIncident.userName}</h4>
                <a
                  href={`tel:${currentActiveIncident.userPhone}`}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold mt-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call: {currentActiveIncident.userPhone}
                </a>
              </div>
            </div>

            <div className="p-3 bg-gray-950/60 border border-gray-900 rounded-xl text-xs space-y-2">
              <p className="text-gray-400 leading-normal">
                Coordinate and travel to the distress location pin shown on the map. Use the simulator below to mock navigation updates.
              </p>
              <button
                onClick={simulateStepCloser}
                className="w-full py-2 bg-cyan-600/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
              >
                <Compass className="h-3.5 w-3.5" /> Simulate Step Closer (Mock Location)
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => resolveIncident('Resolved')}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-outfit font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
              >
                <Check className="h-4 w-4" /> Reach User / Resolve
              </button>
              <button
                onClick={() => resolveIncident('Cancelled')}
                className="flex-1 py-3 bg-gray-950 border border-gray-800 hover:bg-gray-800 text-gray-300 font-outfit font-bold rounded-xl text-xs transition-all"
              >
                False Alarm
              </button>
            </div>
          </div>
        )}

        {/* Post Incident Review Form */}
        {showReportForm && (
          <div className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-4">
            <h3 className="font-outfit font-extrabold text-base text-white flex items-center gap-1.5">
              <FileText className="h-5 w-5 text-emerald-400" />
              Submit Incident Review
            </h3>
            
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Assistance severity
                </label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="Low">Low (False alarm / minor assistance)</option>
                  <option value="Medium">Medium (Guided safely to safe zone)</option>
                  <option value="High">High (Immediate intervention required)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Report details / Notes
                </label>
                <textarea
                  required
                  rows={4}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Describe your response notes, current status of the user, and if they were escorted to a safe zone..."
                  className="w-full px-3 py-2.5 bg-gray-950/60 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-outfit flex items-center justify-center gap-1.5"
              >
                <Send className="h-4 w-4" /> Submit Report & Close Incident
              </button>
            </form>
          </div>
        )}

      </div>

      {/* RIGHT COL: Map Tracking Panel */}
      <div className="lg:col-span-7 h-[580px] glass-panel p-4 rounded-3xl border border-gray-800 flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="font-outfit font-bold text-sm text-gray-200 flex items-center gap-1.5">
              <Compass className="h-4.5 w-4.5 text-cyan-400" />
              Live Incident Dispatch Map
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-cyan-400' : 'bg-gray-600'} animate-pulse`}></span>
            {isOnline ? 'GPS Active' : 'GPS Offline'}
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

    </div>
  );
}
