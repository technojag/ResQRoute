import React, { useEffect, useState } from 'react';

const AmbulanceMarker = ({
  position = { x: 0, y: 0 },
  status = 'en_route',   // dispatched | en_route | nearby | arrived
  vehicleId = 'AMB-23',
  eta = '8 min',
  animated = true,
  size = 'md',           // sm | md | lg
}) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(interval);
  }, [animated]);

  const statusConfig = {
    dispatched: { color: '#ff9500', glow: 'rgba(255,149,0,0.5)', label: 'DISPATCHED', ring: true },
    en_route:   { color: '#00f5ff', glow: 'rgba(0,245,255,0.5)', label: 'EN ROUTE',   ring: true },
    nearby:     { color: '#7fff00', glow: 'rgba(127,255,0,0.6)', label: 'NEARBY',     ring: true },
    arrived:    { color: '#7fff00', glow: 'rgba(127,255,0,0.8)', label: 'ARRIVED',    ring: false },
  };

  const sizeConfig = {
    sm: { outer: 36, inner: 26, emoji: '18px', badge: '8px' },
    md: { outer: 48, inner: 36, emoji: '22px', badge: '10px' },
    lg: { outer: 64, inner: 48, emoji: '28px', badge: '12px' },
  };

  const sc = statusConfig[status] || statusConfig.en_route;
  const sz = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        zIndex: 10,
        animation: animated ? 'float 2.5s ease-in-out infinite' : 'none',
      }}
    >
      {/* Outer pulse ring */}
      {sc.ring && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: sz.outer * 1.8,
          height: sz.outer * 1.8,
          borderRadius: '50%',
          border: `2px solid ${sc.color}`,
          opacity: pulse ? 0.6 : 0.1,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'none',
        }} />
      )}

      {/* Second pulse ring */}
      {sc.ring && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: sz.outer * 1.4,
          height: sz.outer * 1.4,
          borderRadius: '50%',
          border: `1.5px solid ${sc.color}`,
          opacity: pulse ? 0.3 : 0.7,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'none',
        }} />
      )}

      {/* Marker body */}
      <div style={{
        width: sz.outer,
        height: sz.outer,
        background: `radial-gradient(circle at 40% 35%, rgba(${sc.color === '#00f5ff' ? '0,245,255' : sc.color === '#7fff00' ? '127,255,0' : '255,149,0'},0.25) 0%, rgba(4,9,15,0.95) 70%)`,
        border: `2px solid ${sc.color}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 ${pulse ? 30 : 20}px ${sc.glow}, 0 0 ${pulse ? 60 : 40}px rgba(${sc.color === '#00f5ff' ? '0,245,255' : '127,255,0'},0.2), inset 0 1px 0 rgba(255,255,255,0.1)`,
        transition: 'box-shadow 0.6s ease',
        position: 'relative',
        zIndex: 2,
      }}>
        <span style={{
          fontSize: sz.emoji,
          filter: `drop-shadow(0 0 6px ${sc.color})`,
          userSelect: 'none',
        }}>
          🚑
        </span>

        {/* Status dot */}
        <div style={{
          position: 'absolute',
          bottom: '1px',
          right: '1px',
          width: '10px',
          height: '10px',
          background: sc.color,
          borderRadius: '50%',
          border: '2px solid #020408',
          boxShadow: `0 0 8px ${sc.color}`,
          animation: sc.ring ? 'pulse-neon 1s ease infinite' : 'none',
        }} />
      </div>

      {/* Tooltip */}
      <div style={{
        padding: '4px 10px',
        background: 'rgba(4,9,15,0.95)',
        border: `1px solid ${sc.color}`,
        borderRadius: '3px',
        boxShadow: `0 0 12px rgba(${sc.color === '#00f5ff' ? '0,245,255' : '127,255,0'},0.3)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: sz.badge,
          color: sc.color,
          fontWeight: '700',
          letterSpacing: '1px',
        }}>
          {vehicleId}
        </span>
        <span style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '8px',
          color: '#5a7a9a',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>
          {sc.label} · {eta}
        </span>
      </div>

      {/* Connector line to tooltip */}
      <div style={{
        position: 'absolute',
        top: sz.outer,
        width: '1px',
        height: '4px',
        background: sc.color,
        opacity: 0.5,
      }} />
    </div>
  );
};

export default AmbulanceMarker;