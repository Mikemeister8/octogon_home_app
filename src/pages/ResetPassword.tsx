import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle2, KeyRound } from 'lucide-react';

/**
 * Landing page for password-recovery email links: /reset-password
 * Supabase parses the access token in the URL hash on load and fires a
 * PASSWORD_RECOVERY auth event, which establishes a real session — so by
 * the time this renders there's usually already a valid (recovery) session.
 * This just needs to collect a new password and call updateUser().
 */
export const ResetPassword = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Supabase needs a tick to parse the URL hash into a session on mount.
        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') setStatus('ready');
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            setStatus(session ? 'ready' : 'invalid');
        });

        return () => { listener.subscription.unsubscribe(); };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (newPassword.length < 6) { setError('Mínimo 6 caracteres.'); return; }
        if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
        setSaving(true);
        try {
            const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
            if (updateErr) throw updateErr;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'No se pudo cambiar la contraseña.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
                        <img src="/logo.png" alt="Octogon" className="w-12 h-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent">
                        Octogon Home
                    </h1>
                </div>

                <div className="bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />

                    {status === 'checking' && (
                        <div className="py-10 flex flex-col items-center gap-4 relative z-10">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-text-dim text-sm">Comprobando el enlace...</p>
                        </div>
                    )}

                    {status === 'invalid' && (
                        <div className="relative z-10 text-center space-y-4 py-4">
                            <h2 className="text-xl font-black">Enlace no válido o caducado</h2>
                            <p className="text-text-dim text-sm">Pide un nuevo enlace de recuperación desde la pantalla de inicio de sesión.</p>
                            <button
                                onClick={() => navigate('/auth?mode=login')}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all active:scale-95"
                            >
                                Ir a Iniciar sesión
                            </button>
                        </div>
                    )}

                    {status === 'ready' && !success && (
                        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                            <div className="space-y-2 mb-4">
                                <h2 className="text-2xl font-black flex items-center gap-2"><KeyRound className="w-6 h-6 text-primary" /> Nueva contraseña</h2>
                                <p className="text-text-dim text-sm">Elige una contraseña nueva para tu cuenta.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Nueva contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                    <input required type="password" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-primary transition-all font-medium" placeholder="Mínimo 6 caracteres" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1">Repite la contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                    <input required type="password" minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-primary transition-all font-medium" placeholder="••••••" />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium">{error}</div>
                            )}

                            <button disabled={saving} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-5 h-5" /> Guardar contraseña</>}
                            </button>
                        </form>
                    )}

                    {status === 'ready' && success && (
                        <div className="relative z-10 text-center space-y-6 py-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-sm text-text-dim">Contraseña actualizada. Ya puedes continuar.</p>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all active:scale-95"
                            >
                                Ir a la app
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
