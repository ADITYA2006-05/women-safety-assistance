module.exports = (io) => {
  console.log('⚡ Socket.io handler initialized.');

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join alert tracking room
    socket.on('join-alert-room', ({ alertId }) => {
      socket.join(`alert_${alertId}`);
      console.log(`👤 Client ${socket.id} joined tracking room: alert_${alertId}`);
    });

    // Leave alert tracking room
    socket.on('leave-alert-room', ({ alertId }) => {
      socket.leave(`alert_${alertId}`);
      console.log(`👤 Client ${socket.id} left tracking room: alert_${alertId}`);
    });

    // Volunteer location update broadcast
    socket.on('volunteer-location-share', ({ alertId, volunteerId, name, phone, coords }) => {
      // coords is [lng, lat]
      io.to(`alert_${alertId}`).emit('volunteer-location-update', {
        volunteerId,
        name,
        phone,
        coords
      });
      console.log(`📍 Location update from volunteer ${name} for alert ${alertId}: ${coords}`);
    });

    // User location update broadcast (in case they move during SOS)
    socket.on('user-location-share', ({ alertId, userId, coords }) => {
      io.to(`alert_${alertId}`).emit('user-location-update', {
        userId,
        coords
      });
      console.log(`🚨 Distress location update from user for alert ${alertId}: ${coords}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
