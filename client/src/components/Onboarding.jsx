import { useState, useEffect } from 'react';
import { X, Users, ShieldAlert, Share } from 'lucide-react';
import { Link } from 'react-router-dom';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  const steps = [
    {
      title: "Add your trusted contacts",
      desc: "SheAlert only works if you have someone to notify. Add up to 5 people via Email, WhatsApp, or Telegram.",
      icon: <Users className="w-12 h-12 text-brand" />,
      action: <Link to="/contacts" onClick={() => handleComplete(true)} className="w-full h-[56px] flex items-center justify-center bg-brand text-bg font-bold rounded-DEFAULT">Add Contacts Now</Link>
    },
    {
      title: "How SOS works",
      desc: "Press and hold the big red SOS button for 2 seconds. A 3-second countdown will start—you can cancel if it was a mistake. If it finishes, your contacts get your live location instantly.",
      icon: <ShieldAlert className="w-12 h-12 text-sos" />,
      action: <button onClick={() => nextStep()} className="w-full h-[56px] bg-brand text-bg font-bold rounded-DEFAULT">Got it</button>
    }
  ];

  if (isIOS && !isPWA) {
    steps.push({
      title: "Add to Home Screen",
      desc: "For quick access in an emergency, tap the Share button in Safari and select 'Add to Home Screen'.",
      icon: <Share className="w-12 h-12 text-blue-500" />,
      action: <button onClick={() => nextStep()} className="w-full h-[56px] bg-brand text-bg font-bold rounded-DEFAULT">Finish</button>
    });
  } else if (step === 1) { // If not iOS, step 2 is the last step
    steps[1].action = <button onClick={() => handleComplete(false)} className="w-full h-[56px] bg-brand text-bg font-bold rounded-DEFAULT">Finish</button>;
  }

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete(false);
    }
  };

  const handleComplete = (isNavigatingAway) => {
    localStorage.setItem('shealert_onboarding_seen', 'true');
    setIsOpen(false);
    if (!isNavigatingAway) onComplete();
  };

  if (!isOpen) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[100] flex flex-col justify-end">
      <div className="bg-surface rounded-t-sheet w-full max-w-md mx-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-line animate-[slideUp_0.3s_ease-out]">
        <div className="w-full flex justify-center p-4">
          <div className="w-12 h-1.5 bg-line rounded-full"></div>
        </div>
        
        <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+32px)]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center">
              {current.icon}
            </div>
            <button onClick={() => handleComplete(false)} className="text-text-muted hover:text-text p-2 bg-surface-raised rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-2xl font-sora font-bold text-text mb-3">{current.title}</h2>
          <p className="text-text-muted mb-8 leading-relaxed min-h-[80px]">{current.desc}</p>
          
          <div className="flex gap-2 mb-6 justify-center">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-brand' : 'w-2 bg-line'}`}></div>
            ))}
          </div>

          {current.action}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
