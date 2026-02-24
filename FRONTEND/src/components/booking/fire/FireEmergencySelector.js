// FireEmergencySelector.js
import React, { useState } from 'react';

const fireTypes = [
  { id: 'structure', icon: '🏢', label: 'Structure Fire', severity: 'CRITICAL', vehicles: '3+ Trucks' },
  { id: 'vehicle', icon: '🚗', label: 'Vehicle Fire', severity: 'HIGH', vehicles: '1-2 Trucks' },
  { id: 'industrial', icon: '🏭', label: 'Industrial Fire', severity: 'CRITICAL', vehicles: '4+ Trucks' },
  { id: 'forest', icon: '🌲', label: 'Forest Fire', severity: 'HIGH', vehicles: '5+ Trucks' },
  { id: 'electrical', icon: '⚡', label: 'Electrical Fire', severity: 'HIGH', vehicles: '2 Trucks' },
  { id: 'chemical', icon: '☢️', label: 'Chemical Fire', severity: 'CRITICAL', vehicles: 'HazMat+Trucks' },
];

export const FireEmergencySelector = ({ selected, onSelect }) => {
  const [hovered, setHovered] = useState(null);

  const severityStyle = {
    CRITICAL: { color: '#ff2d78', bg: 'rgba(255,45,120,0.08)', border: 'rgba(255,45,120,0.2)' },
    HIGH: { color: '#ff9500', bg: 'rgba(255,149,0,0.08)', border: 'rgba(255,149,0,0.2)' },
  };

  return (
    <div>
      <div style={{
        fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: '700',
        letterSpacing: '2.5px', textTransform: 'uppercase', color: '#ff2d78', marginBottom: '12px',
      }}>
        ▸ Fire Type Classification
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {fireTypes.map(type => {
          const isSelected = selected === type.id;
          const ss = severityStyle[type.severity];
          return (
            <div
              key={type.id}
              onClick={() => onSelect(type.id)}
              onMouseEnter={() => setHovered(type.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '14px',
                background: isSelected ? 'rgba(255,45,120,0.07)' : 'rgba(4,9,15,0.9)',
                border: isSelected ? '1px solid rgba(255,45,120,0.6)' : '1px solid rgba(255,45,120,0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 0 20px rgba(255,45,120,0.2)' : 'none',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <span style={{ fontSize: '26px', filter: isSelected ? 'drop-shadow(0 0 8px #ff2d78)' : 'none' }}>{type.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: '700',
                  color: isSelected ? '#ff2d78' : '#e8f4fd', letterSpacing: '0.5px', textTransform: 'uppercase',
                }}>
                  {type.label}
                </div>
                <div style={{ fontSize: '10px', color: '#5a7a9a', marginTop: '2px', fontFamily: "'Share Tech Mono', monospace" }}>
                  {type.vehicles}
                </div>
              </div>
              <div style={{
                padding: '3px 7px', background: ss.bg, border: `1px solid ${ss.border}`,
                color: ss.color, fontSize: '9px', fontWeight: '700', letterSpacing: '1px',
                borderRadius: '3px', fontFamily: "'Exo 2', sans-serif",
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