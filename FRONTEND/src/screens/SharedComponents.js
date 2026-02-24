import React from 'react';

/* ─── BACKGROUND GRID ─── */
export const BgGrid = ({ color = '0,245,255' }) => (
  <div style={{
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: `
      linear-gradient(rgba(${color},0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(${color},0.025) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
  }} />
);

/* ─── AMBIENT GLOW ─── */
export const AmbientGlow = ({ top, left, bottom, right, color = '0,245,255' }) => (
  <div style={{
    position: 'fixed', pointerEvents: 'none', zIndex: 0,
    top, left, bottom, right,
    width: '600px', height: '600px',
    background: `radial-gradient(circle, rgba(${color},0.06) 0%, transparent 70%)`,
  }} />
);

/* ─── INPUT ─── */
export const Input = ({ label, type = 'text', value, onChange, placeholder, icon, style }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', ...style }}>
      {label && (
        <label style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px', letterSpacing: '2px',
          textTransform: 'uppercase',
          color: focused ? '#00f5ff' : 'rgba(0,245,255,0.6)',
          transition: 'color 0.2s',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none',
            zIndex: 1,
          }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          inputMode={type === 'tel' ? 'tel' : type === 'number' ? 'numeric' : 'text'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: icon ? '14px 16px 14px 44px' : '14px 16px',
            background: focused ? 'rgba(0,245,255,0.06)' : 'rgba(0,245,255,0.03)',
            border: `1px solid ${focused ? 'rgba(0,245,255,0.55)' : 'rgba(0,245,255,0.2)'}`,
            borderRadius: '8px',
            color: '#e8f4fd',
            fontSize: '16px',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '1.5px',
            outline: 'none',
            transition: 'all 0.2s',
            boxShadow: focused ? '0 0 14px rgba(0,245,255,0.15)' : 'none',
            WebkitAppearance: 'none',
          }}
        />
      </div>
    </div>
  );
};

/* ─── BUTTON ─── */
export const Button = ({
  children, onClick, fullWidth, size = 'md',
  loading, variant = 'primary', disabled, style
}) => {
  const [hovered, setHovered] = React.useState(false);
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';

  const accentColor = isSecondary ? '#ff2d78' : '#00f5ff';
  const accentRGB = isSecondary ? '255,45,120' : '0,245,255';

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: size === 'lg' ? '15px 28px' : size === 'sm' ? '8px 16px' : '12px 22px',
        background: isGhost
          ? 'transparent'
          : `linear-gradient(135deg, rgba(${accentRGB},${hovered ? 0.22 : 0.12}) 0%, rgba(${accentRGB},0.06) 100%)`,
        border: `1px solid rgba(${accentRGB},${isGhost ? 0.18 : hovered ? 0.7 : 0.4})`,
        borderRadius: '8px',
        color: isGhost ? `rgba(${accentRGB},0.5)` : accentColor,
        fontSize: size === 'lg' ? '14px' : size === 'sm' ? '11px' : '13px',
        fontFamily: "'Exo 2', sans-serif",
        fontWeight: '700',
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : loading ? 0.65 : 1,
        transition: 'all 0.2s',
        boxShadow: isGhost ? 'none' : hovered
          ? `0 0 28px rgba(${accentRGB},0.3), 0 4px 20px rgba(0,0,0,0.5)`
          : `0 0 14px rgba(${accentRGB},0.1)`,
        transform: hovered && !disabled && !loading ? 'translateY(-1px)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        ...style,
      }}
    >
      {loading ? (
        <span style={{ display: 'inline-block', width: '14px', height: '14px', border: `2px solid rgba(${accentRGB},0.3)`, borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      ) : children}
    </button>
  );
};

/* ─── CARD ─── */
export const Card = ({ title, badge, children, glow = 'primary', style }) => {
  const accentColor = glow === 'secondary' ? '#ff2d78' : glow === 'none' ? '#2a4a6a' : '#00f5ff';
  const accentRGB = glow === 'secondary' ? '255,45,120' : glow === 'none' ? '42,74,106' : '0,245,255';
  return (
    <div style={{
      background: 'rgba(6,13,22,0.95)',
      border: `1px solid rgba(${accentRGB},0.18)`,
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: `0 0 30px rgba(${accentRGB},0.06)`,
      ...style,
    }}>
      <div style={{
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
      }} />
      {(title || badge) && (
        <div style={{
          padding: '14px 20px',
          borderBottom: `1px solid rgba(${accentRGB},0.1)`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {title && (
            <span style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '12px', fontWeight: '700',
              letterSpacing: '2.5px', textTransform: 'uppercase',
              color: accentColor,
            }}>{title}</span>
          )}
          {badge && (
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '10px', letterSpacing: '1.5px',
              color: accentColor, opacity: 0.6,
            }}>{badge}</span>
          )}
        </div>
      )}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
};

/* ─── STEP PROGRESS BAR ─── */
export const StepBar = ({ steps, currentStep, accentColor = '#00f5ff', accentRGB = '0,245,255' }) => (
  <div style={{
    display: 'flex', gap: '6px',
    marginBottom: '24px',
    overflowX: 'auto', paddingBottom: '4px',
  }}>
    {steps.map((step, idx) => {
      const isActive = idx <= currentStep;
      return (
        <div key={step.id} style={{ flex: '1 0 auto', minWidth: '48px' }}>
          <div style={{
            height: '4px', borderRadius: '2px',
            background: isActive ? accentColor : `rgba(${accentRGB},0.1)`,
            boxShadow: isActive ? `0 0 8px rgba(${accentRGB},0.5)` : 'none',
            marginBottom: '6px', transition: 'all 0.3s',
          }} />
          <div style={{
            fontSize: '9px', letterSpacing: '0.8px',
            textTransform: 'uppercase',
            fontFamily: "'Exo 2', sans-serif",
            color: isActive ? accentColor : '#2a4a6a',
            textAlign: 'center', transition: 'color 0.3s',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {step.icon} {step.label}
          </div>
        </div>
      );
    })}
  </div>
);

/* ─── NAV BAR ─── */
export const NavBar = ({ onBack, title, subtitle, accentColor = '#00f5ff', accentRGB = '0,245,255', rightSlot }) => (
  <nav style={{
    padding: '12px 20px',
    borderBottom: `1px solid rgba(${accentRGB},0.12)`,
    background: 'rgba(2,4,8,0.95)',
    backdropFilter: 'blur(20px)',
    display: 'flex', alignItems: 'center', gap: '14px',
    position: 'sticky', top: 0, zIndex: 100,
    flexWrap: 'wrap',
  }}>
    {onBack && (
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: `1px solid rgba(${accentRGB},0.3)`,
          color: accentColor,
          padding: '8px 14px',
          borderRadius: '6px', cursor: 'pointer',
          fontSize: '13px', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '1px', fontWeight: '700',
          flexShrink: 0,
        }}
      >← BACK</button>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: "'Exo 2', sans-serif",
        fontSize: 'clamp(13px, 3vw, 16px)',
        fontWeight: '800', color: accentColor,
        letterSpacing: '2px', textTransform: 'uppercase',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{title}</div>
      {subtitle && (
        <div style={{
          fontSize: '11px', color: '#2a4a6a',
          letterSpacing: '1.5px', fontFamily: "'Share Tech Mono', monospace",
        }}>{subtitle}</div>
      )}
    </div>
    {rightSlot}
  </nav>
);

/* ─── SUMMARY ROW ─── */
export const SummaryRow = ({ label, value, accentRGB = '0,245,255' }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: '10px', marginBottom: '10px',
    borderBottom: `1px solid rgba(${accentRGB},0.07)`,
    gap: '12px', flexWrap: 'wrap',
  }}>
    <span style={{ fontSize: '11px', color: '#5a7a9a', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif", flexShrink: 0 }}>
      {label}
    </span>
    <span style={{ fontSize: '14px', color: '#e8f4fd', fontFamily: "'Rajdhani', sans-serif", fontWeight: '600', textAlign: 'right' }}>
      {value}
    </span>
  </div>
);