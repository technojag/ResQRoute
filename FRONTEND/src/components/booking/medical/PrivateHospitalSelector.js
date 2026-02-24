import React, { useState } from 'react';

const mockHospitals = [
  { id: 'apollo', name: 'Apollo Hospital', match: 95, dist: '5.2 km', eta: '11 min', cost: '₹25,000+', rating: 4.8, insurance: true, specialties: ['Cardiology', 'ICU', 'Neurology'], tier: 'AI PICK #1' },
  { id: 'fortis', name: 'Fortis Healthcare', match: 90, dist: '7.1 km', eta: '14 min', cost: '₹30,000+', rating: 4.7, insurance: true, specialties: ['Cardiology', 'Trauma'], tier: 'AI PICK #2' },
  { id: 'max', name: 'Max Super Speciality', match: 85, dist: '9.4 km', eta: '18 min', cost: '₹35,000+', rating: 4.6, insurance: true, specialties: ['Multi-Specialty'], tier: 'AI PICK #3' },
];

const PrivateHospitalSelector = ({ selected, onSelect }) => {
  const [mode, setMode] = useState('ai'); // ai | manual
  const [hovered, setHovered] = useState(null);

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {[
          { id: 'ai', label: '🤖 AI Recommended', desc: 'Best match for patient' },
          { id: 'manual', label: '🔍 Manual Select', desc: 'Browse all hospitals' },
        ].map(m => (
          <div
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              flex: 1, padding: '12px 16px',
              background: mode === m.id ? 'rgba(0,245,255,0.08)' : 'rgba(4,9,15,0.8)',
              border: mode === m.id ? '1px solid rgba(0,245,255,0.5)' : '1px solid rgba(0,245,255,0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: mode === m.id ? '0 0 20px rgba(0,245,255,0.15)' : 'none',
            }}
          >
            <div style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '13px', fontWeight: '700',
              color: mode === m.id ? '#00f5ff' : '#5a7a9a',
              letterSpacing: '0.5px',
            }}>
              {m.label}
            </div>
            <div style={{ fontSize: '11px', color: '#2a4a6a', marginTop: '2px', fontFamily: "'Rajdhani', sans-serif" }}>
              {m.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Hospital list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {mockHospitals.map((h, idx) => {
          const isSelected = selected === h.id;
          const isHovered = hovered === h.id;
          const matchColor = h.match >= 90 ? '#7fff00' : h.match >= 80 ? '#ff9500' : '#00f5ff';

          return (
            <div
              key={h.id}
              onClick={() => onSelect(h.id)}
              onMouseEnter={() => setHovered(h.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '16px',
                background: isSelected ? 'rgba(0,245,255,0.06)' : 'rgba(4,9,15,0.9)',
                border: isSelected ? '1px solid rgba(0,245,255,0.5)' : '1px solid rgba(0,245,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.25s',
                boxShadow: isSelected ? '0 0 25px rgba(0,245,255,0.15)' : 'none',
                transform: isHovered && !isSelected ? 'translateX(4px)' : 'translateX(0)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: '3px',
                  background: 'linear-gradient(180deg, #00f5ff, #7fff00)',
                }} />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px', height: '38px',
                    background: 'rgba(0,245,255,0.08)',
                    border: '1px solid rgba(0,245,255,0.2)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                    fontFamily: "'Share Tech Mono', monospace",
                    color: '#00f5ff', fontWeight: '800', fontSize: '14px',
                  }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '15px', fontWeight: '800',
                      color: isSelected ? '#00f5ff' : '#e8f4fd',
                      letterSpacing: '0.5px',
                    }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#5a7a9a', marginTop: '2px', fontFamily: "'Rajdhani', sans-serif" }}>
                      ★ {h.rating} · {h.dist} · ETA {h.eta}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '10px', fontWeight: '800',
                    letterSpacing: '1.5px',
                    padding: '3px 8px',
                    background: `rgba(${matchColor === '#7fff00' ? '127,255,0' : matchColor === '#ff9500' ? '255,149,0' : '0,245,255'},0.1)`,
                    border: `1px solid ${matchColor}`,
                    color: matchColor, borderRadius: '3px', marginBottom: '4px',
                  }}>
                    {h.match}% MATCH
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', color: '#ff9500', fontWeight: '700' }}>
                    {h.cost}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {h.insurance && (
                  <span style={{
                    padding: '3px 8px',
                    background: 'rgba(127,255,0,0.08)',
                    border: '1px solid rgba(127,255,0,0.2)',
                    color: '#7fff00', fontSize: '10px',
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: '600', borderRadius: '3px',
                  }}>
                    ✓ Insurance
                  </span>
                )}
                {h.specialties.map(spec => (
                  <span key={spec} style={{
                    padding: '3px 8px',
                    background: 'rgba(0,245,255,0.04)',
                    border: '1px solid rgba(0,245,255,0.1)',
                    color: '#5a7a9a', fontSize: '10px',
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: '600', borderRadius: '3px',
                  }}>
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrivateHospitalSelector;