import React, { useState } from 'react';

const Card = ({
  children,
  title = '',
  subtitle = '',
  badge = null,
  badgeColor = 'primary',
  glow = 'primary', // primary | secondary | accent | warning | none
  hoverable = false,
  padding = '24px',
  style = {},
  headerAction = null,
}) => {
  const [hovered, setHovered] = useState(false);

  const glowMap = {
    primary: {
      border: hovered && hoverable ? 'rgba(0,245,255,0.5)' : 'rgba(0,245,255,0.15)',
      shadow: hovered && hoverable
        ? '0 0 40px rgba(0,245,255,0.2), 0 4px 32px rgba(0,0,0,0.7)'
        : '0 4px 32px rgba(0,0,0,0.6)',
      accent: '#00f5ff',
    },
    secondary: {
      border: hovered && hoverable ? 'rgba(255,45,120,0.5)' : 'rgba(255,45,120,0.15)',
      shadow: hovered && hoverable
        ? '0 0 40px rgba(255,45,120,0.2), 0 4px 32px rgba(0,0,0,0.7)'
        : '0 4px 32px rgba(0,0,0,0.6)',
      accent: '#ff2d78',
    },
    accent: {
      border: hovered && hoverable ? 'rgba(127,255,0,0.5)' : 'rgba(127,255,0,0.15)',
      shadow: hovered && hoverable
        ? '0 0 40px rgba(127,255,0,0.2), 0 4px 32px rgba(0,0,0,0.7)'
        : '0 4px 32px rgba(0,0,0,0.6)',
      accent: '#7fff00',
    },
    warning: {
      border: hovered && hoverable ? 'rgba(255,149,0,0.5)' : 'rgba(255,149,0,0.15)',
      shadow: hovered && hoverable
        ? '0 0 40px rgba(255,149,0,0.2), 0 4px 32px rgba(0,0,0,0.7)'
        : '0 4px 32px rgba(0,0,0,0.6)',
      accent: '#ff9500',
    },
    none: {
      border: 'rgba(0,245,255,0.08)',
      shadow: '0 4px 20px rgba(0,0,0,0.5)',
      accent: 'transparent',
    },
  };

  const badgeColors = {
    primary: { bg: 'rgba(0,245,255,0.1)', color: '#00f5ff', border: 'rgba(0,245,255,0.3)' },
    secondary: { bg: 'rgba(255,45,120,0.1)', color: '#ff2d78', border: 'rgba(255,45,120,0.3)' },
    accent: { bg: 'rgba(127,255,0,0.1)', color: '#7fff00', border: 'rgba(127,255,0,0.3)' },
    warning: { bg: 'rgba(255,149,0,0.1)', color: '#ff9500', border: 'rgba(255,149,0,0.3)' },
    danger: { bg: 'rgba(255,50,50,0.1)', color: '#ff5050', border: 'rgba(255,50,50,0.3)' },
  };

  const g = glowMap[glow] || glowMap.primary;
  const b = badgeColors[badgeColor] || badgeColors.primary;

  const cardStyle = {
    background: 'linear-gradient(145deg, #060d16 0%, #04090f 100%)',
    border: `1px solid ${g.border}`,
    borderRadius: '8px',
    boxShadow: g.shadow,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    transform: hovered && hoverable ? 'translateY(-2px)' : 'translateY(0)',
    cursor: hoverable ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${g.accent}, transparent)`,
        opacity: glow === 'none' ? 0 : 1,
      }} />

      {/* Corner decorations */}
      <div style={{
        position: 'absolute',
        top: '8px', left: '8px',
        width: '16px', height: '16px',
        borderTop: `2px solid ${g.accent}`,
        borderLeft: `2px solid ${g.accent}`,
        opacity: 0.6,
      }} />
      <div style={{
        position: 'absolute',
        top: '8px', right: '8px',
        width: '16px', height: '16px',
        borderTop: `2px solid ${g.accent}`,
        borderRight: `2px solid ${g.accent}`,
        opacity: 0.6,
      }} />

      {/* Content */}
      <div style={{ padding }}>
        {(title || badge || headerAction) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: title ? '16px' : 0,
          }}>
            <div>
              {title && (
                <div style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: g.accent === 'transparent' ? '#5a7a9a' : g.accent,
                  marginBottom: subtitle ? '4px' : 0,
                }}>
                  {title}
                </div>
              )}
              {subtitle && (
                <div style={{
                  fontSize: '12px',
                  color: '#5a7a9a',
                  fontFamily: "'Rajdhani', sans-serif",
                }}>
                  {subtitle}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {badge && (
                <span style={{
                  padding: '4px 10px',
                  background: b.bg,
                  border: `1px solid ${b.border}`,
                  color: b.color,
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontFamily: "'Exo 2', sans-serif",
                }}>
                  {badge}
                </span>
              )}
              {headerAction}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Card;