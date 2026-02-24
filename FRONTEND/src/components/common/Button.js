import React, { useState } from 'react';

const Button = ({
  children,
  onClick,
  variant = 'primary', // primary | secondary | danger | ghost | outline
  size = 'md',         // sm | md | lg
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  style = {},
}) => {
  const [pressed, setPressed] = useState(false);

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, rgba(0,245,255,0.15) 0%, rgba(0,245,255,0.05) 100%)',
      border: '1px solid rgba(0,245,255,0.6)',
      color: '#00f5ff',
      boxShadow: '0 0 20px rgba(0,245,255,0.3), inset 0 1px 0 rgba(0,245,255,0.1)',
      hoverShadow: '0 0 40px rgba(0,245,255,0.6), 0 0 80px rgba(0,245,255,0.2)',
    },
    secondary: {
      background: 'linear-gradient(135deg, rgba(255,45,120,0.15) 0%, rgba(255,45,120,0.05) 100%)',
      border: '1px solid rgba(255,45,120,0.6)',
      color: '#ff2d78',
      boxShadow: '0 0 20px rgba(255,45,120,0.3), inset 0 1px 0 rgba(255,45,120,0.1)',
      hoverShadow: '0 0 40px rgba(255,45,120,0.6), 0 0 80px rgba(255,45,120,0.2)',
    },
    danger: {
      background: 'linear-gradient(135deg, rgba(255,50,50,0.2) 0%, rgba(255,50,50,0.05) 100%)',
      border: '1px solid rgba(255,80,80,0.7)',
      color: '#ff5050',
      boxShadow: '0 0 20px rgba(255,50,50,0.4)',
      hoverShadow: '0 0 50px rgba(255,50,50,0.8)',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid rgba(90,122,154,0.3)',
      color: '#5a7a9a',
      boxShadow: 'none',
      hoverShadow: '0 0 20px rgba(0,245,255,0.1)',
    },
    accent: {
      background: 'linear-gradient(135deg, rgba(127,255,0,0.15) 0%, rgba(127,255,0,0.05) 100%)',
      border: '1px solid rgba(127,255,0,0.6)',
      color: '#7fff00',
      boxShadow: '0 0 20px rgba(127,255,0,0.3)',
      hoverShadow: '0 0 40px rgba(127,255,0,0.6)',
    },
  };

  const sizes = {
    sm: { padding: '8px 18px', fontSize: '13px', letterSpacing: '1.5px' },
    md: { padding: '12px 28px', fontSize: '15px', letterSpacing: '2px' },
    lg: { padding: '16px 40px', fontSize: '17px', letterSpacing: '2.5px' },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  const baseStyle = {
    ...s,
    background: v.background,
    border: v.border,
    color: disabled ? '#2a4a6a' : v.color,
    boxShadow: disabled ? 'none' : (pressed ? v.hoverShadow : v.boxShadow),
    borderRadius: '4px',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: '700',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.2s ease',
    transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  return (
    <button
      style={baseStyle}
      onClick={!disabled && !loading ? onClick : undefined}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      disabled={disabled || loading}
    >
      {/* Shine sweep effect */}
      <span style={{
        position: 'absolute',
        top: 0, left: '-100%', width: '60%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        transform: pressed ? 'translateX(300%)' : 'translateX(0)',
        transition: 'transform 0.5s ease',
        pointerEvents: 'none',
      }} />

      {loading ? (
        <span style={{
          width: '16px', height: '16px',
          border: `2px solid ${v.color}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin-slow 0.8s linear infinite',
          display: 'inline-block',
        }} />
      ) : icon}
      {loading ? 'PROCESSING...' : children}
    </button>
  );
};

export default Button;