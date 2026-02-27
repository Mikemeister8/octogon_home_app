import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Home as HomeIcon, CheckSquare, Trophy, Settings as SettingsIcon, ShoppingCart, Utensils, CalendarDays, Star, LayoutDashboard } from 'lucide-react';
import { AppProvider, useAppContext } from './store/AppContext';
import { Tasks } from './pages/Tasks';
import { Settings as SettingsPage } from './pages/Settings';
import { Home } from './pages/Home';
import { Competition } from './pages/Competition';
import { Shopping } from './pages/Shopping';
import { Reminders } from './pages/Reminders';
import { Meals } from './pages/Meals';
import { Dashboards } from './pages/Dashboards';
import { JoinHousehold } from './pages/JoinHousehold';
import { Auth } from './pages/Auth';
import { getIcon } from './utils/icons';

const Sidebar = () => {
  const { homeSettings, logout } = useAppContext();
  const IconComponent = getIcon(homeSettings.logo);

  const links = [
    { to: "/", icon: <HomeIcon />, label: "Home" },
    { to: "/tasks", icon: <CheckSquare />, label: "Tareas" },
    { to: "/competition", icon: <Trophy />, label: "Ranking" },
    { to: "/shopping", icon: <ShoppingCart />, label: "Compra" },
    {
      to: "/meals",
      icon: <Utensils />,
      label: "Menú",
      subItems: [
        { to: "/meals", label: "Planificador", icon: <CalendarDays className="w-3 h-3" /> },
        { to: "/meals?filter=favorites", label: "Favoritos", icon: <Star className="w-3 h-3" /> }
      ]
    },
    { to: "/reminders", icon: <CalendarDays />, label: "Agenda" },
    { to: "/dashboards", icon: <LayoutDashboard />, label: "Estadísticas" },
    { to: "/settings", icon: <SettingsIcon />, label: "Ajustes" },
  ];

  return (
    <>
      <div className="hidden md:flex flex-col w-64 bg-panel border-r border-foreground/10 h-screen sticky top-0 overflow-y-auto z-40">
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo.png" alt="Octogon" className="h-8 object-contain" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-dim">Octogon Home</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <IconComponent className="w-8 h-8" style={{ color: homeSettings.themeColor }} />
            </div>
            <h1 className="font-extrabold text-xl tracking-tight leading-tight line-clamp-2" style={{ color: homeSettings.themeColor }}>
              {homeSettings.name}
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {links.map(link => (
            <div key={link.to} className="space-y-1">
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-primary text-white font-medium shadow-lg'
                    : 'text-text-dim hover:text-foreground hover:bg-foreground/5'
                  }`
                }
              >
                <div className="w-5 h-5">{link.icon}</div>
                <span className="flex-1 font-bold">{link.label}</span>
              </NavLink>

              {link.subItems && (
                <div className="pl-9 space-y-1 mt-1 border-l border-foreground/5 ml-6">
                  {link.subItems.map(sub => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${isActive
                          ? 'text-primary font-bold bg-primary/10'
                          : 'text-text-dim hover:text-foreground hover:bg-foreground/5'
                        }`
                      }
                    >
                      {sub.icon}
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-foreground/10">
          <button onClick={logout} className="w-full py-3 bg-foreground/5 hover:bg-red-500/10 text-text-dim hover:text-red-500 rounded-xl transition-all text-sm font-bold flex items-center justify-center gap-2">
            Salir de Hogar
          </button>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-panel border-t border-foreground/10 shadow-2xl flex items-center justify-around px-1 pt-3 pb-6 z-50">
        {[
          { to: "/", icon: <HomeIcon />, label: "Inicio" },
          { to: "/tasks", icon: <CheckSquare />, label: "Tareas" },
          { to: "/shopping", icon: <ShoppingCart />, label: "Lista" },
          { to: "/meals", icon: <Utensils />, label: "Cena" },
          { to: "/settings", icon: <SettingsIcon />, label: "App" },
        ].map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 px-3 py-1 transition-all ${isActive
                ? 'text-primary'
                : 'text-text-dim hover:text-foreground'}`
            }
          >
            <div className={`p-2.5 rounded-2xl transition-all ${link.to === '/' ? 'bg-primary/5' : ''}`}>
              <div className="w-6 h-6">{link.icon}</div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
};

const AppContent = () => {
  const { currentUser } = useAppContext();
  const theme = currentUser?.theme || 'cyber';

  useEffect(() => {
    const html = document.documentElement;
    const themes = ['theme-cyber', 'theme-light', 'theme-octogon'];
    themes.forEach(t => html.classList.remove(t));
    html.classList.add(`theme-${theme}`);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/join/:inviteId" element={<JoinHousehold />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-500">
      <Sidebar />
      <main className="flex-1 relative pb-24 md:pb-0 overflow-y-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/competition" element={<Competition />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/join/:inviteId" element={<JoinHousehold />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
