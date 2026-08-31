import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import {
    Utensils, Plus, ChefHat, ShoppingBasket, Loader2, Save, X, Trash2,
    ArrowLeft, BookOpen, Star, CheckCircle2, PlayCircle, GripVertical,
} from 'lucide-react';
import {
    DndContext, pointerWithin, PointerSensor, useSensor, useSensors,
    useDraggable, useDroppable, type DragEndEvent,
} from '@dnd-kit/core';
import type { MealIngredient, MealBlock, Recipe, ShoppingConcept } from '../types';
import { SHOPPING_UNITS } from '../types';
import { normalizeName } from '../utils/text';

const defaultDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const defaultSlots = ['Desayuno', 'Media Mañana', 'Comida', 'Merienda', 'Cena'];

export const Meals = () => {
    const {
        menus, recipes, createMenu, activateMenu, deleteMenu, saveMenuBlock, deleteMenuBlock,
        exportMenuToShopping, addRecipe,
        shoppingConcepts, addShoppingConcept, homeSettings,
    } = useAppContext();

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Menu list UI state
    const [isCreatingMenu, setIsCreatingMenu] = useState(false);
    const [newMenuName, setNewMenuName] = useState('');
    const [creatingMenu, setCreatingMenu] = useState(false);
    const [activatingId, setActivatingId] = useState<string | null>(null);

    // Cell edit modal state
    const [editingCell, setEditingCell] = useState<{ day: string; slot: string } | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIngredients, setEditIngredients] = useState<MealIngredient[]>([]);
    const [ingredientQuery, setIngredientQuery] = useState('');
    const [ingredientQty, setIngredientQty] = useState(1);
    const [ingredientUnit, setIngredientUnit] = useState<string>('ud');
    const [ingredientSuggestions, setIngredientSuggestions] = useState<ShoppingConcept[]>([]);
    const [showRecipeBank, setShowRecipeBank] = useState(false);
    const [savingBlock, setSavingBlock] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [savingRecipe, setSavingRecipe] = useState(false);
    const [movingCell, setMovingCell] = useState(false);

    const sensors = useSensors(
        // Same rationale as Tasks.tsx: a small activation distance so a plain
        // tap to open the edit modal is never mistaken for a drag.
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    if (!homeSettings) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const activeMenu = menus.find(m => m.status === 'active');
    const savedMenus = menus.filter(m => m.status !== 'active').sort((a, b) => a.name.localeCompare(b.name));
    const openMenu = menus.find(m => m.id === openMenuId);

    // ── Menu list actions ────────────────────────────────────────────────────
    const handleCreateMenu = async () => {
        if (!newMenuName.trim() || creatingMenu) return;
        setCreatingMenu(true);
        try {
            const id = await createMenu(newMenuName.trim());
            setNewMenuName('');
            setIsCreatingMenu(false);
            setOpenMenuId(id);
        } catch (err: any) {
            alert(err.message || 'No se pudo crear el menú');
        } finally {
            setCreatingMenu(false);
        }
    };

    const handleDeleteMenu = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('¿Eliminar este menú? Esta acción no se puede deshacer.')) return;
        await deleteMenu(id);
        if (openMenuId === id) setOpenMenuId(null);
    };

    const handleActivate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActivatingId(id);
        try { await activateMenu(id); }
        finally { setActivatingId(null); }
    };

    // ── Menu list view ───────────────────────────────────────────────────────
    if (!openMenu) {
        return (
            <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto pb-20">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-md">
                    <div className="flex items-center gap-6">
                        <div className="bg-primary/20 p-5 rounded-2xl">
                            <Utensils className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tight">Menús</h1>
                            <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Compartidos con todo el hogar</p>
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
                            <button onClick={handleCreateMenu} disabled={!newMenuName.trim() || creatingMenu} className="px-6 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-2">
                                {creatingMenu ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Crear
                            </button>
                            <button onClick={() => setIsCreatingMenu(false)} className="px-4 py-3 bg-foreground/5 text-foreground rounded-xl font-bold hover:bg-foreground/10">Cancelar</button>
                        </div>
                    </div>
                )}

                {/* Menú en curso */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 text-primary" /> Menú en Curso
                    </h2>
                    {activeMenu ? (
                        <div
                            onClick={() => setOpenMenuId(activeMenu.id)}
                            className="bg-panel border-2 border-primary/40 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{activeMenu.name}</h3>
                                </div>
                                <p className="text-text-dim text-xs font-bold mt-2 uppercase tracking-widest">{activeMenu.blocks.length} comidas planificadas</p>
                            </div>
                            <button onClick={(e) => handleDeleteMenu(activeMenu.id, e)} className="p-3 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="py-10 text-center bg-panel/30 border-2 border-dashed border-foreground/10 rounded-3xl">
                            <p className="text-text-dim font-bold italic opacity-60">No hay ningún menú activo ahora mismo.</p>
                            <p className="text-xs text-text-dim/60 mt-1">Crea uno nuevo o activa uno de los guardados abajo.</p>
                        </div>
                    )}
                </div>

                {/* Menús guardados */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Menús Guardados
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedMenus.map(menu => (
                            <div key={menu.id} onClick={() => setOpenMenuId(menu.id)} className="bg-panel border border-foreground/10 p-6 rounded-3xl shadow-sm hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]">
                                <div>
                                    <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{menu.name}</h3>
                                    <p className="text-text-dim text-xs font-bold mt-2 uppercase tracking-widest">{menu.blocks.length} comidas planificadas</p>
                                </div>
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-foreground/5">
                                    <button
                                        onClick={(e) => handleActivate(menu.id, e)}
                                        disabled={activatingId === menu.id}
                                        className="text-primary font-bold text-sm flex items-center gap-1.5 hover:underline disabled:opacity-50"
                                    >
                                        {activatingId === menu.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} Activar
                                    </button>
                                    <button onClick={(e) => handleDeleteMenu(menu.id, e)} className="p-2 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {savedMenus.length === 0 && (
                            <div className="col-span-full py-12 text-center text-text-dim border-2 border-dashed border-foreground/10 rounded-3xl">
                                <p className="font-bold text-lg">Aún no tienes menús guardados.</p>
                                <p className="text-sm opacity-60">Cuando actives otro menú, este quedará aquí para reutilizarlo más adelante.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Active menu editor ───────────────────────────────────────────────────
    const getBlock = (day: string, slot: string) => openMenu.blocks.find(b => b.day === day && b.slot === slot);

    const openCell = (day: string, slot: string) => {
        const existing = getBlock(day, slot);
        setEditTitle(existing?.title || '');
        setEditDescription(existing?.description || '');
        setEditIngredients(existing ? existing.ingredients.map(i => ({ ...i })) : []);
        setEditingCell({ day, slot });
        setShowRecipeBank(false);
    };

    const handleSaveCell = async () => {
        if (!editingCell || !editTitle.trim() || savingBlock) return;
        setSavingBlock(true);
        try {
            await saveMenuBlock(openMenu.id, {
                day: editingCell.day, slot: editingCell.slot,
                title: editTitle.trim(), description: editDescription, ingredients: editIngredients,
            });
            setEditingCell(null);
        } catch (err: any) {
            alert(err.message || 'No se pudo guardar el plato. Inténtalo de nuevo.');
        } finally {
            setSavingBlock(false);
        }
    };

    const handleDeleteCell = async () => {
        const block = editingCell && getBlock(editingCell.day, editingCell.slot);
        if (block) await deleteMenuBlock(block.id);
        setEditingCell(null);
    };

    // Drag a filled cell onto another cell: dropping on an empty cell moves
    // it there; dropping on another filled cell swaps the two. Both cases
    // reuse saveMenuBlock's upsert-by-(day,slot) — it already replaces
    // whatever's at a position wholesale, so "swap" is just writing each
    // block's content into the other's position.
    const handleGridDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || movingCell) return;
        const [fromDay, fromSlot] = String(active.id).split('::');
        const [toDay, toSlot] = String(over.id).split('::');
        const sourceBlock = getBlock(fromDay, fromSlot);
        if (!sourceBlock) return;
        const targetBlock = getBlock(toDay, toSlot);

        setMovingCell(true);
        (async () => {
            try {
                if (targetBlock) {
                    await Promise.all([
                        saveMenuBlock(openMenu.id, { day: toDay, slot: toSlot, title: sourceBlock.title, description: sourceBlock.description, ingredients: sourceBlock.ingredients }),
                        saveMenuBlock(openMenu.id, { day: fromDay, slot: fromSlot, title: targetBlock.title, description: targetBlock.description, ingredients: targetBlock.ingredients }),
                    ]);
                } else {
                    await saveMenuBlock(openMenu.id, { day: toDay, slot: toSlot, title: sourceBlock.title, description: sourceBlock.description, ingredients: sourceBlock.ingredients });
                    await deleteMenuBlock(sourceBlock.id);
                }
            } finally {
                setMovingCell(false);
            }
        })();
    };

    const handleIngQueryChange = (q: string) => {
        setIngredientQuery(q);
        if (q.trim().length > 1) {
            setIngredientSuggestions(shoppingConcepts.filter(c => normalizeName(c.name).includes(normalizeName(q))).slice(0, 4));
        } else {
            setIngredientSuggestions([]);
        }
    };

    // Adds to the visible list immediately — it used to await the food
    // database sync first, so a slow or wedged connection made it look like
    // "I clicked add and nothing happened, I can't add more ingredients."
    // The food database sync now happens in the background; the ingredient
    // is already on the plate regardless of how long (or whether) that
    // finishes.
    const addIngredient = (name: string, unitOverride?: string) => {
        if (!name.trim()) return;
        setEditIngredients(prev => [...prev, { name: name.trim(), quantity: ingredientQty, unit: unitOverride || ingredientUnit }]);
        setIngredientQuery('');
        setIngredientQty(1);
        setIngredientSuggestions([]);

        const exists = shoppingConcepts.some(c => normalizeName(c.name) === normalizeName(name));
        if (!exists) addShoppingConcept(name.trim());
    };

    // Picking a suggestion for a food that has a defined package sub-unit
    // (e.g. jamón -> lonchas) switches the unit picker to it, so the user
    // doesn't have to remember and re-select it every time.
    const pickSuggestion = (concept: ShoppingConcept) => {
        if (concept.pack_unit) setIngredientUnit(concept.pack_unit);
        addIngredient(concept.name, concept.pack_unit || undefined);
    };

    // Custom sub-units defined across the food database (e.g. "lonchas"),
    // offered in the unit picker alongside the fixed SHOPPING_UNITS.
    const customUnits = Array.from(new Set(
        shoppingConcepts.filter(c => c.pack_unit).map(c => c.pack_unit as string)
    ));

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportMenuToShopping(openMenu.id);
            alert('¡Ingredientes añadidos a la lista de la compra!');
        } finally {
            setExporting(false);
        }
    };

    const handleSaveToRecipes = async () => {
        if (!editTitle.trim() || savingRecipe) return;
        setSavingRecipe(true);
        try {
            await addRecipe(editTitle.trim(), editDescription, editIngredients);
            alert('¡Receta guardada en tu recetario para usarla en el futuro!');
        } catch (err: any) {
            alert(err.message || 'No se pudo guardar la receta. Inténtalo de nuevo.');
        } finally {
            setSavingRecipe(false);
        }
    };

    const loadRecipe = (r: Recipe) => {
        setEditTitle(r.title);
        setEditDescription(r.description || '');
        setEditIngredients(r.ingredients.map(i => ({ ...i })));
        setShowRecipeBank(false);
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-[1400px] mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-md">
                <div className="flex items-center gap-6">
                    <button onClick={() => setOpenMenuId(null)} className="bg-foreground/5 p-4 rounded-2xl hover:bg-primary/20 hover:text-primary transition-colors text-text-dim">
                        <ArrowLeft className="w-8 h-8" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-foreground tracking-tight">{openMenu.name}</h1>
                            {openMenu.status === 'active' && (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Activo
                                </span>
                            )}
                        </div>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Editando Menú</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {openMenu.status !== 'active' && (
                        <button
                            onClick={(e) => handleActivate(openMenu.id, e)}
                            disabled={activatingId === openMenu.id}
                            className="px-6 py-4 bg-foreground/5 hover:bg-primary/10 border border-foreground/10 hover:border-primary/30 text-foreground rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {activatingId === openMenu.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />} Activar
                        </button>
                    )}
                    <button onClick={handleExport} disabled={exporting} className="px-6 py-4 bg-accent hover:bg-accent/90 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50">
                        {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBasket className="w-5 h-5" />} Volcar a Compra
                    </button>
                </div>
            </header>

            <div className="overflow-x-auto custom-scrollbar">
                <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleGridDragEnd}>
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
                                    {defaultDays.map(day => (
                                        <MealCell key={day} day={day} slot={slot} block={getBlock(day, slot)} onOpen={() => openCell(day, slot)} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DndContext>
            </div>

            {/* Modal para Editar/Crear Comida */}
            {editingCell && (
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
                            {/* Panel Izquierdo: Formulario */}
                            <div className="p-6 flex-1 overflow-y-auto space-y-6 block">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-widest flex justify-between">
                                        Nombre del Plato
                                        {editTitle.trim() && (
                                            <button onClick={handleSaveToRecipes} disabled={savingRecipe} className="text-primary hover:text-primary/70 flex items-center gap-1 text-[10px] disabled:opacity-50">
                                                {savingRecipe ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />} Guardar como Receta
                                            </button>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground font-bold focus:outline-none focus:border-primary"
                                        placeholder="Ej. Macarrones con Tomate"
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-widest">Descripción / Preparación</label>
                                    <textarea
                                        value={editDescription}
                                        onChange={e => setEditDescription(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary min-h-[80px]"
                                        placeholder="Instrucciones o notas adicionales..."
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-foreground/10">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <ChefHat className="w-4 h-4" /> Ingredientes
                                    </label>

                                    <div className="space-y-2">
                                        {editIngredients.map((ing, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-foreground/5 px-4 py-2 rounded-lg">
                                                <span className="font-bold text-sm text-foreground">{ing.quantity} {ing.unit} — {ing.name}</span>
                                                <button
                                                    onClick={() => setEditIngredients(prev => prev.filter((_, i) => i !== idx))}
                                                    className="p-1.5 text-text-dim hover:text-red-500 rounded-lg hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {editIngredients.length === 0 && (
                                            <p className="text-xs text-text-dim italic">Sin ingredientes</p>
                                        )}
                                    </div>

                                    <div className="relative pt-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="number" min="0.5" step="0.5"
                                                value={ingredientQty}
                                                onChange={e => setIngredientQty(Number(e.target.value))}
                                                className="w-16 bg-foreground/5 border border-foreground/10 rounded-xl px-2 py-2 text-foreground font-bold focus:outline-none focus:border-primary text-center"
                                            />
                                            <select
                                                value={ingredientUnit}
                                                onChange={e => setIngredientUnit(e.target.value)}
                                                className="bg-foreground/5 border border-foreground/10 rounded-xl px-2 py-2 text-foreground font-bold focus:outline-none focus:border-primary"
                                            >
                                                {SHOPPING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                {customUnits.length > 0 && (
                                                    <optgroup label="Personalizadas">
                                                        {customUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                                    </optgroup>
                                                )}
                                            </select>
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
                                                className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-foreground font-bold focus:outline-none focus:border-primary min-w-0"
                                                placeholder="Ingrediente..."
                                            />
                                            <button
                                                onClick={() => addIngredient(ingredientQuery)}
                                                disabled={!ingredientQuery.trim()}
                                                className="p-2 px-4 bg-primary text-white rounded-xl disabled:opacity-50 shrink-0"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {ingredientSuggestions.length > 0 && (
                                            <div className="absolute bottom-full mb-1 bg-panel border border-foreground/20 rounded-xl shadow-xl z-50 w-full overflow-hidden">
                                                {ingredientSuggestions.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => pickSuggestion(s)}
                                                        className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-primary hover:text-white transition-colors flex items-center justify-between gap-2"
                                                    >
                                                        <span>{s.name}</span>
                                                        {s.pack_unit && <span className="text-[9px] opacity-60 uppercase tracking-widest shrink-0">en {s.pack_unit}</span>}
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
                                        <h3 className="font-black text-primary text-sm uppercase tracking-widest flex items-center gap-2"><BookOpen className="w-4 h-4" /> Recetario del Hogar</h3>
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
                                            <p className="text-center text-xs text-text-dim py-10 font-bold opacity-50">No hay recetas guardadas.<br />Usa el botón "Guardar como Receta" desde un plato rellenado.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="flex items-center gap-3 p-6 border-t border-foreground/10 bg-panel shrink-0">
                            <button onClick={handleSaveCell} disabled={!editTitle.trim() || savingBlock} className="flex-1 py-4 bg-primary text-white font-black text-sm uppercase rounded-xl flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                                {savingBlock ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Plato
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

// ─────────────────────────────────────────────────────────────────────────────
// One grid cell — always a drop target (so an empty slot can receive a
// dragged meal); draggable only when it holds a meal, and only from its grip
// handle, so the rest of the cell keeps opening the edit modal on tap and the
// table's horizontal scroll on mobile isn't hijacked by a drag started from
// blank cell space.
// ─────────────────────────────────────────────────────────────────────────────
const MealCell = ({ day, slot, block, onOpen }: { day: string; slot: string; block?: MealBlock; onOpen: () => void }) => {
    const cellId = `${day}::${slot}`;
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: cellId });
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: cellId, disabled: !block });

    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 40 } : undefined;

    return (
        <td
            ref={setDropRef}
            onClick={onOpen}
            className={`p-2 border border-foreground/10 bg-panel hover:bg-foreground/5 transition-colors cursor-pointer align-top ${isOver ? 'bg-primary/10 ring-2 ring-inset ring-primary/40' : ''}`}
        >
            <div
                ref={setDragRef}
                style={style}
                className={`min-h-[60px] flex items-center justify-center gap-1.5 p-2 rounded-lg text-center relative ${isDragging ? 'opacity-40' : ''}`}
            >
                {block ? (
                    <>
                        <button
                            {...attributes}
                            {...listeners}
                            onClick={e => e.stopPropagation()}
                            className="absolute top-0.5 left-0.5 p-1 rounded text-text-dim/30 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all cursor-grab active:cursor-grabbing touch-none"
                            aria-label="Arrastrar para mover o intercambiar"
                            title="Arrastrar para mover o intercambiar"
                        >
                            <GripVertical className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-black text-foreground">{block.title}</span>
                    </>
                ) : (
                    <Plus className="w-4 h-4 text-text-dim opacity-30" />
                )}
            </div>
        </td>
    );
};
