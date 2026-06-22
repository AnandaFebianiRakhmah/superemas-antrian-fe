import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navigation = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    name: 'Antrian',
    path: '/queue',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: 'Riwayat',
    path: '/history',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Tiket Antrian',
    path: '/kiosk',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    name: 'Pengaturan',
    path: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const adminNavigation = [
  {
    name: 'Cabang',
    path: '/branches',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export function Sidebar({ isOpen, onClose }) {
  const { isSuperAdmin } = useAuth();

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
      isActive
        ? 'bg-gold-500/10 text-gold-400 border-l-2 border-gold-400 ml-0 pl-3.5'
        : 'text-navy-300 hover:bg-navy-700/50 hover:text-white border-l-2 border-transparent'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-navy-900 border-r border-navy-700/50 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 sidebar-root ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <span className="text-navy-950 font-black text-sm">SE</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">
                SUPER <span className="text-gold-400">EMAS</span>
              </h1>
              <p className="text-[10px] text-navy-400 font-medium tracking-widest uppercase">
                Queue Admin
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] font-semibold text-navy-500 uppercase tracking-widest mb-2">
            Menu Utama
          </p>
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={linkClasses}
              onClick={onClose}
            >
              <span className="text-current opacity-70 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </span>
              {item.name}
            </NavLink>
          ))}

          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-[10px] font-semibold text-navy-500 uppercase tracking-widest">
                  Super Admin
                </p>
              </div>
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={linkClasses}
                  onClick={onClose}
                >
                  <span className="text-current opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.icon}
                  </span>
                  {item.name}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-navy-700/50">
          <p className="text-[10px] text-navy-500 text-center">
            © 2026 Super Emas
          </p>
        </div>
      </aside>
    </>
  );
}
