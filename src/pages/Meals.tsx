import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Utensils, Plus, Copy, Trash2, Star, X, ShoppingCart, CalendarDays } from 'lucide-react';
import type { WeeklyMenu, MealBlock, MealIngredient } from '../types';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const Meals = () => {
    const { weeklyMenus, addWeeklyMenu, updateWeeklyMenu, deleteWeeklyMenu, shoppingConcepts, addShoppingConcept, addShoppingItem } = useAppContext();
    const location = useLocation();
    const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('filter') === 'favorites') {
            setViewMode('favorites');
        } else {
            setViewMode('all');
        }
    }, [location]);

    // active week
    const currentWeekInfo = weeklyMenus.find(w => w.id === currentWeekId);

    const [isCreatingWeek, setIsCreatingWeek] = useState(false);
    const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
    const [newWeekName, setNewWeekName] = useState('');
    const [newWeekSlots, setNewWeekSlots] = useState<{ id: string, name: string }[]>([
        { id: 'desayuno', name: 'Desayuno' },
        { id: 'comida', name: 'Comida' },
        { id: 'cena', name: 'Cena' }
    ]);

    // modal meal block edit
    const [editingMeal, setEditingMeal] = useState<{ id?: string, title: string, description?: string, ingredients: MealIngredient[], targetDay?: number, targetSlot?: string } | null>(null);

    const handleCreateWeek = () => {
        if (!newWeekName.trim()) return;
        const newMenu: WeeklyMenu = {
            id: crypto.randomUUID(),
            name: newWeekName,
            isFavorite: false,
            slots: newWeekSlots,
            blocks: []
        };
        addWeeklyMenu(newMenu);
        setCurrentWeekId(newMenu.id);
        setIsCreatingWeek(false);
        setNewWeekName('');
    };

    const handleDuplicateWeek = (menuId: string) => {
        const source = weeklyMenus.find(m => m.id === menuId);
        if (!source) return;
        const newMenu: WeeklyMenu = {
            ...source,
            id: crypto.randomUUID(),
            name: source.name + ' (Copia)',
            isFavorite: false,
            blocks: source.blocks.map(b => ({ ...b, id: crypto.randomUUID() }))
        };
        addWeeklyMenu(newMenu);
        setCurrentWeekId(newMenu.id);
    };

    const handleToggleFavorite = (menuId: string) => {
        const menu = weeklyMenus.find(m => m.id === menuId);
        if (!menu) return;
        updateWeeklyMenu({ ...menu, isFavorite: !menu.isFavorite });
    };

    // --- Saving Meals ---
    const handleSaveMeal = () => {
        if (!currentWeekInfo || !editingMeal) return;
        if (!editingMeal.title.trim()) return;

        const newBlock: MealBlock = {
            id: editingMeal.id || crypto.randomUUID(),
            title: editingMeal.title,
            description: editingMeal.description,
            ingredients: editingMeal.ingredients
        };

        let updatedBlocks = [...currentWeekInfo.blocks];

        if (editingMeal.id) {
            // Update existing
            const bx = updatedBlocks.findIndex(b => b.id === editingMeal.id);
            if (bx !== -1) {
                updatedBlocks[bx].meal = newBlock;
            }
        } else {
            // Add new
            if (editingMeal.targetDay !== undefined && editingMeal.targetSlot !== undefined) {
                updatedBlocks.push({
                    id: newBlock.id,
                    day: editingMeal.targetDay,
                    slotId: editingMeal.targetSlot,
                    meal: newBlock
                });
            }
        }
        updateWeeklyMenu({ ...currentWeekInfo, blocks: updatedBlocks });
        setEditingMeal(null);
    };

    const handleDeleteMeal = (blockId: string) => {
        if (!currentWeekInfo) return;
        updateWeeklyMenu({
            ...currentWeekInfo,
            blocks: currentWeekInfo.blocks.filter(b => b.id !== blockId)
        });
        setEditingMeal(null); // safely close if deleting from edit
    };

    // --- Ingredient suggestions check ---
    const toggleIngredientDb = (name: string, conceptId?: string) => {
        if (!conceptId && !shoppingConcepts.find(c => c.name.toLowerCase() === name.toLowerCase().trim())) {
            addShoppingConcept({ id: crypto.randomUUID(), name: name.trim() });
        }
    };

    const [shoppingModalOpen, setShoppingModalOpen] = useState(false);
    const [shoppingListPreview, setShoppingListPreview] = useState<{
        id: string;
        name: string;
        conceptId?: string;
        quantity: number;
        unit: string;
        selected: boolean;
    }[]>([]);

    const handleOpenShoppingModal = () => {
        if (!currentWeekInfo) return;
        const consolidated = new Map<string, { name: string, conceptId?: string, quantity: number, unit: string }>();

        currentWeekInfo.blocks.forEach(b => {
            b.meal.ingredients.forEach(ing => {
                if (!ing.name.trim()) return;
                const key = (ing.name.toLowerCase().trim()) + "|" + (ing.unit || '').toLowerCase().trim();
                const q = ing.quantity || 1;
                if (consolidated.has(key)) {
                    const existing = consolidated.get(key)!;
                    existing.quantity += q;
                } else {
                    consolidated.set(key, { name: ing.name.trim(), conceptId: ing.conceptId, quantity: q, unit: ing.unit || '' });
                }
            });
        });

        const preview = Array.from(consolidated.values()).map(item => ({
            id: crypto.randomUUID(),
            name: item.name,
            conceptId: item.conceptId,
            quantity: item.quantity,
            unit: item.unit,
            selected: true
        }));

        setShoppingListPreview(preview);
        setShoppingModalOpen(true);
    };

    const handleConfirmShoppingList = () => {
        shoppingListPreview.filter(i => i.selected).forEach(ing => {
            toggleIngredientDb(ing.name, ing.conceptId);
            const qtyStr = ing.quantity > 0 ? ` x${ing.quantity} ${ing.unit || ''}`.trimEnd() : '';
            addShoppingItem({
                id: crypto.randomUUID(),
                conceptId: ing.conceptId || shoppingConcepts.find(c => c.name.toLowerCase() === ing.name.toLowerCase().trim())?.id || crypto.randomUUID(),
                name: ing.name + qtyStr,
                addedBy: 'auto',
                addedAt: new Date().toISOString()
            });
        });
        setShoppingModalOpen(false);
    };

    const displayedMenus = viewMode === 'all' ? weeklyMenus : weeklyMenus.filter(m => m.isFavorite);

    // To make it fully DnD HTML5:
    const handleDragStartNative = (e: React.DragEvent, blockId: string) => { e.dataTransfer.setData('text/plain', blockId); };
    const handleDragOverNative = (e: React.DragEvent) => { e.preventDefault(); };
    const handleDropNative = (e: React.DragEvent, dayIdx: number, slotId: string) => {
        e.preventDefault();
        const blockId = e.dataTransfer.getData('text/plain');
        if (!currentWeekInfo || !blockId) return;
        const updated = currentWeekInfo.blocks.map(b => b.id === blockId ? { ...b, day: dayIdx, slotId } : b);
        updateWeeklyMenu({ ...currentWeekInfo, blocks: updated });
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-[95%] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-panel border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-orange-500/20 p-4 rounded-xl shrink-0">
                        <Utensils className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Menú Semanal</h1>
                        <p className="text-gray-400 mt-1">Planifica tus comidas y ahorra tiempo</p>
                    </div>
                </div>
                {!currentWeekId && (
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                            <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white'}`}>Todos</button>
                            <button onClick={() => setViewMode('favorites')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'favorites' ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-400 hover:text-white'}`}>Favoritos</button>
                        </div>
                        <button
                            onClick={() => setIsCreatingWeek(true)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Crear Semana
                        </button>
                    </div>
                )}
            </header>

            {!currentWeekId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedMenus.length === 0 ? (
                        <div className="col-span-full bg-panel rounded-2xl p-12 text-center border-2 border-dashed border-white/10">
                            <CalendarDays className="w-16 h-16 text-orange-500/20 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">No hay menús aquí.</p>
                            {viewMode === 'favorites' ? <p className="text-gray-500 mt-1">Marca algún menú con la estrella para verlo aquí.</p> : <p className="text-gray-500 mt-1">Crea tu primera semana de menú.</p>}
                        </div>
                    ) : displayedMenus.map(menu => (
                        <div key={menu.id} className="bg-panel border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all shadow-lg group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white group-hover:text-orange-400 cursor-pointer" onClick={() => setCurrentWeekId(menu.id)}>{menu.name}</h3>
                                <button onClick={() => handleToggleFavorite(menu.id)} className={`p-2 rounded-lg transition-colors ${menu.isFavorite ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
                                    {menu.isFavorite ? <Star className="w-5 h-5 fill-current" /> : <Star className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex gap-2 text-sm text-gray-400 mb-6">
                                <span className="bg-white/5 px-2 py-1 rounded-md border border-white/5">{menu.slots.length} Tramos / día</span>
                                <span className="bg-white/5 px-2 py-1 rounded-md border border-white/5">{menu.blocks.length} Comidas</span>
                            </div>
                            <div className="flex gap-2 border-t border-white/5 pt-4">
                                <button onClick={() => setCurrentWeekId(menu.id)} className="flex-1 bg-white/5 hover:bg-orange-500 text-white py-2 rounded-xl text-sm font-medium transition-colors border border-white/10 hover:border-orange-500">
                                    Abrir
                                </button>
                                <button onClick={() => handleDuplicateWeek(menu.id)} title="Duplicar" className="px-3 bg-white/5 hover:bg-indigo-500 hover:text-white text-gray-400 py-2 rounded-xl transition-colors border border-white/10">
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteWeeklyMenu(menu.id)} title="Borrar" className="px-3 bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 py-2 rounded-xl transition-colors border border-white/10">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 slide-in-from-right-4 animate-in duration-300">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-panel border-b-4 border-orange-500 p-4 rounded-xl shadow-lg">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setCurrentWeekId(null)} className="text-gray-400 hover:text-white underline text-sm transition-colors">Volver</button>
                            <h2 className="text-2xl font-bold font-mono text-white tracking-wide">{currentWeekInfo?.name}</h2>
                            {currentWeekInfo?.isFavorite && <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleOpenShoppingModal} className="bg-white/5 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-white/10 hover:border-pink-500">
                                <ShoppingCart className="w-4 h-4" /> Revisar Compra
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10 shadow-2xl bg-[#111] hide-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr>
                                    <th className="bg-black/50 p-4 border-b border-t border-l border-white/10 w-32 font-medium text-orange-400/80 uppercase tracking-widest text-xs">Tramo</th>
                                    {DAYS.map(d => (
                                        <th key={d} className="bg-black/50 p-4 border-b border-t border-white/10 font-bold text-white">{d}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentWeekInfo?.slots.map(slot => (
                                    <tr key={slot.id} className="border-b border-white/10 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 bg-black/30 border-r border-white/10 font-medium text-gray-400 sticky left-0 z-10">{slot.name}</td>
                                        {DAYS.map((_, dIdx) => (
                                            <td
                                                key={dIdx}
                                                className="border-r border-white/10 p-2 align-top min-w-[140px] h-[120px] relative group"
                                                onDragOver={handleDragOverNative}
                                                onDrop={(e) => handleDropNative(e, dIdx, slot.id)}
                                            >
                                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button onClick={() => setEditingMeal({ title: '', description: '', ingredients: [], targetDay: dIdx, targetSlot: slot.id })} className="bg-orange-500/20 text-orange-400 h-6 w-6 flex items-center justify-center rounded hover:bg-orange-500/40">
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="space-y-2 h-full">
                                                    {currentWeekInfo.blocks.filter(b => b.day === dIdx && b.slotId === slot.id).map(block => (
                                                        <div
                                                            key={block.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStartNative(e, block.id)}
                                                            onClick={(e) => { e.stopPropagation(); setEditingMeal({ ...block.meal, id: block.id }); }}
                                                            className="bg-white/5 border border-orange-500/20 rounded-lg p-2 text-sm cursor-grab active:cursor-grabbing hover:border-orange-500 transition-all shadow-sm"
                                                        >
                                                            <div className="font-bold text-orange-300 leading-tight mb-1">{block.meal.title}</div>
                                                            {block.meal.ingredients.length > 0 && <div className="text-[10px] text-gray-500 mt-1 flex gap-1 items-center"><ShoppingCart className="w-3 h-3" /> {block.meal.ingredients.length} items</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isCreatingWeek && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Nueva Semana de Menú</h2>
                        <input
                            value={newWeekName} onChange={e => setNewWeekName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none mb-4"
                            placeholder="Ej: Semana 1, Semana Verano..."
                        />
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Tramos de comida por día:</label>
                            {newWeekSlots.map((s, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input value={s.name} onChange={(e) => { const n = [...newWeekSlots]; n[i].name = e.target.value; setNewWeekSlots(n); }} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                    <button onClick={() => setNewWeekSlots(newWeekSlots.filter((_, idx) => idx !== i))} className="p-2 bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            <button onClick={() => setNewWeekSlots([...newWeekSlots, { id: `slot_${Date.now()}`, name: 'Nuevo Tramo' }])} className="text-sm text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 mt-2">
                                <Plus className="w-4 h-4" /> Añadir tramo
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsCreatingWeek(false)} className="flex-1 py-3 px-4 rounded-xl font-medium bg-white/5 text-gray-300">Cancelar</button>
                            <button onClick={handleCreateWeek} disabled={!newWeekName} className="flex-1 py-3 px-4 rounded-xl font-bold bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-50">Crear</button>
                        </div>
                    </div>
                </div>
            )}

            {editingMeal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-white/5 flex justify-between tracking-wide">
                            <h2 className="font-bold text-white text-lg">Bloque de Comida</h2>
                            <button onClick={() => setEditingMeal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Comida / Plato</label>
                                <input value={editingMeal.title} onChange={e => setEditingMeal({ ...editingMeal, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none" placeholder="Ej: Macarrones con tomate" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Notas / Preparación</label>
                                <textarea value={editingMeal.description} onChange={e => setEditingMeal({ ...editingMeal, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none min-h-[60px]" placeholder="Opcional..." />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">Ingredientes para compra</label>
                                {editingMeal.ingredients.map((ing, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2 items-center">
                                        <input value={ing.name} onChange={e => { const n = [...editingMeal.ingredients]; n[idx].name = e.target.value; setEditingMeal({ ...editingMeal, ingredients: n }) }} placeholder="Ingrediente" className="flex-1 bg-black/30 border border-white/10 rounded-md px-2 py-1 text-sm text-white" />
                                        <input type="number" value={ing.quantity || ''} onChange={e => { const n = [...editingMeal.ingredients]; n[idx].quantity = parseFloat(e.target.value); setEditingMeal({ ...editingMeal, ingredients: n }) }} placeholder="Cant" className="w-16 bg-black/30 border border-white/10 rounded-md px-2 py-1 text-sm text-white" />
                                        <input value={ing.unit || ''} onChange={e => { const n = [...editingMeal.ingredients]; n[idx].unit = e.target.value; setEditingMeal({ ...editingMeal, ingredients: n }) }} placeholder="Ud" className="w-16 bg-black/30 border border-white/10 rounded-md px-2 py-1 text-sm text-white" />
                                        <button onClick={() => { const n = [...editingMeal.ingredients]; n.splice(idx, 1); setEditingMeal({ ...editingMeal, ingredients: n }) }} className="text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <button onClick={() => setEditingMeal({ ...editingMeal, ingredients: [...editingMeal.ingredients, { id: crypto.randomUUID(), name: '', quantity: 1, unit: '' }] })} className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 mt-2">
                                    <Plus className="w-3 h-3" /> Añadir ingrediente
                                </button>
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/5 flex gap-2">
                            {editingMeal.id && (
                                <button onClick={() => handleDeleteMeal(editingMeal.id as string)} className="p-2 bg-red-500/10 text-red-500 rounded-lg px-4 hover:bg-red-500/20 transition-colors"><Trash2 className="w-5 h-5" /></button>
                            )}
                            <button onClick={() => setEditingMeal(null)} className="flex-1 bg-white/5 text-gray-300 rounded-lg py-2 hover:bg-white/10">Cancelar</button>
                            <button onClick={handleSaveMeal} disabled={!editingMeal.title} className="flex-1 bg-orange-500 text-white font-bold rounded-lg py-2 hover:bg-orange-400 shadow-lg disabled:opacity-50">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
            {shoppingModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-white/5 flex gap-3 items-center shrink-0">
                            <ShoppingCart className="w-6 h-6 text-pink-500" />
                            <div>
                                <h2 className="text-lg font-bold text-white">Lista previa de compra</h2>
                                <p className="text-xs text-gray-400">Selecciona o edita qué quieres añadir finalmente</p>
                            </div>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-2 relative">
                            {shoppingListPreview.length === 0 ? (
                                <p className="text-center text-gray-400 my-8">No hay ingredientes en esta semana.</p>
                            ) : (
                                shoppingListPreview.map((item, idx) => (
                                    <div key={item.id} className="flex gap-3 items-center bg-black/30 p-2 rounded-lg border border-white/5">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={e => {
                                                const n = [...shoppingListPreview];
                                                n[idx].selected = e.target.checked;
                                                setShoppingListPreview(n);
                                            }}
                                            className="w-5 h-5 rounded text-pink-500 focus:ring-transparent border-white/20 bg-black/50"
                                        />
                                        <div className="flex-1 font-medium text-white truncate text-sm" title={item.name}>{item.name}</div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                disabled={!item.selected}
                                                onChange={e => {
                                                    const n = [...shoppingListPreview];
                                                    n[idx].quantity = parseFloat(e.target.value) || 0;
                                                    setShoppingListPreview(n);
                                                }}
                                                className="w-14 bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-center text-white disabled:opacity-50"
                                            />
                                            {item.unit && <span className="text-xs text-gray-500 w-6">{item.unit}</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-5 border-t border-white/5 flex gap-3 shrink-0 bg-black/20">
                            <button onClick={() => setShoppingModalOpen(false)} className="flex-1 bg-white/5 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors">Cancelar</button>
                            <button onClick={handleConfirmShoppingList} disabled={!shoppingListPreview.some(i => i.selected)} className="flex-1 bg-pink-600 hover:bg-pink-500 py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                Enviar seleccionados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
