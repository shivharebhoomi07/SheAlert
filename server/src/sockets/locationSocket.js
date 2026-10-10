const Alert = require('../models/Alert');

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Join tracking room
    socket.on('join_tracking', async (trackingToken) => {
      try {
        const alert = await Alert.findOne({ shareToken: trackingToken });
        if (!alert || alert.status !== 'active' || (alert.tokenExpiresAt && new Date() > alert.tokenExpiresAt)) {
          return socket.emit('tracking_error', { message: 'Tracking link is invalid or expired.' });
        }
        
        socket.join(trackingToken);
        socket.trackingToken = trackingToken; // store on socket for disconnect
        const count = io.sockets.adapter.rooms.get(trackingToken)?.size || 0;
        io.to(trackingToken).emit('room_watchers_count', count);
      } catch (err) {
        socket.emit('tracking_error', { message: 'Server error while validating link.' });
      }
    });

    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Handle incoming location updates from the user
    socket.on('location:update', (data) => {
      const { trackingToken, location } = data;
      socket.to(trackingToken).emit('location:updated', location);
    });

    socket.on('disconnect', () => {
      if (socket.trackingToken) {
        const count = io.sockets.adapter.rooms.get(socket.trackingToken)?.size || 0;
        io.to(socket.trackingToken).emit('room_watchers_count', count);
      }
    });
  });
};
