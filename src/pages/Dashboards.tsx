import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { LayoutDashboard, PieChart, History, TrendingUp, Loader2 } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type FilterType = 'month' | 'year' | 'total';

export const Dashboards = () => {
    const { tasks, completions, users, homeSettings, loading } = useAppContext();
    const [filter, setFilter] = useState<FilterType>('month');

    if (loading || !homeSettings) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const now = new Date();
    const getFilteredCompletions = () => {
        return completions.filter(c => {
            const date = new Date(c.completed_at);
            if (filter === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            if (filter === 'year') return date.getFullYear() === now.getFullYear();
            return true;
        });
    };

    const filteredCompletions = getFilteredCompletions();

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-700 pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-primary/20 p-5 rounded-[2.5rem] shrink-0 group-hover:rotate-12 transition-transform duration-500 shadow-lg border border-primary/20">
                        <LayoutDashboard className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">Dashboards</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-[0.4em] opacity-40">Métricas de Rendimiento Familiar</p>
                    </div>
                </div>

                <div className="flex flex-wrap bg-foreground/5 p-1.5 rounded-2xl border border-foreground/10 relative z-10 w-full sm:w-auto overflow-hidden">
                    {(['month', 'year', 'total'] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${filter === f ? 'bg-primary text-white shadow-xl' : 'text-text-dim hover:bg-foreground/5 hover:text-foreground'}`}
                        >
                            {f === 'month' ? 'Mes' : f === 'year' ? 'Año' : 'Histórico'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tasks.map(task => {
                    const taskCompletions = filteredCompletions.filter(c => c.task_id === task.id);
                    const data = users.map(u => ({
                        name: u.full_name,
                        value: taskCompletions.filter(c => c.user_id === u.id).length,
                        color: u.color_hex
                    })).filter(d => d.value > 0);

                    return (
                        <div key={task.id} className="bg-panel border border-foreground/10 rounded-[2.5rem] p-8 shadow-xl hover:translate-y-[-4px] transition-all flex flex-col items-center">
                            <h3 className="text-xl font-black text-foreground mb-1 tracking-tight uppercase italic">{task.title}</h3>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                {taskCompletions.length} Veces totales
                            </p>

                            {data.length > 0 ? (
                                <>
                                    <div className="w-full h-64 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePie>
                                                <Pie
                                                    data={data}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1F1E1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                                                    itemStyle={{ color: '#00FF88', fontWeight: 'bold' }}
                                                />
                                            </RePie>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-foreground leading-none">{taskCompletions.length}</p>
                                                <p className="text-[8px] font-black text-text-dim uppercase tracking-widest">Registros</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full space-y-3 mt-4">
                                        {data.map(d => (
                                            <div key={d.name} className="flex items-center justify-between bg-foreground/5 p-3 rounded-xl border border-foreground/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                                    <span className="text-xs font-black uppercase text-text-dim">{d.name}</span>
                                                </div>
                                                <span className="text-sm font-black text-foreground">{d.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-30">
                                    <div className="p-6 border-2 border-dashed border-foreground/20 rounded-full">
                                        <PieChart className="w-12 h-12" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Sin datos en este periodo</p>
                                </div>
                            )}
                        </div>
                    );
                })}
                {tasks.length === 0 && (
                    <div className="col-span-full py-32 text-center bg-panel border-2 border-dashed border-foreground/10 rounded-[4rem]">
                        <TrendingUp className="w-20 h-20 text-text-dim/10 mx-auto mb-6" />
                        <p className="text-text-dim font-black uppercase tracking-[0.4em] italic">No hay métricas disponibles</p>
                        <p className="text-[10px] text-text-dim/60 uppercase mt-4">Crea y completa tareas para ver estadísticas</p>
                    </div>
                )}
            </div>

            <div className="pt-12 flex items-center justify-center gap-6 opacity-30 text-[10px] font-black uppercase tracking-[0.5em] text-text-dim">
                <History className="w-4 h-4" /> Real-time Analytics Hub v1.0
            </div>
        </div>
    );
};
