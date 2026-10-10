import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useGeolocation from '../hooks/useGeolocation';
import useSocket from '../hooks/useSocket';
import { Phone, Navigation } from 'lucide-react';
import TripWidget from '../components/TripWidget';
import CheckStatusPopup from '../components/CheckStatusPopup';
import ActiveAlertScreen from '../components/ActiveAlertScreen';
import ActiveTripScreen from '../components/ActiveTripScreen';
import Onboarding from '../components/Onboarding';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [contactsCount, setContactsCount] = useState(0);
  const [activeAlert, setActiveAlert] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [showActiveTripScreen, setShowActiveTripScreen] = useState(false);
  const [showSafeWaSheet, setShowSafeWaSheet] = useState(false);
  
  const [countdown, setCountdown] = useState(0);
  const [alertLoading, setAlertLoading] = useState(false);
  const countdownRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    const handleOpenTripScreen = () => setShowActiveTripScreen(true);
    window.addEventListener('open-active-trip', handleOpenTripScreen);
    return () => window.removeEventListener('open-active-trip', handleOpenTripScreen);
  }, []);

  const { location, batteryLevel } = useGeolocation();
  const socket = useSocket(activeAlert?.trackingToken);

  const [contacts, setContacts] = useState([]);
  const [responses, setResponses] = useState([]);
  const [lastAlert, setLastAlert] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('shealert_onboarding_seen') !== 'true') {
      setShowOnboarding(true);
    }
    fetchContacts();
    fetchActiveAlert();
    fetchActiveTrip();
    fetchLastAlert();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleResponse = (data) => {
        setResponses(prev => [...prev, data]);
      };
      const handleTripStatus = (data) => {
        if (data.status === 'cancelled' || data.status === 'arrived') {
          setActiveTrip(null);
        } else {
          setActiveTrip(prev => prev ? { ...prev, status: data.status } : null);
        }
      };
      
      socket.on('contact:responded', handleResponse);
      socket.on('trip:status_changed', handleTripStatus);
      return () => {
        socket.off('contact:responded', handleResponse);
        socket.off('trip:status_changed', handleTripStatus);
      }
    }
  }, [socket]);

  // Keep locationRef always fresh so interval callbacks never get stale closure
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (activeAlert && activeAlert.status === 'active' && location && socket) {
      api.post(`/alerts/${activeAlert._id}/location`, {
        lat: location.lat, lng: location.lng, accuracy: location.accuracy, batteryLevel
      }).catch(err => console.error(err));
      socket.emit('location:update', { trackingToken: activeAlert.trackingToken, location: { ...location, timestamp: new Date(), batteryLevel } });
    }
    
    if (activeTrip && !activeAlert && location && socket) {
      api.post(`/trips/${activeTrip._id}/location`, {
        lat: location.lat, lng: location.lng, accuracy: location.accuracy, batteryLevel
      }).catch(err => console.error(err));
      socket.emit('location:update', { trackingToken: activeTrip.trackingToken, location: { ...location, timestamp: new Date(), batteryLevel } });
    }
  }, [location, batteryLevel, activeAlert, activeTrip, socket]);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts');
      setContactsCount(res.data.length);
      setContacts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchActiveAlert = async () => {
    try {
      const res = await api.get('/alerts');
      const active = res.data.find(a => a.status === 'active');
      if (active) {
        setActiveAlert(active);
        setResponses(active.responses?.map(r => ({
          contactName: r.contact?.name || 'Contact',
          responseType: r.responseType,
          timestamp: r.timestamp
        })) || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLastAlert = async () => {
    try {
      const res = await api.get('/alerts');
      const stopped = res.data.filter(a => a.status === 'stopped');
      if (stopped.length > 0) {
        setLastAlert(stopped[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const fetchActiveTrip = async () => {
    try {
      const res = await api.get('/trips');
      const active = res.data.find(t => ['active', 'off_route', 'late'].includes(t.status));
      if (active) {
        setActiveTrip(active);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSOSClick = () => {
    if (contactsCount === 0 || alertLoading) return;
    setCountdown(3);
    if (navigator.vibrate) navigator.vibrate(200);

    let current = 3;
    countdownRef.current = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(countdownRef.current);
        setCountdown(0);
        startAlert();
      } else {
        setCountdown(current);
        if (navigator.vibrate) navigator.vibrate(100);
      }
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(countdownRef.current);
    setCountdown(0);
  };

  const startAlert = async () => {
    const loc = locationRef.current;
    if (!loc) {
      alert('Location is not available yet. Please wait a moment and try again.');
      return;
    }
    if (alertLoading) return;
    setAlertLoading(true);
    try {
      const res = await api.post('/alerts/start', { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy });
      setActiveAlert(res.data);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (error) {
      alert('Failed to start alert. Please try again.');
    } finally {
      setAlertLoading(false);
    }
  };

  const stopAlert = async () => {
    if (!activeAlert || alertLoading) return;
    setAlertLoading(true);
    try {
      await api.post(`/alerts/${activeAlert._id}/stop`);
      setActiveAlert(null);
      fetchLastAlert();
      setShowSafeWaSheet(true);
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (error) {
      alert('Failed to stop alert. Please try again.');
    } finally {
      setAlertLoading(false);
    }
  };

  const generateSmsLink = () => {
    if (!activeAlert || contacts.length === 0) return '#';
    const phones = contacts.map(c => c.phone).join(',');
    const message = encodeURIComponent(`🚨 EMERGENCY: ${user?.name} triggered an SOS!\n\nTrack live location here: ${window.location.origin}/track/${activeAlert.trackingToken}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return `sms:${phones}${isIOS ? '&' : '?'}body=${message}`;
  };

  if (activeAlert) {
    return (
      <ActiveAlertScreen 
        activeAlert={activeAlert} 
        stopAlert={stopAlert}
        contacts={contacts}
        responses={responses}
        generateSmsLink={generateSmsLink}
      />
    );
  }

  if (activeTrip && showActiveTripScreen) {
    return (
      <ActiveTripScreen 
        activeTrip={activeTrip} 
        setActiveTrip={setActiveTrip} 
        socket={socket} 
        contacts={contacts} 
      />
    );
  }

  if (countdown > 0) {
    return (
      <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center p-5">
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <svg className="w-64 h-64 -rotate-90">
            <circle cx="128" cy="128" r="120" stroke="#261F35" strokeWidth="8" fill="none" />
            <circle 
              cx="128" cy="128" r="120" stroke="#FF4D5E" strokeWidth="8" fill="none" 
              strokeDasharray="753.6" 
              strokeDashoffset={753.6 - (753.6 * (countdown / 3))}
              className="transition-all duration-1000 linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[96px] font-sora font-bold text-sos">
            {countdown}
          </div>
        </div>
        <button 
          onClick={cancelSOS}
          className="w-full h-[56px] bg-surface-raised text-text font-bold text-lg rounded-DEFAULT mb-8 hover:bg-line transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  const formatName = (name) => {
    if (!name) return '';
    const first = name.split(' ')[0].toLowerCase();
    return first.charAt(0).toUpperCase() + first.slice(1);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-10">
        <h1 className="font-sora font-bold text-3xl mb-1">Hi, {formatName(user?.name)}</h1>
        {contactsCount === 0 ? (
          <Link to="/contacts" className="text-text-muted text-sm flex items-center gap-1 hover:text-text">
            No contacts yet. <span className="text-brand underline">Add one to use SOS.</span>
          </Link>
        ) : (
          <p className="text-safe text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-safe"></span>
            You're safe. {contactsCount} contact{contactsCount !== 1 ? 's' : ''} will be notified.
          </p>
        )}
      </div>

      <div className="flex justify-center mb-10 relative">
        <div className="relative">
          <button 
            onClick={handleSOSClick}
            disabled={contactsCount === 0}
            className={`w-[240px] h-[240px] rounded-full flex flex-col items-center justify-center relative z-10 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${contactsCount > 0 ? 'bg-sos shadow-[0_0_60px_rgba(255,77,94,0.3)]' : 'bg-surface-raised'}`}
            style={{ touchAction: 'manipulation' }}
          >
            {contactsCount > 0 && (
              <div className="absolute inset-0 rounded-full border-4 border-sos/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none"></div>
            )}
            <span className={`font-sora font-bold text-5xl tracking-wider mb-2 ${contactsCount > 0 ? 'text-white' : 'text-text-muted'}`}>SOS</span>
            <span className={`text-sm font-medium ${contactsCount > 0 ? 'text-white/90' : 'text-text-muted/50'}`}>Hold to start</span>
          </button>
        </div>
      </div>

      <div className="mb-10">
        <TripWidget activeTrip={activeTrip} setActiveTrip={setActiveTrip} contacts={contacts} socket={socket} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        {/* Shortcuts Row */}
        {activeTrip ? (
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-active-trip'))} className="bg-surface border border-line rounded-card p-3 flex flex-col items-center justify-center hover:bg-surface-raised transition h-[100px]">
            <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mb-2">
              <Navigation className="w-5 h-5 text-brand" />
            </div>
            <span className="font-bold text-text text-xs text-center">Trip Screen</span>
          </button>
        ) : (
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-start-trip'))} className="bg-surface border border-line rounded-card p-3 flex flex-col items-center justify-center hover:bg-surface-raised transition h-[100px]">
            <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mb-2">
              <Navigation className="w-5 h-5 text-brand" />
            </div>
            <span className="font-bold text-text text-xs text-center">Start Trip</span>
          </button>
        )}
        <Link to="/timer" className="bg-surface border border-line rounded-card p-3 flex flex-col items-center justify-center hover:bg-surface-raised transition h-[100px]">
          <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-bold text-text text-xs text-center">Check-in</span>
        </Link>
        <Link to="/fake-call" className="bg-surface border border-line rounded-card p-3 flex flex-col items-center justify-center hover:bg-surface-raised transition h-[100px]">
          <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mb-2">
            <Phone className="w-5 h-5 text-brand" />
          </div>
          <span className="font-bold text-text text-xs text-center">Fake Call</span>
        </Link>
      </div>

      {lastAlert && (
        <div>
          <h3 className="font-bold text-text-muted mb-3 text-sm uppercase tracking-wider">Last Alert</h3>
          <div className="bg-surface border border-line rounded-DEFAULT p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-text mb-1">{new Date(lastAlert.startedAt).toLocaleDateString()}</p>
              <p className="text-xs text-text-muted">
                {lastAlert.endedAt ? Math.round((new Date(lastAlert.endedAt) - new Date(lastAlert.startedAt))/60000) : 0} min duration
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-safe"></div>
          </div>
        </div>
      )}

      <CheckStatusPopup activeTrip={activeTrip} setActiveTrip={setActiveTrip} onEscalate={startAlert} />
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      {/* Safe WA Sheet */}
      {showSafeWaSheet && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-surface-raised rounded-t-[28px] border-t border-line p-5 pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-sora font-bold text-xl text-text mb-1">Tell them you're safe</h3>
                <p className="text-text-muted text-sm">Open WhatsApp to send a "safe" message.</p>
              </div>
              <button onClick={() => setShowSafeWaSheet(false)} className="text-text-muted hover:text-text bg-surface rounded-full p-2">
                <Navigation className="w-5 h-5 rotate-45 opacity-0 hidden" />
                <span className="font-bold text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto mb-2">
              {contacts.map(c => {
                let cleanPhone = c.phone.replace(/[\s\-\(\)\+]/g, '');
                if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
                const text = `Hi ${c.name.split(' ')[0]}, I am safe now. The SOS alert has ended.`;
                const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

                return (
                  <a 
                    key={c._id}
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface border border-line rounded-DEFAULT hover:border-[#36D6AA] transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#36D6AA]/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#36D6AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="font-bold text-text text-sm">Send to {c.name}</span>
                  </a>
                );
              })}
            </div>
            <button onClick={() => setShowSafeWaSheet(false)} className="w-full mt-4 h-[56px] font-bold text-text-muted hover:text-text transition">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
