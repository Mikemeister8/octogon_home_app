import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Home, User, ArrowRight, Sparkles, ShieldCheck, Mail, Lock,
    Loader2, KeyRound, CheckCircle2, XCircle, ArrowLeft, Building2
} from 'lucide-react';
import type { PendingAction } from '../types';

type Screen =
    | 'welcome'
    | 'create_household'
    | 'create_account'
    | 'join_code'
    | 'join_account'
    | 'login'
    | 'verify_email';

export const Auth = () => {
    const [screen, setScreen] = useState<Screen>(() => {
        const pending = localStorage.getItem('octo_join_code');
        if (pending) return 'join_code';
        // Set by logout/hard-reset: someone who just signed out already has an
        // account, so open straight on login instead of "create/join a household".
        if (new URLSearchParams(window.location.search).get('mode') === 'login') return 'login';
        return 'welcome';
    });

    // Shared fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState('');
    const [householdName, setHouseholdName] = useState('');

    // Join-specific
    const [inviteCode, setInviteCode] = useState(() => localStorage.getItem('octo_join_code') || '');
    const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [joinHouseholdName, setJoinHouseholdName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-validate if arriving from invite link
    useEffect(() => {
        if (inviteCode) validateCode(inviteCode);
    }, []);

    // ── Code validation ──────────────────────────────────────────────────────
    const validateCode = async (code: string) => {
        const normalized = code.trim().toUpperCase();
        if (normalized.length < 3) { setCodeStatus('idle'); return; }
        setCodeStatus('checking');
        try {
            const { data } = await supabase
                .rpc('check_invite_code', { codigo_ingresado: normalized })
                .maybeSingle() as { data: any, error: any };

            if (data) {
                setCodeStatus('valid');
                setJoinHouseholdName(data.household_name || 'Hogar');
            } else {
                setCodeStatus('invalid');
                setJoinHouseholdName('');
            }
        } catch {
            setCodeStatus('invalid');
        }
    };

    const handleCodeChange = (val: string) => {
        const upper = val.toUpperCase();
        setInviteCode(upper);
        if (upper.length >= 3) validateCode(upper);
        else { setCodeStatus('idle'); setJoinHouseholdName(''); }
    };

    // ── Sign Up: Create Household ────────────────────────────────────────────
    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!householdName.trim() || !userName.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const action: PendingAction = {
                type: 'create',
                userName: userName.trim(),
                householdName: householdName.trim(),
            };
            localStorage.setItem('octo_pending_action', JSON.stringify(action));

            const { data, error: authErr } = await supabase.auth.signUp({ email, password });
            if (authErr) throw authErr;

            if (!data.session) {
                // Email confirmation required
                setScreen('verify_email');
            }
            // If session exists, AppContext listener will handle the rest
        } catch (err: any) {
            localStorage.removeItem('octo_pending_action');
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Sign Up: Join Household ──────────────────────────────────────────────
    const handleJoinAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim() || codeStatus !== 'valid') return;
        setLoading(true);
        setError(null);
        try {
            const action: PendingAction = {
                type: 'join',
                userName: userName.trim(),
                code: inviteCode.trim().toUpperCase(),
            };
            localStorage.setItem('octo_pending_action', JSON.stringify(action));
            localStorage.removeItem('octo_join_code');

            const { data, error: authErr } = await supabase.auth.signUp({ email, password });
            if (authErr) throw authErr;

            if (!data.session) {
                setScreen('verify_email');
            }
        } catch (err: any) {
            localStorage.removeItem('octo_pending_action');
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Login ────────────────────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // If there's a join code pending, save it so fetchUserData can handle it after login
            if (inviteCode && codeStatus === 'valid') {
                localStorage.setItem('octo_join_code', inviteCode.toUpperCase());
            }
            const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
            if (authErr) throw authErr;
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── UI helpers ───────────────────────────────────────────────────────────
    const inputClass = "w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-medium";
    const labelClass = "text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1";

    const BackBtn = ({ to }: { to: Screen }) => (
        <button
            type="button"
            onClick={() => { setScreen(to); setError(null); }}
            className="flex items-center gap-2 text-sm text-text-dim hover:text-foreground transition-colors mb-6"
        >
            <ArrowLeft className="w-4 h-4" /> Atrás
        </button>
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
                        <img src="/logo.png" alt="Octogon" className="w-12 h-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent">
                        Octogon Home
                    </h1>
                    <p className="text-text-dim text-[10px] font-bold tracking-[0.4em] uppercase">Tu hogar, digitalizado</p>
                </div>

                <div className="bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* ── WELCOME ─────────────────────────────────────────── */}
                    {screen === 'welcome' && (
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black">¡Bienvenido!</h2>
                                <p className="text-text-dim text-sm">Organiza tu hogar con Octogon Home.</p>
                            </div>

                            <div className="grid gap-4">
                                <button
                                    onClick={() => setScreen('create_household')}
                                    className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Building2 className="w-5 h-5" />
                                    Crear nuevo hogar
                                </button>
                                <button
                                    onClick={() => setScreen('join_code')}
                                    className="w-full py-5 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <KeyRound className="w-5 h-5" />
                                    Tengo un código de invitación
                                </button>
                            </div>

                            <button
                                onClick={() => setScreen('login')}
                                className="w-full text-center text-sm text-text-dim hover:text-primary transition-colors pt-2"
                            >
                                Ya tengo cuenta → Iniciar sesión
                            </button>

                            <div className="pt-2 flex items-center justify-center gap-6">
                                <ShieldCheck className="w-5 h-5 opacity-20" />
                                <button
                                    type="button"
                                    onClick={() => setScreen('login')}
                                    title="Iniciar sesión"
                                    aria-label="Iniciar sesión"
                                    className="text-text-dim/40 hover:text-primary transition-colors"
                                >
                                    <Home className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── CREATE: step 1 - Household name ─────────────────── */}
                    {screen === 'create_household' && (
                        <div className="relative z-10">
                            <BackBtn to="welcome" />
                            <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-primary" /> Nombre del hogar
                            </h2>
                            <p className="text-text-dim text-sm mb-6">¿Cómo se llama tu hogar?</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>Nombre del hogar</label>
                                    <input
                                        autoFocus
                                        value={householdName}
                                        onChange={e => setHouseholdName(e.target.value)}
                                        className={inputClass}
                                        placeholder="Ej: Casa de Miguel"
                                    />
                                </div>
                                <button
                                    disabled={!householdName.trim()}
                                    onClick={() => { setError(null); setScreen('create_account'); }}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                    Siguiente <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── CREATE: step 2 - Account details ────────────────── */}
                    {screen === 'create_account' && (
                        <form onSubmit={handleCreateAccount} className="relative z-10">
                            <BackBtn to="create_household" />
                            <div className="mb-4 p-3 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                                <p className="text-sm font-bold text-primary truncate">{householdName}</p>
                            </div>
                            <h2 className="text-2xl font-black mb-1">Tu cuenta</h2>
                            <p className="text-text-dim text-sm mb-6">Crea tu perfil para el hogar.</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>Tu nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required value={userName} onChange={e => setUserName(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="Ej: Miguel" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="correo@ejemplo.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="Mínimo 6 caracteres" minLength={6} />
                                    </div>
                                </div>
                                <button disabled={loading} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Crear hogar y entrar</>}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── JOIN: step 1 - Enter code ────────────────────────── */}
                    {screen === 'join_code' && (
                        <div className="relative z-10">
                            <BackBtn to="welcome" />
                            <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                                <KeyRound className="w-6 h-6 text-primary" /> Código de invitación
                            </h2>
                            <p className="text-text-dim text-sm mb-6">Introduce el código que te han enviado.</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>Código</label>
                                    <div className="relative">
                                        <input
                                            autoFocus
                                            value={inviteCode}
                                            onChange={e => handleCodeChange(e.target.value)}
                                            className={`${inputClass} text-center text-2xl font-black tracking-[0.3em] uppercase pr-12 ${codeStatus === 'valid' ? 'border-green-500 text-green-400' : codeStatus === 'invalid' ? 'border-red-500 text-red-400' : ''}`}
                                            placeholder="ABC123"
                                            maxLength={12}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {codeStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-text-dim" />}
                                            {codeStatus === 'valid' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                            {codeStatus === 'invalid' && <XCircle className="w-5 h-5 text-red-500" />}
                                        </div>
                                    </div>
                                </div>

                                {codeStatus === 'valid' && (
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-green-400 uppercase tracking-widest">¡Código válido!</p>
                                            <p className="text-sm font-black text-foreground">Te unirás a: {joinHouseholdName}</p>
                                        </div>
                                    </div>
                                )}

                                {codeStatus === 'invalid' && inviteCode.length > 2 && (
                                    <p className="text-red-500 text-sm font-medium">Código no encontrado. Verifica que esté bien escrito.</p>
                                )}

                                <button
                                    disabled={codeStatus !== 'valid'}
                                    onClick={() => { setError(null); setScreen('join_account'); }}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                    Continuar <ArrowRight className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => setScreen('login')}
                                    className="w-full text-center text-sm text-text-dim hover:text-primary transition-colors"
                                >
                                    Ya tengo cuenta → Iniciar sesión
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── JOIN: step 2 - Account details ──────────────────── */}
                    {screen === 'join_account' && (
                        <form onSubmit={handleJoinAccount} className="relative z-10">
                            <BackBtn to="join_code" />
                            <div className="mb-4 p-3 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Unirse a</p>
                                    <p className="text-sm font-black text-foreground">{joinHouseholdName}</p>
                                </div>
                            </div>
                            <h2 className="text-2xl font-black mb-1">Crea tu perfil</h2>
                            <p className="text-text-dim text-sm mb-6">Solo necesitamos tus datos básicos.</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>Tu nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required value={userName} onChange={e => setUserName(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="Ej: María" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="correo@ejemplo.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="Mínimo 6 caracteres" minLength={6} />
                                    </div>
                                </div>
                                <button disabled={loading} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><KeyRound className="w-5 h-5" /> Unirme al hogar</>}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── LOGIN ────────────────────────────────────────────── */}
                    {screen === 'login' && (
                        <form onSubmit={handleLogin} className="relative z-10">
                            {/* Arrived here from an invite link/code ("Ya tengo cuenta" on the
                                join_code screen) → back should return there, not to the generic
                                welcome screen, or the invite context feels lost mid-flow. */}
                            <BackBtn to={inviteCode ? 'join_code' : 'welcome'} />
                            <h2 className="text-2xl font-black mb-1">Iniciar sesión</h2>
                            <p className="text-text-dim text-sm mb-6">Bienvenido de vuelta.</p>

                            {inviteCode && codeStatus === 'valid' && (
                                <div className="mb-4 p-3 bg-primary/10 rounded-2xl border border-primary/20 text-xs font-bold text-primary">
                                    Al entrar, te unirás automáticamente a: {joinHouseholdName}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="correo@ejemplo.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="••••••" />
                                    </div>
                                </div>
                                <button disabled={loading} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Entrar</>}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── VERIFY EMAIL ─────────────────────────────────────── */}
                    {screen === 'verify_email' && (
                        <div className="text-center space-y-6 relative z-10 py-4">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <Mail className="w-10 h-10 text-primary animate-bounce" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-2xl font-black uppercase italic">¡Casi listo!</h2>
                                <p className="text-sm text-text-dim">
                                    Hemos enviado un correo a <span className="text-primary font-bold">{email}</span>.
                                    Haz clic en el enlace para activar tu cuenta y entrar directamente al hogar.
                                </p>
                            </div>
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-[10px] font-bold text-primary uppercase tracking-widest">
                                Si no ves el correo, revisa tu carpeta de Spam.
                            </div>
                            <button
                                onClick={() => setScreen('login')}
                                className="w-full py-4 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground rounded-2xl font-bold transition-all"
                            >
                                Ir a Iniciar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
