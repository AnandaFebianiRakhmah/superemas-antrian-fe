import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socket, { connectSocket, disconnectSocket, joinBranchRoom } from '../lib/socket';
import { useAuth } from './useAuth';

export function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    connectSocket();
    connectedRef.current = true;

    const branchId = user.branch_id;

    socket.on('connect', () => {
      if (branchId) {
        joinBranchRoom(branchId);
      }
    });

    // If already connected, join room immediately
    if (socket.connected && branchId) {
      joinBranchRoom(branchId);
    }

    // Listen for real-time queue updates
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['display'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    };

    socket.on('queue-updated', handleRefresh);
    socket.on('queue-called', handleRefresh);
    socket.on('queue_created', handleRefresh);
    socket.on('queue_called', handleRefresh);
    socket.on('queue_completed', handleRefresh);
    socket.on('queue_skipped', handleRefresh);

    return () => {
      socket.off('connect');
      socket.off('queue-updated', handleRefresh);
      socket.off('queue-called', handleRefresh);
      socket.off('queue_created', handleRefresh);
      socket.off('queue_called', handleRefresh);
      socket.off('queue_completed', handleRefresh);
      socket.off('queue_skipped', handleRefresh);
      disconnectSocket();
      connectedRef.current = false;
    };
  }, [isAuthenticated, user, queryClient]);

  return socket;
}
