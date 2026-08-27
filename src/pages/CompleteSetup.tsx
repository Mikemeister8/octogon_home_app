import { useState } from 'react';
import {
    Building2, KeyRound, User, ArrowRight, ArrowLeft, Loader2,
    CheckCircle2, XCircle, AlertTriangle, LogOut, Sparkles
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';

/**
 * Shown when a user has a valid session but no household (needsProfileSetup).
 * This happens when create/join setup failed partway through signup (bad
 * invite code, a transient error, etc). Without this screen the user was
 * silently bounced back to the welcome screen with no explanation, and
 * would often just create a brand-new, disconnected household by mistake
 * — this was the actual mechanism behind "el problema de la habitación".
 */
export const CompleteSetup = () => {
    const { setupError, completeSetup, logout } = useAppContext();
    const [screen, setScreen] = useState<'choice' | 'create' | 'join'>('choice');

    const [householdName, setHouseholdName] = useState('');
    const [userName, setUserName] = useState('');
    const [code, setCode] = useState('');
    const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [joinHouseholdName, setJoinHouseholdName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputClass = "w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-medium";
    const labelClass = "text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1";

    const validateCode = async (value: string) => {
        const normalized = value.trim().toUpperCase();
        if (normalized.length < 3) { setCodeStatus('idle'); return; }
        setCodeStatus('checking');
        try {
            const { data } = await supabase
                .rpc('check_invite_code', { codigo_ingresado: normalized })
                .maybeSingle() as { data: any };
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!householdName.trim() || !userName.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await completeSetup({ type: 'create', householdName: householdName.trim(), userName: userName.trim() });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim() || codeStatus !== 'valid') return;
        setLoading(true);
        setError(null);
        try {
            await completeSetup({ type: 'join', code: code.trim().toUpperCase(), userName: userName.trim() });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />

                    {setupError && screen === 'choice' && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 relative z-10">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">No se pudo completar antes</p>
                                <p className="text-sm text-text-dim mt-1">{setupError}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium relative z-10">
                            {error}
                        </div>
                    )}

                    {screen === 'choice' && (
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black">Falta un paso</h2>
                                <p className="text-text-dim text-sm">Tu cuenta ya existe, pero todavía no perteneces a ningún hogar. Elige una opción para continuar.</p>
                            </div>

                            <div className="grid gap-4">
                                <button
                                    onClick={() => { setError(null); setScreen('create'); }}
                                    className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Building2 className="w-5 h-5" />
                                    Crear un hogar nuevo
                                </button>
                                <button
                                    onClick={() => { setError(null); setScreen('join'); }}
                                    className="w-full py-5 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <KeyRound className="w-5 h-5" />
                                    Tengo un código de invitación
                                </button>
                            </div>

                            <button
                                onClick={logout}
                                className="w-full text-center text-sm text-text-dim hover:text-red-500 transition-colors pt-2 flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar sesión
                            </button>
                        </div>
                    )}

                    {screen === 'create' && (
                        <form onSubmit={handleCreate} className="relative z-10">
                            <button type="button" onClick={() => setScreen('choice')} className="flex items-center gap-2 text-sm text-text-dim hover:text-foreground transition-colors mb-6">
                                <ArrowLeft className="w-4 h-4" /> Atrás
                            </button>
                            <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-primary" /> Crear hogar
                            </h2>
                            <p className="text-text-dim text-sm mb-6">Dale un nombre a tu hogar y a tu perfil.</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>Nombre del hogar</label>
                                    <input autoFocus value={householdName} onChange={e => setHouseholdName(e.target.value)}
                                        className={inputClass} placeholder="Ej: Casa de Miguel" />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Tu nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required value={userName} onChange={e => setUserName(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="Ej: Miguel" />
                                    </div>
                                </div>
                                <button disabled={loading || !householdName.trim() || !userName.trim()} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Crear hogar y entrar</>}
                                </button>
                            </div>
                        </form>
                    )}

                    {screen === 'join' && (
                        <form onSubmit={handleJoin} className="relative z-10">
                            <button type="button" onClick={() => setScreen('choice')} className="flex items-center gap-2 text-sm text-text-dim hover:text-foreground transition-colors mb-6">
                                <ArrowLeft className="w-4 h-4" /> Atrás
                            </button>
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
                                            value={code}
                                            onChange={e => { const v = e.target.value.toUpperCase(); setCode(v); if (v.length >= 3) validateCode(v); else { setCodeStatus('idle'); setJoinHouseholdName(''); } }}
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

                                {codeStatus === 'invalid' && code.length > 2 && (
                                    <p className="text-red-500 text-sm font-medium">Código no encontrado. Verifica que esté bien escrito.</p>
                                )}

                                <div className="space-y-2">
                                    <label className={labelClass}>Tu nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <input required value={userName} onChange={e => setUserName(e.target.value)}
                                            className={`${inputClass} pl-12`} placeholder="Ej: María" />
                                    </div>
                                </div>

                                <button disabled={loading || codeStatus !== 'valid' || !userName.trim()} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Unirme al hogar</>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
