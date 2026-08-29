import { Link } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Settings as SettingsIcon, Home, ChevronRight, LogOut } from 'lucide-react';

export const SettingsHub = () => {
    const { currentUser, homeSettings, logout } = useAppContext();

    if (!currentUser || !homeSettings) return null;

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="bg-primary/20 p-5 rounded-[2rem] relative z-10 shrink-0 group-hover:rotate-45 transition-transform">
                    <SettingsIcon className="w-10 h-10 text-primary" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Ajustes</h1>
                    <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Personaliza tu centro de mando</p>
                </div>
                <button onClick={logout} className="sm:ml-auto relative z-10 p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest group/btn">
                    <LogOut className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" /> Cerrar sesión
                </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link
                    to="/settings/profile"
                    className="bg-panel border border-foreground/10 hover:border-blue-500/40 rounded-[2rem] p-8 shadow-xl transition-all active:scale-95 hover:-translate-y-1 flex items-center gap-6 group"
                >
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-xl shrink-0 text-white group-hover:rotate-6 transition-transform" style={{ backgroundColor: currentUser.color_hex }}>
                        {currentUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black text-foreground">Perfil</h2>
                        <p className="text-text-dim text-xs font-bold mt-1">Tu cuenta, contraseña, tema, hogares e invitaciones</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-text-dim/40 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>

                <Link
                    to="/settings/household"
                    className="bg-panel border border-foreground/10 hover:border-pink-500/40 rounded-[2rem] p-8 shadow-xl transition-all active:scale-95 hover:-translate-y-1 flex items-center gap-6 group"
                >
                    <div className="w-16 h-16 bg-pink-500/10 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-pink-500/20 group-hover:rotate-6 transition-transform">
                        <Home className="w-8 h-8 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black text-foreground">Configuración del Hogar</h2>
                        <p className="text-text-dim text-xs font-bold mt-1">{homeSettings.name} · alimentos, miembros y opciones de borrado</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-text-dim/40 group-hover:text-pink-500 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
            </div>
        </div>
    );
};

export const SettingsBackBtn = () => (
    <Link
        to="/settings"
        className="flex items-center gap-2 text-sm text-text-dim hover:text-foreground transition-colors font-bold mb-2 w-fit"
    >
        <ChevronRight className="w-4 h-4 rotate-180" /> Ajustes
    </Link>
);
