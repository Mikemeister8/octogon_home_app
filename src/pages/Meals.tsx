import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Utensils, Plus, ChefHat, ShoppingBasket, Loader2, Save, X, Trash2, ArrowLeft, BookOpen, Star } from 'lucide-react';
import type { MealBlock, MealIngredient, ShoppingConcept } from '../types';

const defaultDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const defaultSlots = ['Desayuno', 'Media Mañana', 'Comida', 'Merienda', 'Cena'];

export interface Recipe {
    id: string;
    title: string;
    description: string;
    ingredients: MealIngredient[];
}

export interface MenuData {
    id: string;
    name: string;
    blocks: MealBlock[];
}

export const Meals = () => {
    const { loading, currentUser, shoppingConcepts, addShoppingItem, addShoppingConcept } = useAppContext();

    // LocalStorage States
    const [menus, setMenus] = useState<MenuData[]>(() => JSON.parse(localStorage.getItem('octo_menus') || '[]'));
    const [activeMenuId, setActiveMenuId] = useState<string | null>(() => localStorage.getItem('octo_active_menu'));
    const [recipes, setRecipes] = useState<Recipe[]>(() => JSON.parse(localStorage.getItem('octo_recipes') || '[]'));

    useEffect(() => { localStorage.setItem('octo_menus', JSON.stringify(menus)); }, [menus]);
    useEffect(() => { 
        if (activeMenuId) localStorage.setItem('octo_active_menu', activeMenuId); 
        else localStorage.removeItem('octo_active_menu');
    }, [activeMenuId]);
    useEffect(() => { localStorage.setItem('octo_recipes', JSON.stringify(recipes)); }, [recipes]);

    // UI States
    const [isCreatingMenu, setIsCreatingMenu] = useState(false);
    const [newMenuName, setNewMenuName] = useState('');
    
    // Modal States
    const [editingCell, setEditingCell] = useState<{ day: string; slot: string } | null>(null);
    const [editModeBloc, setEditModeBloc] = useState<MealBlock | null>(null);
    const [ingredientQuery, setIngredientQuery] = useState('');
    const [ingredientQty, setIngredientQty] = useState(1);
    const [ingredientSuggestions, setIngredientSuggestions] = useState<ShoppingConcept[]>([]);
    const [showRecipeBank, setShowRecipeBank] = useState(false);

    if (!homeSettings) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const activeMenu = menus.find(m => m.id === activeMenuId);

    // MENU LIST LOGIC
    const handleCreateMenu = () => {
        if (!newMenuName.trim()) return;
        const newMenu: MenuData = {
            id: Math.random().toString(),
            name: newMenuName.trim(),
            blocks: []
        };
        setMenus(prev => [...prev, newMenu]);
        setNewMenuName('');
        setIsCreatingMenu(false);
        setActiveMenuId(newMenu.id);
    };

    const handleDeleteMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setMenus(prev => prev.filter(m => m.id !== id));
        if (activeMenuId === id) setActiveMenuId(null);
    };

    if (!activeMenu) {
        // VIEW 1: MENU LIST
        return (
            <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto pb-20">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-md">
                    <div className="flex items-center gap-6">
                        <div className="bg-primary/20 p-5 rounded-2xl">
                            <Utensils className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tight">Menús Semanales</h1>
                            <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Tus planificaciones guardadas</p>
                        </div>
                    </div>
                    <button onClick={() => setIsCreatingMenu(true)} className="px-6 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Nuevo Menú
                    </button>
                </header>

                {isCreatingMenu && (
                    <div className="bg-panel border border-primary/30 p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={newMenuName}
                            onChange={(e) => setNewMenuName(e.target.value)}
                            placeholder="Ej. Menú de Verano, Menú Dieta..."
                            className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground font-bold focus:outline-none focus:border-primary"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={handleCreateMenu} disabled={!newMenuName.trim()} className="px-6 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50">Crear</button>
                            <button onClick={() => setIsCreatingMenu(false)} className="px-4 py-3 bg-foreground/5 text-foreground rounded-xl font-bold hover:bg-foreground/10">Cancelar</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {menus.map(menu => (
                        <div key={menu.id} onClick={() => setActiveMenuId(menu.id)} className="bg-panel border border-foreground/10 p-6 rounded-3xl shadow-sm hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]">
                            <div>
                                <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{menu.name}</h3>
                                <p className="text-text-dim text-xs font-bold mt-2 uppercase tracking-widest">{menu.blocks.length} comidas planificadas</p>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-foreground/5">
                                <span className="text-primary font-bold text-sm flex items-center gap-1">Abrir <ArrowLeft className="w-4 h-4 rotate-180" /></span>
                                <button onClick={(e) => handleDeleteMenu(menu.id, e)} className="p-2 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {menus.length === 0 && !isCreatingMenu && (
                        <div className="col-span-full py-12 text-center text-text-dim border-2 border-dashed border-foreground/10 rounded-3xl">
                            <p className="font-bold text-lg">Aún no has creado ningún menú.</p>
                            <p className="text-sm opacity-60">Crea el primero para empezar a organizar la semana.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ACTIVE MENU LOGIC
    const updateActiveMenuBlocks = (newBlocks: MealBlock[]) => {
        setMenus(prev => prev.map(m => m.id === activeMenu.id ? { ...m, blocks: newBlocks } : m));
    };

    const getBlock = (day: string, slot: string) => activeMenu.blocks.find(b => b.day === day && b.slot === slot);

    const openCell = (day: string, slot: string) => {
        const existing = getBlock(day, slot);
        if (existing) {
            setEditModeBloc(JSON.parse(JSON.stringify(existing)));
        } else {
            setEditModeBloc({
                id: Math.random().toString(),
                title: '',
                description: '',
                ingredients: [],
                day,
                slot
            });
        }
        setEditingCell({ day, slot });
        setShowRecipeBank(false);
    };

    const handleSaveCell = () => {
        if (!editModeBloc || !editModeBloc.title.trim()) return;
        const copy = activeMenu.blocks.filter(b => !(b.day === editingCell?.day && b.slot === editingCell?.slot));
        copy.push(editModeBloc);
        updateActiveMenuBlocks(copy);
        setEditingCell(null);
    };

    const handleDeleteCell = () => {
        const copy = activeMenu.blocks.filter(b => !(b.day === editingCell?.day && b.slot === editingCell?.slot));
        updateActiveMenuBlocks(copy);
        setEditingCell(null);
    };

    const handleIngQueryChange = (q: string) => {
        setIngredientQuery(q);
        if (q.trim().length > 1) {
            setIngredientSuggestions(shoppingConcepts.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 4));
        } else {
            setIngredientSuggestions([]);
        }
    };

    const addIngredient = async (name: string) => {
        if (!name.trim() || !editModeBloc) return;
        const exists = shoppingConcepts.some(c => c.name.toLowerCase() === name.toLowerCase());
        if (!exists && currentUser?.id) {
            await addShoppingConcept(name.trim());
        }

        const newIngr = { name: name.trim(), quantity: ingredientQty, addToShopping: true };
        setEditModeBloc({ ...editModeBloc, ingredients: [...editModeBloc.ingredients, newIngr] });
        setIngredientQuery('');
        setIngredientQty(1);
        setIngredientSuggestions([]);
    };

    const exportToShoppingList = async () => {
        if (!currentUser) return;
        const allIngredients = activeMenu.blocks.flatMap(b => b.ingredients);
        const map = new Map<string, number>();
        allIngredients.forEach(i => {
            const current = map.get(i.name.toLowerCase()) || 0;
            map.set(i.name.toLowerCase(), current + i.quantity);
        });

        const promises = Array.from(map.entries()).map(([name, qty]) => {
            const niceName = name.charAt(0).toUpperCase() + name.slice(1);
            const finalName = qty > 1 ? `${qty}x ${niceName}` : niceName;
            return addShoppingItem(finalName, currentUser.id);
        });

        await Promise.all(promises);
        alert('¡Ingredientes añadidos a la lista de la compra!');
    };

    // Recipe Bank Logic
    const handleSaveToRecipes = () => {
        if (!editModeBloc || !editModeBloc.title.trim()) return;
        const newRecipe: Recipe = {
            id: Math.random().toString(),
            title: editModeBloc.title,
            description: editModeBloc.description || '',
            ingredients: [...editModeBloc.ingredients]
        };
        setRecipes(prev => [...prev, newRecipe]);
        alert('¡Receta guardada en tu recetario para usarla en el futuro!');
    };

    const loadRecipe = (r: Recipe) => {
        if (!editModeBloc) return;
        setEditModeBloc({
            ...editModeBloc,
            title: r.title,
            description: r.description,
            ingredients: [...r.ingredients]
        });
        setShowRecipeBank(false);
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-[1400px] mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-md">
                <div className="flex items-center gap-6">
                    <button onClick={() => setActiveMenuId(null)} className="bg-foreground/5 p-4 rounded-2xl hover:bg-primary/20 hover:text-primary transition-colors text-text-dim">
                        <ArrowLeft className="w-8 h-8" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">{activeMenu.name}</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Editando Menú</p>
                    </div>
                </div>
                <button onClick={exportToShoppingList} className="px-6 py-4 bg-accent hover:bg-accent/90 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                    <ShoppingBasket className="w-5 h-5" /> Volcar a Compra
                </button>
            </header>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr>
                            <th className="p-4 border border-foreground/10 bg-foreground/5 text-text-dim font-black text-xs uppercase text-center w-28">Horario</th>
                            {defaultDays.map(day => (
                                <th key={day} className="p-4 border border-foreground/10 bg-panel text-primary font-black text-xs uppercase text-center min-w-[120px]">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {defaultSlots.map(slot => (
                            <tr key={slot}>
                                <td className="p-4 border border-foreground/10 bg-foreground/5 text-text-dim font-bold text-xs uppercase text-center align-middle">
                                    {slot}
                                </td>
                                {defaultDays.map(day => {
                                    const block = getBlock(day, slot);
                                    return (
                                        <td key={day} className="p-2 border border-foreground/10 bg-panel hover:bg-foreground/5 transition-colors cursor-pointer align-top" onClick={() => openCell(day, slot)}>
                                            <div className="min-h-[60px] flex items-center justify-center p-2 rounded-lg text-center">
                                                {block ? (
                                                    <span className="text-sm font-black text-foreground">{block.title}</span>
                                                ) : (
                                                    <Plus className="w-4 h-4 text-text-dim opacity-30" />
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal para Editar/Crear Comida */}
            {editingCell && editModeBloc && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-panel border border-foreground/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                        
                        {/* Header Modal */}
                        <div className="flex justify-between items-center p-6 border-b border-foreground/10 bg-foreground/5 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-foreground">{editingCell.day} - {editingCell.slot}</h2>
                                <div className="flex gap-4 mt-2">
                                    <button onClick={() => setShowRecipeBank(!showRecipeBank)} className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${showRecipeBank ? 'text-primary' : 'text-text-dim hover:text-primary'}`}>
                                        <BookOpen className="w-4 h-4" /> {showRecipeBank ? 'Ocultar Recetario' : 'Abrir Recetario'}
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setEditingCell(null)} className="p-2 hover:bg-foreground/10 text-text-dim rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Panel Izquierdo: Formulário */}
                            <div className={`p-6 flex-1 overflow-y-auto space-y-6 block`}>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-widest flex justify-between">
                                        Nombre del Plato
                                        {editModeBloc.title.trim() && (
                                            <button onClick={handleSaveToRecipes} className="text-primary hover:text-primary/70 flex items-center gap-1 text-[10px]">
                                                <Star className="w-3 h-3" /> Guardar como Receta
                                            </button>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={editModeBloc.title}
                                        onChange={e => setEditModeBloc({ ...editModeBloc, title: e.target.value })}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground font-bold focus:outline-none focus:border-primary"
                                        placeholder="Ej. Macarrones con Tomate"
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-widest">Descripción / Preparación</label>
                                    <textarea
                                        value={editModeBloc.description || ''}
                                        onChange={e => setEditModeBloc({ ...editModeBloc, description: e.target.value })}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary min-h-[80px]"
                                        placeholder="Instrucciones o notas adicionales..."
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-foreground/10">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <ChefHat className="w-4 h-4" /> Ingredientes
                                    </label>
                                    
                                    <div className="space-y-2">
                                        {editModeBloc.ingredients.map((ing, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-foreground/5 px-4 py-2 rounded-lg">
                                                <span className="font-bold text-sm text-foreground">{ing.quantity}x {ing.name}</span>
                                                <button 
                                                    onClick={() => setEditModeBloc({
                                                        ...editModeBloc,
                                                        ingredients: editModeBloc.ingredients.filter((_, i) => i !== idx)
                                                    })}
                                                    className="p-1.5 text-text-dim hover:text-red-500 rounded-lg hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {editModeBloc.ingredients.length === 0 && (
                                            <p className="text-xs text-text-dim italic">Sin ingredientes</p>
                                        )}
                                    </div>

                                    <div className="relative pt-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="number" min="1"
                                                value={ingredientQty}
                                                onChange={e => setIngredientQty(Number(e.target.value))}
                                                className="w-20 bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-foreground font-bold focus:outline-none focus:border-primary text-center"
                                            />
                                            <input
                                                type="text"
                                                value={ingredientQuery}
                                                onChange={e => handleIngQueryChange(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addIngredient(ingredientQuery);
                                                    }
                                                }}
                                                className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-foreground font-bold focus:outline-none focus:border-primary"
                                                placeholder="Añadir ingrediente..."
                                            />
                                            <button 
                                                onClick={() => addIngredient(ingredientQuery)}
                                                disabled={!ingredientQuery.trim()}
                                                className="p-2 px-4 bg-primary text-white rounded-xl disabled:opacity-50"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {ingredientSuggestions.length > 0 && (
                                            <div className="absolute bottom-full mb-1 bg-panel border border-foreground/20 rounded-xl shadow-xl z-50 w-full overflow-hidden">
                                                {ingredientSuggestions.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => addIngredient(s.name)}
                                                        className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-primary hover:text-white transition-colors"
                                                    >
                                                        {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Panel Derecho: Recetario (Side panel if active) */}
                            {showRecipeBank && (
                                <div className="w-1/2 border-l border-foreground/10 bg-panel/50 overflow-y-auto flex flex-col">
                                    <div className="p-4 bg-primary/5 border-b border-primary/20 sticky top-0">
                                        <h3 className="font-black text-primary text-sm uppercase tracking-widest flex items-center gap-2"><BookOpen className="w-4 h-4"/> Tu Recetario</h3>
                                        <p className="text-[10px] text-text-dim mt-1 font-bold">Haz click para cargar una receta</p>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {recipes.map(r => (
                                            <div key={r.id} onClick={() => loadRecipe(r)} className="bg-panel border border-foreground/10 p-4 rounded-xl cursor-pointer hover:border-primary hover:shadow-lg transition-all group">
                                                <h4 className="font-black text-foreground group-hover:text-primary">{r.title}</h4>
                                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide mt-1">{r.ingredients.length} Ingredientes</p>
                                            </div>
                                        ))}
                                        {recipes.length === 0 && (
                                            <p className="text-center text-xs text-text-dim py-10 font-bold opacity-50">No hay recetas guardadas.<br/>Usa el botón "Guardar como Receta" desde un plato rellenado.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="flex items-center gap-3 p-6 border-t border-foreground/10 bg-panel shrink-0">
                            <button onClick={handleSaveCell} className="flex-1 py-4 bg-primary text-white font-black text-sm uppercase rounded-xl flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors">
                                <Save className="w-5 h-5" /> Guardar Plato
                            </button>
                            <button onClick={handleDeleteCell} className="py-4 px-6 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-black text-sm uppercase rounded-xl transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};
