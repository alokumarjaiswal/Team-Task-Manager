// Shared Socket.IO singleton — one connection per browser session
// Usage: call getSocket() on mount, releaseSocket() on unmount

import { io } from 'socket.io-client';
import API_URL from '../config';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, { autoConnect: true });
  }
  return socket;
};

export const releaseSocket = () => {
  // Keep the singleton connected so layout/sidebar refresh events are not
  // dropped when route-scoped views unmount and remount.
};
