import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ShoppingCart, Plus, CheckCircle2, Trash2, Calendar, ShoppingBag, Loader2 } from 'lucide-react';

export const Shopping = () => {
    const { shoppingItems, addShoppingItem, updateShoppingItem, deleteShoppingItem, currentUser, loading } = useAppContext();
    const [newItem, setNewItem] = useState('');

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim() || !currentUser) return;
        await addShoppingItem(newItem.trim(), currentUser.id);
        setNewItem('');
    };

    const toggleBought = async (item: any) => {
        await updateShoppingItem({ ...item, is_purchased: !item.is_purchased });
    };

    const activeItems = shoppingItems.filter(i => !i.is_purchased);
    const completedItems = shoppingItems.filter(i => i.is_purchased);

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

            <form onSubmit={handleAdd} className="relative group">
                <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    placeholder="¿Qué falta en la nevera?"
                    className="w-full bg-panel border border-foreground/10 rounded-2xl py-5 px-6 pr-20 text-lg font-bold text-foreground focus:outline-none focus:border-accent transition-all shadow-xl placeholder:font-medium placeholder:opacity-50"
                />
                <button type="submit" disabled={!newItem.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-accent hover:bg-accent/90 text-white rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50 active:scale-95">
                    <Plus className="w-6 h-6" />
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Active Items */}
                <div className="bg-panel border border-foreground/10 rounded-[2rem] overflow-hidden shadow-xl">
                    <div className="px-8 py-5 border-b border-foreground/10 flex items-center justify-between bg-foreground/5">
                        <h3 className="text-xs font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" /> Pendientes
                        </h3>
                        <span className="bg-accent/20 text-accent text-[10px] font-black px-3 py-1 rounded-full">{activeItems.length}</span>
                    </div>
                    <div className="divide-y divide-foreground/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {activeItems.length > 0 ? activeItems.map(item => (
                            <div key={item.id} className="p-4 sm:px-6 flex items-center gap-4 hover:bg-foreground/5 group transition-colors">
                                <button
                                    onClick={() => toggleBought(item)}
                                    className="w-7 h-7 rounded-xl border-2 border-accent/30 hover:bg-accent/10 flex items-center justify-center transition-all shrink-0"
                                >
                                    <div className="w-3 h-3 bg-accent rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
                                </button>
                                <span className="flex-1 text-foreground font-black tracking-tight">{item.name}</span>
                                <button onClick={() => deleteShoppingItem(item.id)} className="p-2 text-text-dim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )) : (
                            <div className="p-12 text-center text-text-dim italic font-medium">Lista de compra vacia</div>
                        )}
                    </div>
                </div>

                {/* Recently Bought */}
                <div className="bg-panel/50 border border-foreground/10 rounded-[2rem] overflow-hidden shadow-xl">
                    <div className="px-8 py-5 border-b border-foreground/10 flex items-center justify-between bg-foreground/5 opacity-60">
                        <h3 className="text-xs font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> En el carro
                        </h3>
                    </div>
                    <div className="divide-y divide-foreground/2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {completedItems.length > 0 ? completedItems.map(item => (
                            <div key={item.id} className="p-4 sm:px-6 flex items-center gap-4 hover:bg-foreground/2 transition-colors group opacity-60">
                                <button
                                    onClick={() => toggleBought(item)}
                                    className="w-7 h-7 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 border border-accent/20"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-accent" />
                                </button>
                                <span className="flex-1 text-foreground font-medium line-through decoration-2 decoration-accent/30">{item.name}</span>
                                <button onClick={() => deleteShoppingItem(item.id)} className="p-2 text-text-dim hover:text-red-500 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-text-dim text-xs">Aun no has marcado ningun producto</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-text-dim opacity-30">
                <Calendar className="w-4 h-4" /> Octogon Shopping System v2.0
            </div>
        </div>
    );
};
