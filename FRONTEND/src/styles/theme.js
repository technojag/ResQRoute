export const theme = {
  colors: {
    bg: '#020408',
    bgCard: '#060d16',
    bgElevated: '#0a1628',
    primary: '#00f5ff',
    primaryGlow: 'rgba(0,245,255,0.15)',
    secondary: '#ff2d78',
    secondaryGlow: 'rgba(255,45,120,0.15)',
    accent: '#7fff00',
    accentGlow: 'rgba(127,255,0,0.15)',
    warning: '#ff9500',
    warningGlow: 'rgba(255,149,0,0.15)',
    text: '#e8f4fd',
    textMuted: '#5a7a9a',
    textDim: '#2a4a6a',
    border: 'rgba(0,245,255,0.12)',
    borderHover: 'rgba(0,245,255,0.4)',
  },
  fonts: {
    display: "'Exo 2', sans-serif",
    body: "'Rajdhani', sans-serif",
    mono: "'Share Tech Mono', monospace",
  },
  shadows: {
    neonBlue: '0 0 20px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.1)',
    neonPink: '0 0 20px rgba(255,45,120,0.4), 0 0 60px rgba(255,45,120,0.1)',
    neonGreen: '0 0 20px rgba(127,255,0,0.4), 0 0 60px rgba(127,255,0,0.1)',
    card: '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,245,255,0.05)',
  }
};

export const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    background: #020408;
    color: #e8f4fd;
    font-family: 'Rajdhani', sans-serif;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #020408; }
  ::-webkit-scrollbar-thumb { background: #00f5ff; border-radius: 2px; }

  @keyframes pulse-neon {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes scan-line {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.1); }
    50% { box-shadow: 0 0 40px rgba(0,245,255,0.8), 0 0 100px rgba(0,245,255,0.3); }
  }
  @keyframes slide-in-left {
    from { opacity: 0; transform: translateX(-40px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slide-in-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes flicker {
    0%, 100% { opacity: 1; }
    92% { opacity: 1; }
    93% { opacity: 0.4; }
    94% { opacity: 1; }
    96% { opacity: 0.6; }
    97% { opacity: 1; }
  }
  @keyframes data-stream {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-20px); opacity: 0; }
  }
`;