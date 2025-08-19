// client/src/socket.js

import { io } from 'socket.io-client';

let socket;

export const initiateSocketConnection = () => {
  // Only create a new socket if one doesn't already exist
  if (!socket) {
    socket = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");
    console.log("Socket connection initiated.");
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initiateSocketConnection first.");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null; // Allow for a new connection later
    console.log("Socket disconnected.");
  }
};