import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState({ lat: 27.1957, lng: 77.9448, accuracy: 100 });
  const [error, setError] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);

  useEffect(() => {
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(err => console.warn("Battery API error:", err));
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocation({ lat: 40.7812, lng: -73.9665, accuracy: 100 }); // Test location fallback
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        console.warn("Location error:", err.message);
        setError(err.message);
        // Provide a dummy test location if browser blocks it or takes too long
        setLocation(prev => prev || { lat: 40.7812, lng: -73.9665, accuracy: 100 });
      },
      { enableHighAccuracy: false, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error, batteryLevel };
};

export default useGeolocation;
