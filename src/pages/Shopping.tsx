import { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { ShoppingCart, Plus, Check, Trash2, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import type { ShoppingItem } from '../types';

export const Shopping = () => {
    const {
        shoppingConcepts, addShoppingConcept,
        shoppingItems, addShoppingItem, updateShoppingItem, deleteShoppingItem,
        currentUser, users
    } = useAppContext();

    const [inputText, setInputText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const activeItems = shoppingItems.filter(item => !item.boughtBy);

    const suggestions = useMemo(() => {
        if (!inputText.trim()) return [];
        const lowerInput = inputText.toLowerCase();
        return shoppingConcepts.filter(c => c.name.toLowerCase().includes(lowerInput));
    }, [inputText, shoppingConcepts]);

    const handleAddItem = (conceptName: string) => {
        if (!conceptName.trim() || !currentUser) return;

        let concept = shoppingConcepts.find(c => c.name.toLowerCase() === conceptName.toLowerCase());

        if (!concept) {
            concept = {
                id: crypto.randomUUID(),
                name: conceptName.trim()
            };
            addShoppingConcept(concept);
        }

        const newItem: ShoppingItem = {
            id: crypto.randomUUID(),
            conceptId: concept.id,
            name: concept.name,
            addedBy: currentUser.id,
            addedAt: new Date().toISOString()
        };

        addShoppingItem(newItem);
        setInputText('');
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem(inputText);
        }
    };

    const handleMarkAsBought = (item: ShoppingItem) => {
        if (!currentUser) return;
        updateShoppingItem({
            ...item,
            boughtBy: currentUser.id,
            boughtAt: new Date().toISOString()
        });
    };

    const boughtItems = shoppingItems.filter(item => item.boughtBy);
    const metricsMap: Record<string, number> = {};
    users.forEach(u => metricsMap[u.id] = 0);
    boughtItems.forEach(item => {
        if (item.boughtBy && metricsMap[item.boughtBy] !== undefined) {
            metricsMap[item.boughtBy]++;
        }
    });

    const metricsArr = users.map(u => ({ user: u, count: metricsMap[u.id] })).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...metricsArr.map(m => m.count), 1);

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600">
                    Lista de la Compra
                </h1>
                <p className="text-text-dim mt-1">Anota lo que hace falta. Compra inteligentemente.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative group">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => {
                                        setInputText(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="¿Qué necesitamos comprar? Ej. Tortilla..."
                                    className="w-full bg-foreground/5 border-2 border-foreground/10 focus:border-teal-500 rounded-xl px-4 py-3 text-foreground outline-none transition-all placeholder:text-text-dim/50"
                                />
                                {suggestions.length > 0 && showSuggestions && (
                                    <div className="absolute z-10 w-full mt-2 bg-panel border border-foreground/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                        {suggestions.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => handleAddItem(s.name)}
                                                className="px-4 py-3 hover:bg-foreground/5 cursor-pointer text-foreground flex items-center gap-2 transition-colors border-b border-foreground/10 last:border-0 font-medium"
                                            >
                                                <TrendingUp className="w-4 h-4 text-teal-500" />
                                                {s.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleAddItem(inputText)}
                                className="bg-teal-600 hover:bg-teal-500 text-white p-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 shrink-0"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-panel border border-foreground/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="px-6 py-4 border-b border-foreground/10 bg-foreground/5 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-teal-400" />
                            <h3 className="font-bold text-foreground">Por Comprar ({activeItems.length})</h3>
                        </div>

                        {activeItems.length > 0 ? (
                            <div className="divide-y divide-foreground/10">
                                {activeItems.map(item => {
                                    const u = users.find(x => x.id === item.addedBy);
                                    return (
                                        <div key={item.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-foreground/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleMarkAsBought(item)}
                                                    className="w-6 h-6 rounded-full border-2 border-foreground/20 flex items-center justify-center group-hover:border-teal-500 transition-colors shadow-sm"
                                                >
                                                    <Check className="w-4 h-4 text-transparent group-hover:text-teal-500" />
                                                </button>
                                                <div>
                                                    <p className="font-bold text-foreground group-hover:text-teal-500 transition-colors">{item.name}</p>
                                                    {u && (
                                                        <p className="text-[10px] text-text-dim flex items-center gap-1 mt-1 font-medium opacity-70">
                                                            Añadido por <span style={{ color: u.color }}>{u.name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteShoppingItem(item.id)}
                                                className="text-text-dim hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-16 text-center flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mb-4 transition-transform hover:scale-110">
                                    <Check className="w-10 h-10 text-teal-500/40" />
                                </div>
                                <p className="text-foreground text-xl font-bold">¡Todo al día!</p>
                                <p className="text-text-dim mt-1 italic">No hay items pendientes en la lista.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-panel border border-foreground/10 rounded-2xl overflow-hidden p-6 shadow-xl">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-foreground">Actividad de Compra</h3>
                        </div>

                        {boughtItems.length > 0 ? (
                            <div className="space-y-5">
                                {metricsArr.map((stat) => (
                                    <div key={stat.user.id} className="space-y-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-foreground">{stat.user.name}</span>
                                            <span className="text-text-dim font-extrabold">{stat.count} <span className="text-[10px] font-normal uppercase tracking-wider">items</span></span>
                                        </div>
                                        <div className="h-2.5 bg-foreground/5 rounded-full overflow-hidden border border-foreground/5">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                                                style={{
                                                    width: `${(stat.count / maxCount) * 100}%`,
                                                    backgroundColor: stat.user.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-foreground/5 rounded-2xl border border-dashed border-foreground/10">
                                <AlertCircle className="w-10 h-10 text-text-dim/30 mx-auto mb-2" />
                                <p className="text-text-dim text-xs italic">Sin datos suficientes para mostrar métricas todavía.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
