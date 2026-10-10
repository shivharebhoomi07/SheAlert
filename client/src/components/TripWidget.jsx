import { useState, useRef, useEffect, useCallback } from 'react';
import { useLoadScript, DirectionsRenderer, GoogleMap } from '@react-google-maps/api';
import api from '../services/api';
import { Navigation, X, Search, Loader } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';

const libraries = [];
const mapContainerStyle = { width: '100%', height: '200px', borderRadius: '12px' };
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

const TripWidget = ({ activeTrip, setActiveTrip, contacts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [destination, setDestination] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [showSavePlace, setShowSavePlace] = useState(false);
  const [savePlaceName, setSavePlaceName] = useState('');
  const debounceRef = useRef(null);

  const { location } = useGeolocation();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, libraries });

  useEffect(() => {
    if (isModalOpen) {
      api.get('/places').then(res => setSavedPlaces(res.data)).catch(console.error);
    }
  }, [isModalOpen]);

  const searchPlaces = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error('Nominatim search failed:', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(e.target.value), 400);
  };

  const handleSelectSuggestion = async (place, isSaved = false) => {
    const lat = isSaved ? place.lat : parseFloat(place.lat);
    const lng = isSaved ? place.lng : parseFloat(place.lon);
    const address = isSaved ? place.address : place.display_name;

    if (!isSaved) {
       // Optionally auto-save if they want, but let's just use it
       setQuery(address.split(',').slice(0, 2).join(', '));
    } else {
       setQuery(place.name);
    }
    setSuggestions([]);
    setDestination({ lat, lng, address });

    if (!location) return;
    setIsRoutingLoading(true);
    try {
      const directionsService = new window.google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: { lat: location.lat, lng: location.lng },
        destination: { lat, lng },
        travelMode: window.google.maps.TravelMode.WALKING,
      });
      setDirectionsResponse(results);
    } catch (e) {
      console.error('Directions failed:', e);
      // Still set destination even if directions fail
    } finally {
      setIsRoutingLoading(false);
    }
  };

  const handleSavePlace = async () => {
    if (!savePlaceName || !destination) return;
    try {
      const res = await api.post('/places', {
        name: savePlaceName,
        lat: destination.lat,
        lng: destination.lng,
        address: destination.address
      });
      setSavedPlaces(prev => [...prev, res.data]);
      setShowSavePlace(false);
      setSavePlaceName('');
    } catch (error) {
      console.error('Failed to save place:', error);
    }
  };

  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startTrip = async () => {
    if (!destination) return;
    
    let durationValue = 3600;
    if (directionsResponse?.routes?.[0]?.legs?.[0]?.duration?.value) {
      durationValue = directionsResponse.routes[0].legs[0].duration.value;
    } else if (location && destination) {
      const distKm = calculateDistanceKm(location.lat, location.lng, destination.lat, destination.lng);
      // Assume 60 km/h average speed across globe if google fails
      durationValue = Math.floor(distKm * 60); 
    }
    
    const expectedArrival = new Date(Date.now() + durationValue * 1000);

    try {
      const res = await api.post('/trips', {
        destination,
        route: directionsResponse?.routes[0]?.overview_polyline || '',
        expectedArrival,
        lat: location?.lat,
        lng: location?.lng,
        accuracy: location?.accuracy
      });
      setActiveTrip(res.data);
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to start trip.');
    }
  };

  const cancelTrip = async () => {
    if (!activeTrip) return;
    try {
      await api.post(`/trips/${activeTrip._id}/cancel`);
      setActiveTrip(null);
    } catch (err) {
      alert('Failed to cancel trip.');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setQuery('');
    setSuggestions([]);
    setDestination(null);
    setDirectionsResponse(null);
  };

  if (!isLoaded) return null;

  if (activeTrip) {
    const etaDate = new Date(activeTrip.expectedArrival);
    const m = Math.max(0, Math.floor((etaDate - new Date()) / 60000));
    
    return (
      <div 
        onClick={() => window.dispatchEvent(new CustomEvent('open-active-trip'))}
        className="bg-surface border border-brand rounded-card p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(157,132,255,0.1)] cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-text flex items-center gap-2 mb-1">
              <Navigation className="w-4 h-4 text-brand" />
              Heading to
            </h3>
            <p className="text-text-muted text-xs truncate max-w-[200px]">{activeTrip.destination?.address}</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); cancelTrip(); }} 
            className="px-3 py-1.5 bg-surface-raised text-sos rounded-DEFAULT font-bold text-xs hover:bg-line transition"
          >
            End
          </button>
        </div>
        
        <div className="flex justify-between items-end mb-2">
          <p className="text-brand font-bold text-lg">{m} min left</p>
          <p className="text-text-muted text-xs">{activeTrip.distanceLeftMeters ? (activeTrip.distanceLeftMeters/1000).toFixed(1) + ' km' : ''}</p>
        </div>
        
        <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
           <div className="h-full bg-brand rounded-full transition-all" style={{ width: '50%' }}></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-surface border border-line rounded-card p-4 flex flex-col justify-between text-left hover:bg-surface-raised transition h-[120px]"
      >
        <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center">
          <Navigation className="w-5 h-5 text-brand" />
        </div>
        <span className="font-bold text-text">Start Trip</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-surface rounded-t-sheet w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90dvh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-line">
            <div className="w-full flex justify-center p-4">
              <div className="w-12 h-1.5 bg-line rounded-full"></div>
            </div>

            <div className="px-5 pb-5 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-sora font-bold text-xl text-text">Plan a trip</h2>
                <button onClick={handleClose} className="text-text-muted hover:text-text bg-surface-raised rounded-full p-2"><X className="w-5 h-5" /></button>
              </div>

              {/* Search box */}
              <div className="mb-4 relative">
                <label className="block text-sm font-bold text-text-muted mb-2">Where to?</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Search destination..."
                    className="w-full pl-10 pr-4 py-4 bg-surface-raised border border-line rounded-DEFAULT text-text placeholder-text-muted outline-none focus:border-brand transition"
                  />
                  {isSearching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />}
                </div>

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-line rounded-DEFAULT shadow-2xl z-10 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSuggestion(s, false)}
                        className="w-full text-left px-4 py-3 text-sm text-text hover:bg-line transition border-b border-line last:border-0 flex flex-col gap-0.5"
                      >
                        <span className="font-bold truncate">{s.name || s.display_name.split(',')[0]}</span>
                        <span className="text-text-muted text-xs truncate">{s.display_name.split(',').slice(1, 3).join(',')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Places */}
              {!destination && suggestions.length === 0 && savedPlaces.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-text-muted mb-3">Saved Places</h3>
                  <div className="flex flex-col gap-2">
                    {savedPlaces.map(sp => (
                      <button key={sp._id} onClick={() => handleSelectSuggestion(sp, true)} className="flex items-center gap-3 p-3 bg-surface-raised border border-line rounded-DEFAULT hover:border-brand transition text-left">
                        <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
                          <Navigation className="w-4 h-4 text-brand" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                           <span className="font-bold text-text text-sm">{sp.name}</span>
                           <span className="text-xs text-text-muted truncate">{sp.address}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Route preview */}
              {isRoutingLoading && (
                <div className="flex items-center justify-center h-[100px] text-text-muted gap-2">
                  <Loader className="w-5 h-5 animate-spin" /> Calculating route...
                </div>
              )}

              {directionsResponse && !isRoutingLoading && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-text">Route preview</span>
                    <span className="text-brand font-bold bg-brand/10 px-3 py-1 rounded-full text-sm">
                      ETA: {directionsResponse.routes[0].legs[0].duration.text}
                    </span>
                  </div>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={13}
                    center={location}
                    options={{ disableDefaultUI: true, styles: darkMapStyle }}
                  >
                    <DirectionsRenderer directions={directionsResponse} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#9D84FF', strokeWeight: 4 } }} />
                  </GoogleMap>
                </div>
              )}

              {/* Show destination info without route if directions failed */}
              {destination && !directionsResponse && !isRoutingLoading && (
                <div className="mb-6 p-3 bg-surface-raised border border-line rounded-DEFAULT">
                  <p className="text-sm text-text-muted">Destination set:</p>
                  <p className="font-bold text-text text-sm mt-1">{destination.address.split(',').slice(0, 3).join(', ')}</p>
                </div>
              )}

              {destination && (
                <div className="mb-6">
                  {!showSavePlace ? (
                    <button 
                      onClick={() => setShowSavePlace(true)}
                      className="text-brand font-bold text-sm flex items-center gap-1 hover:opacity-80 transition"
                    >
                      + Save this place (Home, Work, etc.)
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-surface-raised p-2 rounded-DEFAULT border border-line">
                      <input 
                        type="text" 
                        value={savePlaceName} 
                        onChange={(e) => setSavePlaceName(e.target.value)} 
                        placeholder="e.g. Home"
                        className="bg-transparent flex-1 text-sm text-text outline-none px-2"
                        autoFocus
                      />
                      <button 
                        onClick={handleSavePlace}
                        className="bg-brand text-bg px-3 py-1.5 rounded-sm font-bold text-xs"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setShowSavePlace(false)}
                        className="text-text-muted px-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={startTrip}
                disabled={!destination}
                className="w-full h-[56px] bg-brand text-bg rounded-DEFAULT font-bold text-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
              >
                Share Trip & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TripWidget;
