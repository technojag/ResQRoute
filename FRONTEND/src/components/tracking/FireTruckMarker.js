import React, { useEffect, useState } from 'react';

const FireTruckMarker = ({
  position = { x: 0, y: 0 },
  status = 'en_route',   // dispatched | en_route | nearby | arrived | on_scene
  vehicleId = 'FT-47',
  eta = '5 min',
  truckType = 'water_tender', // water_tender | ladder | hazmat | rescue
  animated = true,
  size = 'md',
}) => {
  const [pulse, setPulse] = useState(false);
  const [flickerState, setFlicker] = useState(true);

  useEffect(() => {
    if (!animated) return;
    const pulseInterval = setInterval(() => setPulse(p => !p), 1000);
    const flickerInterval = setInterval(() => setFlicker(f => !f), 300);
    return () => { clearInterval(pulseInterval); clearInterval(flickerInterval); };
  }, [animated]);

  const statusConfig = {
    dispatched: { color: '#ff9500', glow: 'rgba(255,149,0,0.5)', label: 'DISPATCHED' },
    en_route:   { color: '#ff2d78', glow: 'rgba(255,45,120,0.5)', label: 'EN ROUTE' },
    nearby:     { color: '#ffd700', glow: 'rgba(255,215,0,0.6)', label: 'APPROACHING' },
    arrived:    { color: '#7fff00', glow: 'rgba(127,255,0,0.7)', label: 'ON SCENE' },
    on_scene:   { color: '#7fff00', glow: 'rgba(127,255,0,0.8)', label: 'FIGHTING FIRE' },
  };

  const truckConfig = {
    water_tender: { emoji: '🚒', label: 'Water Tender' },
    ladder:       { emoji: '🔧', label: 'Ladder Truck' },
    hazmat:       { emoji: '☢️', label: 'HazMat Unit' },
    rescue:       { emoji: '🆘', label: 'Rescue Squad' },
  };

  const sizeConfig = {
    sm: { outer: 36, emoji: '16px', badge: '8px' },
    md: { outer: 50, emoji: '24px', badge: '10px' },
    lg: { outer: 66, emoji: '30px', badge: '12px' },
  };

  const sc = statusConfig[status] || statusConfig.en_route;
  const tc = truckConfig[truckType] || truckConfig.water_tender;
  const sz = sizeConfig[size] || sizeConfig.md;

  // Emergency light effect — alternating red/blue like siren
  const sirenColor = flickerState ? '#ff2d78' : '#00f5ff';

  return (
    <div style={{
      position: 'absolute',
      left: position.x,
      top: position.y,
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      zIndex: 10,
      animation: animated ? 'float 2s ease-in-out infinite' : 'none',
    }}>
      {/* Emergency light glow (siren effect) */}
      {(status === 'en_route' || status === 'nearby') && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: sz.outer * 2.2,
          height: sz.outer * 2.2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${sirenColor}22 0%, transparent 70%)`,
          transition: 'background 0.15s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}

      {/* Outer ring */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: sz.outer * 1.9,
        height: sz.outer * 1.9,
        borderRadius: '50%',
        border: `2px solid ${sc.color}`,
        opacity: pulse ? 0.5 : 0.1,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Marker body */}
      <div style={{
        width: sz.outer,
        height: sz.outer,
        background: `radial-gradient(circle at 40% 35%, rgba(255,45,120,0.2) 0%, rgba(4,9,15,0.97) 70%)`,
        border: `2px solid ${sc.color}`,
        borderRadius: '8px', // Square-ish for fire truck (different from ambulance circle)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 ${pulse ? 35 : 20}px ${sc.glow}, 0 0 ${pulse ? 70 : 40}px rgba(255,45,120,0.15), inset 0 1px 0 rgba(255,255,255,0.08)`,
        transition: 'box-shadow 0.5s ease',
        position: 'relative',
        zIndex: 2,
      }}>
        <span style={{
          fontSize: sz.emoji,
          filter: `drop-shadow(0 0 8px ${sc.color})`,
          userSelect: 'none',
        }}>
          {tc.emoji}
        </span>

        {/* Siren lights (top corners) */}
        {(status === 'en_route' || status === 'nearby') && (
          <>
            <div style={{
              position: 'absolute',
              top: '2px', left: '4px',
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: flickerState ? '#ff2d78' : 'transparent',
              boxShadow: flickerState ? '0 0 6px #ff2d78' : 'none',
              transition: 'all 0.15s',
            }} />
            <div style={{
              position: 'absolute',
              top: '2px', right: '4px',
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: !flickerState ? '#00f5ff' : 'transparent',
              boxShadow: !flickerState ? '0 0 6px #00f5ff' : 'none',
              transition: 'all 0.15s',
            }} />
          </>
        )}

        {/* Status dot */}
        <div style={{
          position: 'absolute',
          bottom: '-4px', right: '-4px',
          width: '12px', height: '12px',
          background: sc.color,
          borderRadius: '50%',
          border: '2px solid #020408',
          boxShadow: `0 0 10px ${sc.color}`,
          animation: 'pulse-neon 1s ease infinite',
        }} />
      </div>

      {/* Tooltip label */}
      <div style={{
        marginTop: '2px',
        padding: '4px 10px',
        background: 'rgba(4,9,15,0.97)',
        border: `1px solid ${sc.color}`,
        borderRadius: '3px',
        boxShadow: `0 0 15px rgba(255,45,120,0.3)`,
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: sz.badge,
          color: sc.color,
          fontWeight: '700',
          letterSpacing: '1px',
        }}>
          {vehicleId}
        </div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '8px',
          color: '#5a7a9a',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          {tc.label} · ETA {eta}
        </div>
      </div>
    </div>
  );
};

export default FireTruckMarker;