// client/src/hooks/useSocket.js
import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';

const useSocket = (eventHandlers = {}) => {
  const socket = getSocket();
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    if (!socket) return;
    const handlers = handlersRef.current;
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket]);

  const emit = useCallback((event, data) => {
    if (socket?.connected) socket.emit(event, data);
  }, [socket]);

  const joinRoom = useCallback((room) => {
    if (socket?.connected) socket.emit(`${room}:join`, { roomId: room });
  }, [socket]);

  const leaveRoom = useCallback((room) => {
    if (socket?.connected) socket.emit(`${room}:leave`, { roomId: room });
  }, [socket]);

  return { socket, emit, joinRoom, leaveRoom, isConnected: socket?.connected || false };
};

export default useSocket;