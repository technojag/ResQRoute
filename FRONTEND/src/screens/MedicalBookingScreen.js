import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import MedicalEmergencySelector from '../components/booking/medical/MedicalEmergencySelector';
import PatientDetailsForm from '../components/booking/medical/PatientDetailsForm';
import HospitalPreferenceSelector from '../components/booking/medical/HospitalPreferenceSelector';
import GovernmentHospitalDisplay from '../components/booking/medical/GovernmentHospitalDisplay';
import PrivateHospitalSelector from '../components/booking/medical/PrivateHospitalSelector';
import VehicleTypeSelector from '../components/common/VehicleTypeSelector';
import LocationPicker from '../components/booking/LocationPicker';

const steps = [
  { id: 'emergency', label: 'Emergency', icon: '⚡' },
  { id: 'patient', label: 'Patient', icon: '👤' },
  { id: 'vehicle', label: 'Vehicle', icon: '🚑' },
  { id: 'hospital', label: 'Hospital', icon: '🏥' },
  { id: 'location', label: 'Location', icon: '📍' },
  { id: 'confirm', label: 'Confirm', icon: '✅' },
];

const MedicalBookingScreen = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [booking, setBooking] = useState({
    emergencyType: null,
    patient: {},
    vehicleType: null,
    hospitalPreference: null,
    selectedHospital: null,
    location: {},
  });
  const [loading, setLoading] = useState(false);

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'emergency': return !!booking.emergencyType;
      case 'patient': return !!booking.patient.name && !!booking.patient.age;
      case 'vehicle': return !!booking.vehicleType;
      case 'hospital': return !!booking.hospitalPreference;
      case 'location': return !!booking.location.address || (!!booking.location.lat);
      default: return true;
    }
  };

  const handleBook = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onNavigate('tracking', { type: 'medical', booking }); }, 2000);
  };

  const StepContent = () => {
    const step = steps[currentStep].id;
    switch (step) {
      case 'emergency':
        return <MedicalEmergencySelector selected={booking.emergencyType} onSelect={v => setBooking(b => ({ ...b, emergencyType: v }))} />;
      case 'patient':
        return <PatientDetailsForm data={booking.patient} onChange={v => setBooking(b => ({ ...b, patient: v }))} />;
      case 'vehicle':
        return <VehicleTypeSelector emergencyType="medical" selected={booking.vehicleType} onSelect={v => setBooking(b => ({ ...b, vehicleType: v }))} />;
      case 'hospital':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <HospitalPreferenceSelector
              selected={booking.hospitalPreference}
              onSelect={v => setBooking(b => ({ ...b, hospitalPreference: v }))}
            />
            {booking.hospitalPreference === 'government' && <GovernmentHospitalDisplay />}
            {booking.hospitalPreference === 'private' && (
              <PrivateHospitalSelector
                selected={booking.selectedHospital}
                onSelect={v => setBooking(b => ({ ...b, selectedHospital: v }))}
              />
            )}
          </div>
        );
      case 'location':
        return <LocationPicker location={booking.location} onChange={v => setBooking(b => ({ ...b, location: v }))} />;
      case 'confirm':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '20px',
              background: 'rgba(0,245,255,0.05)',
              border: '1px solid rgba(0,245,255,0.2)',
              borderRadius: '8px',
            }}>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: '#00f5ff', letterSpacing: '2px', marginBottom: '16px' }}>
                ◆ BOOKING SUMMARY
              </div>
              {[
                { label: 'Emergency', value: booking.emergencyType?.toUpperCase() || '—' },
                { label: 'Patient', value: booking.patient?.name || '—' },
                { label: 'Age', value: booking.patient?.age ? `${booking.patient.age} yrs` : '—' },
                { label: 'Vehicle', value: booking.vehicleType?.toUpperCase() || '—' },
                { label: 'Hospital', value: booking.hospitalPreference === 'government' ? 'AIIMS Delhi (FREE)' : booking.selectedHospital?.toUpperCase() || '—' },
                { label: 'Location', value: booking.location?.address || `${booking.location?.lat}, ${booking.location?.lng}` || '—' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingBottom: '10px', marginBottom: '10px',
                  borderBottom: '1px solid rgba(0,245,255,0.06)',
                }}>
                  <span style={{ fontSize: '12px', color: '#5a7a9a', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif" }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: '14px', color: '#e8f4fd', fontFamily: "'Rajdhani', sans-serif", fontWeight: '600' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(127,255,0,0.06)',
              border: '1px solid rgba(127,255,0,0.2)',
              borderRadius: '6px',
              fontSize: '13px', color: '#7fff00',
              fontFamily: "'Rajdhani', sans-serif",
              lineHeight: '1.5',
            }}>
              ✅ Nearest ambulance will be dispatched immediately on booking. Average response time: <strong>6-8 minutes</strong>. Lane-clear alerts will be sent to nearby vehicles.
            </div>

            <Button onClick={handleBook} fullWidth size="lg" loading={loading}>
              🚑 DISPATCH AMBULANCE NOW
            </Button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020408',
      color: '#e8f4fd',
      fontFamily: "'Rajdhani', sans-serif",
      position: 'relative',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '50px 50px', pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <div style={{
        padding: '16px 32px', borderBottom: '1px solid rgba(0,245,255,0.1)',
        background: 'rgba(2,4,8,0.95)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: '16px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => currentStep > 0 ? setCurrentStep(s => s - 1) : onNavigate('home')}
          style={{
            background: 'transparent', border: '1px solid rgba(0,245,255,0.2)',
            color: '#00f5ff', padding: '8px 16px', borderRadius: '4px',
            cursor: 'pointer', fontSize: '14px', fontFamily: "'Exo 2', sans-serif",
            letterSpacing: '1px', fontWeight: '700',
          }}
        >
          ← BACK
        </button>
        <div>
          <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: '800', color: '#00f5ff', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Medical Emergency Booking
          </div>
          <div style={{ fontSize: '12px', color: '#2a4a6a', letterSpacing: '1.5px', fontFamily: "'Share Tech Mono', monospace" }}>
            Step {currentStep + 1} of {steps.length} · {steps[currentStep].label.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Step progress */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{ flex: 1 }}>
              <div style={{
                height: '4px', borderRadius: '2px',
                background: idx <= currentStep ? '#00f5ff' : 'rgba(0,245,255,0.1)',
                boxShadow: idx <= currentStep ? '0 0 8px rgba(0,245,255,0.5)' : 'none',
                marginBottom: '6px', transition: 'all 0.3s',
              }} />
              <div style={{
                fontSize: '9px', letterSpacing: '1px',
                textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif",
                color: idx <= currentStep ? '#00f5ff' : '#2a4a6a',
                textAlign: 'center', transition: 'color 0.3s',
              }}>
                {step.icon} {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Step card */}
        <Card
          title={steps[currentStep].label}
          glow="primary"
          style={{ marginBottom: '20px', animation: 'slide-in-up 0.3s ease' }}
        >
          <StepContent />
        </Card>

        {/* Navigation */}
        {steps[currentStep].id !== 'confirm' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setCurrentStep(s => s + 1)}
              disabled={!canProceed()}
              size="lg"
            >
              NEXT: {steps[currentStep + 1]?.label?.toUpperCase()} →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalBookingScreen;