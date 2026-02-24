import React from 'react';

const HospitalPreferenceSelector = ({ selected, onSelect }) => {
  const options = [
    {
      id: 'government',
      icon: '🏛️',
      label: 'Government Hospital',
      tagline: 'FREE / Subsidized Treatment',
      features: ['Ayushman Bharat Covered', 'Auto-selected nearest', 'AIIMS / District Hospitals', '24/7 Emergency Care'],
      badge: 'FREE',
      badgeColor: '#7fff00',
      color: '#7fff00',
      glow: 'rgba(127,255,0,0.35)',
      bg: 'rgba(127,255,0,0.06)',
    },
    {
      id: 'private',
      icon: '🏥',
      label: 'Private Hospital',
      tagline: 'Premium Care Options',
      features: ['AI Recommended Hospitals', 'Insurance Accepted', 'Specialist Doctors', 'Premium Facilities'],
      badge: 'PREMIUM',
      badgeColor: '#00f5ff',
      color: '#00f5ff',
      glow: 'rgba(0,245,255,0.35)',
      bg: 'rgba(0,245,255,0.06)',
    },
  ];

  return (
    <div>
      <div style={{
        fontFamily: "'Exo 2', sans-serif",
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color: '#00f5ff',
        marginBottom: '14px',
      }}>
        ▸ Hospital Preference
      </div>
      <div style={{ display: 'flex', gap: '14px' }}>
        {options.map(opt => {
          const isSelected = selected === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              style={{
                flex: 1,
                padding: '20px',
                background: isSelected ? opt.bg : 'rgba(4,9,15,0.9)',
                border: isSelected
                  ? `1px solid ${opt.color}`
                  : '1px solid rgba(0,245,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isSelected ? `0 0 25px ${opt.glow}` : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${opt.color}, transparent)`,
                }} />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>{opt.icon}</span>
                <span style={{
                  padding: '4px 10px',
                  background: `rgba(${opt.color === '#7fff00' ? '127,255,0' : '0,245,255'},0.12)`,
                  border: `1px solid ${opt.color}`,
                  color: opt.color,
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '800',
                  letterSpacing: '1.5px',
                  fontFamily: "'Exo 2', sans-serif",
                  height: 'fit-content',
                  boxShadow: isSelected ? `0 0 10px ${opt.glow}` : 'none',
                }}>
                  {opt.badge}
                </span>
              </div>

              <div style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '15px',
                fontWeight: '800',
                color: isSelected ? opt.color : '#e8f4fd',
                letterSpacing: '1px',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {opt.label}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#5a7a9a',
                marginBottom: '14px',
                fontFamily: "'Rajdhani', sans-serif",
              }}>
                {opt.tagline}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {opt.features.map(feat => (
                  <div key={feat} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: isSelected ? opt.color : '#5a7a9a',
                    fontFamily: "'Rajdhani', sans-serif",
                    transition: 'color 0.2s',
                  }}>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>◆</span>
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HospitalPreferenceSelector;