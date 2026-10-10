import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import AlertHistory from './pages/AlertHistory';
import TrackingPage from './pages/TrackingPage';
import TripTrackingPage from './pages/TripTrackingPage';
import Reports from './pages/Reports';
import FakeCall from './pages/FakeCall';
import Landing from './pages/Landing';
import CheckIn from './pages/CheckIn';

const RootComponent = () => {
  const { user } = useContext(AuthContext);
  return user ? <Dashboard /> : <Landing />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/track/:token" element={<TrackingPage />} />
          <Route path="/track-trip/:token" element={<TripTrackingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RootComponent />} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><AlertHistory /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/fake-call" element={<ProtectedRoute><FakeCall /></ProtectedRoute>} />
            <Route path="/timer" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
