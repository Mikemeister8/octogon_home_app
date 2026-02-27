import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Utensils, Plus, ChefHat, ShoppingBasket, Loader2 } from 'lucide-react';

export const Meals = () => {
    const { loading } = useAppContext();
    const [activeTab, setActiveTab] = useState<'plan' | 'favorites'>('plan');

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-700 pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-primary/20 p-5 rounded-[2.5rem] shrink-0 group-hover:rotate-12 transition-transform duration-500 shadow-lg border border-primary/20">
                        <Utensils className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">Plan de Comidas</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-[0.4em] opacity-40">Organización y Nutrición</p>
                    </div>
                </div>

                <div className="flex bg-foreground/5 p-1.5 rounded-2xl border border-foreground/10 relative z-10">
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'plan' ? 'bg-primary text-white shadow-xl' : 'text-text-dim hover:bg-foreground/5 hover:text-foreground'}`}
                    >
                        Semanario
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'favorites' ? 'bg-primary text-white shadow-xl' : 'text-text-dim hover:bg-foreground/5 hover:text-foreground'}`}
                    >
                        Recetas Favoritas
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                    <div key={day} className="bg-panel border border-foreground/10 rounded-[2rem] p-6 space-y-4 shadow-lg hover:border-primary/20 transition-all">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{day}</h3>
                        <div className="space-y-3">
                            {['Comida', 'Cena'].map(slot => (
                                <div key={slot} className="p-4 bg-foreground/5 rounded-2xl border border-foreground/5 group hover:border-foreground/10 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black uppercase text-text-dim tracking-widest">{slot}</span>
                                        <Plus className="w-3 h-3 text-text-dim opacity-0 group-hover:opacity-100" />
                                    </div>
                                    <p className="text-xs font-bold text-foreground opacity-30 italic">Sin asignar</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-panel border border-foreground/10 rounded-[3rem] p-10 shadow-2xl space-y-8">
                <div className="flex items-center justify-between border-b border-foreground/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/10 rounded-2xl">
                            <ShoppingBasket className="w-6 h-6 text-accent" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight uppercase italic">Lista de Preparación</h2>
                    </div>
                    <button className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 transition-all active:scale-95">
                        Enviar a la compra
                    </button>
                </div>

                <div className="py-20 text-center bg-foreground/5 rounded-[2.5rem] border border-dashed border-foreground/10">
                    <ChefHat className="w-16 h-16 text-text-dim/10 mx-auto mb-4" />
                    <p className="text-text-dim font-black uppercase tracking-widest text-sm">Gestiona tus ingredientes aquí</p>
                    <p className="text-[10px] text-text-dim/40 uppercase mt-2">Agrega platos al semanario para generar la lista</p>
                </div>
            </div>
        </div>
    );
};
