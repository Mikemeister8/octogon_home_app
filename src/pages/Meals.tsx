import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Utensils, Plus, ChefHat, ShoppingBasket, Loader2, Save, X, Trash2 } from 'lucide-react';
import type { MealBlock, ShoppingConcept } from '../types';

const defaultDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const defaultSlots = ['Desayuno', 'Media Mañana', 'Comida', 'Merienda', 'Cena'];

export const Meals = () => {
    const { loading, currentUser, shoppingConcepts, addShoppingItem, addShoppingConcept } = useAppContext();
    const [blocks, setBlocks] = useState<MealBlock[]>([]);
    
    // Edit Modal State
    const [editingCell, setEditingCell] = useState<{ day: string; slot: string } | null>(null);
    const [editModeBloc, setEditModeBloc] = useState<MealBlock | null>(null);
    const [ingredientQuery, setIngredientQuery] = useState('');
    const [ingredientQty, setIngredientQty] = useState(1);
    const [ingredientSuggestions, setIngredientSuggestions] = useState<ShoppingConcept[]>([]);

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const getBlock = (day: string, slot: string) => blocks.find(b => b.day === day && b.slot === slot);

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
    };

    const handleSaveCell = () => {
        if (!editModeBloc || !editModeBloc.title.trim()) return;
        setBlocks(prev => {
            const copy = prev.filter(b => !(b.day === editingCell?.day && b.slot === editingCell?.slot));
            copy.push(editModeBloc);
            return copy;
        });
        setEditingCell(null);
    };

    const handleDeleteCell = () => {
        setBlocks(prev => prev.filter(b => !(b.day === editingCell?.day && b.slot === editingCell?.slot)));
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
        
        // ensure exists in DB concepts
        const exists = shoppingConcepts.some(c => c.name.toLowerCase() === name.toLowerCase());
        if (!exists && currentUser?.id) {
            await addShoppingConcept(name.trim());
        }

        const newIngr = { name: name.trim(), quantity: ingredientQty, addToShopping: true };
        setEditModeBloc({
            ...editModeBloc,
            ingredients: [...editModeBloc.ingredients, newIngr]
        });
        
        setIngredientQuery('');
        setIngredientQty(1);
        setIngredientSuggestions([]);
    };

    const exportToShoppingList = async () => {
        if (!currentUser) return;
        // aggregate ingredients taking quantities into account
        const allIngredients = blocks.flatMap(b => b.ingredients);
        const map = new Map<string, number>();
        allIngredients.forEach(i => {
            const current = map.get(i.name.toLowerCase()) || 0;
            map.set(i.name.toLowerCase(), current + i.quantity);
        });

        const promises = Array.from(map.entries()).map(([name, qty]) => {
            // we uppercase first letter for niceness
            const niceName = name.charAt(0).toUpperCase() + name.slice(1);
            return addShoppingItem(niceName, qty, currentUser.id);
        });

        await Promise.all(promises);
        alert('Ingredientes añadidos a la lista de la compra!');
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-[1400px] mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-md">
                <div className="flex items-center gap-6">
                    <div className="bg-primary/20 p-5 rounded-2xl">
                        <Utensils className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Menú Semanal</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Organización de Comidas</p>
                    </div>
                </div>
                <button onClick={exportToShoppingList} className="px-6 py-4 bg-accent hover:bg-accent/90 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2">
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
                    <div className="bg-panel border border-foreground/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-6 relative">
                        <div className="flex justify-between items-center border-b border-foreground/10 pb-4">
                            <div>
                                <h2 className="text-xl font-black text-foreground">{editingCell.day} - {editingCell.slot}</h2>
                                <p className="text-xs text-text-dim font-bold uppercase tracking-widest mt-1">Receta / Comida</p>
                            </div>
                            <button onClick={() => setEditingCell(null)} className="p-2 bg-foreground/5 hover:bg-foreground/10 text-text-dim rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-dim uppercase tracking-widest">Nombre del Plato</label>
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
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary min-h-[100px]"
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
                                        <div className="absolute top-full mt-1 bg-panel border border-foreground/20 rounded-xl shadow-xl z-50 w-full overflow-hidden">
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

                        <div className="flex items-center gap-3 pt-4 border-t border-foreground/10 mt-auto">
                            <button onClick={handleSaveCell} className="flex-1 py-3 bg-primary text-white font-black text-sm uppercase rounded-xl flex justify-center items-center gap-2 hover:bg-primary/90">
                                <Save className="w-4 h-4" /> Guardar
                            </button>
                            <button onClick={handleDeleteCell} className="py-3 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-black text-sm uppercase rounded-xl transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
