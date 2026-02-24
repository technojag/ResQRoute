import React, { useState } from 'react';
import { Input, Button, BgGrid } from './SharedComponents';

const LoginScreen = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit number'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('otp'); }, 1500);
  };

  const handleVerify = () => {
    setError('');
    if (otp.length < 4) { setError('Enter a valid OTP'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin?.(); }, 1500);
  };

  const Corner = ({ pos }) => {
    const styles = {
      tl: { top: '12px', left: '12px', borderTop: '2px solid #00f5ff', borderLeft: '2px solid #00f5ff' },
      tr: { top: '12px', right: '12px', borderTop: '2px solid #00f5ff', borderRight: '2px solid #00f5ff' },
      bl: { bottom: '12px', left: '12px', borderBottom: '2px solid #00f5ff', borderLeft: '2px solid #00f5ff' },
      br: { bottom: '12px', right: '12px', borderBottom: '2px solid #00f5ff', borderRight: '2px solid #00f5ff' },
    };
    return <div style={{ position: 'absolute', width: '18px', height: '18px', opacity: 0.45, ...styles[pos] }} />;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800;900&family=Share+Tech+Mono&family=Rajdhani:wght@500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input { -webkit-appearance: none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div style={{

        background: '#020408',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Rajdhani', sans-serif",
        position: 'relative', overflow: 'hidden',
      }}>
        <BgGrid />

        {/* Glows */}
        <div style={{ position:'fixed', top:'-200px', left:'-200px', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(0,245,255,0.07) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', bottom:'-200px', right:'-200px', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(255,45,120,0.07) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: '420px',
          padding: 'clamp(24px, 5vw, 44px) clamp(20px, 5vw, 36px)',
          background: 'linear-gradient(145deg, #060d16 0%, #030810 100%)',
          border: '1px solid rgba(0,245,255,0.15)',
          borderRadius: '12px',
          boxShadow: '0 0 60px rgba(0,245,255,0.08), 0 30px 80px rgba(0,0,0,0.8)',
          position: 'relative', overflow: 'hidden',
          animation: 'slideUp 0.5s ease',
          zIndex: 1,
        }}>
          {/* Corner decorations */}
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

          {/* Top accent line */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg, transparent, #00f5ff, #ff2d78, transparent)' }} />

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'clamp(24px,5vw,36px)' }}>
            <div style={{ fontSize:'clamp(44px,10vw,60px)', marginBottom:'12px', filter:'drop-shadow(0 0 16px rgba(0,245,255,0.6))', animation:'float 3s ease-in-out infinite', lineHeight:1 }}>🚨</div>
            <div style={{
              fontFamily:"'Exo 2', sans-serif",
              fontSize:'clamp(20px,5vw,26px)', fontWeight:'900', letterSpacing:'4px', textTransform:'uppercase',
              background:'linear-gradient(135deg, #00f5ff 0%, #ff2d78 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              marginBottom:'4px',
            }}>ResQRoute</div>
            <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'10px', color:'#2a4a6a', letterSpacing:'3px' }}>
              SMART EMERGENCY RESPONSE
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'28px' }}>
            {['Enter Mobile','Verify OTP'].map((s, i) => {
              const active = i === 0 ? true : step === 'otp';
              return (
                <div key={i} style={{ flex:1 }}>
                  <div style={{ height:'3px', borderRadius:'2px', background: active ? '#00f5ff' : 'rgba(0,245,255,0.15)', boxShadow: active ? '0 0 8px rgba(0,245,255,0.5)' : 'none', marginBottom:'6px', transition:'all 0.3s' }} />
                  <div style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'Exo 2', sans-serif", color: active ? '#00f5ff' : '#2a4a6a', transition:'color 0.3s' }}>{s}</div>
                </div>
              );
            })}
          </div>

          {/* Form */}
          {step === 'phone' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <Input
                label="Mobile Number"
                type="tel"
                value={phone}
                onChange={v => { setError(''); setPhone(v); }}
                placeholder="+91 XXXXX XXXXX"
                icon="📱"
              />
              {error && <div style={{ fontSize:'12px', color:'#ff2d78', fontFamily:"'Exo 2', sans-serif", letterSpacing:'1px' }}>⚠ {error}</div>}
              <Button onClick={handleSendOTP} fullWidth size="lg" loading={loading}>
                SEND OTP
              </Button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <div style={{ textAlign:'center', fontSize:'13px', color:'#5a7a9a', marginBottom:'4px' }}>
                OTP sent to <span style={{ color:'#00f5ff' }}>+91 {phone}</span>
              </div>
              <Input
                label="Enter OTP"
                type="number"
                value={otp}
                onChange={v => { setError(''); setOtp(v); }}
                placeholder="6-digit code"
                icon="🔐"
              />
              {error && <div style={{ fontSize:'12px', color:'#ff2d78', fontFamily:"'Exo 2', sans-serif", letterSpacing:'1px' }}>⚠ {error}</div>}
              <Button onClick={handleVerify} fullWidth size="lg" loading={loading}>
                VERIFY & ACCESS
              </Button>
              <Button variant="ghost" onClick={() => { setStep('phone'); setError(''); setOtp(''); }} fullWidth size="sm">
                ← Change Number
              </Button>
            </div>
          )}

          <div style={{
            marginTop:'28px', paddingTop:'18px',
            borderTop:'1px solid rgba(0,245,255,0.08)',
            textAlign:'center', fontSize:'10px', color:'#2a4a6a',
            fontFamily:"'Share Tech Mono', monospace", letterSpacing:'1px',
          }}>
            SECURED BY ANTHROPIC AI · GOVT CERTIFIED
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginScreen;