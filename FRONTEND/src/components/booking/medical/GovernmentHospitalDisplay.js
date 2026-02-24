import React, { useEffect, useState } from 'react';

const GovernmentHospitalDisplay = ({ hospital }) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), 600);
    return () => clearTimeout(t);
  }, [hospital?.id]);

  // Default mock if no data passed
  const h = hospital || {
    name: 'AIIMS - All India Institute of Medical Sciences',
    distance: '3.8 km',
    eta: '8 min',
    type: 'Government / Central',
    specialties: ['Trauma', 'Cardiology', 'Neurology', 'ICU'],
    beds: { total: 2500, available: 47 },
    rating: '4.6',
    scheme: 'Ayushman Bharat',
    address: 'Ansari Nagar, New Delhi - 110029',
    status: 'READY',
  };

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(145deg, rgba(127,255,0,0.06) 0%, rgba(4,9,15,0.9) 100%)',
      border: '1px solid rgba(127,255,0,0.3)',
      borderRadius: '8px',
      boxShadow: '0 0 25px rgba(127,255,0,0.1)',
      position: 'relative',
      overflow: 'hidden',
      transform: animating ? 'scale(0.98)' : 'scale(1)',
      transition: 'transform 0.3s ease',
    }}>
      {/* Top glow bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #7fff00, transparent)',
      }} />

      {/* AUTO-SELECTED badge */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '14px',
      }}>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '10px', fontWeight: '700', letterSpacing: '2.5px',
          textTransform: 'uppercase', color: '#7fff00',
        }}>
          ◆ AUTO-SELECTED HOSPITAL
        </div>
        <div style={{
          padding: '4px 12px',
          background: 'rgba(127,255,0,0.1)',
          border: '1px solid rgba(127,255,0,0.4)',
          color: '#7fff00',
          borderRadius: '3px',
          fontSize: '10px', fontWeight: '800',
          letterSpacing: '2px',
          fontFamily: "'Exo 2', sans-serif",
          animation: 'pulse-neon 2s ease infinite',
        }}>
          {h.status}
        </div>
      </div>

      {/* Hospital name */}
      <div style={{
        fontFamily: "'Exo 2', sans-serif",
        fontSize: '18px', fontWeight: '800',
        color: '#e8f4fd', marginBottom: '4px',
        letterSpacing: '0.5px',
      }}>
        {h.name}
      </div>
      <div style={{ fontSize: '13px', color: '#5a7a9a', marginBottom: '16px', fontFamily: "'Rajdhani', sans-serif" }}>
        📍 {h.address}
      </div>

      {/* Key stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Distance', value: h.distance, color: '#00f5ff' },
          { label: 'ETA', value: h.eta, color: '#7fff00' },
          { label: 'Beds Free', value: h.beds?.available || '--', color: '#ff9500' },
          { label: 'Rating', value: `★ ${h.rating}`, color: '#ffd700' },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '10px',
            background: 'rgba(4,9,15,0.7)',
            border: '1px solid rgba(0,245,255,0.08)',
            borderRadius: '6px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '18px', fontWeight: '700',
              color: stat.color,
              marginBottom: '4px',
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '10px', color: '#2a4a6a', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Scheme badge + type */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{
          padding: '6px 14px',
          background: 'rgba(127,255,0,0.1)',
          border: '1px solid rgba(127,255,0,0.3)',
          borderRadius: '4px',
          color: '#7fff00',
          fontSize: '12px', fontWeight: '700',
          fontFamily: "'Rajdhani', sans-serif",
          letterSpacing: '0.5px',
        }}>
          🏥 {h.type}
        </div>
        <div style={{
          padding: '6px 14px',
          background: 'rgba(255,215,0,0.08)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: '4px',
          color: '#ffd700',
          fontSize: '12px', fontWeight: '700',
          fontFamily: "'Rajdhani', sans-serif",
          letterSpacing: '0.5px',
        }}>
          ✅ {h.scheme} — COST FREE
        </div>
      </div>

      {/* Specialties */}
      <div>
        <div style={{
          fontSize: '10px', fontWeight: '700', letterSpacing: '2px',
          textTransform: 'uppercase', color: '#2a4a6a',
          fontFamily: "'Exo 2', sans-serif", marginBottom: '8px',
        }}>
          Specialties Available
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(h.specialties || []).map(spec => (
            <span key={spec} style={{
              padding: '4px 10px',
              background: 'rgba(0,245,255,0.06)',
              border: '1px solid rgba(0,245,255,0.15)',
              color: '#00f5ff',
              borderRadius: '3px',
              fontSize: '11px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: '600',
            }}>
              {spec}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GovernmentHospitalDisplay;