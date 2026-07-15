'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/config';

export default function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    // Create socket connection
    const socket = io(API_BASE_URL, {
      autoConnect: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 3000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setIsPolling(false);
      console.log('⚡ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error, using polling fallback:', error.message);
      setIsPolling(true);
    });

    // Safety timeout: if not connected in 3 seconds, assume polling mode
    const timer = setTimeout(() => {
      if (!socket.connected) {
        console.log('⌛ Socket connection timed out. Falling back to HTTP polling.');
        setIsPolling(true);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const emitEvent = (eventName, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(eventName, data);
    }
  };

  const registerEvent = (eventName, callback) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(eventName, callback);
      }
    };
  };

  return {
    socket: socketRef.current,
    isConnected,
    isPolling,
    emitEvent,
    registerEvent
  };
}
