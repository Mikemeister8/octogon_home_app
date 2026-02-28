import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Save, Home, User as UserIcon, Palette, Sun, Zap, Share2, LogOut, Loader2, Plus, Trash2 } from 'lucide-react';
import { ICONS } from '../utils/icons';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#00FF88', '#FF5D00'];

export const Settings = () => {
    const {
        tokenName, setTokenName,
        currentUser, setCurrentUser,
        homeSettings, setHomeSettings,
        shoppingConcepts, addShoppingConcept, deleteShoppingConcept,
        generateInviteId, logout, loading
    } = useAppContext();

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
            setHomeName(homeSettings.name);
            setHomeLogo(homeSettings.logo || 'Home');
            setHomeColor(homeSettings.themeColor);
            setLocalToken(homeSettings.token_name);
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

    if (loading || !homeSettings || !currentUser) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const handleSaveEconomy = async () => {
        setIsSaving(true);
        await setTokenName(localToken);
        notifySaved('economy');
        setIsSaving(false);
    };

    const handleSaveHome = async () => {
        setIsSaving(true);
        const updated = { ...homeSettings, name: homeName, logo: homeLogo, themeColor: homeColor };
        const { error } = await supabase.from('households').update({ name: homeName, logo: homeLogo, themeColor: homeColor }).eq('id', homeSettings.id);
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
        <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="bg-primary/20 p-5 rounded-[2rem] relative z-10 shrink-0 group-hover:rotate-45 transition-transform duration-700">
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
                <div className="bg-panel border border-foreground/10 rounded-[2rem] p-8 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3">
                        <Share2 className="w-6 h-6 text-accent" />
                        <h3 className="text-xl font-black text-foreground">Invitar Miembros</h3>
                    </div>
                    <p className="text-xs font-medium text-text-dim italic">Envía este enlace para que otros se registren directamente en tu hogar.</p>
                    {!homeSettings.householdInvitationId ? (
                        <button onClick={() => generateInviteId()} className="w-full bg-accent hover:bg-accent/90 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
                            Generar Enlace
                        </button>
                    ) : (
                        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex flex-col gap-3">
                            <code className="text-xs text-accent font-mono break-all bg-black/20 p-3 rounded-xl border border-white/5">
                                {window.location.origin}/join/{homeSettings.householdInvitationId}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/join/${homeSettings.householdInvitationId}`);
                                    alert('¡Enlace copiado al portapapeles!');
                                }}
                                className="w-full bg-foreground/10 hover:bg-foreground/20 text-foreground py-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Copiar Enlace
                            </button>
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
        </div>
    );
};
