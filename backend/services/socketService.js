const { Server } = require('socket.io');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:5174", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
      }
    });
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join-article', (articleId) => {
        socket.join(articleId);
        console.log(`User ${socket.id} joined article ${articleId}`);
      });

      socket.on('disconnect', () => console.log('User disconnected:', socket.id));
    });
  }

  sendNotification(articleId, message) {
    console.log(`Sending notification to article ${articleId}: ${message}`);
    this.io.to(articleId).emit('notification', {
      message,
      timestamp: new Date().toISOString()
    });
  }

  emitToArticle(articleId, event, data) {
    this.io.to(articleId).emit(event, data);
  }
}

module.exports = SocketService;
