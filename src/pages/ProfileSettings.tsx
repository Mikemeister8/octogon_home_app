import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { Save, User as UserIcon, Palette, Sun, Zap, Share2, Loader2, Copy, Home, Lock, CheckCircle2 } from 'lucide-react';
import { SettingsBackBtn } from './SettingsHub';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#00FF88', '#FF5D00'];

export const ProfileSettings = () => {
    const {
        currentUser, setCurrentUser, homeSettings,
        generateInviteCode, joinHouseholdByCode, households, activeHouseholdId, switchHousehold,
    } = useAppContext();

    const [userName, setUserName] = useState(currentUser?.full_name || '');
    const [userColor, setUserColor] = useState(currentUser?.color_hex || COLORS[0]);
    const [userTheme, setUserTheme] = useState(currentUser?.theme || 'cyber');
    const [savedSection, setSavedSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwSuccess, setPwSuccess] = useState(false);

    const [inviteCode, setInviteCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joinSuccess, setJoinSuccess] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setUserName(currentUser.full_name);
            setUserColor(currentUser.color_hex);
            setUserTheme(currentUser.theme);
        }
    }, [currentUser]);

    // Apply theme preview immediately
    useEffect(() => {
        const html = document.documentElement;
        const themes = ['theme-cyber', 'theme-light', 'theme-octogon'];
        themes.forEach(t => html.classList.remove(t));
        html.classList.add(`theme-${userTheme}`);
    }, [userTheme]);

    const notifySaved = (section: string) => {
        setSavedSection(section);
        setTimeout(() => setSavedSection(null), 2000);
    };

    if (!homeSettings || !currentUser) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const updatedUser = { ...currentUser, full_name: userName, color_hex: userColor, theme: userTheme };
        const { error } = await supabase.from('profiles').update({ full_name: userName, color_hex: userColor, theme: userTheme }).eq('id', currentUser.id);
        if (!error) {
            setCurrentUser(updatedUser);
            notifySaved('profile');
        }
        setIsSaving(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError(null);
        setPwSuccess(false);
        if (newPassword.length < 6) { setPwError('Mínimo 6 caracteres.'); return; }
        if (newPassword !== confirmPassword) { setPwError('Las contraseñas no coinciden.'); return; }
        setPwSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPwSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPwError(err.message || 'No se pudo cambiar la contraseña.');
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto pb-20">
            <div>
                <SettingsBackBtn />
                <header className="flex items-center gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
                    <div className="bg-blue-500/20 p-5 rounded-[2rem] relative z-10 shrink-0">
                        <UserIcon className="w-10 h-10 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Perfil</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Tu cuenta</p>
                    </div>
                </header>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <div className="bg-panel border border-foreground/10 rounded-[2rem] p-8 space-y-6 shadow-xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <UserIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground">Tu Perfil</h2>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center gap-6 p-4 bg-foreground/5 rounded-3xl border border-foreground/5 mb-4">
                            <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-2xl shrink-0 text-white"
                                style={{ backgroundColor: userColor }}>
                                {userName.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Tu Nombre</label>
                                <input
                                    value={userName} onChange={e => setUserName(e.target.value)}
                                    className="w-full bg-panel border border-foreground/10 rounded-2xl px-4 py-3 text-foreground font-bold focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Color de Perfil</label>
                            <div className="flex flex-wrap gap-2.5">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setUserColor(c)}
                                        className={`w-9 h-9 rounded-full border-2 transition-all ${userColor === c ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Ambiente Octogon</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setUserTheme('cyber')}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${userTheme === 'cyber' ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-foreground/10 bg-panel hover:border-foreground/20'}`}
                                >
                                    <Zap className={`w-6 h-6 transition-all ${userTheme === 'cyber' ? 'text-primary scale-110' : 'text-text-dim group-hover:text-primary'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${userTheme === 'cyber' ? 'text-primary' : 'text-text-dim'}`}>Cyber</span>
                                </button>
                                <button
                                    onClick={() => setUserTheme('light')}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${userTheme === 'light' ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10' : 'border-foreground/10 bg-panel hover:border-foreground/20'}`}
                                >
                                    <Sun className={`w-6 h-6 transition-all ${userTheme === 'light' ? 'text-accent scale-110' : 'text-text-dim group-hover:text-accent'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${userTheme === 'light' ? 'text-accent' : 'text-text-dim'}`}>Claro</span>
                                </button>
                                <button
                                    onClick={() => setUserTheme('octogon')}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${userTheme === 'octogon' ? 'border-[#00FF88] bg-[#00FF88]/10 shadow-lg shadow-[#00FF88]/10' : 'border-foreground/10 bg-panel hover:border-foreground/20'}`}
                                >
                                    <Palette className={`w-6 h-6 transition-all ${userTheme === 'octogon' ? 'text-[#00FF88] scale-110' : 'text-text-dim group-hover:text-[#00FF88]'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${userTheme === 'octogon' ? 'text-[#00FF88]' : 'text-text-dim'}`}>Octogon</span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile} disabled={isSaving}
                            className="w-full py-4 rounded-2xl font-black bg-blue-500 hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30 uppercase text-xs tracking-widest"
                        >
                            {savedSection === 'profile' ? 'Perfil Guardado ✓' : <><Save className="w-5 h-5" /> Actualizar Perfil</>}
                        </button>
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-panel border border-foreground/10 rounded-[2rem] p-8 space-y-6 shadow-xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <Lock className="w-6 h-6 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground">Contraseña</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Nueva contraseña</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-4 text-foreground font-bold focus:outline-none focus:border-amber-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Repite la contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••"
                                minLength={6}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-4 text-foreground font-bold focus:outline-none focus:border-amber-500 transition-all"
                            />
                        </div>

                        {pwError && (
                            <p className="p-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl border border-red-500/20 text-center uppercase">{pwError}</p>
                        )}
                        {pwSuccess && (
                            <p className="p-3 bg-green-500/10 text-green-500 text-[10px] font-black rounded-xl border border-green-500/20 text-center uppercase flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Contraseña actualizada
                            </p>
                        )}

                        <button
                            disabled={pwSaving || !newPassword || !confirmPassword}
                            className="w-full py-4 rounded-2xl font-black bg-amber-500 hover:bg-amber-600 text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/30 uppercase text-xs tracking-widest disabled:opacity-50"
                        >
                            {pwSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-5 h-5" /> Cambiar Contraseña</>}
                        </button>
                    </form>
                </div>

                {/* Manual Join Section */}
                <div className="bg-panel border border-foreground/10 rounded-[2rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-24 h-24 bg-primary/5 blur-3xl rounded-full" />

                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Share2 className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground">Unirse a otro Hogar</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-text-dim text-xs font-bold leading-relaxed px-1">
                            Si tienes un código de invitación de otro hogar, pégalo aquí para unirte a su espacio.
                            <span className="block mt-1 text-red-500 font-black uppercase text-[9px] tracking-widest">
                                • Perderás acceso a tu hogar actual
                            </span>
                        </p>

                        <div className="space-y-2">
                            <input
                                placeholder="Pega el código aquí (ej: a8k2m9v)"
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value)}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-4 text-foreground font-black tracking-widest text-center focus:outline-none focus:border-primary transition-all placeholder:text-text-dim/30 placeholder:tracking-normal"
                            />
                        </div>

                        {joinError && (
                            <p className="p-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl border border-red-500/20 text-center uppercase">
                                {joinError}
                            </p>
                        )}
                        {joinSuccess && (
                            <p className="p-3 bg-green-500/10 text-green-500 text-[10px] font-black rounded-xl border border-green-500/20 text-center uppercase">
                                ¡Te has unido correctamente! ✓
                            </p>
                        )}

                        <button
                            onClick={async () => {
                                if (!inviteCode.trim()) return;
                                setJoinLoading(true);
                                setJoinError(null);
                                setJoinSuccess(false);
                                try {
                                    await joinHouseholdByCode(inviteCode.trim());
                                    setJoinSuccess(true);
                                    setInviteCode('');
                                } catch (err: any) {
                                    setJoinError(err.message || 'Error al unirse');
                                } finally {
                                    setJoinLoading(false);
                                }
                            }}
                            disabled={joinLoading || !inviteCode.trim()}
                            className="w-full py-4 rounded-2xl font-black bg-primary hover:bg-primary/90 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 uppercase text-xs tracking-widest active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            {joinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unirse ahora'}
                        </button>
                    </div>

                    {/* Lista de Hogares actuales */}
                    {households && households.length > 0 && (
                        <div className="pt-6 border-t border-foreground/10 space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-dim">Mis Hogares</h3>
                            <div className="space-y-2">
                                {households.map(h => (
                                    <div key={h.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${activeHouseholdId === h.id ? 'bg-primary/10 border-primary/30' : 'bg-foreground/5 border-foreground/10 hover:border-foreground/30'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-panel shadow-sm">
                                                <Home className="w-4 h-4" style={{ color: h.themeColor || '#00FF88' }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground">{h.name}</p>
                                                {activeHouseholdId === h.id && <span className="text-[9px] font-black uppercase tracking-widest text-primary">Hogar Activo</span>}
                                            </div>
                                        </div>
                                        {activeHouseholdId !== h.id && (
                                            <button
                                                onClick={() => switchHousehold(h.id)}
                                                className="px-4 py-2 bg-foreground/10 hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-colors"
                                            >
                                                Cambiar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Invitations */}
                <div className="bg-panel border border-foreground/10 rounded-[2rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-4 right-6 p-2 bg-accent/10 rounded-xl">
                        <Share2 className="w-5 h-5 text-accent" />
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-foreground uppercase italic leading-none">Invitar Miembros</h3>
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-widest opacity-60">Haz que tu hogar crezca</p>
                    </div>

                    <p className="text-xs font-medium text-text-dim italic leading-relaxed">
                        Envía el enlace directo para que entren al registrarse, o dales el código si ya tienen cuenta.
                    </p>

                    {!homeSettings.invitation_id && !homeSettings.householdInvitationId ? (
                        <button
                            onClick={async () => {
                                setIsSaving(true);
                                await generateInviteCode();
                                setIsSaving(false);
                            }}
                            disabled={isSaving}
                            className="w-full bg-accent hover:bg-accent/90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-accent/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Generar Código de Invitación</>}
                        </button>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {/* Link Box */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Enlace de Unión Directa</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 truncate text-[11px] font-mono text-accent">
                                        {window.location.host}/join/{homeSettings.invitation_id || homeSettings.householdInvitationId}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/join/${homeSettings.invitation_id || homeSettings.householdInvitationId}`);
                                            alert('¡Enlace de unión copiado!');
                                        }}
                                        className="shrink-0 p-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all active:scale-90"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Code Box */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Código de Hogar (Para Unirse Manualmente)</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-center text-lg font-black tracking-[0.3em] text-foreground uppercase">
                                        {homeSettings.invitation_id || homeSettings.householdInvitationId}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(homeSettings.invitation_id || homeSettings.householdInvitationId || '');
                                            alert('¡Código de hogar copiado!');
                                        }}
                                        className="shrink-0 p-3 bg-foreground text-panel rounded-xl hover:bg-foreground/80 transition-all active:scale-90"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-[9px] font-black text-text-dim uppercase tracking-widest text-center opacity-40 italic">
                                * Pega este código en la sección "Unirse a otro hogar"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
