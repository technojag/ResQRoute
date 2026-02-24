import React, { useState, useEffect } from 'react';
import { globalCSS } from './styles/theme';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MedicalBookingScreen from './screens/MedicalBookingScreen';
import FireBookingScreen from './screens/FireBookingScreen';
import TrackingScreen from './screens/TrackingScreen';

// Inject global styles
const styleTag = document.createElement('style');
styleTag.innerHTML = globalCSS;
document.head.appendChild(styleTag);

const App = () => {
  const [screen, setScreen] = useState('login'); // login | home | medical-booking | fire-booking | tracking
  const [screenParams, setScreenParams] = useState({});
  const [user, setUser] = useState(null);

  const navigate = (screenName, params = {}) => {
    setScreen(screenName);
    setScreenParams(params);
    window.scrollTo(0, 0);
  };

  const handleLogin = () => {
    setUser({ name: 'Rahul Sharma', phone: '+91 98765 43210' });
    navigate('home');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'home':
        return <HomeScreen onNavigate={navigate} user={user} />;
      case 'medical-booking':
        return <MedicalBookingScreen onNavigate={navigate} />;
      case 'fire-booking':
        return <FireBookingScreen onNavigate={navigate} />;
      case 'tracking':
        return <TrackingScreen onNavigate={navigate} params={screenParams} />;
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020408' }}>
      {renderScreen()}
    </div>
  );
};

export default App;