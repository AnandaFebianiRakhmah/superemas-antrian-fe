import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export default function TicketKioskSetup() {
  const { user, isSuperAdmin } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branch_id || '');

  // Fetch branches for super admin dropdown
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data || [];
    },
    enabled: isSuperAdmin,
  });

  const selectedBranch = isSuperAdmin
    ? branches?.find((b) => b.id === Number(selectedBranchId))
    : { name: user?.branch_name };

  const handleOpenKiosk = () => {
    const branchId = isSuperAdmin ? selectedBranchId : user?.branch_id;
    if (branchId) {
      window.open(`/display/${branchId}`, '_blank');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Tiket Antrian (Kios & Display)</h1>
        <p className="text-sm text-navy-400 mt-1">
          Buka halaman kios tiket dan display monitor antrian cabang
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <div className="py-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Kios Tiket & Display Monitor
            </h3>
            <p className="text-xs text-navy-400 mb-6 max-w-sm mx-auto">
              Halaman ini menggabungkan display monitor antrian (realtime) dan kiosk pengambilan tiket mandiri untuk pelanggan.
            </p>

            {isSuperAdmin && (
              <div className="text-left mb-6 bg-navy-800/50 p-4 rounded-xl border border-navy-700/50">
                <label className="block text-xs font-medium text-navy-300 mb-2">
                  Pilih Cabang
                </label>
                <select
                  value={selectedBranchId || ''}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-navy-900 border border-navy-700 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors cursor-pointer"
                >
                  <option value="">-- Pilih Cabang --</option>
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(!isSuperAdmin || selectedBranchId) ? (
              <div className="mb-6 py-3 px-4 rounded-lg bg-navy-800 border border-navy-700/50 inline-block text-xs text-gold-400 font-mono">
                /display/{(isSuperAdmin ? selectedBranchId : user?.branch_id)}
              </div>
            ) : null}

            <div className="pt-4 border-t border-navy-700/60">
              <Button
                variant="primary"
                onClick={handleOpenKiosk}
                disabled={isSuperAdmin && !selectedBranchId}
                className="w-full justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-4m-6-6l-3-3m0 0l3-3m-3 3h12" />
                </svg>
                Buka Kios & Display Monitor
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
