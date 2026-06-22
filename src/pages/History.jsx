import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import api from '../services/api';

export default function History() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: history, isLoading } = useQuery({
    queryKey: ['history', user?.branch_id, dateFilter, statusFilter],
    queryFn: async () => {
      const params = {};
      if (user?.branch_id) params.branch_id = user.branch_id;
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/history', { params });
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/queues/${id}`);
    },
    onSuccess: () => {
      toast.success('Antrian berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus antrian');
    },
  });

  const handleDeleteQueue = (id, queueNumber) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus antrian ${queueNumber}?`)) {
      deleteMutation.mutate(id);
    }
  };

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
      render: (val) =>
        val ? new Date(val).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '—',
    },
    {
      key: 'called_at',
      label: 'Waktu Panggil',
      render: (val) =>
        val ? new Date(val).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '—',
    },
    {
      key: 'finished_at',
      label: 'Waktu Selesai',
      render: (val) =>
        val ? new Date(val).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '—',
    },
    {
      key: 'id',
      label: 'Aksi',
      render: (id, row) => (
        <Button
          variant="danger"
          size="sm"
          className="!p-1.5"
          onClick={() => handleDeleteQueue(id, row.queue_number)}
          loading={deleteMutation.isPending && deleteMutation.variables === id}
          title="Hapus Antrian"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      ),
    },
  ];

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const exportData = (history || []).map((item) => ({
        'No Antrian': item.queue_number,
        'Status': item.status,
        'Loket': item.counter_number || '-',
        'Waktu Ambil': item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-',
        'Waktu Panggil': item.called_at ? new Date(item.called_at).toLocaleString('id-ID') : '-',
        'Waktu Selesai': item.finished_at ? new Date(item.finished_at).toLocaleString('id-ID') : '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Antrian');
      XLSX.writeFile(wb, `riwayat-antrian-${dateFilter || 'semua'}.xlsx`);
      toast.success('Export Excel berhasil');
    } catch {
      toast.error('Gagal mengexport Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('Riwayat Antrian - Super Emas', 14, 15);
      doc.setFontSize(10);
      doc.text(`Tanggal: ${dateFilter || 'Semua'} | Status: ${statusFilter || 'Semua'}`, 14, 22);

      autoTable(doc, {
        startY: 28,
        head: [['No Antrian', 'Status', 'Loket', 'Waktu Ambil', 'Waktu Panggil', 'Waktu Selesai']],
        body: (history || []).map((item) => [
          item.queue_number,
          item.status,
          item.counter_number || '-',
          item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-',
          item.called_at ? new Date(item.called_at).toLocaleString('id-ID') : '-',
          item.finished_at ? new Date(item.finished_at).toLocaleString('id-ID') : '-',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [10, 22, 40], textColor: [212, 168, 67] },
      });

      doc.save(`riwayat-antrian-${dateFilter || 'semua'}.pdf`);
      toast.success('Export PDF berhasil');
    } catch {
      toast.error('Gagal mengexport PDF');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Riwayat Antrian</h1>
        <p className="text-sm text-navy-400 mt-1">
          Lihat dan export data riwayat antrian
        </p>
      </div>

      {/* Filters and Export */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-navy-300 mb-1.5">
              Tanggal
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-navy-800 border border-navy-600 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-navy-300 mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-navy-800 border border-navy-600 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="waiting">Menunggu</option>
              <option value="called">Dipanggil</option>
              <option value="completed">Selesai</option>
              <option value="skipped">Dilewati</option>
            </select>
          </div>

          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={handleExportExcel}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportPDF}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <Table
        columns={columns}
        data={history || []}
        loading={isLoading}
        emptyMessage="Tidak ada data riwayat"
      />
    </div>
  );
}
