import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { Save, Home, Zap, Loader2, Plus, Trash2, AlertTriangle, Users, Trophy, ShoppingCart, Calendar, Utensils, Palette } from 'lucide-react';
import { ICONS } from '../utils/icons';
import { SettingsBackBtn } from './SettingsHub';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#00FF88', '#FF5D00'];

export const HouseholdSettings = () => {
    const {
        tokenName, setTokenName,
        currentUser, homeSettings, setHomeSettings,
        shoppingConcepts, addShoppingConcept, deleteShoppingConcept,
        resetRanking, resetShoppingList, resetShoppingDatabase, resetReminders, resetMenus,
        users,
    } = useAppContext();

    const [localToken, setLocalToken] = useState(tokenName);
    const [homeName, setHomeName] = useState(homeSettings?.name || '');
    const [homeLogo, setHomeLogo] = useState<string>(homeSettings?.logo || 'Home');
    const [homeColor, setHomeColor] = useState(homeSettings?.themeColor || '#00FF88');
    const [newConcept, setNewConcept] = useState('');

    const [savedSection, setSavedSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [resettingModule, setResettingModule] = useState<string | null>(null);

    useEffect(() => {
        if (homeSettings) {
            setHomeName(homeSettings.name || '');
            setHomeLogo(homeSettings.logo || 'Home');
            setLocalToken(homeSettings.token_name || 'Puntos');
        }
    }, [homeSettings]);

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

    const handleAddConcept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConcept.trim()) return;
        await addShoppingConcept(newConcept.trim());
        setNewConcept('');
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto pb-20">
            <div>
                <SettingsBackBtn />
                <header className="flex items-center gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent pointer-events-none" />
                    <div className="bg-pink-500/20 p-5 rounded-[2rem] relative z-10 shrink-0">
                        <Home className="w-10 h-10 text-pink-500" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Configuración del Hogar</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">{homeSettings.name}</p>
                    </div>
                </header>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* Household Members Section */}
            <div className="bg-panel border border-foreground/10 rounded-[2.5rem] p-10 shadow-2xl space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-3xl">
                        <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Miembros del Hogar</h2>
                        <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest">{users.length} {users.length === 1 ? 'miembro' : 'miembros'} en este hogar</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {users.length === 0 && (
                        <p className="py-8 text-center text-text-dim font-bold italic opacity-40">No se han cargado miembros</p>
                    )}
                    {users.map(member => {
                        const isMe = member.id === currentUser?.id;
                        return (
                            <div
                                key={member.id}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isMe
                                    ? 'bg-primary/5 border-primary/20'
                                    : 'bg-foreground/5 border-foreground/10'
                                    }`}
                            >
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0 shadow-md"
                                    style={{ backgroundColor: member.color_hex || '#00FF88' }}
                                >
                                    {member.full_name.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-foreground truncate">
                                        {member.full_name}
                                        {isMe && <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-primary">Tú</span>}
                                    </p>
                                </div>

                                <span className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${isMe
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-foreground/10 text-text-dim border-foreground/10'
                                    }`}>
                                    {isMe ? 'Propietario' : 'Miembro'}
                                </span>
                            </div>
                        );
                    })}
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

            {/* Reset App Section — by module, tasks are never touched */}
            <div className="bg-panel border border-red-500/20 rounded-[2.5rem] p-10 shadow-2xl space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-500/10 rounded-3xl">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Zona de Peligro</h2>
                        <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest">Resetear datos por módulo</p>
                    </div>
                </div>
                <p className="text-sm text-text-dim">Cada botón borra solo ese módulo para todo el hogar. <strong>Las tareas creadas nunca se tocan</strong>, ni los miembros ni la configuración. Esta acción no se puede deshacer.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { key: 'ranking', icon: Trophy, label: 'Ranking y Puntos', detail: 'Borra las tareas completadas y los puntos de todo el hogar.', confirm: '¿Resetear el ranking? Se borrarán los puntos y las tareas completadas de TODOS los miembros.', run: resetRanking },
                        { key: 'shopping', icon: ShoppingCart, label: 'Lista de la Compra', detail: 'Vacía la lista de la compra actual.', confirm: '¿Vaciar la lista de la compra actual?', run: resetShoppingList },
                        { key: 'shoppingDb', icon: Palette, label: 'Base de Datos de Alimentos', detail: 'Borra las sugerencias guardadas de alimentos.', confirm: '¿Borrar toda la base de datos de alimentos?', run: resetShoppingDatabase },
                        { key: 'reminders', icon: Calendar, label: 'Recordatorios', detail: 'Borra todos los recordatorios de la agenda.', confirm: '¿Borrar todos los recordatorios del hogar?', run: resetReminders },
                        { key: 'menus', icon: Utensils, label: 'Menús y Recetas', detail: 'Borra todos los menús (activo y guardados) y el recetario de todo el hogar.', confirm: '¿Borrar todos los menús y el recetario de todo el hogar?', run: resetMenus },
                    ].map(({ key, icon: Icon, label, detail, confirm, run }) => (
                        <button
                            key={key}
                            disabled={resettingModule === key}
                            onClick={async () => {
                                if (!window.confirm(confirm)) return;
                                setResettingModule(key);
                                try { await run(); }
                                finally { setResettingModule(null); }
                            }}
                            className="text-left p-5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-start gap-4"
                        >
                            {resettingModule === key
                                ? <Loader2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-spin" />
                                : <Icon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                            <div>
                                <p className="font-black text-sm text-foreground uppercase tracking-wide">{label}</p>
                                <p className="text-xs text-text-dim mt-1">{detail}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
