import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = API_URL.replace('/api', '');

const useSocket = (trackingToken) => {
  const [socket, setSocket] = useState(null);
  const lastLocationRef = useRef(null);

  useEffect(() => {
    if (!trackingToken) return;

    const newSocket = io(SOCKET_URL);
    
    // Intercept emit to save last location
    const originalEmit = newSocket.emit;
    newSocket.emit = function(event, data, ...args) {
      if (event === 'location:update') {
        lastLocationRef.current = data;
      }
      return originalEmit.apply(newSocket, [event, data, ...args]);
    };
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('join_tracking', trackingToken);
      
      if (lastLocationRef.current) {
        originalEmit.apply(newSocket, ['location:update', lastLocationRef.current]);
      }
    });

    return () => newSocket.disconnect();
  }, [trackingToken]);

  return socket;
};

export default useSocket;
