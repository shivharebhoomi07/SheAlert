import { useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const CheckIn = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="w-10 h-10 bg-surface rounded-full flex items-center justify-center hover:bg-surface-raised transition border border-line">
          <ArrowLeft className="w-5 h-5 text-text" />
        </Link>
        <h1 className="text-2xl font-sora font-bold text-text">Check-in Timer</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-5 bg-surface border border-line rounded-card">
        <Clock className="w-16 h-16 text-brand mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-text mb-2">Coming Soon</h3>
        <p className="text-text-muted">
          The Check-in feature will allow you to set a timer (e.g., 30 minutes). If you don't check in before the timer expires, an SOS will be triggered automatically.
        </p>
      </div>
    </div>
  );
};

export default CheckIn;
