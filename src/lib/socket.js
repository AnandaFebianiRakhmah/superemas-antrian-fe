import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
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
