import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Save, Home, User as UserIcon, Palette, Sun, Zap, Share2, LogOut, Loader2, Plus, Trash2, AlertTriangle, Copy } from 'lucide-react';
import { ICONS } from '../utils/icons';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#00FF88', '#FF5D00'];

export const Settings = () => {
    const {
        tokenName, setTokenName,
        currentUser, setCurrentUser,
        homeSettings, setHomeSettings,
        shoppingConcepts, addShoppingConcept, deleteShoppingConcept,
        generateInviteCode, resetAllData, logout, loading,
        joinHouseholdByCode, households, activeHouseholdId, switchHousehold
    } = useAppContext();

    const [inviteCode, setInviteCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joinSuccess, setJoinSuccess] = useState(false);

    const [localToken, setLocalToken] = useState(tokenName);
    const [homeName, setHomeName] = useState(homeSettings?.name || '');
    const [homeLogo, setHomeLogo] = useState<string>(homeSettings?.logo || 'Home');
    const [homeColor, setHomeColor] = useState(homeSettings?.themeColor || '#00FF88');

    const [userName, setUserName] = useState(currentUser?.full_name || '');
    const [userColor, setUserColor] = useState(currentUser?.color_hex || COLORS[0]);
    const [userTheme, setUserTheme] = useState(currentUser?.theme || 'cyber');
    const [newConcept, setNewConcept] = useState('');

    const [savedSection, setSavedSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (homeSettings) {
            setHomeName(homeSettings.name || '');
            setHomeLogo(homeSettings.logo || 'Home');
            setLocalToken(homeSettings.token_name || 'Puntos');
        }
        if (currentUser) {
            setUserName(currentUser.full_name);
            setUserColor(currentUser.color_hex);
            setUserTheme(currentUser.theme);
        }
    }, [homeSettings, currentUser]);

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

    const handleSaveEconomy = async () => {
        setIsSaving(true);
        await setTokenName(localToken);
        notifySaved('economy');
        setIsSaving(false);
    };

    const handleSaveHome = async () => {
        setIsSaving(true);
        const updated = { ...homeSettings, name: homeName, logo: homeLogo, themeColor: homeColor };
        const { error } = await supabase.from('households').update({ name: homeName, logo: homeLogo, theme_color: homeColor }).eq('id', homeSettings.id);
        if (!error) {
            setHomeSettings(updated);
            notifySaved('home');
        }
        setIsSaving(false);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        if (!currentUser) return;
        const updatedUser = { ...currentUser, full_name: userName, color_hex: userColor, theme: userTheme };
        const { error } = await supabase.from('profiles').update({ full_name: userName, color_hex: userColor, theme: userTheme }).eq('id', currentUser.id);
        if (!error) {
            setCurrentUser(updatedUser);
            notifySaved('profile');
        }
        setIsSaving(false);
    };

    const handleAddConcept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConcept.trim()) return;
        await addShoppingConcept(newConcept.trim());
        setNewConcept('');
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="bg-primary/20 p-5 rounded-[2rem] relative z-10 shrink-0 group-hover:rotate-45 transition-transform">
                    <SettingsIcon className="w-10 h-10 text-primary" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Configuración</h1>
                    <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Personaliza tu centro de mando</p>
                </div>
                <button onClick={logout} className="sm:ml-auto relative z-10 p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest group/btn">
                    <LogOut className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" /> Salir de Hogar
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Home Settings */}
                <div className="bg-panel border border-foreground/10 rounded-[2rem] p-8 space-y-6 shadow-xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-pink-500/10 rounded-2xl">
                            <Home className="w-6 h-6 text-pink-500" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground">Hogar</h2>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Nombre del Hogar</label>
                            <input
                                value={homeName} onChange={e => setHomeName(e.target.value)}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-4 text-foreground font-bold focus:outline-none focus:border-pink-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Color de Marca</label>
                            <div className="flex flex-wrap gap-2.5">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setHomeColor(c)}
                                        className={`w-9 h-9 rounded-full border-2 transition-all ${homeColor === c ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Icono Principal</label>
                            <div className="grid grid-cols-6 gap-2 overflow-y-auto max-h-40 p-3 bg-foreground/5 rounded-2xl border border-foreground/10 custom-scrollbar">
                                {Object.entries(ICONS).map(([name, IconComp]) => (
                                    <button
                                        key={name}
                                        onClick={() => setHomeLogo(name)}
                                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${homeLogo === name ? 'bg-foreground/20' : 'hover:bg-foreground/10'}`}
                                        style={{ color: homeLogo === name ? homeColor : 'currentColor' }}
                                    >
                                        <IconComp className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveHome} disabled={isSaving}
                            className="w-full py-4 rounded-2xl font-black bg-pink-500 hover:bg-pink-600 text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-500/30 uppercase text-xs tracking-widest"
                        >
                            {savedSection === 'home' ? 'Hogar Actualizado ✓' : <><Save className="w-5 h-5" /> Guardar Hogar</>}
                        </button>
                    </div>
                </div>

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
                                if(!inviteCode.trim()) return;
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Economy Settings */}
                <div className="bg-panel border border-foreground/10 rounded-[2rem] p-8 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6 text-primary" />
                        <h3 className="text-xl font-black text-foreground">Economía del Hogar</h3>
                    </div>
                    <p className="text-xs font-medium text-text-dim italic">Cambia el nombre de la moneda o puntos que usáis para el ranking.</p>
                    <div className="flex gap-4 pt-2">
                        <input
                            type="text"
                            value={localToken}
                            onChange={e => setLocalToken(e.target.value)}
                            className="flex-1 bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-4 text-foreground font-black focus:outline-none focus:border-primary transition-all"
                        />
                        <button
                            onClick={handleSaveEconomy}
                            className="px-6 py-4 rounded-2xl font-black bg-primary hover:bg-primary/90 text-white transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {savedSection === 'economy' ? '✓' : <Save className="w-6 h-6" />}
                        </button>
                    </div>
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

            {/* Shopping Database Section */}
            <div className="bg-panel border border-foreground/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-3xl">
                        <Palette className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Base de Datos de Alimentos</h2>
                        <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest">Sugerencias inteligentes para la compra</p>
                    </div>
                </div>

                <form onSubmit={handleAddConcept} className="flex gap-4">
                    <input
                        value={newConcept}
                        onChange={e => setNewConcept(e.target.value)}
                        placeholder="Añadir nuevo alimento (ej: Leche, Tomates...)"
                        className="flex-1 bg-foreground/5 border border-foreground/10 rounded-2xl px-6 py-4 text-foreground font-bold focus:outline-none focus:border-primary transition-all"
                    />
                    <button type="submit" className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg hover:shadow-primary/30 active:scale-95 transition-all">
                        <Plus className="w-6 h-6" />
                    </button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {shoppingConcepts.map(concept => (
                        <div key={concept.id} className="group flex items-center justify-between p-4 bg-foreground/5 border border-foreground/10 rounded-2xl hover:border-primary/30 transition-all">
                            <span className="text-xs font-bold truncate pr-2 uppercase tracking-tighter">{concept.name}</span>
                            <button
                                onClick={() => deleteShoppingConcept(concept.id)}
                                className="p-2 text-text-dim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {shoppingConcepts.length === 0 && (
                        <p className="col-span-full py-10 text-center text-text-dim font-bold italic opacity-40">No hay alimentos en la base de datos</p>
                    )}
                </div>
            </div>

            {/* Reset App Section */}
            <div className="bg-panel border border-red-500/20 rounded-[2.5rem] p-10 shadow-2xl space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-500/10 rounded-3xl">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Zona de Peligro</h2>
                        <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest">Resetear datos de la app</p>
                    </div>
                </div>
                <p className="text-sm text-text-dim">Esto eliminará <strong>todas las tareas realizadas</strong>, <strong>puntos acumulados</strong> y la <strong>lista de la compra</strong>. Las tareas, los miembros y la configuración se mantendrán. Esta acción no se puede deshacer.</p>
                <button
                    onClick={async () => {
                        if (window.confirm('¿Estás completamente seguro? Se borrarán TODOS los puntos, rankings y la lista de la compra. Las tareas y miembros se mantienen.')) {
                            await resetAllData();
                            alert('¡App reseteada! Todos los datos de actividad se han eliminado.');
                        }
                    }}
                    className="w-full py-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-red-500/20"
                >
                    <Trash2 className="w-5 h-5" />
                    Resetear Toda la Actividad
                </button>
            </div>
        </div>
    );
};
