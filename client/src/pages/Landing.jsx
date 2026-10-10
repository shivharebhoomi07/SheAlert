import { Link } from 'react-router-dom';
import { ShieldAlert, Users, Map, Phone, Navigation } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* Navbar handled by AppLayout? Wait, AppLayout only shows navbar if NOT logged in, but we want a login button there. Let's make sure AppLayout topbar works, or override it. Actually AppLayout is wrapping this, so it has the BrandLogo. We need to put Login button in AppLayout or here. 
      Let's just put it here and it will render below the AppLayout header. That's fine, but wait: we want a specific layout. Let's just build the content here. */}
      
      <div className="flex-1 flex flex-col items-center px-4 pt-8 pb-16">
        
        {/* Hero Section */}
        <div className="text-center w-full max-w-sm mb-12">
          <Link to="/login" className="absolute top-4 right-5 text-brand font-bold">Log in</Link>
          <h1 className="font-sora font-bold text-4xl text-text leading-tight mb-4 mt-8">
            Press once.<br/>
            <span className="text-brand">Your people see where you are.</span>
          </h1>
          <p className="text-text-muted mb-8 text-lg">
            A fast, silent personal safety tracker that instantly shares your live location with emergency contacts.
          </p>
          <Link to="/register" className="inline-flex items-center justify-center w-full h-[56px] bg-brand text-bg font-bold text-lg rounded-DEFAULT hover:bg-brand/90 transition shadow-[0_0_20px_rgba(157,132,255,0.3)]">
            Get started
          </Link>
        </div>

        {/* Animated Phone Mockup */}
        <div className="w-[280px] h-[580px] bg-surface rounded-[40px] border-[8px] border-line shadow-2xl relative overflow-hidden mb-16 shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-line rounded-b-2xl z-20"></div>
          
          {/* Fake Map Background */}
          <div className="absolute inset-0 bg-[#120F1A] overflow-hidden">
            {/* Grid to look like map */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#352B49 1px, transparent 1px), linear-gradient(90deg, #352B49 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            {/* Fake Route */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 580">
              <path d="M 140 400 L 140 300 L 200 200 L 150 100" stroke="#FF4D5E" strokeWidth="6" fill="none" opacity="0.5" />
            </svg>

            {/* Moving Marker */}
            <div className="absolute w-6 h-6 bg-sos rounded-full border-4 border-[#120F1A] shadow-[0_0_15px_rgba(255,77,94,0.8)] -translate-x-1/2 -translate-y-1/2 animate-[followPath_4s_ease-in-out_infinite_alternate]" style={{ top: '400px', left: '140px' }}></div>
          </div>

          {/* Fake UI Overlay */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-line flex items-center gap-2">
            <span className="font-bold text-xs text-text">Live Tracking</span>
            <span className="w-2 h-2 bg-sos rounded-full animate-pulse"></span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-sheet p-5 border-t border-line">
            <div className="w-full h-12 bg-surface-raised rounded-DEFAULT mb-3"></div>
            <div className="w-full h-12 bg-brand rounded-DEFAULT"></div>
          </div>
        </div>

        {/* How it works */}
        <div className="w-full max-w-sm space-y-8 mb-16">
          <h2 className="font-sora font-bold text-2xl text-text text-center mb-8">How it works</h2>
          
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h3 className="font-bold text-text mb-1">1. Add contacts</h3>
              <p className="text-text-muted text-sm">Add up to 5 people you trust via email, WhatsApp, or Telegram.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-sos" />
            </div>
            <div>
              <h3 className="font-bold text-text mb-1">2. Press SOS</h3>
              <p className="text-text-muted text-sm">Hold the button for 2 seconds. It works silently.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
              <Map className="w-6 h-6 text-[#36D6AA]" />
            </div>
            <div>
              <h3 className="font-bold text-text mb-1">3. They follow you</h3>
              <p className="text-text-muted text-sm">Your contacts instantly get a link to track your live location and battery.</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="w-full max-w-sm mb-16 bg-surface border border-line rounded-card p-6">
          <h2 className="font-sora font-bold text-xl text-text mb-6">More than just SOS</h2>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-text-muted">
              <Navigation className="w-5 h-5 text-brand" /> Trip sharing with ETA
            </li>
            <li className="flex items-center gap-3 text-text-muted">
              <Phone className="w-5 h-5 text-brand" /> Fake call simulator
            </li>
            <li className="flex items-center gap-3 text-text-muted">
              <Map className="w-5 h-5 text-brand" /> Unsafe area heatmaps
            </li>
          </ul>
        </div>

        {/* Footer */}
        <footer className="w-full text-center border-t border-line pt-8">
          <p className="text-text-muted text-sm mb-2">Built as a portfolio project.</p>
          <a href="https://github.com/yourusername/shealert" className="text-brand text-sm font-bold hover:underline">
            View on GitHub
          </a>
        </footer>
      </div>
      
      <style>{`
        @keyframes followPath {
          0% { top: 400px; left: 140px; }
          33% { top: 300px; left: 140px; }
          66% { top: 200px; left: 200px; }
          100% { top: 100px; left: 150px; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
