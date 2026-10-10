import { useState, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api';
import { AlertTriangle, MessageSquare, Phone, X } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';
import api from '../services/api';

const libraries = ['geometry'];
const mapContainerStyle = { width: '100%', height: '100%' };
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1B1626' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1B1626' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A296B5' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#F2EEF8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#A296B5' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#261F35' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#A296B5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#352B49' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#261F35' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#A296B5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#FF4D5E' }] }, // just example
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#120F1A' }] },
];

const ActiveAlertScreen = ({ activeAlert, stopAlert, contacts, responses, generateSmsLink }) => {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, libraries });
  const { location } = useGeolocation();
  const [duration, setDuration] = useState(0);
  const [sheetSnap, setSheetSnap] = useState('peek');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showWaSheet, setShowWaSheet] = useState(true);

  useEffect(() => {
    if (activeAlert) {
      const start = new Date(activeAlert.startedAt).getTime();
      const interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeAlert]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    if (isStopping) return;
    if (showConfirm) {
      setIsStopping(true);
      await stopAlert();
      setIsStopping(false);
    } else {
      setShowConfirm(true);
      // Auto-reset confirm after 3s so it doesn't get stuck
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  const generateWaLink = (contact) => {
    let cleanPhone = contact.phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const text = `🚨 EMERGENCY: I have triggered an SOS alert at ${timeString}.\n\nTrack my live location here: ${window.location.origin}/track/${activeAlert.trackingToken}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  if (!isLoaded) return <div className="h-dvh flex items-center justify-center bg-bg">Loading Map...</div>;

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col font-manrope">
      {/* Top Banner */}
      <div className="bg-sos text-white h-12 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] box-content shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-sm">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          Alert Active
        </div>
        <div className="font-sora font-bold text-lg">{formatDuration(duration)}</div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-surface">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={16}
          center={location || { lat: 0, lng: 0 }}
          options={{
            styles: darkMapStyle,
            disableDefaultUI: true,
            zoomControl: false,
          }}
        >
          {location && (
            <Marker 
              position={location} 
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#FF4D5E', // sos
                fillOpacity: 1,
                strokeColor: '#1B1626',
                strokeWeight: 2,
                scale: 10
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Startup WA Sheet */}
      {showWaSheet && (
        <div className="absolute top-16 left-4 right-4 bg-surface-raised border border-line rounded-card shadow-2xl p-4 z-30 animate-in slide-in-from-top-4 fade-in">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-sora font-bold text-text">Also send it on WhatsApp?</h3>
            <button onClick={() => setShowWaSheet(false)} className="text-text-muted p-1 hover:text-text bg-surface rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
            {contacts.map(c => (
              <a 
                key={c._id}
                href={generateWaLink(c)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-surface border border-line rounded-DEFAULT hover:border-[#36D6AA] transition"
              >
                <div className="w-8 h-8 rounded-full bg-[#36D6AA]/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#36D6AA]" />
                </div>
                <span className="font-bold text-text text-sm">{c.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Draggable Bottom Sheet */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-surface rounded-t-[28px] border-t border-line transition-all duration-300 ease-out shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pb-[env(safe-area-inset-bottom)] z-20 ${sheetSnap === 'full' ? 'h-[85vh]' : 'h-auto max-h-[50vh]'}`}
      >
        <div 
          className="w-full flex justify-center p-4 cursor-pointer"
          onClick={() => setSheetSnap(sheetSnap === 'peek' ? 'full' : 'peek')}
        >
          <div className="w-12 h-1.5 bg-line rounded-full"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <button 
            onClick={handleStop}
            disabled={isStopping}
            className={`w-full h-[56px] rounded-DEFAULT font-sora font-bold text-lg mb-6 transition-colors disabled:opacity-60 ${isStopping ? 'bg-line text-white' : showConfirm ? 'bg-warn text-white animate-pulse' : 'bg-safe text-[#004D36]'}`}
          >
            {isStopping ? 'Stopping...' : showConfirm ? 'Tap again to confirm ✓' : "I'm safe, stop alert"}
          </button>
          
          <div className="space-y-6">
            <div className={activeAlert.notificationStatus === 'failed' ? 'bg-warn/20 border border-warn p-4 rounded-card' : ''}>
              <h3 className="font-sora font-bold text-text mb-3">
                {activeAlert.notificationStatus === 'failed' ? '⚠️ Notifications Failed - Use Fallbacks Now' : 'Fallbacks'}
              </h3>
              <div className="flex flex-col gap-2">
                {contacts.map(c => (
                  <a 
                    key={c._id}
                    href={generateWaLink(c)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-12 flex items-center px-4 gap-3 bg-surface-raised border border-line rounded-DEFAULT font-bold text-text hover:border-[#36D6AA] transition text-sm"
                  >
                    <MessageSquare className="w-4 h-4 text-[#36D6AA]" /> Send WhatsApp to {c.name.split(' ')[0]}
                  </a>
                ))}
                <a 
                  href={generateSmsLink()}
                  className="w-full h-12 flex items-center px-4 gap-3 bg-surface-raised border border-line rounded-DEFAULT font-bold text-text hover:bg-line transition mt-2 text-sm"
                >
                  <MessageSquare className="w-4 h-4" /> SMS all contacts
                </a>
              </div>
            </div>

            {responses.length > 0 && (
              <div>
                <h3 className="font-sora font-bold text-text mb-3">Responses</h3>
                <div className="flex flex-col gap-2">
                  {responses.map((r, i) => (
                    <div key={i} className="bg-surface-raised p-3 rounded-DEFAULT border border-line flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${r.responseType === 'on_way' ? 'bg-brand' : 'bg-line'}`}></div>
                      <div>
                        <p className="font-bold text-text">{r.contactName}</p>
                        <p className="text-sm text-text-muted">
                          {r.responseType === 'on_way' ? 'is on their way' : 'has seen the alert'} • {new Date(r.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveAlertScreen;
