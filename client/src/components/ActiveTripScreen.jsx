import { useState, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api';
import { Navigation, Clock, User, MessageSquare, ShieldAlert, CheckCircle2, ChevronUp } from 'lucide-react';
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
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#9D84FF' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#120F1A' }] },
];

const ActiveTripScreen = ({ activeTrip, setActiveTrip, socket, contacts }) => {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, libraries });
  const { location } = useGeolocation();
  const [sheetSnap, setSheetSnap] = useState('peek');
  const [watchersCount, setWatchersCount] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [decodedRoute, setDecodedRoute] = useState([]);
  
  // Format ETA dynamically based on activeTrip.expectedArrival
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (activeTrip?.route) {
      // Decode polyline simply if window.google is available
      if (window.google) {
         try {
           const path = window.google.maps.geometry.encoding.decodePath(activeTrip.route);
           setDecodedRoute(path);
         } catch(e) {}
      }
    }
  }, [activeTrip, isLoaded]);

  useEffect(() => {
    if (!activeTrip) return;
    const interval = setInterval(() => {
      const now = new Date();
      const eta = new Date(activeTrip.expectedArrival);
      let diff = Math.floor((eta - now) / 1000);
      
      if (diff < 0) {
         setTimeLeftStr('Late');
      } else {
         const m = Math.floor(diff / 60);
         setTimeLeftStr(`${m} min left`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTrip]);

  useEffect(() => {
    if (!socket || !activeTrip) return;
    socket.emit('join_tracking', activeTrip.trackingToken);
    
    socket.on('room_watchers_count', (count) => {
      // Don't count the user themselves
      setWatchersCount(Math.max(0, count - 1));
    });

    socket.on('trip:status_changed', ({ status }) => {
      if (status === 'arrived' || status === 'cancelled') {
        setActiveTrip(null); // Return to dashboard
      }
    });

    return () => {
      socket.off('room_watchers_count');
      socket.off('trip:status_changed');
    };
  }, [socket, activeTrip]);

  const handleEndTrip = async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      await api.post(`/trips/${activeTrip._id}/cancel`);
      setActiveTrip(null);
    } catch (err) {
      alert("Failed to end trip");
    } finally {
      setIsEnding(false);
    }
  };

  const handleRunningLate = async () => {
    try {
      const res = await api.post(`/trips/${activeTrip._id}/extend`, { minutes: 10 });
      setActiveTrip(res.data);
    } catch(e) {
      alert("Failed to update ETA");
    }
  };

  const shareLink = () => {
    const link = `${window.location.origin}/track-trip/${activeTrip.trackingToken}`;
    if (navigator.share) {
      navigator.share({ title: 'Track my trip', text: 'Follow my live trip on SheAlert', url: link });
    } else {
      navigator.clipboard.writeText(link);
      alert('Tracking link copied to clipboard!');
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-bg flex items-center justify-center text-text">Loading...</div>;

  const destCoords = activeTrip?.destination ? { lat: activeTrip.destination.lat, lng: activeTrip.destination.lng } : null;

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-hidden flex flex-col">
      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={location || destCoords || { lat: 0, lng: 0 }}
          options={{
            disableDefaultUI: true,
            styles: darkMapStyle,
            gestureHandling: 'greedy'
          }}
        >
          {decodedRoute.length > 0 && (
            <Polyline path={decodedRoute} options={{ strokeColor: '#9D84FF', strokeWeight: 4 }} />
          )}
          {location && (
            <Marker 
              position={location} 
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#9D84FF',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
              }} 
            />
          )}
          {destCoords && (
            <Marker position={destCoords} />
          )}
        </GoogleMap>

        {/* Watchers Pill */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-md px-4 py-2 rounded-full border border-line flex items-center gap-2 shadow-lg z-10">
          <div className="w-2 h-2 rounded-full bg-[#36D6AA] animate-pulse"></div>
          <span className="text-sm font-bold text-text">{watchersCount} people watching</span>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className={`absolute bottom-0 left-0 right-0 bg-surface rounded-t-[28px] border-t border-line transition-all duration-300 ease-out shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pb-[env(safe-area-inset-bottom)] z-20 ${sheetSnap === 'full' ? 'h-[85vh]' : 'h-auto max-h-[50vh]'}`}>
        <div className="w-full flex justify-center p-4 cursor-pointer" onClick={() => setSheetSnap(sheetSnap === 'peek' ? 'full' : 'peek')}>
          <div className="w-12 h-1.5 bg-line rounded-full"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="mb-6">
            <h2 className="font-sora font-bold text-xl text-text">Heading to</h2>
            <p className="text-text-muted text-sm truncate">{activeTrip.destination.address}</p>
          </div>

          {/* ETA & Progress */}
          <div className="bg-surface-raised rounded-card p-4 mb-6">
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="text-3xl font-bold text-brand">{timeLeftStr}</span>
                <p className="text-text-muted text-xs">ETA: {new Date(activeTrip.expectedArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-text text-sm">{activeTrip.distanceLeftMeters ? (activeTrip.distanceLeftMeters/1000).toFixed(1) + ' km' : '---'}</span>
              </div>
            </div>
            
            {/* Fake progress bar since we don't have total distance */}
            <div className="w-full h-2 bg-line rounded-full overflow-hidden">
               <div className="h-full bg-brand rounded-full transition-all duration-1000" style={{ width: '50%' }}></div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={handleRunningLate} className="flex items-center justify-center gap-2 h-[50px] bg-surface-raised border border-line rounded-DEFAULT text-text font-bold hover:bg-line transition">
              <Clock className="w-4 h-4" /> Late (+10m)
            </button>
            <button onClick={shareLink} className="flex items-center justify-center gap-2 h-[50px] bg-surface-raised border border-line rounded-DEFAULT text-text font-bold hover:bg-line transition">
               Share Link
            </button>
          </div>

          <button onClick={handleEndTrip} disabled={isEnding} className="w-full h-[56px] bg-brand text-bg rounded-DEFAULT font-bold text-lg hover:bg-brand/90 transition disabled:opacity-60">
            {isEnding ? 'Ending...' : 'End Trip'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveTripScreen;
