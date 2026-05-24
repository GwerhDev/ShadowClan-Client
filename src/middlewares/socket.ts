import { io, Socket } from 'socket.io-client';
import { API_URL } from './misc/const';

let _socket: Socket | null = null;

export function connectSocket(): Socket {
  if (_socket?.connected) return _socket;
  _socket = io(API_URL, { withCredentials: true });
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}

export function getSocket(): Socket | null {
  return _socket;
}
