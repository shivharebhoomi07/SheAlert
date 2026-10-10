import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import useGeolocation from '../hooks/useGeolocation';
import { GoogleMap, useLoadScript, HeatmapLayer, Marker } from '@react-google-maps/api';
import { MapPin, AlertTriangle, X } from 'lucide-react';

const libraries = ['places', 'visualization'];
const mapContainerStyle = { width: '100%', height: 'calc(100vh - 120px)', borderRadius: '20px' };

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

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('poor_lighting');
  const [note, setNote] = useState('');
  
  const mapRef = useRef();
  const { location } = useGeolocation();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, libraries });

  const fetchReports = useCallback(async (bounds) => {
    try {
      let url = '/reports';
      if (bounds) {
        url += `?bounds=${bounds.sw.lat},${bounds.sw.lng},${bounds.ne.lat},${bounds.ne.lng}`;
      }
      const res = await api.get(url);
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onBoundsChanged = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    fetchReports({ ne: { lat: ne.lat(), lng: ne.lng() }, sw: { lat: sw.lat(), lng: sw.lng() } });
  }, [fetchReports]);

  const handleMapClick = (e) => {
    setSelectedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setIsModalOpen(true);
  };

  const submitReport = async () => {
    if (!selectedLocation) return;
    try {
      await api.post('/reports', { lat: selectedLocation.lat, lng: selectedLocation.lng, category, note });
      setIsModalOpen(false);
      setSelectedLocation(null);
      setNote('');
      if (mapRef.current) onBoundsChanged();
      // use a proper toast in a real app
      alert("Report submitted successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit report.");
    }
  };

  if (!isLoaded) return <div className="p-8 text-center text-text-muted">Loading map...</div>;

  const heatmapData = reports.map(r => ({
    location: new window.google.maps.LatLng(r.lat, r.lng),
    weight: 1
  }));

  // Define heatmap gradient going from warn to sos
  const heatmapGradient = [
    'rgba(255, 181, 71, 0)',
    'rgba(255, 181, 71, 1)',
    'rgba(255, 77, 94, 1)'
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-sora font-bold text-text flex items-center gap-2">
          Unsafe Areas
        </h1>
        <p className="text-text-muted mt-1 text-sm">Tap anywhere on the map to anonymously report an area.</p>
      </div>

      <div className="bg-surface rounded-card border border-line p-1 relative flex-1">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={14}
          center={location || { lat: 28.6139, lng: 77.2090 }} 
          onLoad={onMapLoad}
          onIdle={onBoundsChanged}
          onClick={handleMapClick}
          options={{ mapTypeControl: false, streetViewControl: false, styles: darkMapStyle }}
        >
          {heatmapData.length > 0 && (
            <HeatmapLayer data={heatmapData} options={{ radius: 30, opacity: 0.8, gradient: heatmapGradient }} />
          )}
          {selectedLocation && (
            <Marker position={selectedLocation} icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#FF4D5E',
              fillOpacity: 1,
              strokeColor: '#1B1626',
              strokeWeight: 2,
              scale: 8
            }} />
          )}
        </GoogleMap>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-surface rounded-t-sheet w-full max-w-lg mx-auto overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-line">
            <div className="w-full flex justify-center p-4">
              <div className="w-12 h-1.5 bg-line rounded-full"></div>
            </div>
            <div className="px-5 pb-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-sora font-bold text-xl text-text">Report Area</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text bg-surface-raised rounded-full p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-bold text-text mb-2">What happened here?</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-14 px-4 bg-surface-raised border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition appearance-none"
                >
                  <option value="poor_lighting">Poor Lighting</option>
                  <option value="harassment">Harassment</option>
                  <option value="isolated">Too Isolated</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-text mb-2">Additional Note (Optional)</label>
                <textarea 
                  value={note} 
                  onChange={e => setNote(e.target.value)}
                  maxLength={200}
                  className="w-full p-4 bg-surface-raised border border-line rounded-DEFAULT text-text outline-none resize-none h-24 focus:border-brand transition"
                  placeholder="E.g., Streetlights were broken..."
                />
              </div>
              <button 
                onClick={submitReport}
                className="w-full h-[56px] bg-sos text-white rounded-DEFAULT font-bold text-lg hover:bg-sos/90 transition shadow-sm"
              >
                Submit Anonymously
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
