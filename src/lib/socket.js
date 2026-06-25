import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const socketUrl = API_BASE_URL
  ? API_BASE_URL.replace(/\/api$/, '')
  : '/';

const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinBranchRoom = (branchId) => {
  if (branchId) {
    socket.emit('join-branch', branchId);
  }
};

export default socket;
