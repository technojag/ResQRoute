import React, { useState } from 'react';
import Input from '../common/Input';

const LocationPicker = ({ location, onChange, color = 'primary' }) => {
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);

  const accentColor = color === 'secondary' ? '#ff2d78' : '#00f5ff';
  const accentRGB = color === 'secondary' ? '255,45,120' : '0,245,255';

  const detectLocation = () => {
    setDetecting(true);
    setDetected(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          onChange({
            ...location,
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
            address: 'GPS Location Detected',
          });
          setDetecting(false);
          setDetected(true);
        },
        () => {
          // Fallback mock
          onChange({
            ...location,
            lat: '28.6139',
            lng: '77.2090',
            address: 'New Delhi, India (Mock)',
          });
          setDetecting(false);
          setDetected(true);
        },
        { timeout: 5000 }
      );
    } else {
      setTimeout(() => {
        onChange({ ...location, lat: '28.6139', lng: '77.2090', address: 'New Delhi (Default)' });
        setDetecting(false);
        setDetected(true);
      }, 1500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* GPS button */}
      <div
        onClick={!detecting ? detectLocation : undefined}
        style={{
          padding: '16px 20px',
          background: detected
            ? 'rgba(127,255,0,0.08)'
            : detecting
              ? `rgba(${accentRGB},0.08)`
              : 'rgba(4,9,15,0.9)',
          border: detected
            ? '1px solid rgba(127,255,0,0.5)'
            : detecting
              ? `1px solid ${accentColor}`
              : `1px solid rgba(${accentRGB},0.2)`,
          borderRadius: '8px',
          cursor: detecting ? 'wait' : 'pointer',
          transition: 'all 0.3s',
          boxShadow: detecting ? `0 0 30px rgba(${accentRGB},0.2)` : 'none',
          display: 'flex', alignItems: 'center', gap: '16px',
          animation: detecting ? 'glow-pulse 1s ease infinite' : 'none',
        }}
      >
        <div style={{
          width: '44px', height: '44px',
          background: detected
            ? 'rgba(127,255,0,0.1)'
            : `rgba(${accentRGB},0.1)`,
          border: `1px solid ${detected ? '#7fff00' : accentColor}`,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          animation: detecting ? 'pulse-neon 0.8s ease infinite' : 'none',
          boxShadow: detecting ? `0 0 20px rgba(${accentRGB},0.4)` : 'none',
        }}>
          {detecting ? '⌛' : detected ? '✅' : '📍'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: '800',
            color: detected ? '#7fff00' : accentColor, letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            {detecting ? 'ACQUIRING GPS SIGNAL...' : detected ? 'LOCATION CONFIRMED' : 'AUTO-DETECT MY LOCATION'}
          </div>
          <div style={{ fontSize: '12px', color: '#5a7a9a', marginTop: '3px', fontFamily: "'Rajdhani', sans-serif" }}>
            {detecting ? 'Connecting to satellites...' : detected
              ? `${location?.lat}, ${location?.lng}`
              : 'Tap to use GPS · Fastest response time'}
          </div>
        </div>
        {detecting && (
          <div style={{
            width: '20px', height: '20px',
            border: `2px solid ${accentColor}`, borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin-slow 0.8s linear infinite',
          }} />
        )}
      </div>

      {/* Manual address */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{ flex: 1, height: '1px', background: `rgba(${accentRGB},0.1)` }} />
        <span style={{ color: '#2a4a6a', fontSize: '11px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '2px' }}>OR ENTER MANUALLY</span>
        <div style={{ flex: 1, height: '1px', background: `rgba(${accentRGB},0.1)` }} />
      </div>

      <Input
        label="Street Address"
        value={location?.address || ''}
        onChange={v => onChange({ ...location, address: v })}
        placeholder="House/Building No., Street, Area"
        icon="🏠"
        color={color}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="City"
          value={location?.city || ''}
          onChange={v => onChange({ ...location, city: v })}
          placeholder="e.g. New Delhi"
          icon="🏙️"
          color={color}
        />
        <Input
          label="Pincode"
          type="number"
          value={location?.pincode || ''}
          onChange={v => onChange({ ...location, pincode: v })}
          placeholder="6-digit code"
          icon="📮"
          color={color}
        />
      </div>

      {/* Landmark */}
      <Input
        label="Nearest Landmark"
        value={location?.landmark || ''}
        onChange={v => onChange({ ...location, landmark: v })}
        placeholder="Metro station, hospital, school nearby..."
        icon="🗺️"
        color={color}
      />
    </div>
  );
};

export default LocationPicker;