import React, { useState, useEffect } from 'react';
import { LiveMap, ETADisplay } from '../components/tracking/LiveMap';
import Card from '../components/common/Card';
import LaneClearAlert from '../components/notifications/LaneClearAlert';

const TrackingScreen = ({ onNavigate, params = {} }) => {
  const { type = 'medical', booking = {} } = params;
  const [showAlert, setShowAlert] = useState(true);
  const [status, setStatus] = useState('dispatched');
  const accentColor = type === 'fire' ? '#ff2d78' : '#00f5ff';
  const accentRGB = type === 'fire' ? '255,45,120' : '0,245,255';

  const statusFlow = ['dispatched', 'en_route', 'nearby', 'arrived'];
  const statusLabels = {
    dispatched: { label: 'UNIT DISPATCHED', color: '#ff9500', desc: 'Emergency unit has been assigned and is leaving the station.' },
    en_route: { label: 'EN ROUTE', color: '#00f5ff', desc: 'Vehicle is actively navigating to your location via green corridor.' },
    nearby: { label: 'APPROACHING', color: '#7fff00', desc: 'Less than 1km away. Please clear path and keep line open.' },
    arrived: { label: 'ARRIVED', color: '#7fff00', desc: 'Emergency unit has reached your location.' },
  };

  useEffect(() => {
    const timers = [
      setTimeout(() => setStatus('en_route'), 4000),
      setTimeout(() => setStatus('nearby'), 14000),
      setTimeout(() => setStatus('arrived'), 22000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const s = statusLabels[status];

  return (
    <div style={{ minHeight: '100vh', background: '#020408', color: '#e8f4fd', fontFamily: "'Rajdhani', sans-serif" }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(${accentRGB},0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(${accentRGB},0.02) 1px, transparent 1px)`, backgroundSize: '50px 50px', pointerEvents: 'none' }} />

      {/* Alert */}
      {showAlert && <LaneClearAlert vehicleType={type === 'fire' ? 'firetruck' : 'ambulance'} onDismiss={() => setShowAlert(false)} />}

      {/* Header */}
      <div style={{
        padding: '16px 32px', borderBottom: `1px solid rgba(${accentRGB},0.15)`,
        background: 'rgba(2,4,8,0.95)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '30px', filter: `drop-shadow(0 0 8px ${accentColor})` }}>
            {type === 'fire' ? '🚒' : '🚑'}
          </div>
          <div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: '800', color: accentColor, letterSpacing: '2px', textTransform: 'uppercase' }}>
              LIVE TRACKING
            </div>
            <div style={{ fontSize: '12px', color: '#2a4a6a', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '1.5px' }}>
              {type === 'fire' ? 'FIRE UNIT EN-47' : 'AMBULANCE AMB-23'} · BOOKING #RRQ-{Math.floor(Math.random() * 90000 + 10000)}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px',
          background: `rgba(${accentRGB},0.08)`,
          border: `1px solid ${s.color}`,
          borderRadius: '6px',
          boxShadow: `0 0 20px rgba(${accentRGB},0.2)`,
          animation: status === 'arrived' ? 'glow-pulse 1s ease infinite' : 'none',
        }}>
          <div style={{ width: '8px', height: '8px', background: s.color, borderRadius: '50%', boxShadow: `0 0 8px ${s.color}`, animation: 'pulse-neon 1s ease infinite' }} />
          <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: s.color, fontWeight: '800', letterSpacing: '1.5px' }}>
            {s.label}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Status timeline */}
        <div style={{
          padding: '16px 20px',
          background: `rgba(${accentRGB},0.04)`,
          border: `1px solid rgba(${accentRGB},0.15)`,
          borderRadius: '8px',
          display: 'flex', gap: '0px',
        }}>
          {statusFlow.map((st, i) => {
            const isActive = statusFlow.indexOf(status) >= i;
            const isCurrent = status === st;
            return (
              <div key={st} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i < statusFlow.length - 1 && (
                  <div style={{
                    position: 'absolute', top: '14px', left: '50%', right: '-50%',
                    height: '2px',
                    background: statusFlow.indexOf(status) > i ? accentColor : 'rgba(0,245,255,0.1)',
                    transition: 'background 0.5s',
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: '28px', height: '28px',
                  background: isActive ? `rgba(${accentRGB},0.2)` : 'rgba(4,9,15,0.8)',
                  border: `2px solid ${isActive ? accentColor : 'rgba(0,245,255,0.15)'}`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1, position: 'relative',
                  boxShadow: isCurrent ? `0 0 15px rgba(${accentRGB},0.5)` : 'none',
                  transition: 'all 0.5s',
                }}>
                  {isActive && <div style={{ width: '8px', height: '8px', background: accentColor, borderRadius: '50%' }} />}
                </div>
                <div style={{ marginTop: '8px', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif", color: isActive ? accentColor : '#2a4a6a', textAlign: 'center', transition: 'color 0.3s', fontWeight: isCurrent ? '800' : '400' }}>
                  {statusLabels[st].label.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Map */}
        <Card title="Live Map" badge="REAL-TIME" glow={type === 'fire' ? 'secondary' : 'primary'}>
          <LiveMap type={type} />
        </Card>

        {/* ETA */}
        <Card title="ETA & Vehicle Info" glow={type === 'fire' ? 'secondary' : 'primary'}>
          <ETADisplay
            eta={status === 'arrived' ? 0 : status === 'nearby' ? 1 : status === 'en_route' ? 5 : 8}
            distance={status === 'arrived' ? '0 m' : status === 'nearby' ? '0.8 km' : '3.8 km'}
            vehicleId={type === 'fire' ? 'FT-47' : 'AMB-23'}
            type={type}
          />
        </Card>

        {/* Status message */}
        <div style={{
          padding: '16px 20px',
          background: `rgba(${accentRGB},0.04)`,
          border: `1px solid rgba(${accentRGB},0.15)`,
          borderRadius: '8px',
          fontSize: '14px', color: '#e8f4fd', fontFamily: "'Rajdhani', sans-serif",
          lineHeight: '1.6',
        }}>
          <span style={{ color: accentColor, fontWeight: '700' }}>◆ STATUS: </span>
          {s.desc}
        </div>

        {/* Driver contact */}
        <Card title="Driver Contact" glow="none">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', background: `rgba(${accentRGB},0.1)`, border: `1px solid rgba(${accentRGB},0.3)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                👨‍✈️
              </div>
              <div>
                <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px', fontWeight: '700', color: '#e8f4fd' }}>
                  {type === 'fire' ? 'Suresh Kumar' : 'Rajan Patel'}
                </div>
                <div style={{ fontSize: '12px', color: '#5a7a9a' }}>
                  {type === 'fire' ? 'Chief Fire Officer · 12 yrs exp' : 'Paramedic · Certified ALS'}
                </div>
              </div>
            </div>
            <button style={{
              padding: '10px 20px',
              background: `rgba(${accentRGB},0.1)`,
              border: `1px solid rgba(${accentRGB},0.4)`,
              borderRadius: '6px', color: accentColor,
              fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: '700',
              letterSpacing: '1px', cursor: 'pointer',
            }}>
              📞 CALL
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TrackingScreen;