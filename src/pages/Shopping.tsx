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

    // Active items: those that haven't been bought yet.
    const activeItems = shoppingItems.filter(item => !item.boughtBy);

    // Auto-suggest logic
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

    // Calculate metrics: Who goes shopping most? (Counting bought items per user)
    const boughtItems = shoppingItems.filter(item => item.boughtBy);
    const metricsMap: Record<string, number> = {};
    users.forEach(u => metricsMap[u.id] = 0);
    boughtItems.forEach(item => {
        if (item.boughtBy && metricsMap[item.boughtBy] !== undefined) {
            metricsMap[item.boughtBy]++;
        }
    });

    const metricsArr = users.map(u => ({ user: u, count: metricsMap[u.id] })).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...metricsArr.map(m => m.count), 1); // prevent division by zero

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600">
                    Lista de la Compra
                </h1>
                <p className="text-gray-400 mt-1">Anota lo que hace falta. Compra inteligentemente.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main List Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Add Input */}
                    <div className="relative">
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
                                    // Make timeout to allow click on suggestion
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="¿Qué necesitamos comprar? Ej. Tortilla..."
                                    className="w-full bg-panel border-2 border-white/5 focus:border-teal-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                                />
                                {suggestions.length > 0 && showSuggestions && (
                                    <div className="absolute z-10 w-full mt-2 bg-panel border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {suggestions.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => handleAddItem(s.name)}
                                                className="px-4 py-3 hover:bg-white/5 cursor-pointer text-white flex items-center gap-2 transition-colors border-b border-white/5 last:border-0"
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
                                className="bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-xl transition-colors shadow-lg shadow-teal-900/20 shrink-0"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Pending Items List */}
                    <div className="bg-panel border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-teal-400" />
                            <h3 className="font-semibold text-white">Por Comprar ({activeItems.length})</h3>
                        </div>

                        {activeItems.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {activeItems.map(item => {
                                    const u = users.find(x => x.id === item.addedBy);
                                    return (
                                        <div key={item.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleMarkAsBought(item)}
                                                    className="w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center group-hover:border-teal-400 transition-colors"
                                                >
                                                    <Check className="w-4 h-4 text-transparent group-hover:text-teal-400" />
                                                </button>
                                                <div>
                                                    <p className="font-medium text-white group-hover:text-teal-300 transition-colors">{item.name}</p>
                                                    {u && (
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            Añadido por <span className="font-semibold" style={{ color: u.color }}>{u.name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteShoppingItem(item.id)}
                                                className="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 pl-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <Check className="w-8 h-8 text-teal-500/50" />
                                </div>
                                <p className="text-gray-400 text-lg">¡Todo comprado!</p>
                                <p className="text-gray-500 mt-1">La lista está vacía.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dashboard / Metrics Column */}
                <div className="space-y-6">
                    <div className="bg-panel border border-white/5 rounded-2xl overflow-hidden p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                            <h3 className="font-semibold text-white">¿Quién va más a la compra?</h3>
                        </div>

                        {boughtItems.length > 0 ? (
                            <div className="space-y-5">
                                {metricsArr.map((stat) => (
                                    <div key={stat.user.id}>
                                        <div className="flex justify-between items-center mb-1 text-sm">
                                            <span className="font-medium text-white">{stat.user.name}</span>
                                            <span className="text-gray-400 font-bold">{stat.count} <span className="text-xs font-normal">items</span></span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
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
                            <div className="text-center py-6">
                                <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Aún no hay compras registradas para mostrar métricas.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
