import React, { useEffect, useState } from 'react';

const LaneClearAlert = ({ isVisible, message, onDismiss }) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    if (isVisible) {
      const timer = setTimeout(() => {
        setShow(false);
        if (onDismiss) onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: '20px', left: '50%',
      transform: 'translateX(-50%)', backgroundColor: '#E53935',
      color: '#fff', padding: '16px 24px', borderRadius: '8px',
      zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: '12px', minWidth: '300px',
    }}>
      <span style={{ fontSize: '24px' }}>🚨</span>
      <div style={{ flex: 1 }}>
        <strong>EMERGENCY ALERT</strong>
        <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
          {message || 'Ambulance approaching! Please clear the lane.'}
        </p>
      </div>
      <button onClick={() => { setShow(false); if (onDismiss) onDismiss(); }}
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>
        ✕
      </button>
    </div>
  );
};

export default LaneClearAlert;