import { io } from "socket.io-client";

const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Socket.io client connection to backend
const socket = io("http://localhost:3000", {
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  auth: (cb) => {
    cb({ token: getAuthToken() || "" });
  },
});

// Reconnect with new token if authentication fails
socket.on("connect_error", (error) => {
  console.log("Socket connection error:", error.message);
  if (
    error.message.includes("Authentication error") ||
    error.message.includes("Unauthorized")
  ) {
    console.log("Socket authentication failed");
    const newToken = getAuthToken();
    if (newToken) {
      socket.auth = (cb) => {
        cb({ token: newToken });
      };
      socket.connect();
    }
  }
});

// Log connection events
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});

export default socket;
