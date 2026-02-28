import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ShoppingCart, Plus, Trash2, ShoppingBag, Loader2, Calendar } from 'lucide-react';

export const Shopping = () => {
    const {
        shoppingItems, addShoppingItem, updateShoppingItem, deleteShoppingItem,
        shoppingConcepts, addShoppingConcept, currentUser, loading
    } = useAppContext();
    const [newItem, setNewItem] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

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

        await addShoppingItem(name.trim(), currentUser.id);
        setNewItem('');
        setSuggestions([]);
    };

    const toggleBought = async (item: any) => {
        await updateShoppingItem({ ...item, is_purchased: !item.is_purchased });
    };

    const activeItems = shoppingItems.filter(i => !i.is_purchased);

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto animate-in fade-in duration-700">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-accent/20 p-5 rounded-[2rem] shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                        <ShoppingCart className="w-10 h-10 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Lista de Compra</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-widest">Lo que falta en casa</p>
                    </div>
                </div>
            </header>

            <div className="relative group">
                <form onSubmit={(e) => { e.preventDefault(); handleAdd(newItem); }} className="relative">
                    <input
                        type="text"
                        value={newItem}
                        onChange={e => handleInputChange(e.target.value)}
                        placeholder="Escribe un producto..."
                        className="w-full bg-panel border border-foreground/10 rounded-2xl py-5 px-6 pr-20 text-lg font-bold text-foreground focus:outline-none focus:border-primary transition-all shadow-xl placeholder:opacity-30"
                    />
                    <button type="submit" disabled={!newItem.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-30">
                        <Plus className="w-6 h-6" />
                    </button>
                </form>

                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-panel border border-foreground/10 rounded-2xl shadow-2xl z-20 overflow-hidden divide-y divide-foreground/5 animate-in fade-in slide-in-from-top-2">
                        {suggestions.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleAdd(s.name)}
                                className="w-full text-left p-4 hover:bg-primary/10 hover:text-primary transition-all font-bold flex items-center justify-between group"
                            >
                                {s.name}
                                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100" />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeItems.length > 0 ? activeItems.map(item => (
                        <div key={item.id} className="bg-panel border border-foreground/10 p-5 rounded-2xl flex items-center gap-4 hover:border-primary/30 group transition-all shadow-md">
                            <button
                                onClick={() => toggleBought(item)}
                                className="w-8 h-8 rounded-xl border-2 border-primary/20 hover:bg-primary/10 flex items-center justify-center transition-all shrink-0"
                            >
                                <div className="w-3 h-3 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
                            </button>
                            <span className="flex-1 text-foreground font-black tracking-tight">{item.name}</span>
                            <button onClick={() => deleteShoppingItem(item.id)} className="p-2 text-text-dim hover:text-red-500 opacity-40 hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
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
