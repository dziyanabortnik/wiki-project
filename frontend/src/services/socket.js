import { io } from "socket.io-client";

// Helper functions inline (чтобы не создавать utils папку)
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Socket.io client connection to backend
const socket = io("http://localhost:3000", {
  transports: ["websocket", "polling"],
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

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

export default socket;
