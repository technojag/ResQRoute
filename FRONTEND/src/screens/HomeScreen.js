import React, { useState, useEffect } from 'react';

const stats = [
  { label: 'Avg Response Time', value: '6.2', unit: 'min', color: '#00f5ff', delta: '-18%' },
  { label: 'Active Units', value: '47', unit: 'vehicles', color: '#7fff00', delta: '+3' },
  { label: 'Lives Saved Today', value: '23', unit: 'patients', color: '#ff9500', delta: '+5' },
  { label: 'System Uptime', value: '99.9', unit: '%', color: '#7fff00', delta: 'SLA' },
];

const recentActivity = [
  { type: 'medical', msg: 'AMB-23 dispatched • Sector 15, Noida', time: '2m ago', color: '#00f5ff' },
  { type: 'fire', msg: 'Fire-07 responding • Khan Market fire', time: '8m ago', color: '#ff2d78' },
  { type: 'medical', msg: 'Patient delivered • Apollo Hospital', time: '15m ago', color: '#7fff00' },
  { type: 'fire', msg: 'Green corridor active • NH-48', time: '22m ago', color: '#ff9500' },
];

const HomeScreen = ({ onNavigate, user }) => {
  const [time, setTime] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const p = setInterval(() => setPulse(x => !x), 2000);
    return () => { clearInterval(t); clearInterval(p); };
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour12: false });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020408',
      color: '#e8f4fd',
      fontFamily: "'Rajdhani', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', top: '-300px', right: '-300px',
        width: '800px', height: '800px',
        background: 'radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* NAV BAR */}
      <nav style={{
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,245,255,0.1)',
        background: 'rgba(2,4,8,0.9)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '30px', filter: 'drop-shadow(0 0 10px rgba(0,245,255,0.6))' }}>🚨</span>
          <div>
            <div style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '20px', fontWeight: '900', letterSpacing: '3px',
              background: 'linear-gradient(135deg, #00f5ff 0%, #ff2d78 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              ResQRoute
            </div>
            <div style={{ fontSize: '10px', color: '#2a4a6a', letterSpacing: '2px', fontFamily: "'Share Tech Mono', monospace" }}>
              SMART EMERGENCY PLATFORM
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Live clock */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '20px', color: '#00f5ff',
              letterSpacing: '2px',
              textShadow: '0 0 10px rgba(0,245,255,0.4)',
            }}>
              {timeStr}
            </div>
            <div style={{ fontSize: '10px', color: '#2a4a6a', letterSpacing: '1px' }}>{dateStr}</div>
          </div>

          {/* System status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px',
            background: 'rgba(127,255,0,0.08)',
            border: '1px solid rgba(127,255,0,0.3)',
            borderRadius: '6px',
          }}>
            <div style={{
              width: '8px', height: '8px',
              background: '#7fff00', borderRadius: '50%',
              boxShadow: '0 0 8px #7fff00',
              animation: 'pulse-neon 1.5s ease infinite',
            }} />
            <span style={{ fontSize: '12px', color: '#7fff00', fontFamily: "'Exo 2', sans-serif", letterSpacing: '1.5px', fontWeight: '700' }}>
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>

          <div style={{
            width: '38px', height: '38px',
            background: 'rgba(0,245,255,0.1)',
            border: '1px solid rgba(0,245,255,0.3)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', cursor: 'pointer',
          }}>
            👤
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '56px', animation: 'slide-in-up 0.5s ease' }}>
          <div style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '13px', fontWeight: '700', letterSpacing: '5px',
            textTransform: 'uppercase', color: '#2a4a6a',
            marginBottom: '16px',
          }}>
            ◆ INDIA'S FIRST AI-POWERED EMERGENCY PLATFORM ◆
          </div>
          <div style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: '900',
            lineHeight: '1.1', marginBottom: '20px',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #00f5ff 0%, #7fff00 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              EVERY SECOND
            </span>
            <br />
            <span style={{ color: '#e8f4fd' }}>MATTERS.</span>
          </div>
          <div style={{
            fontSize: '17px', color: '#5a7a9a',
            maxWidth: '500px', margin: '0 auto',
            lineHeight: '1.6', marginBottom: '36px',
          }}>
            One tap. Nearest ambulance or fire truck. Real-time tracking. Green corridor.
          </div>
        </div>

        {/* EMERGENCY BUTTONS */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '20px', marginBottom: '48px',
          animation: 'slide-in-up 0.6s ease 0.1s both',
        }}>
          {/* Medical */}
          <div
            onClick={() => onNavigate('medical-booking')}
            style={{
              padding: '36px 28px',
              background: 'linear-gradient(145deg, rgba(0,245,255,0.08) 0%, rgba(4,9,15,0.95) 100%)',
              border: '1px solid rgba(0,245,255,0.35)',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: `0 0 40px rgba(0,245,255,0.15), 0 20px 60px rgba(0,0,0,0.6)`,
              transition: 'all 0.3s ease',
              position: 'relative', overflow: 'hidden',
              textAlign: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 0 60px rgba(0,245,255,0.3), 0 30px 80px rgba(0,0,0,0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(0,245,255,0.15), 0 20px 60px rgba(0,0,0,0.6)';
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)' }} />
            <div style={{ fontSize: '64px', marginBottom: '16px', filter: 'drop-shadow(0 0 16px rgba(0,245,255,0.6))', animation: 'float 3s ease-in-out infinite' }}>🚑</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '26px', fontWeight: '900', color: '#00f5ff', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
              MEDICAL
            </div>
            <div style={{ fontSize: '14px', color: '#5a7a9a', marginBottom: '20px' }}>Ambulance · Hospital · ICU</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px',
              background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.4)',
              borderRadius: '4px', color: '#00f5ff',
              fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: '700', letterSpacing: '2px',
            }}>
              BOOK AMBULANCE →
            </div>
          </div>

          {/* Fire */}
          <div
            onClick={() => onNavigate('fire-booking')}
            style={{
              padding: '36px 28px',
              background: 'linear-gradient(145deg, rgba(255,45,120,0.08) 0%, rgba(4,9,15,0.95) 100%)',
              border: '1px solid rgba(255,45,120,0.35)',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: `0 0 40px rgba(255,45,120,0.15), 0 20px 60px rgba(0,0,0,0.6)`,
              transition: 'all 0.3s ease',
              position: 'relative', overflow: 'hidden',
              textAlign: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 0 60px rgba(255,45,120,0.3), 0 30px 80px rgba(0,0,0,0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(255,45,120,0.15), 0 20px 60px rgba(0,0,0,0.6)';
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #ff2d78, transparent)' }} />
            <div style={{ fontSize: '64px', marginBottom: '16px', filter: 'drop-shadow(0 0 16px rgba(255,45,120,0.6))', animation: 'float 3s ease-in-out infinite 1s' }}>🚒</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '26px', fontWeight: '900', color: '#ff2d78', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
              FIRE
            </div>
            <div style={{ fontSize: '14px', color: '#5a7a9a', marginBottom: '20px' }}>Fire Trucks · HazMat · Rescue</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px',
              background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.4)',
              borderRadius: '4px', color: '#ff2d78',
              fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: '700', letterSpacing: '2px',
            }}>
              REPORT FIRE →
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
          marginBottom: '36px',
          animation: 'slide-in-up 0.6s ease 0.2s both',
        }}>
          {stats.map(stat => (
            <div key={stat.label} style={{
              padding: '20px',
              background: 'rgba(6,13,22,0.9)',
              border: '1px solid rgba(0,245,255,0.1)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '36px', fontWeight: '700',
                color: stat.color,
                textShadow: `0 0 15px rgba(${stat.color === '#00f5ff' ? '0,245,255' : stat.color === '#7fff00' ? '127,255,0' : '255,149,0'},0.4)`,
                lineHeight: 1, marginBottom: '4px',
              }}>
                {stat.value}
                <span style={{ fontSize: '16px', marginLeft: '4px' }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#2a4a6a', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif", marginBottom: '6px' }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: '11px', color: stat.color, fontFamily: "'Share Tech Mono', monospace",
                padding: '2px 6px',
                background: `rgba(${stat.color === '#00f5ff' ? '0,245,255' : stat.color === '#7fff00' ? '127,255,0' : '255,149,0'},0.08)`,
                borderRadius: '3px', display: 'inline-block',
              }}>
                {stat.delta}
              </div>
            </div>
          ))}
        </div>

        {/* RECENT ACTIVITY */}
        <div style={{
          padding: '24px',
          background: 'rgba(6,13,22,0.9)',
          border: '1px solid rgba(0,245,255,0.1)',
          borderRadius: '8px',
          animation: 'slide-in-up 0.6s ease 0.3s both',
        }}>
          <div style={{
            fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: '700',
            letterSpacing: '2.5px', textTransform: 'uppercase', color: '#00f5ff',
            marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ width: '8px', height: '8px', background: '#7fff00', borderRadius: '50%', boxShadow: '0 0 8px #7fff00', animation: 'pulse-neon 1s ease infinite' }} />
            Live Activity Feed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentActivity.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '10px 14px',
                background: 'rgba(4,9,15,0.6)',
                border: `1px solid rgba(${item.color === '#00f5ff' ? '0,245,255' : item.color === '#ff2d78' ? '255,45,120' : '127,255,0'},0.1)`,
                borderRadius: '6px',
                animation: `slide-in-left 0.4s ease ${i * 0.08}s both`,
              }}>
                <div style={{
                  width: '6px', height: '6px',
                  background: item.color, borderRadius: '50%',
                  boxShadow: `0 0 8px ${item.color}`,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, fontSize: '13px', color: '#e8f4fd', fontFamily: "'Rajdhani', sans-serif", fontWeight: '500' }}>
                  {item.msg}
                </div>
                <div style={{ fontSize: '11px', color: '#2a4a6a', fontFamily: "'Share Tech Mono', monospace", whiteSpace: 'nowrap' }}>
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;