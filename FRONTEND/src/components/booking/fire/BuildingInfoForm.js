import React, { useState } from 'react';
import Input from '../../common/Input';

const buildingTypes = [
  { id: 'residential', label: 'Residential', icon: '🏠' },
  { id: 'commercial', label: 'Commercial', icon: '🏢' },
  { id: 'industrial', label: 'Industrial', icon: '🏭' },
  { id: 'hospital', label: 'Hospital', icon: '🏥' },
  { id: 'school', label: 'School / College', icon: '🏫' },
  { id: 'mall', label: 'Mall / Market', icon: '🛒' },
  { id: 'warehouse', label: 'Warehouse', icon: '📦' },
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'other', label: 'Other', icon: '🔲' },
];

const constructionTypes = ['RCC / Concrete', 'Steel Frame', 'Brick & Mortar', 'Wood Frame', 'Prefab / Tin', 'Mixed'];

const BuildingInfoForm = ({ data = {}, onChange }) => {
  const [hovered, setHovered] = useState(null);
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Building Type Grid */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: '#ff2d78',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            width: '6px', height: '6px',
            background: '#ff2d78',
            borderRadius: '50%',
            boxShadow: '0 0 8px #ff2d78',
            animation: 'pulse-neon 1.5s ease infinite',
            display: 'inline-block',
          }} />
          Building Type <span style={{ color: '#ff2d78' }}>*</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}>
          {buildingTypes.map(type => {
            const isSelected = data.buildingType === type.id;
            const isHovered = hovered === type.id;

            return (
              <div
                key={type.id}
                onClick={() => update('buildingType', type.id)}
                onMouseEnter={() => setHovered(type.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: '14px 10px',
                  background: isSelected
                    ? 'rgba(255,45,120,0.1)'
                    : isHovered
                      ? 'rgba(255,45,120,0.04)'
                      : 'rgba(4,9,15,0.9)',
                  border: isSelected
                    ? '1px solid rgba(255,45,120,0.7)'
                    : '1px solid rgba(255,45,120,0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(255,45,120,0.2)' : 'none',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #ff2d78, transparent)',
                  }} />
                )}
                <div style={{
                  fontSize: '22px',
                  marginBottom: '6px',
                  filter: isSelected ? 'drop-shadow(0 0 6px #ff2d78)' : 'none',
                  transition: 'filter 0.2s',
                }}>
                  {type.icon}
                </div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isSelected ? '#ff2d78' : '#5a7a9a',
                  letterSpacing: '0.5px',
                  transition: 'color 0.2s',
                }}>
                  {type.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floor Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <Input
          label="Total Floors"
          type="number"
          value={data.totalFloors || ''}
          onChange={v => update('totalFloors', v)}
          placeholder="e.g. 10"
          icon="🏢"
          color="secondary"
        />
        <Input
          label="Floor on Fire"
          type="number"
          value={data.fireFloor || ''}
          onChange={v => update('fireFloor', v)}
          placeholder="e.g. 4"
          icon="🔥"
          color="secondary"
          required
        />
        <Input
          label="Basement Levels"
          type="number"
          value={data.basements || ''}
          onChange={v => update('basements', v)}
          placeholder="e.g. 2"
          icon="⬇️"
          color="secondary"
        />
      </div>

      {/* Entry & Access */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Input
          label="Entry Points / Gates"
          type="number"
          value={data.entryPoints || ''}
          onChange={v => update('entryPoints', v)}
          placeholder="e.g. 3"
          icon="🚪"
          color="secondary"
        />
        <Input
          label="Staircase Count"
          type="number"
          value={data.staircases || ''}
          onChange={v => update('staircases', v)}
          placeholder="e.g. 2"
          icon="🪜"
          color="secondary"
        />
      </div>

      {/* Construction Type */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px', fontWeight: '700',
          letterSpacing: '2px', textTransform: 'uppercase',
          color: '#5a7a9a', marginBottom: '10px',
        }}>
          Construction Type
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {constructionTypes.map(ct => {
            const isSelected = data.constructionType === ct;
            return (
              <div
                key={ct}
                onClick={() => update('constructionType', ct)}
                style={{
                  padding: '8px 16px',
                  background: isSelected ? 'rgba(255,45,120,0.1)' : 'rgba(4,9,15,0.8)',
                  border: isSelected
                    ? '1px solid rgba(255,45,120,0.5)'
                    : '1px solid rgba(255,45,120,0.1)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: isSelected ? '#ff2d78' : '#5a7a9a',
                  fontSize: '13px',
                  fontWeight: '600',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                }}
              >
                {ct}
              </div>
            );
          })}
        </div>
      </div>

      {/* Elevator & Fire Safety */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px', fontWeight: '700',
          letterSpacing: '2px', textTransform: 'uppercase',
          color: '#5a7a9a', marginBottom: '10px',
        }}>
          Safety Infrastructure
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'elevator', label: '🛗 Elevator' },
            { id: 'sprinklers', label: '💧 Sprinklers' },
            { id: 'fire_alarm', label: '🚨 Fire Alarm' },
            { id: 'fire_exit', label: '🚪 Fire Exit' },
            { id: 'backup_power', label: '⚡ Backup Power' },
            { id: 'fire_extinguisher', label: '🧯 Extinguishers' },
          ].map(item => {
            const active = (data.infrastructure || []).includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  const cur = data.infrastructure || [];
                  update('infrastructure', active ? cur.filter(x => x !== item.id) : [...cur, item.id]);
                }}
                style={{
                  padding: '8px 14px',
                  background: active ? 'rgba(127,255,0,0.1)' : 'rgba(4,9,15,0.8)',
                  border: active ? '1px solid rgba(127,255,0,0.4)' : '1px solid rgba(0,245,255,0.08)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: active ? '#7fff00' : '#5a7a9a',
                  fontSize: '13px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: active ? '0 0 10px rgba(127,255,0,0.15)' : 'none',
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Water Source Availability */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <div style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '11px', fontWeight: '700',
            letterSpacing: '2px', textTransform: 'uppercase',
            color: '#5a7a9a', marginBottom: '8px',
          }}>
            Water Source Nearby
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Yes', 'No', 'Unknown'].map(opt => (
              <div
                key={opt}
                onClick={() => update('waterSource', opt)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: data.waterSource === opt ? 'rgba(0,245,255,0.08)' : 'rgba(4,9,15,0.8)',
                  border: data.waterSource === opt ? '1px solid rgba(0,245,255,0.4)' : '1px solid rgba(0,245,255,0.08)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: data.waterSource === opt ? '#00f5ff' : '#5a7a9a',
                  fontSize: '13px', fontWeight: '600',
                  fontFamily: "'Rajdhani', sans-serif",
                  textAlign: 'center', transition: 'all 0.2s',
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
        <Input
          label="Building Name / ID"
          value={data.buildingName || ''}
          onChange={v => update('buildingName', v)}
          placeholder="e.g. Sunrise Tower A"
          icon="🏷️"
          color="secondary"
        />
      </div>

      {/* Special Notes */}
      <Input
        label="Special Notes for Firefighters"
        value={data.notes || ''}
        onChange={v => update('notes', v)}
        placeholder="Gas pipelines, chemical storage, locked floors, narrow lanes, special access info..."
        multiline
        rows={3}
        color="secondary"
      />

      {/* Warning summary */}
      {(data.totalFloors > 10 || (data.infrastructure || []).length === 0) && (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255,149,0,0.08)',
          border: '1px solid rgba(255,149,0,0.3)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ fontSize: '13px', color: '#ff9500', fontFamily: "'Rajdhani', sans-serif", lineHeight: '1.5' }}>
            {data.totalFloors > 10 && (
              <div>High-rise building detected. <strong>Aerial ladder truck</strong> will be dispatched automatically.</div>
            )}
            {(data.infrastructure || []).length === 0 && (
              <div>No safety infrastructure selected. <strong>Extra rescue units</strong> will be included in response.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingInfoForm;