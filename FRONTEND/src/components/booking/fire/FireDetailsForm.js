import React from 'react';
import Input from '../../common/Input';

const flameScales = [
  { id: 'small', label: 'Small', desc: 'Contained, single room', color: '#ff9500' },
  { id: 'medium', label: 'Medium', desc: 'Multiple rooms / floors', color: '#ff6b00' },
  { id: 'large', label: 'Large', desc: 'Entire building / structure', color: '#ff2d78' },
  { id: 'massive', label: 'Massive', desc: 'Multi-structure / out of control', color: '#ff0000' },
];

export const FireDetailsForm = ({ data, onChange }) => {
  const update = (f, v) => onChange({ ...data, [f]: v });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Scale */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: '700',
          letterSpacing: '2px', textTransform: 'uppercase', color: '#ff9500', marginBottom: '10px',
        }}>
          🔥 Fire Scale
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {flameScales.map(s => (
            <div
              key={s.id}
              onClick={() => update('scale', s.id)}
              style={{
                padding: '10px 14px',
                background: data.scale === s.id ? `rgba(${s.color === '#ff2d78' ? '255,45,120' : '255,149,0'},0.1)` : 'rgba(4,9,15,0.8)',
                border: data.scale === s.id ? `1px solid ${s.color}` : '1px solid rgba(255,45,120,0.1)',
                borderRadius: '6px', cursor: 'pointer',
                boxShadow: data.scale === s.id ? `0 0 15px rgba(255,80,80,0.2)` : 'none',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: '700',
                color: data.scale === s.id ? s.color : '#e8f4fd', textTransform: 'uppercase',
              }}>
                {s.label}
              </div>
              <div style={{ fontSize: '11px', color: '#5a7a9a', marginTop: '2px', fontFamily: "'Rajdhani', sans-serif" }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* People trapped */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Input
          label="Estimated People Inside"
          type="number"
          value={data.peopleCount || ''}
          onChange={v => update('peopleCount', v)}
          placeholder="0"
          icon="👥"
          color="secondary"
        />
        <Input
          label="People Trapped"
          type="number"
          value={data.trapped || ''}
          onChange={v => update('trapped', v)}
          placeholder="0"
          icon="🆘"
          color="secondary"
        />
      </div>

      {/* Additional notes */}
      <Input
        label="Additional Details"
        value={data.notes || ''}
        onChange={v => update('notes', v)}
        placeholder="Visible flames, smoke color, explosion risk, hazardous materials..."
        multiline rows={3}
        color="secondary"
      />

      {/* Quick indicators */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: '700',
          letterSpacing: '2px', textTransform: 'uppercase', color: '#ff2d78', marginBottom: '8px',
        }}>
          ⚠ Hazard Indicators
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['Gas Cylinders', 'Chemicals', 'Explosives', 'Electrical Hazard', 'People Trapped', 'Spread Risk'].map(h => {
            const active = (data.hazards || []).includes(h);
            return (
              <div
                key={h}
                onClick={() => {
                  const cur = data.hazards || [];
                  update('hazards', active ? cur.filter(x => x !== h) : [...cur, h]);
                }}
                style={{
                  padding: '7px 14px',
                  background: active ? 'rgba(255,45,120,0.1)' : 'rgba(4,9,15,0.8)',
                  border: active ? '1px solid rgba(255,45,120,0.5)' : '1px solid rgba(255,45,120,0.12)',
                  borderRadius: '4px', cursor: 'pointer',
                  color: active ? '#ff2d78' : '#5a7a9a',
                  fontSize: '12px', fontWeight: '600',
                  fontFamily: "'Rajdhani', sans-serif",
                  transition: 'all 0.2s',
                }}
              >
                {h}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const BuildingInfoForm = ({ data, onChange }) => {
  const update = (f, v) => onChange({ ...data, [f]: v });
  const buildingTypes = ['Residential', 'Commercial', 'Industrial', 'Hospital', 'School/College', 'Mall', 'Warehouse', 'Other'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Building type */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: '700',
          letterSpacing: '2px', textTransform: 'uppercase', color: '#ff2d78', marginBottom: '8px',
        }}>
          🏗️ Building Type
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {buildingTypes.map(t => (
            <div
              key={t}
              onClick={() => update('buildingType', t)}
              style={{
                padding: '7px 14px',
                background: data.buildingType === t ? 'rgba(255,45,120,0.1)' : 'rgba(4,9,15,0.8)',
                border: data.buildingType === t ? '1px solid rgba(255,45,120,0.5)' : '1px solid rgba(255,45,120,0.1)',
                borderRadius: '4px', cursor: 'pointer',
                color: data.buildingType === t ? '#ff2d78' : '#5a7a9a',
                fontSize: '12px', fontWeight: '600',
                fontFamily: "'Rajdhani', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <Input
          label="Number of Floors"
          type="number"
          value={data.floors || ''}
          onChange={v => update('floors', v)}
          placeholder="e.g. 5"
          icon="🏢"
          color="secondary"
        />
        <Input
          label="Floor on Fire"
          type="number"
          value={data.fireFloor || ''}
          onChange={v => update('fireFloor', v)}
          placeholder="e.g. 3"
          icon="🔥"
          color="secondary"
        />
        <Input
          label="Entry Points"
          type="number"
          value={data.entryPoints || ''}
          onChange={v => update('entryPoints', v)}
          placeholder="e.g. 2"
          icon="🚪"
          color="secondary"
        />
      </div>
    </div>
  );
};