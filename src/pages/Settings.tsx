import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Settings as SettingsIcon, Save, Trash2, Home, User as UserIcon, Tag, Palette, Sun, Zap } from 'lucide-react';
import { ICONS } from '../utils/icons';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e'];

export const Settings = () => {
    const {
        tokenName, setTokenName,
        currentUser, setCurrentUser, users, setUsers,
        homeSettings, setHomeSettings,
        shoppingConcepts, deleteShoppingConcept,
        generateInviteId
    } = useAppContext();

    const [localToken, setLocalToken] = useState(tokenName);
    const [homeName, setHomeName] = useState(homeSettings.name);
    const [homeLogo, setHomeLogo] = useState<string>(homeSettings.logo);
    const [homeColor, setHomeColor] = useState(homeSettings.themeColor);

    const [userName, setUserName] = useState(currentUser?.name || '');
    const [userColor, setUserColor] = useState(currentUser?.color || COLORS[0]);
    const [userTheme, setUserTheme] = useState(currentUser?.theme || 'cyber');

    const [savedSection, setSavedSection] = useState<string | null>(null);

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

    const handleSaveEconomy = () => {
        setTokenName(localToken);
        notifySaved('economy');
    };

    const handleSaveHome = () => {
        setHomeSettings({
            ...homeSettings,
            name: homeName,
            logo: homeLogo,
            themeColor: homeColor
        });
        notifySaved('home');
    };

    const handleSaveProfile = () => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, name: userName, color: userColor, theme: userTheme };
        const newUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
        setUsers(newUsers);
        setCurrentUser(updatedUser);
        notifySaved('profile');
    };

    const handleDeleteConcept = (id: string) => {
        if (window.confirm('¿Eliminar este concepto?')) {
            deleteShoppingConcept(id);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center gap-4 bg-panel border border-foreground/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="bg-primary/20 p-4 rounded-xl relative z-10 shrink-0">
                    <SettingsIcon className="w-8 h-8 text-primary" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
                    <p className="text-text-dim mt-1">Personaliza el hogar y tus preferencias</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Settings */}
                <div className="bg-panel border border-foreground/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Home className="w-6 h-6 text-pink-500" />
                        <h2 className="text-xl font-bold text-foreground">Hogar</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-text-dim mb-2">Nombre del Hogar</label>
                            <input
                                value={homeName} onChange={e => setHomeName(e.target.value)}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-pink-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-text-dim mb-2">Color del Hogar</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setHomeColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${homeColor === c ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-text-dim mb-2">Icono del Hogar</label>
                            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 overflow-y-auto max-h-32 p-2 bg-foreground/5 rounded-xl border border-foreground/10">
                                {Object.entries(ICONS).map(([name, IconComp]) => (
                                    <button
                                        key={name}
                                        onClick={() => setHomeLogo(name)}
                                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${homeLogo === name ? 'bg-foreground/20' : 'hover:bg-foreground/10'}`}
                                        style={{ color: homeLogo === name ? homeColor : 'currentColor' }}
                                    >
                                        <IconComp className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveHome}
                            className="w-full py-3 rounded-xl font-bold bg-pink-500 hover:bg-pink-600 text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-500/20"
                        >
                            {savedSection === 'home' ? 'Guardado ✓' : <><Save className="w-4 h-4" /> Guardar Hogar</>}
                        </button>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="bg-panel border border-foreground/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <UserIcon className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-foreground">Tu Perfil</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl shrink-0"
                                style={{ backgroundColor: userColor, color: '#fff' }}>
                                {userName.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-text-dim mb-2">Tu Nombre</label>
                                <input
                                    value={userName} onChange={e => setUserName(e.target.value)}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-text-dim mb-2">Tu Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setUserColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${userColor === c ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-text-dim mb-2">Tema de la App</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setUserTheme('cyber')}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${userTheme === 'cyber' ? 'border-primary bg-primary/10' : 'border-foreground/10 bg-panel hover:border-foreground/20'}`}
                                >
                                    <Zap className="w-5 h-5 text-primary" />
                                    <span className="text-[10px] font-bold uppercase">Cyber</span>
                                </button>
                                <button
                                    onClick={() => setUserTheme('light')}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${userTheme === 'light' ? 'border-accent bg-accent/10' : 'border-foreground/10 bg-panel hover:border-foreground/20'}`}
                                >
                                    <Sun className="w-5 h-5 text-accent" />
                                    <span className="text-[10px] font-bold uppercase">Claro</span>
                                </button>
                                <button
                                    onClick={() => setUserTheme('octogon')}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${userTheme === 'octogon' ? 'border-teal-500 bg-teal-500/10' : 'border-foreground/10 bg-panel hover:border-foreground/20'}`}
                                >
                                    <Palette className="w-5 h-5 text-teal-500" />
                                    <span className="text-[10px] font-bold uppercase">Octogon</span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            className="w-full py-3 rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20"
                        >
                            {savedSection === 'profile' ? 'Guardado ✓' : <><Save className="w-4 h-4" /> Guardar Perfil</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Economy & Shopping maintenance skipped for brevity but would follow same pattern */}
            <div className="bg-panel border border-foreground/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Configuración Adicional</h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={localToken}
                        onChange={e => setLocalToken(e.target.value)}
                        className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-all font-medium"
                    />
                    <button
                        onClick={handleSaveEconomy}
                        className="px-6 py-3 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white transition-all flex items-center gap-2"
                    >
                        {savedSection === 'economy' ? '✓' : <Save className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="bg-panel border border-foreground/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-teal-400" />
                    <h3 className="text-lg font-bold text-foreground">Diccionario de Compra</h3>
                </div>
                <div className="bg-foreground/5 border border-foreground/10 rounded-xl max-h-48 overflow-y-auto divide-y divide-foreground/10">
                    {shoppingConcepts.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-3 hover:bg-foreground/5">
                            <span className="text-sm text-foreground">{c.name}</span>
                            <button onClick={() => handleDeleteConcept(c.id)} className="p-1.5 text-text-dim hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-panel border border-foreground/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <UserIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Invitar al Hogar</h3>
                </div>
                {!homeSettings.householdInvitationId ? (
                    <button onClick={() => generateInviteId()} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg">
                        Generar Invitación
                    </button>
                ) : (
                    <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4 flex items-center justify-between">
                        <code className="text-xs text-primary truncate mr-4">
                            {window.location.origin}/join/{homeSettings.householdInvitationId}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/join/${homeSettings.householdInvitationId}`);
                                alert('Enlace copiado');
                            }}
                            className="bg-foreground/10 hover:bg-foreground/20 text-foreground p-2 rounded-lg transition-all"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
