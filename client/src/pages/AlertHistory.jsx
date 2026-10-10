import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Clock, ShieldAlert, ChevronRight, Navigation } from 'lucide-react';

const AlertHistory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const [alertsRes, tripsRes] = await Promise.all([
        api.get('/alerts'),
        api.get('/trips')
      ]);

      const alerts = alertsRes.data.map(a => ({ ...a, type: 'alert' }));
      const trips = tripsRes.data.map(t => ({ ...t, type: 'trip' }));

      const combined = [...alerts, ...trips].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
      setItems(combined);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  const getDuration = (start, end) => {
    if (!end) return 'Ongoing';
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  const groupedItems = items.reduce((acc, item) => {
    const monthYear = new Date(item.startedAt).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(item);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-sora font-bold text-text">History</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted">Loading...</div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-12 h-12 text-text-muted mb-4" />
          <h3 className="text-lg font-bold text-text mb-2">No history</h3>
          <p className="text-text-muted">You have no past activity.</p>
        </div>
      ) : (
        <div className="flex-1">
          {Object.entries(groupedItems).map(([monthYear, monthItems]) => (
            <div key={monthYear} className="mb-6">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 px-1">{monthYear}</h2>
              <div className="bg-surface border border-line rounded-card overflow-hidden">
                {monthItems.map((item, index) => (
                  <div
                    key={item._id}
                    className={`flex items-center justify-between p-4 hover:bg-surface-raised transition ${index !== monthItems.length - 1 ? 'border-b border-line' : ''}`}
                  >
                    <div className="flex gap-4 items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'alert' ? 'bg-sos/20 text-sos' : 'bg-brand/20 text-brand'}`}>
                        {item.type === 'alert' ? <ShieldAlert className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-text mb-1 truncate max-w-[180px]">
                          {item.type === 'alert' ? formatDate(item.startedAt) : item.destination?.address?.split(',')[0]}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.type === 'trip' && item.status !== 'active' && item.arrivedAt 
                               ? `${Math.round((new Date(item.arrivedAt) - new Date(item.startedAt))/60000)} min`
                               : getDuration(item.startedAt, item.endedAt)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${['active', 'off_route', 'late', 'stopped'].includes(item.status) ? 'bg-sos animate-pulse' : 'bg-safe'}`}></span>
                            <span className="text-xs font-bold text-text-muted capitalize">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertHistory;
