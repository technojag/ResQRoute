import React, { useState } from 'react';

const EmergencyTypeSelector = ({ selected, onSelect }) => {
  const [hovered, setHovered] = useState(null);

  const types = [
    {
      id: 'medical',
      icon: '🚑',
      label: 'Medical',
      subLabel: 'Ambulance & Hospital',
      color: '#00f5ff',
      glow: 'rgba(0,245,255,0.4)',
      bg: 'rgba(0,245,255,0.06)',
      description: 'Cardiac, Trauma, Critical Care',
    },
    {
      id: 'fire',
      icon: '🚒',
      label: 'Fire',
      subLabel: 'Fire Truck & Response',
      color: '#ff2d78',
      glow: 'rgba(255,45,120,0.4)',
      bg: 'rgba(255,45,120,0.06)',
      description: 'Structural, Vehicle, Industrial',
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
      {types.map(type => {
        const isSelected = selected === type.id;
        const isHovered = hovered === type.id;
        const active = isSelected || isHovered;

        return (
          <div
            key={type.id}
            onClick={() => onSelect(type.id)}
            onMouseEnter={() => setHovered(type.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              flex: 1,
              padding: '28px 20px',
              background: active ? type.bg : 'rgba(6,13,22,0.9)',
              border: isSelected
                ? `1px solid ${type.color}`
                : `1px solid rgba(${type.color === '#00f5ff' ? '0,245,255' : '255,45,120'},0.15)`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isSelected
                ? `0 0 30px ${type.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
                : '0 4px 20px rgba(0,0,0,0.5)',
              transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
            }}
          >
            {/* Top bar indicator */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '3px',
              background: `linear-gradient(90deg, transparent, ${type.color}, transparent)`,
              opacity: isSelected ? 1 : 0,
              transition: 'opacity 0.3s',
            }} />

            {/* Selection indicator */}
            {isSelected && (
              <div style={{
                position: 'absolute',
                top: '12px', right: '12px',
                width: '20px', height: '20px',
                background: type.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                boxShadow: `0 0 10px ${type.glow}`,
              }}>
                ✓
              </div>
            )}

            <div style={{
              fontSize: '52px',
              marginBottom: '14px',
              display: 'block',
              filter: isSelected ? `drop-shadow(0 0 12px ${type.color})` : 'none',
              transform: active ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s',
              animation: isSelected ? 'float 3s ease-in-out infinite' : 'none',
            }}>
              {type.icon}
            </div>

            <div style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '22px',
              fontWeight: '800',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: isSelected ? type.color : '#e8f4fd',
              marginBottom: '4px',
              transition: 'color 0.3s',
            }}>
              {type.label}
            </div>

            <div style={{
              fontSize: '12px',
              color: isSelected ? type.color : '#5a7a9a',
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '12px',
              transition: 'color 0.3s',
            }}>
              {type.subLabel}
            </div>

            <div style={{
              padding: '6px 12px',
              background: `rgba(${type.color === '#00f5ff' ? '0,245,255' : '255,45,120'},0.08)`,
              border: `1px solid rgba(${type.color === '#00f5ff' ? '0,245,255' : '255,45,120'},0.2)`,
              borderRadius: '3px',
              fontSize: '11px',
              color: '#5a7a9a',
              fontFamily: "'Share Tech Mono', monospace",
              display: 'inline-block',
            }}>
              {type.description}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmergencyTypeSelector;