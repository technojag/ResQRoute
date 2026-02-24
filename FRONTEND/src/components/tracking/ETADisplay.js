import React, { useEffect, useState } from 'react';

const ETADisplay = ({
  eta = 8,
  distance = '3.8 km',
  vehicleId = 'AMB-23',
  type = 'medical',       // medical | fire
  speed = 62,
  driverName = 'Rajan Patel',
  hospital = 'AIIMS Delhi',
}) => {
  const [seconds, setSeconds] = useState(eta * 60);
  const [prevSeconds, setPrevSeconds] = useState(eta * 60);
  const [flipped, setFlipped] = useState(false);

  const accentColor = type === 'fire' ? '#ff2d78' : '#00f5ff';
  const accentRGB   = type === 'fire' ? '255,45,120' : '0,245,255';

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds(s => {
        const next = Math.max(0, s - 1);
        if (Math.floor(s / 60) !== Math.floor(next / 60)) setFlipped(true);
        setTimeout(() => setFlipped(false), 300);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const totalOriginal = eta * 60;
  const progressPercent = totalOriginal > 0 ? ((totalOriginal - seconds) / totalOriginal) * 100 : 100;

  const statusColor = seconds === 0 ? '#7fff00' : seconds < 60 ? '#ff9500' : accentColor;

  return (
    <div style={{
      background: `linear-gradient(145deg, rgba(${accentRGB},0.06) 0%, rgba(4,9,15,0.97) 100%)`,
      border: `1px solid rgba(${accentRGB},0.25)`,
      borderRadius: '10px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top accent */}
      <div style={{
        height: '3px',
        background: `linear-gradient(90deg, transparent, ${accentColor}, ${seconds === 0 ? '#7fff00' : accentColor}, transparent)`,
      }} />

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: `linear-gradient(90deg, ${accentColor}, ${seconds === 0 ? '#7fff00' : '#7fff00'})`,
          boxShadow: `0 0 10px ${accentColor}`,
          transition: 'width 1s linear',
        }} />
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Main ETA block */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '20px',
        }}>
          {/* Countdown digits */}
          <div style={{ textAlign: 'center', minWidth: '130px' }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '64px',
              fontWeight: '700',
              color: statusColor,
              letterSpacing: '-3px',
              lineHeight: '1',
              textShadow: `0 0 30px rgba(${accentRGB},0.7)`,
              transform: flipped ? 'scaleY(0.8)' : 'scaleY(1)',
              transition: 'transform 0.15s ease, color 0.5s ease',
            }}>
              {seconds === 0 ? 'HERE' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
            </div>
            {seconds > 0 && (
              <div style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '10px',
                color: '#5a7a9a',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}>
                MIN : SEC REMAINING
              </div>
            )}
            {seconds === 0 && (
              <div style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '11px',
                color: '#7fff00',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginTop: '4px',
                animation: 'pulse-neon 1s ease infinite',
              }}>
                ✅ ARRIVED
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '80px',
            background: `linear-gradient(180deg, transparent, rgba(${accentRGB},0.4), transparent)`,
            flexShrink: 0,
          }} />

          {/* Stats */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Vehicle ID',  value: vehicleId,          color: accentColor },
              { label: 'Distance',    value: distance,           color: '#7fff00'   },
              { label: 'Speed',       value: `${speed} km/h`,    color: '#ff9500'   },
              { label: 'Destination', value: hospital,            color: '#e8f4fd'   },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(0,245,255,0.05)',
              }}>
                <span style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '10px',
                  color: '#2a4a6a',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontWeight: '700',
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontFamily: item.label === 'Destination' ? "'Rajdhani', sans-serif" : "'Share Tech Mono', monospace",
                  fontSize: item.label === 'Destination' ? '13px' : '14px',
                  color: item.color,
                  fontWeight: '700',
                  maxWidth: '160px',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Driver row */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(4,9,15,0.6)',
          border: `1px solid rgba(${accentRGB},0.1)`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: `rgba(${accentRGB},0.1)`,
              border: `1px solid rgba(${accentRGB},0.25)`,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>
              {type === 'fire' ? '👨‍🚒' : '🧑‍⚕️'}
            </div>
            <div>
              <div style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '13px', fontWeight: '700',
                color: '#e8f4fd', letterSpacing: '0.5px',
              }}>
                {driverName}
              </div>
              <div style={{ fontSize: '11px', color: '#5a7a9a', fontFamily: "'Rajdhani', sans-serif" }}>
                {type === 'fire' ? 'Chief Fire Officer' : 'Certified Paramedic'} · Verified ✅
              </div>
            </div>
          </div>

          <button style={{
            padding: '8px 18px',
            background: `rgba(${accentRGB},0.1)`,
            border: `1px solid rgba(${accentRGB},0.4)`,
            borderRadius: '5px',
            color: accentColor,
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '12px', fontWeight: '700',
            letterSpacing: '1.5px', textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: `0 0 12px rgba(${accentRGB},0.2)`,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 25px rgba(${accentRGB},0.5)`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 12px rgba(${accentRGB},0.2)`}
          >
            📞 CALL
          </button>
        </div>
      </div>
    </div>
  );
};

export default ETADisplay;