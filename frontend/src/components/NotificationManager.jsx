import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../services/socket';

// Global notification component for real-time alerts
export default function NotificationManager() {
  const { id } = useParams();
  const [notifications, setNotifications] = useState([]);

  // WebSocket event listeners setup
  useEffect(() => {
    console.log('Initializing WebSocket connection');

    socket.on('connect', () => console.log('CONNECTED to server'));
    socket.on('disconnect', () => console.log('DISCONNECTED'));

    // Handle incoming notifications
    socket.on('notification', (notification) => {
      const notificationWithId = { 
        ...notification, 
        id: Date.now() + Math.random(),
        type: 'info'
      };
      
      // Keep only last 5 notifications
      setNotifications(prev => [notificationWithId, ...prev.slice(0, 4)]);

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notificationWithId.id));
      }, 5000);
    });

    return () => {
      console.log('Cleaning up WebSocket listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('notification');
    };
  }, []);

  // Join article room for real-time updates
  useEffect(() => {
    if (id && socket.connected) {
      console.log(`Joining article room: ${id}`);
      socket.emit('join-article', id);
    }
  }, [id]);

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className="notification"
        >
          <div className="notification-content">
            <span className="notification-message">{notification.message}</span>
            <small className="notification-time">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </small>
          </div>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="notification-close"
            title="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}