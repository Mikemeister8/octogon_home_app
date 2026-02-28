import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, ListTodo, Trophy, Calendar, ShoppingCart, Settings as SettingsIcon, LogOut, LayoutDashboard, ChevronRight, Loader2 } from 'lucide-react';
import { Home as HomePage } from './pages/Home';
import { Tasks } from './pages/Tasks';
import { Competition } from './pages/Competition';
import { Reminders } from './pages/Reminders';
import { Shopping } from './pages/Shopping';
import { Settings } from './pages/Settings';
import { Dashboards } from './pages/Dashboards';
import { Auth } from './pages/Auth';
import { JoinHousehold } from './pages/JoinHousehold';
import { useAppContext } from './store/AppContext';
import { getIcon } from './utils/icons';
import { useEffect } from 'react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Sidebar = () => {
  const { currentUser, homeSettings, logout } = useAppContext();
  const location = useLocation();

  if (!currentUser) return null;

  const HomeIconComponent = getIcon(homeSettings?.logo || 'Home');

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/tasks', icon: ListTodo, label: 'Tareas' },
    { path: '/competition', icon: Trophy, label: 'Ranking' },
    { path: '/reminders', icon: Calendar, label: 'Agenda' },
    { path: '/shopping', icon: ShoppingCart, label: 'Compra' },
    { path: '/dashboards', icon: LayoutDashboard, label: 'Dashboards' },
    { path: '/settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-panel border-r border-foreground/10 z-40 hidden lg:flex flex-col shadow-2xl">
      <div className="p-8 border-b border-foreground/10 flex flex-col items-center gap-6 bg-foreground/5 py-12 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="p-4 bg-panel rounded-[2rem] shadow-2xl border border-foreground/10 group-hover:rotate-12 transition-transform duration-500 relative z-10">
          <HomeIconComponent className="w-10 h-10" style={{ color: homeSettings?.themeColor || '#00FF88' }} />
        </div>
        <div className="text-center relative z-10 space-y-1">
          <h2 className="text-2xl font-black tracking-tight" style={{ color: homeSettings?.themeColor || '#00FF88' }}>{homeSettings?.name || 'Hogar'}</h2>
          <span className="text-[10px] font-black opacity-30 tracking-[0.3em] uppercase">OCTOGON HOME APP • v2.0.5</span>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center justify-between p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest group ${location.pathname === item.path
              ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-x-1'
              : 'text-text-dim hover:bg-foreground/5 hover:text-foreground'
              }`}
          >
            <div className="flex items-center gap-4">
              <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-white' : 'group-hover:text-primary transition-colors'}`} />
              <span>{item.label}</span>
            </div>
            {location.pathname === item.path && <ChevronRight className="w-4 h-4 animate-in slide-in-from-left-2" />}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-foreground/10 bg-foreground/5">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-panel border border-foreground/10 mb-5 shadow-lg group">
          <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-lg text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform" style={{ backgroundColor: currentUser.color_hex }}>
            {currentUser.full_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-foreground truncate uppercase tracking-tight">{currentUser.full_name}</p>
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-tighter italic">OCTOGON HOME APP v2.0.5</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Salir
        </button>
      </div>
    </aside>
  );
};

const MobileNav = () => {
  const { currentUser } = useAppContext();
  const location = useLocation();

  if (!currentUser) return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/tasks', icon: ListTodo, label: 'Tareas' },
    { path: '/dashboards', icon: LayoutDashboard, label: 'Panel' },
    { path: '/reminders', icon: Calendar, label: 'Agenda' },
    { path: '/shopping', icon: ShoppingCart, label: 'Compra' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-panel/95 backdrop-blur-xl border-t border-foreground/5 lg:hidden z-50 px-2 pb-safe-area shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 ${isActive ? 'text-primary' : 'text-text-dim/40'
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : 'scale-100'}`} />
              <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
            </Link>
          );
        })}
        <Link
          to="/settings"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 ${location.pathname === '/settings' ? 'text-primary' : 'text-text-dim/40'
            }`}
        >
          <SettingsIcon className={`w-5 h-5 ${location.pathname === '/settings' ? 'scale-110' : 'scale-100'}`} />
          <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${location.pathname === '/settings' ? 'opacity-100' : 'opacity-0'}`}>Ajustes</span>
        </Link>
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { currentUser, loading } = useAppContext();
  const location = useLocation();

  useEffect(() => {
    if (currentUser) {
      document.documentElement.classList.remove('theme-cyber', 'theme-light', 'theme-octogon');
      document.documentElement.classList.add(`theme-${currentUser.theme || 'cyber'}`);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="w-24 h-24 bg-panel border-2 border-primary/20 rounded-[2.5rem] flex items-center justify-center relative z-10 shadow-2xl">
            <img src="/logo.png" alt="Octogon" className="w-12 h-12 object-contain" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Cargando Centro</h2>
          <p className="text-text-dim text-xs font-black uppercase tracking-[0.3em]">OCTOGON HOME APP v2.0.5</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !location.pathname.startsWith('/join')) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground pb-24 lg:pb-0 lg:pl-72 selection:bg-primary selection:text-white">
      <ScrollToTop />
      <Sidebar />
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/competition" element={<Competition />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="/join/:inviteId" element={<JoinHousehold />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
