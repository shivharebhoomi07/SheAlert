import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

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
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#120F1A' }] },
];

const TrackingPage = () => {
  const { token } = useParams();
  const [alertData, setAlertData] = useState(null);
  const [path, setPath] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseSent, setResponseSent] = useState('');

  const socket = useSocket(token);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    fetchTrackingData();
  }, [token]);

  useEffect(() => {
    if (socket) {
      socket.on('location:updated', (location) => {
        setCurrentLocation(location);
        setPath(prev => [...prev, location]);
      });
    }
  }, [socket]);

  const fetchTrackingData = async () => {
    try {
      const res = await api.get(`/alerts/track/${token}`);
      setAlertData(res.data.alert);
      setPath(res.data.path);
      if (res.data.path.length > 0) {
        setCurrentLocation(res.data.path[res.data.path.length - 1]);
      } else if (res.data.alert.lastLocation) {
        setCurrentLocation(res.data.alert.lastLocation);
        setPath([res.data.alert.lastLocation]);
      }
    } catch (err) {
      setError('Invalid tracking link or alert not found');
    } finally {
      setLoading(false);
    }
  };

  const respondToAlert = async (type) => {
    const contactId = new URLSearchParams(window.location.search).get('c');
    if (!contactId) return;
    try {
      await api.post(`/alerts/track/${token}/respond`, { contactId, responseType: type });
      setResponseSent(type === 'on_way' ? 'Sent. She can see you are on your way.' : 'Sent. She knows you saw this.');
    } catch (err) {
      alert("Failed to send response");
    }
  };

  if (loadError) return <div className="h-dvh flex flex-col items-center justify-center bg-bg text-sos font-bold">Error loading map</div>;
  if (loading || !isLoaded) return <div className="h-dvh flex flex-col items-center justify-center bg-bg text-text-muted">Loading live tracking...</div>;
  if (error) return (
    <div className="h-dvh flex flex-col items-center justify-center bg-bg p-5 text-center">
      <AlertTriangle className="w-16 h-16 text-sos mb-4" />
      <h1 className="text-2xl font-sora font-bold text-text mb-2">Tracking Unavailable</h1>
      <p className="text-text-muted">{error}</p>
    </div>
  );

  const isActive = alertData.status === 'active';
  const getSecondsSinceUpdate = () => {
    if (!currentLocation?.timestamp) return null;
    return Math.floor((Date.now() - new Date(currentLocation.timestamp).getTime()) / 1000);
  };

  const secondsSinceUpdate = getSecondsSinceUpdate();
  let statusBadgeLabel = isActive ? 'Live' : 'Ended';
  let statusBadgeClass = isActive ? 'bg-sos text-white' : 'bg-safe text-[#004D36]';
  if (isActive && secondsSinceUpdate > 120) {
    statusBadgeLabel = 'Signal lost';
    statusBadgeClass = 'bg-warn text-[#4D3200]';
  }

  const contactId = new URLSearchParams(window.location.search).get('c');

  return (
    <div className="fixed inset-0 bg-bg flex flex-col">
      {/* Top overlay pill */}
      <div className="absolute top-[env(safe-area-inset-top)] left-1/2 -translate-x-1/2 mt-4 z-10 flex flex-col items-center">
        <div className="bg-surface-raised/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-line flex items-center gap-3">
          <span className="font-bold text-text whitespace-nowrap">{alertData.user?.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusBadgeClass}`}>
            {statusBadgeLabel}
          </span>
        </div>
        {secondsSinceUpdate !== null && isActive && (
          <div className="mt-2 text-xs font-medium text-text bg-bg/60 backdrop-blur-sm px-2 py-1 rounded">
            Updated {secondsSinceUpdate < 60 ? `${secondsSinceUpdate}s` : `${Math.floor(secondsSinceUpdate/60)}m`} ago
          </div>
        )}
      </div>

      <div className={`flex-1 relative ${!isActive ? 'opacity-50 grayscale' : ''}`}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={16}
          center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : { lat: 0, lng: 0 }}
          options={{ disableDefaultUI: true, zoomControl: false, styles: darkMapStyle }}
        >
          {currentLocation && (
            <Marker 
              position={{ lat: currentLocation.lat, lng: currentLocation.lng }} 
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: isActive ? '#FF4D5E' : '#36D6AA',
                fillOpacity: 1,
                strokeColor: '#1B1626',
                strokeWeight: 2,
                scale: 10
              }}
            />
          )}
          <Polyline 
            path={path.map(p => ({ lat: p.lat, lng: p.lng }))} 
            options={{ strokeColor: '#FF4D5E', strokeOpacity: 0.8, strokeWeight: 4 }}
          />
        </GoogleMap>
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-[28px] border-t border-line pb-[env(safe-area-inset-bottom)] z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="p-5">
          {!isActive ? (
            <div className="text-center py-4">
              <p className="text-xl font-sora font-bold text-text">She marked herself safe.</p>
              <p className="text-text-muted mt-2">Live tracking has ended.</p>
            </div>
          ) : (
            <>
              {currentLocation?.batteryLevel !== undefined && (
                <div className="flex justify-between items-center mb-6 text-sm font-bold">
                  <span className="text-text-muted">Battery</span>
                  <span className={currentLocation.batteryLevel <= 20 ? 'text-sos' : 'text-safe'}>{currentLocation.batteryLevel}%</span>
                </div>
              )}

              {isActive && secondsSinceUpdate > 120 && (
                <div className="mb-6 bg-warn/20 border border-warn text-warn p-3 rounded-DEFAULT text-sm font-bold">
                  Location signal lost. Trying to reconnect...
                </div>
              )}

              {contactId && !responseSent ? (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => respondToAlert('seen')}
                    className="h-14 bg-surface-raised text-text rounded-DEFAULT font-bold hover:bg-line transition"
                  >
                    I've seen this
                  </button>
                  <button 
                    onClick={() => respondToAlert('on_way')}
                    className="h-14 bg-brand text-bg rounded-DEFAULT font-bold hover:bg-brand/90 transition shadow-[0_0_20px_rgba(157,132,255,0.3)]"
                  >
                    I'm on my way
                  </button>
                </div>
              ) : responseSent ? (
                <div className="h-14 flex items-center justify-center bg-surface-raised text-safe font-bold rounded-DEFAULT">
                  {responseSent}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
