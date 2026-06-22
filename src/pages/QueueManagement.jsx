import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import api from '../services/api';

export default function QueueManagement() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedCounter, setSelectedCounter] = useState(1);
  const branchId = user?.branch_id;

  // Fetch display info (current queue per counter + waiting list)
  const { data: displayData, isLoading } = useQuery({
    queryKey: ['display', branchId],
    queryFn: async () => {
      if (!branchId) return null;
      const res = await api.get(`/display/${branchId}`);
      return res.data;
    },
    enabled: !!branchId,
    refetchInterval: 15000, // Fallback polling every 15s in addition to socket
  });

  // Fetch waiting list queues
  const { data: queuesData, isLoading: isLoadingQueues } = useQuery({
    queryKey: ['queues', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const res = await api.get('/queues', {
        params: { status: 'waiting', branch_id: branchId }
      });
      return res.data.data || [];
    },
    enabled: !!branchId,
    refetchInterval: 15000,
  });

  // Mutation helpers
  const createQueueMutation = (action) => ({
    mutationFn: (data) => api.post(`/queues/${action}`, data),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['display'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operasi gagal');
    },
  });

  const callNextMutation = useMutation(createQueueMutation('call-next'));
  const recallMutation = useMutation(createQueueMutation('recall'));
  const completeMutation = useMutation(createQueueMutation('complete'));
  const skipMutation = useMutation(createQueueMutation('skip'));

  const handleCallNext = (counterNumber) => {
    callNextMutation.mutate({ branch_id: branchId, counter_number: counterNumber });
  };

  const handleRecall = () => {
    recallMutation.mutate({ branch_id: branchId, counter_number: selectedCounter });
  };

  const handleComplete = () => {
    completeMutation.mutate({ branch_id: branchId, counter_number: selectedCounter });
  };

  const handleSkip = () => {
    skipMutation.mutate({ branch_id: branchId, counter_number: selectedCounter });
  };

  // Build table data from display info & waiting queues
  const currentlyServing = displayData?.currently_serving || {};
  const queues = queuesData || [];

  // Log as requested by the user
  console.log('Waiting Queue:', queues);
  console.log('Current Branch:', branchId);

  // Combine currently serving + waiting into a unified view
  const allQueues = [];
  if (currentlyServing.counter_1) {
    allQueues.push({ ...currentlyServing.counter_1, status: 'called' });
  }
  if (currentlyServing.counter_2) {
    allQueues.push({ ...currentlyServing.counter_2, status: 'called' });
  }
  queues.forEach((q) => allQueues.push({ ...q, status: 'waiting' }));

  const columns = [
    { key: 'queue_number', label: 'No Antrian' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'counter_number',
      label: 'Loket',
      render: (val) => (val ? `Loket ${val}` : '—'),
    },
    {
      key: 'created_at',
      label: 'Waktu Ambil',
      render: (val) => (val ? new Date(val).toLocaleTimeString('id-ID') : '—'),
    },
    {
      key: 'called_at',
      label: 'Waktu Panggil',
      render: (val) => (val ? new Date(val).toLocaleTimeString('id-ID') : '—'),
    },
  ];

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-navy-400">Pilih cabang untuk mengelola antrian</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Manajemen Antrian</h1>
        <p className="text-sm text-navy-400 mt-1">
          Kelola antrian secara realtime
        </p>
      </div>

      {/* Currently Serving Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          className={`glass-card p-5 cursor-pointer transition-all ${
            selectedCounter === 1
              ? 'border-gold-500/40 shadow-lg shadow-gold-500/10'
              : ''
          }`}
          onClick={() => setSelectedCounter(1)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-white">Loket 1</h3>
            </div>
            {selectedCounter === 1 && (
              <span className="text-[10px] font-semibold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                AKTIF
              </span>
            )}
          </div>
          <p className="text-4xl font-black text-gold-400 text-center py-2 tracking-wider">
            {currentlyServing.counter_1?.queue_number || '—'}
          </p>
        </div>

        <div
          className={`glass-card p-5 cursor-pointer transition-all ${
            selectedCounter === 2
              ? 'border-gold-500/40 shadow-lg shadow-gold-500/10'
              : ''
          }`}
          onClick={() => setSelectedCounter(2)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-white">Loket 2</h3>
            </div>
            {selectedCounter === 2 && (
              <span className="text-[10px] font-semibold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                AKTIF
              </span>
            )}
          </div>
          <p className="text-4xl font-black text-gold-400 text-center py-2 tracking-wider">
            {currentlyServing.counter_2?.queue_number || '—'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleCallNext(1)}
            loading={callNextMutation.isPending}
            size="md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Panggil Loket 1
          </Button>

          <Button
            onClick={() => handleCallNext(2)}
            loading={callNextMutation.isPending}
            size="md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Panggil Loket 2
          </Button>

          <div className="w-px bg-navy-600 mx-1 self-stretch" />

          <Button
            variant="secondary"
            onClick={handleRecall}
            loading={recallMutation.isPending}
            size="md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Panggil Ulang (Loket {selectedCounter})
          </Button>

          <Button
            variant="success"
            onClick={handleComplete}
            loading={completeMutation.isPending}
            size="md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Selesai (Loket {selectedCounter})
          </Button>

          <Button
            variant="danger"
            onClick={handleSkip}
            loading={skipMutation.isPending}
            size="md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            Lewati (Loket {selectedCounter})
          </Button>
        </div>
      </div>

      {/* Queue Table */}
      <Table
        columns={columns}
        data={allQueues}
        loading={isLoading || isLoadingQueues}
        emptyMessage="Belum ada antrian saat ini"
      />
    </div>
  );
}
