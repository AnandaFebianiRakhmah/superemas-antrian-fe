import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm();

  const newPassword = watch('new_password');

  const onChangePassword = () => {
    toast.info('Fitur ubah password akan tersedia setelah backend endpoint ditambahkan');
    reset();
  };

  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-600 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-colors';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
        <p className="text-sm text-navy-400 mt-1">
          Kelola profil dan keamanan akun
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="p-0">
          <div className="p-6 border-b border-navy-700/60">
            <h3 className="text-base font-semibold text-white">Profil Admin</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
                <span className="text-navy-950 font-black text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">{user?.name}</h4>
                <p className="text-sm text-gold-400 font-medium">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Branch Admin'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-navy-700/30">
                <span className="text-sm text-navy-400">Email</span>
                <span className="text-sm text-white font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-navy-700/30">
                <span className="text-sm text-navy-400">Role</span>
                <span className="text-sm text-white font-medium">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Branch Admin'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-navy-400">Cabang</span>
                <span className="text-sm text-white font-medium">
                  {user?.branch_name || 'Semua Cabang'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-0">
          <div className="p-6 border-b border-navy-700/60">
            <h3 className="text-base font-semibold text-white">Ubah Password</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-navy-300 mb-1.5">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  className={inputClasses}
                  placeholder="Masukkan password saat ini"
                  {...register('current_password', {
                    required: 'Password saat ini wajib diisi',
                  })}
                />
                {errors.current_password && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.current_password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-navy-300 mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  className={inputClasses}
                  placeholder="Masukkan password baru"
                  {...register('new_password', {
                    required: 'Password baru wajib diisi',
                    minLength: {
                      value: 6,
                      message: 'Minimal 6 karakter',
                    },
                  })}
                />
                {errors.new_password && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.new_password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-navy-300 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  className={inputClasses}
                  placeholder="Konfirmasi password baru"
                  {...register('confirm_password', {
                    required: 'Konfirmasi password wajib diisi',
                    validate: (value) =>
                      value === newPassword || 'Password tidak sama',
                  })}
                />
                {errors.confirm_password && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full">
                  Ubah Password
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
