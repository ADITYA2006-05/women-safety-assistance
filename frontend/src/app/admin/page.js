'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, AlertOctagon, HeartHandshake, Percent, Clock, Check, X, ShieldAlert, Plus, MapPin, Phone } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { API_BASE_URL } from '@/config';

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  // Mounted state to prevent SSR mismatch in Recharts
  const [mounted, setMounted] = useState(false);

  // States
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // New Resource Form
  const [newResource, setNewResource] = useState({
    name: '',
    type: 'SafeZone',
    longitude: '',
    latitude: '',
    address: '',
    phone: ''
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingVols, setLoadingVols] = useState(true);

  useEffect(() => {
    setMounted(true);

    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (!storedUser || !storedToken) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'Admin') {
      router.push(parsedUser.role === 'Volunteer' ? '/volunteer' : '/dashboard');
      return;
    }

    setToken(storedToken);
    fetchData(storedToken);
  }, [router]);

  const fetchData = (authToken) => {
    fetchStats(authToken);
    fetchVolunteers(authToken);
    fetchActiveAlerts(authToken);
    fetchUsers(authToken);
  };

  const fetchStats = async (authToken) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setKpis(data.kpis);
        setChartData(data.chartData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchVolunteers = async (authToken) => {
    setLoadingVols(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/volunteers`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) setVolunteers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVols(false);
    }
  };

  const fetchActiveAlerts = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts/active`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) setActiveAlerts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Verify / Approve / Reject volunteer profile
  const verifyVolunteer = async (volunteerId, targetStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/volunteers/${volunteerId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      if (res.ok) {
        // Refresh volunteers list and stats
        fetchVolunteers(token);
        fetchStats(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Safe Zone/Resource
  const handleCreateResource = async (e) => {
    e.preventDefault();
    const { name, type, longitude, latitude, address, phone } = newResource;

    if (!name || !longitude || !latitude || !address || !phone) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          type,
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          address,
          phone
        })
      });
      if (res.ok) {
        alert('Safety resource created successfully!');
        setNewResource({
          name: '',
          type: 'SafeZone',
          longitude: '',
          latitude: '',
          address: '',
          phone: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      
      {/* HEADER TITLE */}
      <div>
        <h2 className="font-outfit font-extrabold text-2xl text-white">System Operations Board</h2>
        <p className="text-xs text-gray-400 mt-1">Real-time alerts monitor, verified volunteer logs and metrics</p>
      </div>

      {/* KPI SUMMARY CARDS */}
      {loadingStats ? (
        <div className="text-center py-6 text-xs text-gray-500">Loading system KPIs...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Card 1 */}
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Registered Users</span>
              <h3 className="text-xl font-extrabold font-outfit text-white mt-1.5">{kpis?.registeredUsers}</h3>
            </div>
            <div className="bg-rose-500/10 p-2.5 rounded-xl text-rose-400">
              <Users className="h-5 w-5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SOS Triggered</span>
              <h3 className="text-xl font-extrabold font-outfit text-white mt-1.5">{kpis?.alertsTriggered}</h3>
            </div>
            <div className="bg-red-500/10 p-2.5 rounded-xl text-red-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Avg Response</span>
              <h3 className="text-xl font-extrabold font-outfit text-white mt-1.5">{kpis?.averageResponseTime}</h3>
            </div>
            <div className="bg-cyan-500/10 p-2.5 rounded-xl text-cyan-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assistance Rate</span>
              <h3 className="text-xl font-extrabold font-outfit text-white mt-1.5">{kpis?.successRate}</h3>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Alerts</span>
              <h3 className="text-xl font-extrabold font-outfit text-red-500 mt-1.5 animate-pulse">
                {kpis?.activeAlerts + kpis?.acceptedAlerts}
              </h3>
            </div>
            <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-400">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>

        </div>
      )}

      {/* MID SECTION: Live Alerts and Analytics Line chart */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Live SOS Alerts Monitor */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-gray-800 flex flex-col justify-between">
          <h3 className="font-outfit font-bold text-base text-white mb-4 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            Live Emergency Alerts Monitor
          </h3>

          {activeAlerts.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-gray-800 rounded-2xl text-xs text-gray-500">
              No active distress alerts currently reported. Everything is safe.
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px]">
              {activeAlerts.map((alertItem) => (
                <div
                  key={alertItem._id}
                  className={`p-4 border rounded-2xl flex items-center justify-between ${
                    alertItem.status === 'Accepted'
                      ? 'bg-cyan-500/5 border-cyan-500/30'
                      : 'bg-red-500/5 border-red-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{alertItem.userName}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        alertItem.status === 'Accepted' ? 'bg-cyan-500 text-black' : 'bg-red-500 text-white'
                      }`}>
                        {alertItem.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Phone: {alertItem.userPhone}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      Distress Loc: [{alertItem.location.coordinates[1].toFixed(5)}, {alertItem.location.coordinates[0].toFixed(5)}]
                    </p>
                  </div>
                  {alertItem.responderName && (
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 font-bold block">Assigned Volunteer</span>
                      <span className="text-xs text-cyan-400 font-semibold">{alertItem.responderName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Line Chart */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-gray-800">
          <h3 className="font-outfit font-bold text-base text-white mb-4">Alert Trigger Trends (Weekly)</h3>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="alerts"
                  stroke="#ef4444"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* LOWER SECTION: Volunteer Approvals & Safe Zones creation */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Volunteer Review Panel */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-gray-800">
          <h3 className="font-outfit font-bold text-base text-white mb-4">Volunteer Verification Directory</h3>

          {loadingVols ? (
            <div className="text-center py-4 text-xs text-gray-500">Loading directory...</div>
          ) : volunteers.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-800 rounded-2xl text-xs text-gray-500">
              No registered volunteers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="pb-3 font-semibold">Volunteer Name</th>
                    <th className="pb-3 font-semibold">Contact Info</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {volunteers.map((vol) => (
                    <tr key={vol._id} className="hover:bg-gray-950/20">
                      <td className="py-4.5 font-bold text-white">{vol.name}</td>
                      <td className="py-4.5">
                        <p>{vol.email}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{vol.phone}</p>
                      </td>
                      <td className="py-4.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                          vol.verificationStatus === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : vol.verificationStatus === 'Rejected'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {vol.verificationStatus}
                        </span>
                      </td>
                      <td className="py-4.5 text-right space-x-1.5">
                        {vol.verificationStatus !== 'Approved' && (
                          <button
                            onClick={() => verifyVolunteer(vol._id, 'Approved')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold transition-all inline-flex items-center gap-0.5"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                        )}
                        {vol.verificationStatus !== 'Rejected' && (
                          <button
                            onClick={() => verifyVolunteer(vol._id, 'Rejected')}
                            className="px-2 py-1 bg-gray-900 border border-gray-800 hover:bg-red-950/20 hover:border-red-950 hover:text-red-400 rounded text-[10px] font-semibold transition-all inline-flex items-center gap-0.5"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Safe Zone/Resource Form */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-gray-800">
          <h3 className="font-outfit font-bold text-base text-white mb-4 flex items-center gap-1.5">
            <Plus className="h-5 w-5 text-red-500" />
            Add Safe Zone / Station
          </h3>

          <form onSubmit={handleCreateResource} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Resource Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Koramangala Station"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Type
                </label>
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="SafeZone">Safe Zone</option>
                  <option value="PoliceStation">Police Station</option>
                  <option value="Hospital">Hospital</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  placeholder="77.6245"
                  value={newResource.longitude}
                  onChange={(e) => setNewResource({ ...newResource, longitude: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  placeholder="12.9348"
                  value={newResource.latitude}
                  onChange={(e) => setNewResource({ ...newResource, latitude: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 80..."
                  value={newResource.phone}
                  onChange={(e) => setNewResource({ ...newResource, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Address Details
                </label>
                <input
                  type="text"
                  required
                  placeholder="80 Feet Rd, Koramangala"
                  value={newResource.address}
                  onChange={(e) => setNewResource({ ...newResource, address: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold font-outfit shadow-md transition-all active:scale-[0.98]"
            >
              Register Safety Resource
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
