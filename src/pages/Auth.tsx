import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Home, User, ArrowRight, Sparkles, ShieldCheck, Laptop, Moon, Zap, Mail, Lock, Loader2 } from 'lucide-react';

export const Auth = () => {
    const [view, setView] = useState<'welcome' | 'register' | 'login'>('welcome');

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState('');
    const [homeName, setHomeName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsVerification, setNeedsVerification] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario.");

            // 2. Create Household
            const { data: household, error: hError } = await supabase
                .from('households')
                .insert({ name: homeName, token_name: 'Puntos' })
                .select()
                .single();

            if (hError) throw hError;

            // 3. Create Profile
            const { error: pError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    household_id: household.id,
                    full_name: userName,
                    avatar_url: '',
                    color_hex: '#00FF88',
                    theme: 'cyber'
                });

            if (pError) throw pError;

            setNeedsVerification(true);
        } catch (err: any) {
            setError(err.message || 'Error en el registro');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
            setError(authError.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
                {/* Logo Branding */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
                        <img src="/logo.png" alt="Octogon" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent">
                        Octogon Home
                    </h1>
                    <p className="text-text-dim text-[10px] font-bold tracking-[0.4em] uppercase">Control Total • v2.0.3</p>
                </div>

                <div className="bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {needsVerification ? (
                        <div className="space-y-8 py-6 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-10 h-10 text-primary animate-bounce" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tight">¡Casi listo!</h2>
                                <p className="text-sm text-text-dim font-medium italic text-balance">
                                    Hemos enviado un enlace de confirmación a <span className="text-primary font-bold">{email}</span>.
                                    Por favor, revisa tu bandeja de entrada.
                                </p>
                            </div>
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed">
                                <p>IMPORTANTE: Si el enlace te da error, asegúrate de que el 'Site URL' en el Dashboard de Supabase apunte a tu nueva URL de Vercel.</p>
                            </div>
                            <button
                                onClick={() => { setNeedsVerification(false); setView('login'); }}
                                className="w-full py-4 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/10 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest"
                            >
                                Volver al Iniciar Sesión
                            </button>
                        </div>
                    ) : view === 'welcome' ? (
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">¡Empieza hoy!</h2>
                                <p className="text-text-dim text-sm italic">Organiza tareas, compras y agenda familiar en un solo lugar.</p>
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
                                    Entrar a mi Cuenta
                                </button>
                            </div>

                            <div className="pt-4 flex items-center justify-center gap-6 opacity-30">
                                <ShieldCheck className="w-5 h-5" />
                                <Laptop className="w-5 h-5" />
                                <Moon className="w-5 h-5" />
                            </div>
                        </div>
                    ) : view === 'register' ? (
                        <form onSubmit={handleRegister} className="space-y-5 relative z-10">
                            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                                <Home className="text-primary w-6 h-6" />
                                Nuevo Hogar
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input
                                            required type="email"
                                            value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-primary transition-all font-medium"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                            <input
                                                required type="password"
                                                value={password} onChange={e => setPassword(e.target.value)}
                                                className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-primary transition-all font-medium"
                                                placeholder="••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px) font-bold uppercase tracking-widest text-text-dim ml-1">Tu Nombre</label>
                                        <input
                                            required
                                            value={userName} onChange={e => setUserName(e.target.value)}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-medium"
                                            placeholder="Miguel"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Nombre del Hogar</label>
                                    <input
                                        required
                                        value={homeName} onChange={e => setHomeName(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-medium"
                                        placeholder="Ej: Familia García"
                                    />
                                </div>
                            </div>

                            <button disabled={loading} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Crear Hogar</>}
                            </button>

                            <button type="button" onClick={() => setView('welcome')} className="w-full text-center text-sm text-text-dim hover:text-foreground">
                                Volver atrás
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                            <h2 className="text-2xl font-bold flex flex-col gap-1 mb-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="text-primary w-6 h-6" />
                                    Iniciar Sesión
                                </div>
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-50">Auth Protocol v2.0.3</span>
                            </h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input
                                            required type="email"
                                            value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-primary transition-all font-medium"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input
                                            required type="password"
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-primary transition-all font-medium"
                                            placeholder="••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button disabled={loading} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Entrar</>}
                            </button>

                            <button type="button" onClick={() => setView('welcome')} className="w-full text-center text-sm text-text-dim hover:text-foreground">
                                No tengo cuenta, volver
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
