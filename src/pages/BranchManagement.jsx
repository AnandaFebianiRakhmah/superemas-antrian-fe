import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import api from '../services/api';

export default function BranchManagement() {
  const { isSuperAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Redirect non-super-admins
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/branches', data),
    onSuccess: () => {
      toast.success('Cabang berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambahkan cabang'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/branches/${id}`, data),
    onSuccess: () => {
      toast.success('Cabang berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui cabang'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      toast.success('Cabang berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus cabang'),
  });

  const openCreateModal = () => {
    setEditingBranch(null);
    reset({ branch_name: '', address: '', phone: '' });
    setModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    reset({
      branch_name: branch.branch_name,
      address: branch.address || '',
      phone: branch.phone || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBranch(null);
    reset();
  };

  const onSubmit = (data) => {
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'branch_name', label: 'Nama Cabang' },
    { key: 'address', label: 'Alamat', render: (val) => val || '—' },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(row)}>
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-600 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-colors';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Cabang</h1>
          <p className="text-sm text-navy-400 mt-1">Kelola cabang Super Emas</p>
        </div>
        <Button onClick={openCreateModal}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Cabang
        </Button>
      </div>

      <Table
        columns={columns}
        data={branches || []}
        loading={isLoading}
        emptyMessage="Belum ada cabang"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingBranch ? 'Edit Cabang' : 'Tambah Cabang'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-navy-300 mb-1.5">
              Nama Cabang *
            </label>
            <input
              className={inputClasses}
              placeholder="Masukkan nama cabang"
              {...register('branch_name', { required: 'Nama cabang wajib diisi' })}
            />
            {errors.branch_name && (
              <p className="text-red-400 text-xs mt-1">{errors.branch_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-300 mb-1.5">
              Alamat
            </label>
            <input
              className={inputClasses}
              placeholder="Masukkan alamat"
              {...register('address')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-300 mb-1.5">
              Telepon
            </label>
            <input
              className={inputClasses}
              placeholder="Masukkan nomor telepon"
              {...register('phone')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={closeModal}>
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingBranch ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Cabang"
        size="sm"
      >
        <p className="text-navy-200 text-sm mb-6">
          Apakah Anda yakin ingin menghapus cabang{' '}
          <strong className="text-white">{deleteConfirm?.branch_name}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
            loading={deleteMutation.isPending}
          >
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  );
}
