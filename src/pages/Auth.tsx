import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Home, User, ArrowRight, Sparkles, ShieldCheck, Laptop, Moon, Zap } from 'lucide-react';

export const Auth = () => {
    const { registerUserAndHousehold, households, loginAsUser } = useAppContext();
    const [view, setView] = useState<'welcome' | 'register' | 'login'>('welcome');
    const [userName, setUserName] = useState('');
    const [homeName, setHomeName] = useState('');

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (userName.trim() && homeName.trim()) {
            registerUserAndHousehold(userName, homeName);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
                {/* Logo Branding */}
                <div className="flex flex-col items-center mb-12 text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl animate-bounce-slow">
                        <img src="/logo.png" alt="Octogon" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent">
                        Octogon Home
                    </h1>
                    <p className="text-text-dim font-medium tracking-wide">EL EPICENTRO DE TU HOGAR</p>
                </div>

                <div className="bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />

                    {view === 'welcome' && (
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">¡Bienvenido!</h2>
                                <p className="text-text-dim text-sm italic">Organiza tareas, compras y menús con tu familia.</p>
                            </div>

                            <div className="grid gap-4">
                                <button
                                    onClick={() => setView('register')}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Crear Nuevo Hogar
                                </button>
                                <button
                                    onClick={() => setView('login')}
                                    className="w-full py-4 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <User className="w-5 h-5" />
                                    Entrar a mi Hogar
                                </button>
                            </div>

                            <div className="pt-4 flex items-center justify-center gap-6 opacity-30">
                                <ShieldCheck className="w-5 h-5" />
                                <Laptop className="w-5 h-5" />
                                <Moon className="w-5 h-5" />
                            </div>
                        </div>
                    )}

                    {view === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-6 relative z-10">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Home className="text-primary w-6 h-6" />
                                Registro de Hogar
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-dim ml-1">Tu Nombre</label>
                                    <input
                                        required
                                        value={userName} onChange={e => setUserName(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-medium"
                                        placeholder="Ej: Miguel"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-dim ml-1">Nombre del Hogar</label>
                                    <input
                                        required
                                        value={homeName} onChange={e => setHomeName(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-medium"
                                        placeholder="Ej: Familia García"
                                    />
                                </div>
                            </div>

                            <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                                Lanzar Proyecto <ArrowRight className="w-5 h-5" />
                            </button>

                            <button type="button" onClick={() => setView('welcome')} className="w-full text-center text-sm text-text-dim hover:text-foreground">
                                Volver atrás
                            </button>
                        </form>
                    )}

                    {view === 'login' && (
                        <div className="space-y-6 relative z-10">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Zap className="text-primary w-6 h-6" />
                                Selecciona Perfil
                            </h2>

                            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {households.map(h => (
                                    <div key={h.id} className="space-y-2">
                                        <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">{h.settings.name}</p>
                                        <div className="grid gap-2">
                                            {h.users.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => loginAsUser(h.id, u.id)}
                                                    className="flex items-center gap-4 p-3 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-2xl transition-all group active:scale-95"
                                                >
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: u.color }}>
                                                        {u.name[0]}
                                                    </div>
                                                    <span className="font-bold">{u.name}</span>
                                                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {households.length === 0 && (
                                    <p className="text-center text-text-dim italic text-sm">No hay perfiles locales guardados.</p>
                                )}
                            </div>

                            <button type="button" onClick={() => setView('welcome')} className="w-full text-center text-sm text-text-dim hover:text-foreground">
                                Volver atrás
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
