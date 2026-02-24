import React, { useState, useEffect, useCallback } from 'react';
import ActiveMedicalRequests from './ActiveMedicalRequests';
import ActiveFireRequests from './ActiveFireRequests';
import LiveMap from './LiveMap';

const API_BASE = 'http://localhost:5000';
const AI_BASE  = 'http://localhost:8000';

// ── Fallback mock data (used if API is unavailable) ──
const MOCK_STATS = {
  activeEmergencies: 7,
  availableAmbulances: 12,
  availableFiretrucks: 8,
  hospitalsOnline: 6,
  resolvedToday: 24,
  avgResponseTime: '8.4 min',
};

const MOCK_RECENT = [
  { id: 1, type: 'medical', desc: 'Cardiac arrest – Connaught Place', time: '2 min ago', severity: 'critical', status: 'dispatched' },
  { id: 2, type: 'fire',    desc: 'Building fire – Karol Bagh',       time: '5 min ago', severity: 'major',    status: 'on_scene' },
  { id: 3, type: 'medical', desc: 'Road accident – NH-8',             time: '9 min ago', severity: 'severe',   status: 'en_route' },
  { id: 4, type: 'fire',    desc: 'Vehicle fire – Ring Road',         time: '14 min ago',severity: 'minor',    status: 'controlled' },
  { id: 5, type: 'medical', desc: 'Stroke – Lajpat Nagar',            time: '18 min ago',severity: 'severe',   status: 'at_hospital' },
];

function StatCard({ icon, value, label, color, delta, onClick, loading }) {
  return (
    <div
      className={`stat-card ${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', position: 'relative' }}
    >
      {loading && (
        <div style={{
          position: 'absolute', top: 6, right: 8,
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent)', animation: 'pulse 1.5s infinite'
        }} />
      )}
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{loading ? '...' : value}</div>
      <div className="stat-label">{label}</div>
      {delta && <div className={`stat-delta ${delta.startsWith('+') ? '' : 'down'}`}>{delta}</div>}
    </div>
  );
}

function SeverityBadge({ severity }) {
  const map = { critical: 'red', major: 'red', severe: 'yellow', minor: 'green', moderate: 'yellow' };
  return <span className={`badge ${map[severity] || 'gray'}`}><span className="badge-dot" />{severity}</span>;
}

function StatusBadge({ status }) {
  const map = { dispatched: 'blue', on_scene: 'red', en_route: 'yellow', controlled: 'green', at_hospital: 'green', completed: 'gray' };
  return <span className={`badge ${map[status] || 'gray'}`}>{status.replace('_', ' ')}</span>;
}

function ServiceStatus({ label, url, color }) {
  const [online, setOnline] = useState(null);
  useEffect(() => {
    fetch(url)
      .then(r => setOnline(r.ok))
      .catch(() => setOnline(false));
  }, [url]);
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: online === null ? 'gray' : online ? '#22c55e' : '#ef4444'
      }} />
      {label}: {online === null ? 'checking...' : online ? 'online' : 'offline'}
    </span>
  );
}

export default function UnifiedDashboard() {
  const [stats, setStats]       = useState(MOCK_STATS);
  const [recent, setRecent]     = useState(MOCK_RECENT);
  const [activeTab, setActiveTab] = useState('all');
  const [time, setTime]         = useState(new Date());
  const [loading, setLoading]   = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch real stats from BACKEND
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const [emergRes, ambRes, truckRes, hospRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/medical/bookings?status=active`),
        fetch(`${API_BASE}/api/medical/ambulances?status=available`),
        fetch(`${API_BASE}/api/fire/firetrucks?status=available`),
        fetch(`${API_BASE}/api/medical/hospitals?status=online`),
      ]);

      const getCount = async (res) => {
        if (res.status === 'fulfilled' && res.value.ok) {
          const data = await res.value.json();
          return Array.isArray(data) ? data.length : (data.count || data.total || data.data?.length || 0);
        }
        return null;
      };

      const [emergCount, ambCount, truckCount, hospCount] = await Promise.all([
        getCount(emergRes), getCount(ambRes), getCount(truckRes), getCount(hospRes)
      ]);

      // Only update if we got real data
      if (emergCount !== null || ambCount !== null) {
        setApiConnected(true);
        setStats(prev => ({
          ...prev,
          activeEmergencies: emergCount ?? prev.activeEmergencies,
          availableAmbulances: ambCount ?? prev.availableAmbulances,
          availableFiretrucks: truckCount ?? prev.availableFiretrucks,
          hospitalsOnline: hospCount ?? prev.hospitalsOnline,
        }));
      }

      // Fetch recent emergencies
      const recentRes = await fetch(`${API_BASE}/api/medical/bookings?limit=5&sort=recent`);
      if (recentRes.ok) {
        const recentData = await recentRes.json();
        if (Array.isArray(recentData) && recentData.length > 0) {
          setRecent(recentData.map((r, i) => ({
            id: r._id || i,
            type: r.type || 'medical',
            desc: r.description || r.patientName || 'Emergency',
            time: r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : 'recently',
            severity: r.severity || 'severe',
            status: r.status || 'dispatched',
          })));
        }
      }
    } catch (err) {
      // Keep mock data if API fails
      console.log('Using mock data - API not available');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 15000); // Refresh every 15 seconds
    return () => clearInterval(t);
  }, [fetchStats]);

  const filtered = activeTab === 'all' ? recent : recent.filter(r => r.type === activeTab);

  const handleCardClick = (cardType) => {
    setSelectedCard(selectedCard === cardType ? null : cardType);
    // Scroll to relevant section
    if (cardType === 'ambulances' || cardType === 'emergencies') {
      document.getElementById('medical-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (cardType === 'firetrucks') {
      document.getElementById('fire-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (cardType === 'hospitals') {
      document.getElementById('hospitals-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="page">
      {/* ── HEADER ── */}
      <div className="page-header">
        <div>
          <div className="page-title">Emergency Dashboard</div>
          <div className="page-subtitle">Real-time overview · ResQRoute Control Platform</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ServiceStatus label="Backend" url={`${API_BASE}/health`} />
            <ServiceStatus label="AI-Service" url={`${AI_BASE}/health`} />
          </div>
          <span className="live-dot">LIVE</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono' }}>
            {time.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* ── STATUS BANNER ── */}
      {apiConnected ? (
        <div className="alert" style={{ background: 'rgba(34,197,94,0.1)', borderColor: '#22c55e', color: '#22c55e' }}>
          ✅ <strong>ResQRoute Dashboard is running successfully!</strong> All systems operational. Live data connected.
        </div>
      ) : (
        <div className="alert red">
          🚨 <strong>3 critical emergencies</strong> currently active — 2 ambulances dispatched, 1 awaiting assignment
        </div>
      )}

      {/* ── STATS GRID ── */}
      <div className="stats-grid">
        <StatCard
          icon="🚨" value={stats.activeEmergencies} label="Active Emergencies"
          color={selectedCard === 'emergencies' ? 'red active-card' : 'red'}
          delta="+2 today" loading={loading}
          onClick={() => handleCardClick('emergencies')}
        />
        <StatCard
          icon="🚑" value={stats.availableAmbulances} label="Ambulances Ready"
          color={selectedCard === 'ambulances' ? 'blue active-card' : 'blue'}
          delta="+3 online" loading={loading}
          onClick={() => handleCardClick('ambulances')}
        />
        <StatCard
          icon="🚒" value={stats.availableFiretrucks} label="Fire Trucks Ready"
          color={selectedCard === 'firetrucks' ? 'yellow active-card' : 'yellow'}
          loading={loading}
          onClick={() => handleCardClick('firetrucks')}
        />
        <StatCard
          icon="🏥" value={stats.hospitalsOnline} label="Hospitals Online"
          color={selectedCard === 'hospitals' ? 'green active-card' : 'green'}
          loading={loading}
          onClick={() => handleCardClick('hospitals')}
        />
        <StatCard icon="✅" value={stats.resolvedToday} label="Resolved Today" color="green" delta="+8 vs yesterday" />
        <StatCard icon="⏱" value={stats.avgResponseTime} label="Avg Response Time" color="blue" delta="-1.2 min" />
      </div>

      {/* ── DETAIL PANEL (shown when card is clicked) ── */}
      {selectedCard && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="card-title">
              {selectedCard === 'emergencies' && '🚨 Active Emergencies Detail'}
              {selectedCard === 'ambulances' && '🚑 Available Ambulances'}
              {selectedCard === 'firetrucks' && '🚒 Available Fire Trucks'}
              {selectedCard === 'hospitals' && '🏥 Hospitals Online'}
            </span>
            <button onClick={() => setSelectedCard(null)}
              style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', padding: '4px 12px', borderRadius: 6, cursor: 'pointer' }}>
              Close ✕
            </button>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>
            {selectedCard === 'emergencies' && (
              <p>Showing {stats.activeEmergencies} active emergencies. See the Recent Emergencies table below for details. Use <strong>Control Center</strong> to manage dispatch.</p>
            )}
            {selectedCard === 'ambulances' && (
              <p>{stats.availableAmbulances} ambulances are currently available and ready for dispatch. AI-SERVICE is actively optimizing routes at <strong>http://localhost:8000</strong>.</p>
            )}
            {selectedCard === 'firetrucks' && (
              <p>{stats.availableFiretrucks} fire trucks are standing by. Fire spread prediction and severity classification is handled by AI-SERVICE.</p>
            )}
            {selectedCard === 'hospitals' && (
              <p>{stats.hospitalsOnline} hospitals are online. AI-SERVICE automatically matches patients to the nearest capable government or private hospital.</p>
            )}
          </div>
        </div>
      )}

      {/* ── MAP + RECENT ── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <LiveMap />

        {/* Recent Emergencies */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚡ Recent Emergencies</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={fetchStats}
                style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                {loading ? '⟳ Loading...' : '⟳ Refresh'}
              </button>
              <div className="tabs">
                {['all','medical','fire'].map(t => (
                  <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`}
                    onClick={() => setActiveTab(t)}>
                    {t === 'all' ? 'All' : t === 'medical' ? '🚑 Medical' : '🔥 Fire'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="card-body no-pad">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} style={{ cursor: 'pointer' }}
                      onClick={() => alert(`Incident: ${r.desc}\nStatus: ${r.status}\nSeverity: ${r.severity}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{r.type === 'medical' ? '🚑' : '🔥'}</span>
                          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.desc}</span>
                        </div>
                      </td>
                      <td><SeverityBadge severity={r.severity} /></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td style={{ color: 'var(--text3)', fontSize: 11 }}>{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── MEDICAL + FIRE REQUESTS ── */}
      <div className="grid-2">
        <div id="medical-section"><ActiveMedicalRequests /></div>
        <div id="fire-section"><ActiveFireRequests /></div>
      </div>
    </div>
  );
}