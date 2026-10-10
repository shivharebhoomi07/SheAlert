import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const FakeCall = () => {
  const [callerName, setCallerName] = useState('Mom');
  const [delay, setDelay] = useState(0); 
  const [status, setStatus] = useState('setup'); 
  const [callDuration, setCallDuration] = useState(0);
  
  const timerRef = useRef(null);
  const ringtoneRef = useRef(new Audio('/ringtone.mp3'));

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      ringtoneRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (status === 'ringing') {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(e => console.log("Audio play blocked by browser"));
    } else {
      ringtoneRef.current.pause();
    }
  }, [status]);

  const scheduleCall = () => {
    setStatus('waiting');
    timerRef.current = setTimeout(() => {
      setStatus('ringing');
    }, delay * 1000);
  };

  const acceptCall = () => {
    setStatus('active');
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const endCall = () => {
    clearTimeout(timerRef.current);
    clearInterval(timerRef.current);
    setStatus('setup');
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (status === 'ringing') {
    return (
      <div className="fixed inset-0 bg-bg z-50 flex flex-col justify-between p-8 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <div className="text-center mt-16 flex flex-col items-center">
          <div className="w-24 h-24 bg-surface-raised rounded-full flex items-center justify-center mb-6">
            <User className="w-12 h-12 text-text-muted" />
          </div>
          <h1 className="text-4xl font-sora font-light text-text mb-2">{callerName}</h1>
          <p className="text-lg text-text-muted">Incoming call...</p>
        </div>
        
        <div className="flex justify-between items-center px-8 mb-12">
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={endCall} 
              className="w-20 h-20 bg-sos rounded-full flex items-center justify-center hover:bg-sos/90 transition-colors shadow-lg"
            >
              <PhoneOff className="w-10 h-10 text-white" />
            </button>
            <span className="text-sm font-medium text-text-muted">Decline</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={acceptCall} 
              className="w-20 h-20 bg-safe rounded-full flex items-center justify-center hover:bg-safe/90 transition-colors shadow-lg animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
            >
              <Phone className="w-10 h-10 text-[#004D36]" />
            </button>
            <span className="text-sm font-medium text-text-muted">Accept</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="fixed inset-0 bg-bg z-50 flex flex-col justify-between p-8 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <div className="text-center mt-16 flex flex-col items-center">
          <div className="w-24 h-24 bg-surface-raised rounded-full flex items-center justify-center mb-6">
            <User className="w-12 h-12 text-text-muted" />
          </div>
          <h1 className="text-4xl font-sora font-light text-text mb-2">{callerName}</h1>
          <p className="text-lg text-text-muted">{formatTime(callDuration)}</p>
        </div>
        
        <div className="flex justify-center items-center px-8 mb-12">
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={endCall} 
              className="w-20 h-20 bg-sos rounded-full flex items-center justify-center hover:bg-sos/90 transition-colors shadow-lg"
            >
              <PhoneOff className="w-10 h-10 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-full flex flex-col">
      <div className="flex items-center mb-8">
        <Link to="/" className="w-10 h-10 rounded-full flex items-center justify-center bg-surface hover:bg-surface-raised transition text-text-muted mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-sora font-bold text-2xl text-text">Fake Call</h1>
      </div>
      
      <div className="bg-surface rounded-card border border-line p-5">
        <p className="text-text-muted mb-8 text-sm leading-relaxed">
          Schedule a fake incoming call to help you get out of an uncomfortable situation. 
          <span className="block mt-3 font-semibold text-warn">Note: The app must remain open for the call to ring.</span>
        </p>

        {status === 'waiting' ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 border-4 border-line border-t-brand rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl font-sora font-bold text-text mb-2">Call scheduled</p>
            <p className="text-text-muted mb-8">Ringing from {callerName} in a few moments...</p>
            <button onClick={endCall} className="w-full h-14 bg-surface-raised text-sos font-bold rounded-DEFAULT hover:bg-line transition">
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-text mb-2">Caller Name</label>
              <input 
                type="text" 
                value={callerName} 
                onChange={e => setCallerName(e.target.value)}
                className="w-full h-14 px-4 bg-surface-raised border border-line rounded-DEFAULT text-text placeholder-text-muted outline-none focus:border-brand transition"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-text mb-2">Delay</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Now', val: 0 },
                  { label: '10 seconds', val: 10 },
                  { label: '30 seconds', val: 30 },
                  { label: '1 minute', val: 60 },
                ].map(opt => (
                  <button 
                    key={opt.val}
                    onClick={() => setDelay(opt.val)}
                    className={`h-12 rounded-DEFAULT text-sm font-bold transition border ${
                      delay === opt.val ? 'bg-surface-raised text-brand border-brand' : 'bg-surface text-text-muted border-line hover:bg-surface-raised'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={scheduleCall}
              className="w-full h-[56px] mt-4 bg-brand text-bg rounded-DEFAULT font-bold text-lg hover:bg-brand/90 transition shadow-sm"
            >
              Schedule Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FakeCall;
