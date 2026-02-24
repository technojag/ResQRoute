import React from 'react';
import Input from '../../common/Input';

const PatientDetailsForm = ({ data, onChange }) => {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
  const genderOptions = ['Male', 'Female', 'Other'];

  const chipStyle = (isSelected, color = '#00f5ff') => ({
    padding: '8px 16px',
    background: isSelected ? `rgba(${color === '#00f5ff' ? '0,245,255' : '255,45,120'},0.12)` : 'rgba(4,9,15,0.8)',
    border: isSelected ? `1px solid ${color}` : '1px solid rgba(0,245,255,0.1)',
    borderRadius: '4px',
    cursor: 'pointer',
    color: isSelected ? color : '#5a7a9a',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: "'Rajdhani', sans-serif",
    transition: 'all 0.2s',
    letterSpacing: '1px',
    boxShadow: isSelected ? `0 0 12px rgba(${color === '#00f5ff' ? '0,245,255' : '255,45,120'},0.2)` : 'none',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Name & Age */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Input
          label="Patient Name"
          value={data.name || ''}
          onChange={v => update('name', v)}
          placeholder="Full name"
          required
          icon="👤"
        />
        <Input
          label="Age"
          type="number"
          value={data.age || ''}
          onChange={v => update('age', v)}
          placeholder="Years"
          required
          icon="📅"
          suffix="yrs"
        />
      </div>

      {/* Gender */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#5a7a9a',
          marginBottom: '8px',
        }}>
          Gender <span style={{ color: '#ff2d78' }}>*</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {genderOptions.map(g => (
            <div key={g} style={chipStyle(data.gender === g)} onClick={() => update('gender', g)}>
              {g}
            </div>
          ))}
        </div>
      </div>

      {/* Blood Group */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#5a7a9a',
          marginBottom: '8px',
        }}>
          Blood Group
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {bloodGroups.map(bg => (
            <div key={bg} style={chipStyle(data.bloodGroup === bg, '#ff2d78')} onClick={() => update('bloodGroup', bg)}>
              {bg}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Input
          label="Contact Number"
          type="tel"
          value={data.contact || ''}
          onChange={v => update('contact', v)}
          placeholder="+91 XXXXX XXXXX"
          required
          icon="📞"
        />
        <Input
          label="Medical ID / Aadhaar"
          value={data.medicalId || ''}
          onChange={v => update('medicalId', v)}
          placeholder="Optional"
          icon="🪪"
        />
      </div>

      {/* Symptoms */}
      <Input
        label="Current Symptoms"
        value={data.symptoms || ''}
        onChange={v => update('symptoms', v)}
        placeholder="Describe visible symptoms, pain level, consciousness..."
        multiline
        rows={3}
        icon="📋"
      />

      {/* Critical indicators */}
      <div>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#ff9500',
          marginBottom: '10px',
        }}>
          ⚠ Critical Indicators
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['Unconscious', 'Not Breathing', 'Heavy Bleeding', 'Chest Pain', 'Seizures', 'Allergic Reaction'].map(indicator => (
            <div
              key={indicator}
              onClick={() => {
                const current = data.indicators || [];
                const updated = current.includes(indicator)
                  ? current.filter(i => i !== indicator)
                  : [...current, indicator];
                update('indicators', updated);
              }}
              style={{
                padding: '7px 14px',
                background: (data.indicators || []).includes(indicator)
                  ? 'rgba(255,149,0,0.12)'
                  : 'rgba(4,9,15,0.8)',
                border: (data.indicators || []).includes(indicator)
                  ? '1px solid rgba(255,149,0,0.6)'
                  : '1px solid rgba(0,245,255,0.08)',
                borderRadius: '4px',
                cursor: 'pointer',
                color: (data.indicators || []).includes(indicator) ? '#ff9500' : '#5a7a9a',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: "'Rajdhani', sans-serif",
                transition: 'all 0.2s',
                letterSpacing: '0.5px',
              }}
            >
              {indicator}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsForm;