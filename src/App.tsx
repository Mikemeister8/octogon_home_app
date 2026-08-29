import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, ListTodo, Trophy, Calendar, ShoppingCart, Settings as SettingsIcon, LogOut, LayoutDashboard, ChevronRight, Utensils, Loader2, RefreshCw } from 'lucide-react';
import { Home as HomePage } from './pages/Home';
import { Tasks } from './pages/Tasks';
import { Competition } from './pages/Competition';
import { Reminders } from './pages/Reminders';
import { Shopping } from './pages/Shopping';
import { Settings } from './pages/Settings';
import { Dashboards } from './pages/Dashboards';
import { Auth } from './pages/Auth';
import { CompleteSetup } from './pages/CompleteSetup';
import { JoinHousehold } from './pages/JoinHousehold';
import { Meals } from './pages/Meals';
import { useAppContext } from './store/AppContext';
import { getIcon } from './utils/icons';
import { useEffect, useState } from 'react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Sidebar = () => {
  const { currentUser, homeSettings, logout, households, activeHouseholdId, switchHousehold, refreshData, refreshing } = useAppContext();
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
    { path: '/meals', icon: Utensils, label: 'Menú' },
    { path: '/settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-panel border-r border-foreground/10 z-40 hidden lg:flex flex-col shadow-2xl">
      <div className="p-8 border-b border-foreground/10 flex flex-col items-center gap-6 bg-foreground/5 py-12 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="p-4 bg-panel rounded-[2rem] shadow-2xl border border-foreground/10 group-hover:rotate-12 transition-transform relative z-10">
          <HomeIconComponent className="w-10 h-10" style={{ color: homeSettings?.themeColor || '#00FF88' }} />
        </div>
        <div className="text-center relative z-10 w-full px-4 space-y-2">
          {households && households.length > 1 ? (
            <div className="relative">
              <select
                value={activeHouseholdId || ''}
                onChange={(e) => switchHousehold(e.target.value)}
                className="w-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground text-lg font-black tracking-tight text-center appearance-none rounded-2xl py-3 outline-none cursor-pointer transition-colors truncate px-4"
                style={{ color: homeSettings?.themeColor || '#00FF88' }}
              >
                {households.map(h => (
                  <option key={h.id} value={h.id} className="bg-panel text-foreground">{h.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <h2 className="text-2xl font-black tracking-tight truncate" style={{ color: homeSettings?.themeColor || '#00FF88' }}>{homeSettings?.name || 'Hogar'}</h2>
          )}
          <span className="text-[10px] font-black opacity-30 tracking-[0.3em] uppercase block">OCTOGON HOME APP • v2.0.5</span>
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
            {location.pathname === item.path && <ChevronRight className="w-4 h-4" />}
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
          onClick={() => refreshData()}
          disabled={refreshing}
          className="w-full flex items-center justify-center gap-3 p-4 mb-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 text-text-dim hover:text-foreground transition-all font-black text-xs uppercase tracking-widest group disabled:opacity-60"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>

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
  const { currentUser, refreshData, refreshing } = useAppContext();
  const location = useLocation();

  if (!currentUser) return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/tasks', icon: ListTodo, label: 'Tareas' },
    { path: '/competition', icon: Trophy, label: 'Ranking' },
    { path: '/meals', icon: Utensils, label: 'Menú' },
    { path: '/reminders', icon: Calendar, label: 'Agenda' },
    { path: '/shopping', icon: ShoppingCart, label: 'Compra' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-panel border-t border-foreground/5 lg:hidden z-50 px-1 pb-safe-area shadow-md">
      <div className="flex justify-around items-center h-24 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors  ${isActive ? 'text-primary' : 'text-text-dim/40'}`}
            >
              <item.icon className="w-7 h-7" />
              <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
            </Link>
          );
        })}
        <Link
          to="/settings"
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors  ${location.pathname === '/settings' ? 'text-primary' : 'text-text-dim/40'}`}
        >
          <SettingsIcon className="w-7 h-7" />
          <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${location.pathname === '/settings' ? 'opacity-100' : 'opacity-0'}`}>Ajustes</span>
        </Link>
        {/* Manual refresh — re-fetches the active household's data in place,
            no page reload. A native pull-to-refresh reloads the whole page
            and has been reported to drop the session; this is the safe
            alternative, available from every screen since MobileNav is. */}
        <button
          type="button"
          onClick={() => refreshData()}
          disabled={refreshing}
          className="flex flex-col items-center justify-center flex-1 py-2 transition-colors text-text-dim/40 disabled:opacity-60"
        >
          <RefreshCw className={`w-7 h-7 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-tighter mt-1 opacity-0">Actualizar</span>
        </button>
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { currentUser, needsProfileSetup, loading, retrySetup, logout } = useAppContext();
  const location = useLocation();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (currentUser) {
      document.documentElement.classList.remove('theme-cyber', 'theme-light', 'theme-octogon');
      document.documentElement.classList.add(`theme-${currentUser.theme || 'cyber'}`);
    }
  }, [currentUser]);

  // AppContext seeds currentUser/households/homeSettings from localStorage
  // so the UI paints instantly, then verifies against Supabase in the
  // background (loading=true until that first fetch resolves). Without this
  // gate, a user could interact with — and write to — a stale cached
  // household (e.g. one that got cleaned up, or from a broken earlier
  // signup attempt) before the real data replaced it, silently losing
  // whatever they added. Only gates the very first load; later `loading`
  // toggles (switching households) don't blank the screen.
  useEffect(() => {
    if (!loading) setHasLoadedOnce(true);
  }, [loading]);

  // If this first load hangs (e.g. a stuck network request, a bad cached
  // session token needing a silent refresh that never comes back), the user
  // used to be stuck on a spinner forever with no way out. Offer an escape
  // hatch instead of leaving them stranded.
  useEffect(() => {
    if (hasLoadedOnce) { setIsSlow(false); return; }
    const t = setTimeout(() => setIsSlow(true), 8000);
    return () => clearTimeout(t);
  }, [hasLoadedOnce]);

  if (currentUser && loading && !hasLoadedOnce && !location.pathname.startsWith('/join')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          {isSlow && (
            <div className="space-y-4 max-w-xs">
              <p className="text-text-dim text-sm">Esto está tardando más de lo normal.</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => retrySetup()}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  Reintentar
                </button>
                <button
                  onClick={() => logout()}
                  className="px-6 py-3 bg-foreground/5 hover:bg-foreground/10 text-text-dim rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Signed in, but setup (create/join a household) never finished — show a
  // real recovery screen instead of silently falling back to /auth, which
  // used to let people accidentally spin up a brand-new, disconnected
  // household instead of the one they meant to join.
  if (!currentUser && !loading && needsProfileSetup && !location.pathname.startsWith('/join')) {
    return <CompleteSetup />;
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
    <div className="flex min-h-screen bg-background text-foreground pb-32 lg:pb-0 lg:pl-72 selection:bg-primary selection:text-white">
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
          <Route path="/meals" element={<Meals />} />
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
