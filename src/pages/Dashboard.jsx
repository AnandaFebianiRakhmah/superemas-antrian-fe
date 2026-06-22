import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import api from '../services/api';

const statCards = [
  {
    key: 'total_waiting',
    title: 'Menunggu',
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20',
  },
  {
    key: 'total_called',
    title: 'Dipanggil',
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    ),
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
  },
  {
    key: 'total_completed',
    title: 'Selesai',
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20',
  },
  {
    key: 'total_skipped',
    title: 'Dilewati',
    icon: (
      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    color: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
  },
  {
    key: 'total_today',
    title: 'Total Hari Ini',
    icon: (
      <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'from-gold-500/10 to-gold-600/5',
    border: 'border-gold-500/20',
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', user?.branch_id],
    queryFn: async () => {
      const params = {};
      if (user?.branch_id) params.branch_id = user.branch_id;
      const res = await api.get('/dashboard', { params });
      return res.data.data;
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-navy-400 mt-1">
          Ringkasan antrian hari ini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={card.key}
            className={`animate-fade-in-up stagger-${idx + 1}`}
            style={{ opacity: 0 }}
          >
            <Card
              title={card.title}
              value={isLoading ? '—' : (stats?.[card.key] ?? 0)}
              icon={card.icon}
              className={`bg-gradient-to-br ${card.color} ${card.border}`}
            />
          </div>
        ))}
      </div>

      {/* Current Queue Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-white">Loket 1</h3>
          </div>
          <div className="text-center py-4">
            <p className="text-5xl font-black text-gold-400 tracking-wider">
              {isLoading ? '—' : (stats?.counter_1?.queue_number || '—')}
            </p>
            <p className="text-xs text-navy-400 mt-2">Sedang Dilayani</p>
          </div>
        </div>

        <div className="glass-card p-6 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-white">Loket 2</h3>
          </div>
          <div className="text-center py-4">
            <p className="text-5xl font-black text-gold-400 tracking-wider">
              {isLoading ? '—' : (stats?.counter_2?.queue_number || '—')}
            </p>
            <p className="text-xs text-navy-400 mt-2">Sedang Dilayani</p>
          </div>
        </div>
      </div>
    </div>
  );
}
