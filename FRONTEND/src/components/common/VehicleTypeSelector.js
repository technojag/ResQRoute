import React, { useState } from 'react';

const VehicleTypeSelector = ({ emergencyType, selected, onSelect }) => {
  const [hovered, setHovered] = useState(null);

  const vehicleGroups = {
    medical: [
      { id: 'basic', icon: '🚑', label: 'Basic ALS', detail: 'Advanced Life Support', eta: '~6 min' },
      { id: 'advanced', icon: '🏥', label: 'MICU', detail: 'Mobile ICU', eta: '~10 min' },
      { id: 'cardiac', icon: '❤️', label: 'Cardiac', detail: 'Cardiac Specialist', eta: '~12 min' },
      { id: 'neonatal', icon: '👶', label: 'Neonatal', detail: 'Neonatal Care Unit', eta: '~15 min' },
    ],
    fire: [
      { id: 'water_tender', icon: '🚒', label: 'Water Tender', detail: 'Standard Fire Truck', eta: '~5 min' },
      { id: 'ladder', icon: '🔥', label: 'Ladder Truck', detail: 'High-Rise Response', eta: '~8 min' },
      { id: 'hazmat', icon: '☢️', label: 'HazMat', detail: 'Chemical Response', eta: '~12 min' },
      { id: 'rescue', icon: '🆘', label: 'Rescue Squad', detail: 'Trapped Persons', eta: '~7 min' },
    ],
  };

  const accentColor = emergencyType === 'fire' ? '#ff2d78' : '#00f5ff';
  const vehicles = vehicleGroups[emergencyType] || vehicleGroups.medical;

  return (
    <div>
      <div style={{
        fontFamily: "'Exo 2', sans-serif",
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color: accentColor,
        marginBottom: '12px',
      }}>
        ▸ Select Vehicle Type
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {vehicles.map(v => {
          const isSelected = selected === v.id;
          const isHovered = hovered === v.id;

          return (
            <div
              key={v.id}
              onClick={() => onSelect(v.id)}
              onMouseEnter={() => setHovered(v.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '14px',
                background: isSelected ? `rgba(${accentColor === '#00f5ff' ? '0,245,255' : '255,45,120'},0.08)` : 'rgba(4,9,15,0.8)',
                border: isSelected
                  ? `1px solid ${accentColor}`
                  : `1px solid rgba(0,245,255,0.1)`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 0 20px rgba(${accentColor === '#00f5ff' ? '0,245,255' : '255,45,120'},0.2)` : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{
                fontSize: '28px',
                filter: isSelected ? `drop-shadow(0 0 8px ${accentColor})` : 'none',
                transition: 'filter 0.2s',
              }}>
                {v.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px',
                  fontWeight: '700',
                  color: isSelected ? accentColor : '#e8f4fd',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>
                  {v.label}
                </div>
                <div style={{ fontSize: '11px', color: '#5a7a9a', marginTop: '2px' }}>
                  {v.detail}
                </div>
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '11px',
                color: isSelected ? '#7fff00' : '#2a4a6a',
                letterSpacing: '0.5px',
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}>
                {v.eta}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleTypeSelector;