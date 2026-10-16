import { io, Socket } from 'socket.io-client';
import { API_URL } from './misc/const';
import { refreshSession } from './authRefresh';

let _socket: Socket | null = null;

export function connectSocket(): Socket {
  if (_socket?.connected) return _socket;
  _socket = io(API_URL, { withCredentials: true });

  // Si el handshake falla por token vencido, renovar la sesión y reconectar (una vez por fallo).
  let retrying = false;
  _socket.on('connect_error', async (err) => {
    if (retrying || !/auth|token/i.test(err.message)) return;
    retrying = true;
    try {
      if (await refreshSession()) _socket?.connect();
    } finally {
      retrying = false;
    }
  });
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}

export function getSocket(): Socket | null {
  return _socket;
}
