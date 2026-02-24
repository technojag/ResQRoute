import React, { useState } from 'react';

const emergencyTypes = [
  { id: 'cardiac', icon: '❤️', label: 'Cardiac Arrest', severity: 'CRITICAL', color: '#ff2d78' },
  { id: 'trauma', icon: '🩸', label: 'Trauma/Accident', severity: 'CRITICAL', color: '#ff2d78' },
  { id: 'stroke', icon: '🧠', label: 'Stroke', severity: 'HIGH', color: '#ff9500' },
  { id: 'respiratory', icon: '🫁', label: 'Respiratory', severity: 'HIGH', color: '#ff9500' },
  { id: 'burns', icon: '🔥', label: 'Burns', severity: 'HIGH', color: '#ff9500' },
  { id: 'fracture', icon: '🦴', label: 'Fracture/Bone', severity: 'MEDIUM', color: '#00f5ff' },
  { id: 'poisoning', icon: '☠️', label: 'Poisoning', severity: 'MEDIUM', color: '#00f5ff' },
  { id: 'childbirth', icon: '👶', label: 'Childbirth', severity: 'HIGH', color: '#ff9500' },
  { id: 'allergic', icon: '⚠️', label: 'Allergic Reaction', severity: 'MEDIUM', color: '#00f5ff' },
  { id: 'other', icon: '🏥', label: 'Other Emergency', severity: 'LOW', color: '#7fff00' },
];

const severityConfig = {
  CRITICAL: { bg: 'rgba(255,45,120,0.1)', border: 'rgba(255,45,120,0.3)', color: '#ff2d78', pulse: true },
  HIGH: { bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.3)', color: '#ff9500', pulse: false },
  MEDIUM: { bg: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.2)', color: '#00f5ff', pulse: false },
  LOW: { bg: 'rgba(127,255,0,0.08)', border: 'rgba(127,255,0,0.2)', color: '#7fff00', pulse: false },
};

const MedicalEmergencySelector = ({ selected, onSelect }) => {
  const [hovered, setHovered] = useState(null);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: '#00f5ff',
        }}>
          ▸ Emergency Type
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['CRITICAL', 'HIGH', 'MEDIUM'].map(s => (
            <span key={s} style={{
              padding: '3px 8px',
              background: severityConfig[s].bg,
              border: `1px solid ${severityConfig[s].border}`,
              color: severityConfig[s].color,
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '1.5px',
              borderRadius: '3px',
              fontFamily: "'Exo 2', sans-serif",
            }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
      }}>
        {emergencyTypes.map(type => {
          const isSelected = selected === type.id;
          const isHovered = hovered === type.id;
          const sc = severityConfig[type.severity];

          return (
            <div
              key={type.id}
              onClick={() => onSelect(type.id)}
              onMouseEnter={() => setHovered(type.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '12px 14px',
                background: isSelected ? sc.bg : 'rgba(4,9,15,0.8)',
                border: isSelected
                  ? `1px solid ${sc.color}`
                  : `1px solid rgba(0,245,255,0.08)`,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 0 15px ${sc.bg}` : 'none',
                transform: isHovered && !isSelected ? 'translateX(3px)' : 'translateX(0)',
              }}
            >
              <span style={{ fontSize: '22px', minWidth: '28px', textAlign: 'center' }}>
                {type.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: isSelected ? sc.color : '#e8f4fd',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                }}>
                  {type.label}
                </div>
              </div>
              <div style={{
                padding: '2px 7px',
                background: sc.bg,
                border: `1px solid ${sc.border}`,
                color: sc.color,
                fontSize: '8px',
                fontWeight: '700',
                letterSpacing: '1px',
                borderRadius: '2px',
                fontFamily: "'Share Tech Mono', monospace",
              }}>
                {type.severity}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicalEmergencySelector;