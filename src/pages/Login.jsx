import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Selamat datang, ${user.name}!`);
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login gagal');
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-navy-600/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-gold-500/20">
            <span className="text-navy-950 font-black text-2xl">SE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            SUPER <span className="text-gold-400">EMAS</span>
          </h1>
          <p className="text-navy-400 text-sm mt-1">Queue Management System</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-7">
          <h2 className="text-lg font-semibold text-white mb-1">Login Admin</h2>
          <p className="text-sm text-navy-400 mb-6">
            Masukkan kredensial Anda untuk melanjutkan
          </p>

          <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-navy-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@superemas.com"
                className="w-full px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-600 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-colors"
                {...register('email', {
                  required: 'Email wajib diisi',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Format email tidak valid',
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-navy-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-600 text-white text-sm placeholder-navy-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-colors"
                {...register('password', {
                  required: 'Password wajib diisi',
                })}
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loginMutation.isPending}
            >
              Masuk
            </Button>
          </form>
        </div>

        <p className="text-center text-navy-500 text-xs mt-6">
          © 2026 Super Emas Queue Management
        </p>
      </div>
    </div>
  );
}
