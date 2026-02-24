import React from 'react';

export const LiveMap = ({ type }) => {
  const accentColor = type === 'fire' ? '#ff2d78' : '#00f5ff';
  const accentRGB = type === 'fire' ? '255,45,120' : '0,245,255';
  return (
    <div style={{ width: '100%', height: '350px', background: '#04090f', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(' + accentRGB + ',0.2)' }}>
      <div style={{ textAlign: 'center', color: accentColor }}>
        <div style={{ fontSize: '48px' }}>{type === 'fire' ? '??' : '??'}</div>
        <div>LIVE TRACKING ACTIVE</div>
      </div>
    </div>
  );
};

export const ETADisplay = ({ eta, distance, vehicleId, type }) => {
  const accentColor = type === 'fire' ? '#ff2d78' : '#00f5ff';
  const accentRGB = type === 'fire' ? '255,45,120' : '0,245,255';
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {[{ label: 'ETA', value: eta === 0 ? 'ARRIVED' : eta + ' min' }, { label: 'DISTANCE', value: distance }, { label: 'VEHICLE', value: vehicleId }].map(({ label, value }) => (
        <div key={label} style={{ flex: 1, padding: '16px', background: 'rgba(' + accentRGB + ',0.05)', border: '1px solid rgba(' + accentRGB + ',0.2)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: accentColor }}>{value}</div>
          <div style={{ fontSize: '11px', color: '#5a7a9a' }}>{label}</div>
        </div>
      ))}
    </div>
  );
};

export default LiveMap;
