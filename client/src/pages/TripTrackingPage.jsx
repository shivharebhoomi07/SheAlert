import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api';
import { AlertTriangle, Navigation } from 'lucide-react';

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

const TripTrackingPage = () => {
  const { token } = useParams();
  const [tripData, setTripData] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const socket = useSocket(token);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    fetchTripData();
  }, [token]);

  useEffect(() => {
    if (socket) {
      socket.emit('join_tracking', token);
      socket.on('location:updated', (location) => {
        setCurrentLocation(location);
      });
      socket.on('trip:status_changed', (data) => {
        setTripData(prev => prev ? { ...prev, status: data.status } : null);
      });
    }
  }, [socket]);

  const fetchTripData = async () => {
    try {
      const res = await api.get(`/trips/track/${token}`);
      setTripData(res.data.trip);
      if (res.data.trip.route && window.google) {
        const decoded = window.google.maps.geometry.encoding.decodePath(res.data.trip.route);
        setRoutePath(decoded.map(p => ({ lat: p.lat(), lng: p.lng() })));
      }
      if (res.data.trip.lastLocation) {
        setCurrentLocation(res.data.trip.lastLocation);
      } else {
        // Assume origin of route if no location yet
        if (res.data.trip.route && window.google) {
          const decoded = window.google.maps.geometry.encoding.decodePath(res.data.trip.route);
          if (decoded.length > 0) {
            setCurrentLocation({ lat: decoded[0].lat(), lng: decoded[0].lng() });
          }
        }
      }
    } catch (err) {
      setError('Invalid trip link or trip not found');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) return <div className="h-dvh flex flex-col items-center justify-center bg-bg text-sos font-bold">Error loading map</div>;
  if (loading || !isLoaded) return <div className="h-dvh flex flex-col items-center justify-center bg-bg text-text-muted">Loading trip tracking...</div>;
  if (error) return (
    <div className="h-dvh flex flex-col items-center justify-center bg-bg p-5 text-center">
      <AlertTriangle className="w-16 h-16 text-sos mb-4" />
      <h1 className="text-2xl font-sora font-bold text-text mb-2">Trip Unavailable</h1>
      <p className="text-text-muted">{error}</p>
    </div>
  );

  const getStatusDisplay = () => {
    switch (tripData.status) {
      case 'active': return { label: 'Live Trip', class: 'bg-brand text-bg' };
      case 'off_route': return { label: 'Off Route', class: 'bg-sos text-white animate-pulse' };
      case 'late': return { label: 'Late', class: 'bg-warn text-[#4D3200]' };
      case 'arrived': return { label: 'Arrived', class: 'bg-safe text-[#004D36]' };
      case 'cancelled': return { label: 'Cancelled', class: 'bg-surface-raised text-text-muted' };
      default: return { label: tripData.status, class: 'bg-surface-raised text-text' };
    }
  };

  const statusDisplay = getStatusDisplay();
  const isEnded = ['arrived', 'cancelled'].includes(tripData.status);

  return (
    <div className="fixed inset-0 bg-bg flex flex-col">
      <div className="absolute top-[env(safe-area-inset-top)] left-1/2 -translate-x-1/2 mt-4 z-10 flex flex-col items-center">
        <div className="bg-surface-raised/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-line flex items-center gap-3">
          <span className="font-bold text-text whitespace-nowrap">{tripData.user?.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusDisplay.class}`}>
            {statusDisplay.label}
          </span>
        </div>
      </div>

      <div className={`flex-1 relative ${isEnded ? 'opacity-50 grayscale' : ''}`}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : { lat: 0, lng: 0 }}
          options={{ disableDefaultUI: true, zoomControl: false, styles: darkMapStyle }}
        >
          {routePath.length > 0 && (
            <Polyline 
              path={routePath} 
              options={{ strokeColor: '#9D84FF', strokeOpacity: 0.5, strokeWeight: 4 }}
            />
          )}
          {currentLocation && (
            <Marker 
              position={{ lat: currentLocation.lat, lng: currentLocation.lng }} 
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#9D84FF',
                fillOpacity: 1,
                strokeColor: '#1B1626',
                strokeWeight: 2,
                scale: 8
              }}
            />
          )}
          {tripData.destination && (
            <Marker 
              position={{ lat: tripData.destination.lat, lng: tripData.destination.lng }} 
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#36D6AA',
                fillOpacity: 1,
                strokeColor: '#1B1626',
                strokeWeight: 2,
                scale: 6
              }}
            />
          )}
        </GoogleMap>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-[28px] border-t border-line pb-[env(safe-area-inset-bottom)] z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="p-5">
          {isEnded ? (
            <div className="text-center py-4">
              <p className="text-xl font-sora font-bold text-text">
                {tripData.status === 'arrived' ? 'She arrived safely.' : 'She ended the trip.'}
              </p>
              <p className="text-text-muted mt-2">Live tracking has ended.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <Navigation className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-text flex-1 truncate">{tripData.destination?.address}</h3>
              </div>
              <div className="flex justify-between items-end mb-2 mt-4">
                <span className="text-brand font-bold text-lg">
                  {(() => {
                    const diff = Math.floor((new Date(tripData.expectedArrival) - new Date()) / 60000);
                    return diff > 0 ? `${diff} min left` : 'Late';
                  })()}
                </span>
                <span className="text-text-muted text-xs">
                  {tripData.distanceLeftMeters ? (tripData.distanceLeftMeters/1000).toFixed(1) + ' km left' : ''}
                </span>
              </div>
              <div className="w-full h-1.5 bg-line rounded-full overflow-hidden mb-4">
                <div className="h-full bg-brand rounded-full transition-all" style={{ width: '50%' }}></div>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-text-muted">Expected Arrival</span>
                <span className="text-text">{new Date(tripData.expectedArrival).toLocaleTimeString()}</span>
              </div>
              {tripData.status === 'off_route' && (
                <div className="mt-4 bg-sos/20 border border-sos text-sos p-3 rounded-DEFAULT text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  She has deviated significantly from her route. Check in!
                </div>
              )}
              {tripData.status === 'late' && (
                <div className="mt-4 bg-warn/20 border border-warn text-warn p-3 rounded-DEFAULT text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  She is running late. Try contacting her!
                </div>
              )}
              {tripData.status === 'stopped' && (
                <div className="mt-4 bg-warn/20 border border-warn text-warn p-3 rounded-DEFAULT text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  She has been stopped for a while. Check in!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripTrackingPage;
