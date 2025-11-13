import { io } from 'socket.io-client';

// Socket.io client connection to backend
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

export default socket;
