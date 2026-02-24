import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FireEmergencySelector } from '../components/booking/fire/FireEmergencySelector';
import { FireDetailsForm, BuildingInfoForm } from '../components/booking/fire/FireDetailsForm';
import VehicleTypeSelector from '../components/common/VehicleTypeSelector';
import LocationPicker from '../components/booking/LocationPicker';

const steps = [
  { id: 'type', label: 'Fire Type', icon: '🔥' },
  { id: 'details', label: 'Details', icon: '📋' },
  { id: 'building', label: 'Building', icon: '🏢' },
  { id: 'vehicle', label: 'Vehicles', icon: '🚒' },
  { id: 'location', label: 'Location', icon: '📍' },
  { id: 'confirm', label: 'Dispatch', icon: '🆘' },
];

const FireBookingScreen = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [booking, setBooking] = useState({ fireType: null, details: {}, building: {}, vehicleType: null, location: {} });
  const [loading, setLoading] = useState(false);

  const handleDispatch = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onNavigate('tracking', { type: 'fire', booking }); }, 2000);
  };

  const StepContent = () => {
    switch (steps[currentStep].id) {
      case 'type': return <FireEmergencySelector selected={booking.fireType} onSelect={v => setBooking(b => ({ ...b, fireType: v }))} />;
      case 'details': return <FireDetailsForm data={booking.details} onChange={v => setBooking(b => ({ ...b, details: v }))} />;
      case 'building': return <BuildingInfoForm data={booking.building} onChange={v => setBooking(b => ({ ...b, building: v }))} />;
      case 'vehicle': return <VehicleTypeSelector emergencyType="fire" selected={booking.vehicleType} onSelect={v => setBooking(b => ({ ...b, vehicleType: v }))} />;
      case 'location': return <LocationPicker location={booking.location} onChange={v => setBooking(b => ({ ...b, location: v }))} color="secondary" />;
      case 'confirm':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* AI analysis banner */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(255,45,120,0.1) 0%, rgba(255,149,0,0.08) 100%)',
              border: '1px solid rgba(255,45,120,0.3)',
              borderRadius: '8px',
              display: 'flex', gap: '14px', alignItems: 'center',
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 0 8px #ff2d78)' }}>🤖</div>
              <div>
                <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: '#ff2d78', letterSpacing: '2px', fontWeight: '700', marginBottom: '4px' }}>
                  AI FIRE ANALYSIS
                </div>
                <div style={{ fontSize: '13px', color: '#e8f4fd', fontFamily: "'Rajdhani', sans-serif" }}>
                  Classified as <strong style={{ color: '#ff2d78' }}>MAJOR FIRE</strong>. Deploying <strong>3 fire trucks + 1 HazMat</strong> unit. Spread prediction: <strong style={{ color: '#ff9500' }}>High risk</strong>.
                </div>
              </div>
            </div>

            <div style={{
              padding: '20px', background: 'rgba(255,45,120,0.04)',
              border: '1px solid rgba(255,45,120,0.2)', borderRadius: '8px',
            }}>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: '#ff2d78', letterSpacing: '2px', marginBottom: '16px' }}>
                ◆ DISPATCH SUMMARY
              </div>
              {[
                { label: 'Fire Type', value: booking.fireType?.toUpperCase() || '—' },
                { label: 'Scale', value: booking.details?.scale?.toUpperCase() || '—' },
                { label: 'Building', value: booking.building?.buildingType || '—' },
                { label: 'Floors', value: booking.building?.floors ? `${booking.building.floors} floors` : '—' },
                { label: 'Trapped', value: booking.details?.trapped || '0' },
                { label: 'Units Dispatching', value: '3 Fire Trucks + 1 HazMat' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingBottom: '10px', marginBottom: '10px',
                  borderBottom: '1px solid rgba(255,45,120,0.06)',
                }}>
                  <span style={{ fontSize: '12px', color: '#5a7a9a', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif" }}>{row.label}</span>
                  <span style={{ fontSize: '14px', color: '#e8f4fd', fontFamily: "'Rajdhani', sans-serif", fontWeight: '600' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <Button onClick={handleDispatch} fullWidth size="lg" variant="secondary" loading={loading}>
              🚒 DISPATCH FIRE UNITS NOW
            </Button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020408', color: '#e8f4fd', fontFamily: "'Rajdhani', sans-serif" }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(255,45,120,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,120,0.02) 1px, transparent 1px)`, backgroundSize: '50px 50px', pointerEvents: 'none' }} />

      <div style={{
        padding: '16px 32px', borderBottom: '1px solid rgba(255,45,120,0.15)',
        background: 'rgba(2,4,8,0.95)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: '16px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => currentStep > 0 ? setCurrentStep(s => s - 1) : onNavigate('home')}
          style={{ background: 'transparent', border: '1px solid rgba(255,45,120,0.3)', color: '#ff2d78', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontFamily: "'Exo 2', sans-serif", letterSpacing: '1px', fontWeight: '700' }}
        >← BACK</button>
        <div>
          <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: '800', color: '#ff2d78', letterSpacing: '2px', textTransform: 'uppercase' }}>
            🔥 Fire Emergency Report
          </div>
          <div style={{ fontSize: '12px', color: '#2a4a6a', letterSpacing: '1.5px', fontFamily: "'Share Tech Mono', monospace" }}>
            Step {currentStep + 1} of {steps.length} · {steps[currentStep].label.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{ flex: 1 }}>
              <div style={{ height: '4px', borderRadius: '2px', background: idx <= currentStep ? '#ff2d78' : 'rgba(255,45,120,0.1)', boxShadow: idx <= currentStep ? '0 0 8px rgba(255,45,120,0.5)' : 'none', marginBottom: '6px', transition: 'all 0.3s' }} />
              <div style={{ fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif", color: idx <= currentStep ? '#ff2d78' : '#2a4a6a', textAlign: 'center' }}>
                {step.icon} {step.label}
              </div>
            </div>
          ))}
        </div>

        <Card title={steps[currentStep].label} glow="secondary" style={{ marginBottom: '20px', animation: 'slide-in-up 0.3s ease' }}>
          <StepContent />
        </Card>

        {steps[currentStep].id !== 'confirm' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setCurrentStep(s => s + 1)} size="lg" variant="secondary">
              NEXT: {steps[currentStep + 1]?.label?.toUpperCase()} →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FireBookingScreen;