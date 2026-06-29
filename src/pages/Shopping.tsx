import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ShoppingCart, Plus, Trash2, ShoppingBag, Loader2, Calendar } from 'lucide-react';
import type { ShoppingConcept, ShoppingItem } from '../types';

export const Shopping = () => {
    const {
        shoppingItems, addShoppingItem, updateShoppingItem, deleteShoppingItem,
        shoppingConcepts, addShoppingConcept, currentUser, homeSettings
    } = useAppContext();
    const [newItem, setNewItem] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [suggestions, setSuggestions] = useState<ShoppingConcept[]>([]);

    if (!homeSettings) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const handleInputChange = (e: string) => {
        setNewItem(e);
        if (e.trim().length > 1) {
            const filtered = shoppingConcepts.filter(c =>
                c.name.toLowerCase().includes(e.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleAdd = async (name: string) => {
        if (!name.trim() || !currentUser) return;

        // Check if exists in DB, if not add it
        const exists = shoppingConcepts.some(c => c.name.toLowerCase() === name.toLowerCase());
        if (!exists) {
            await addShoppingConcept(name.trim());
        }

        const finalName = quantity > 1 ? `${quantity}x ${name.trim()}` : name.trim();
        await addShoppingItem(finalName, currentUser.id);
        setNewItem('');
        setQuantity(1);
        setSuggestions([]);
    };

    const toggleBought = async (item: ShoppingItem) => {
        await updateShoppingItem({ ...item, is_purchased: !item.is_purchased });
    };

    const activeItems = shoppingItems.filter(i => !i.is_purchased);

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-accent/20 p-5 rounded-[2rem] shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                        <ShoppingCart className="w-10 h-10 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Lista de Compra</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Lo que falta en casa</p>
                    </div>
                </div>
            </header>

            <div className="relative group">
                <form onSubmit={(e) => { e.preventDefault(); handleAdd(newItem); }} className="relative flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="w-20 bg-panel border border-foreground/10 rounded-2xl py-3 sm:py-4 px-3 text-base sm:text-lg font-bold text-foreground focus:outline-none focus:border-primary shadow-sm"
                        />
                        <button type="submit" disabled={!newItem.trim()} className="sm:hidden px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-30 flex items-center justify-center grow">
                            Añadir
                        </button>
                    </div>
                    <div className="flex gap-2 flex-1 w-full">
                        <input
                            type="text"
                            value={newItem}
                            onChange={e => handleInputChange(e.target.value)}
                            placeholder="Escribe un producto..."
                            className="flex-1 bg-panel border border-foreground/10 rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg font-bold text-foreground focus:outline-none focus:border-primary shadow-sm placeholder:opacity-30 w-full min-w-0"
                        />
                        <button type="submit" disabled={!newItem.trim()} className="hidden sm:flex px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-30 items-center justify-center shrink-0">
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                </form>

                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-panel border border-foreground/10 rounded-2xl shadow-2xl z-20 overflow-hidden divide-y divide-foreground/5">
                        {suggestions.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    setNewItem(s.name);
                                    setSuggestions([]);
                                }}
                                className="w-full text-left p-4 hover:bg-primary/10 hover:text-primary transition-all font-bold flex items-center justify-between group"
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> En la lista
                    </h3>
                    <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full">{activeItems.length}</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {activeItems.length > 0 ? activeItems.map(item => (
                        <div key={item.id} className="bg-panel border border-foreground/10 p-4 rounded-2xl flex items-center gap-4 hover:border-primary/30 group shadow-sm transition-all animate-in fade-in zoom-in slide-in-from-top-2">
                            <button
                                onClick={() => toggleBought(item)}
                                className="w-8 h-8 rounded-xl border-2 border-primary/20 hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors"
                            >
                                <div className="w-3 h-3 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
                            </button>
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                                <span className="text-foreground font-black text-lg tracking-tight truncate block w-full">{item.name}</span>
                            </div>
                            <button onClick={() => deleteShoppingItem(item.id)} className="p-3 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-xl opacity-40 hover:opacity-100 transition-all shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center bg-panel/30 border-2 border-dashed border-foreground/5 rounded-[3rem]">
                            <p className="text-text-dim font-black uppercase tracking-[0.4em] italic opacity-30">Todo comprado</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-text-dim opacity-30">
                <Calendar className="w-4 h-4" /> Octogon Shopping System v2.0
            </div>
        </div>
    );
};
