import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '../services/api';

const CheckStatusPopup = ({ activeTrip, setActiveTrip, onEscalate }) => {
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef(null);

  useEffect(() => {
    if (['off_route', 'late', 'stopped'].includes(activeTrip?.status)) {
      setCountdown(30);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onEscalate(); // Trigger SOS
            return 0;
          }
          if (navigator.vibrate && prev <= 10) navigator.vibrate(100);
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [activeTrip?.status, onEscalate]);

  const handleMarkSafe = async () => {
    clearInterval(timerRef.current);
    try {
      const res = await api.post(`/trips/${activeTrip._id}/ok`);
      // Update local state instead of doing full replace just in case
      setActiveTrip(prev => ({...prev, status: 'active', offRouteSince: null}));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (!['off_route', 'late', 'stopped'].includes(activeTrip?.status)) return null;

  const reasonText = activeTrip.status === 'off_route' ? "You have deviated from your route." : activeTrip.status === 'late' ? "You haven't arrived at your expected ETA." : "You have been stopped for a while.";

  return (
    <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm z-[100] flex flex-col justify-end">
      <div className="bg-surface rounded-t-[28px] p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] w-full max-w-md mx-auto shadow-[0_-20px_60px_rgba(255,77,94,0.3)] border-t border-sos">
        <div className="w-16 h-16 bg-sos text-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-[0_0_20px_rgba(255,77,94,0.6)]">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-sora font-bold text-center text-text mb-2">Are you okay?</h2>
        <p className="text-center text-text-muted mb-6">
          {reasonText} If you don't respond, we will trigger an SOS alert in <span className="text-sos font-bold">{countdown}</span> seconds.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleMarkSafe}
            className="w-full h-[56px] bg-safe text-[#004D36] rounded-DEFAULT font-bold text-lg hover:bg-safe/90 transition shadow-[0_0_15px_rgba(54,214,170,0.3)]"
          >
            I'm Fine, Back on Track
          </button>
          <button 
            onClick={() => {
              clearInterval(timerRef.current);
              onEscalate();
            }}
            className="w-full h-[56px] bg-sos text-white rounded-DEFAULT font-bold text-lg hover:bg-sos/90 transition shadow-[0_0_15px_rgba(255,77,94,0.3)]"
          >
            Trigger SOS Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckStatusPopup;
