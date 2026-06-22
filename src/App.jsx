import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AdminLayout } from './components/layout/AdminLayout';
import queryClient from './lib/queryClient';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QueueManagement from './pages/QueueManagement';
import History from './pages/History';
import BranchManagement from './pages/BranchManagement';
import TicketKioskSetup from './pages/TicketKioskSetup';
import Settings from './pages/Settings';
import DisplayMonitor from './pages/DisplayMonitor';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Display Monitor for TV */}
              <Route path="/display/:branchId" element={<DisplayMonitor />} />

              <Route path="/login" element={<Login />} />

              {/* Protected Admin Routes */}
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/queue" element={<QueueManagement />} />
                <Route path="/history" element={<History />} />
                <Route path="/branches" element={<BranchManagement />} />
                <Route path="/kiosk" element={<TicketKioskSetup />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
