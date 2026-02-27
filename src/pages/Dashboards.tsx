import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { LayoutDashboard, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const Dashboards = () => {
    const { users, tasks, completions } = useAppContext();
    const [timeFilter, setTimeFilter] = useState<'month' | 'year' | 'total'>('month');

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filteredCompletions = completions.filter(c => {
        const d = new Date(c.timestamp);
        if (timeFilter === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        if (timeFilter === 'year') return d.getFullYear() === currentYear;
        return true;
    });

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-panel border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-teal-500/20 p-4 rounded-xl shrink-0">
                        <LayoutDashboard className="w-8 h-8 text-teal-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Dashboards</h1>
                        <p className="text-gray-400 mt-1">Análisis detallado por tarea y participación</p>
                    </div>
                </div>

                <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 relative z-10 shrink-0">
                    <button
                        onClick={() => setTimeFilter('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'month' ? 'bg-teal-500/20 text-teal-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setTimeFilter('year')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'year' ? 'bg-teal-500/20 text-teal-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Año
                    </button>
                    <button
                        onClick={() => setTimeFilter('total')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'total' ? 'bg-teal-500/20 text-teal-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Histórico
                    </button>
                </div>
            </header>

            {tasks.length === 0 ? (
                <div className="bg-panel border border-white/5 rounded-2xl p-12 text-center">
                    <TrendingUp className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Crea tareas primero para ver estadísticas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {tasks.map(task => {
                        const taskCompletions = filteredCompletions.filter(c => c.taskId === task.id);
                        const total = taskCompletions.length;

                        // Group by user
                        const data = users.map(user => {
                            const count = taskCompletions.filter(c => c.userId === user.id).length;
                            return {
                                name: user.name,
                                value: count,
                                color: user.color
                            };
                        }).filter(d => d.value > 0);

                        return (
                            <div key={task.id} className="bg-panel border border-white/5 rounded-2xl p-6 shadow-lg hover:border-teal-500/30 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <PieIcon className="w-24 h-24 text-teal-400" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors uppercase tracking-wide">{task.name}</h3>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3" />
                                                Total: {total} veces
                                            </div>
                                        </div>
                                    </div>

                                    {total > 0 ? (
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name, value }) => `${name}: ${value}`}
                                                    >
                                                        {data.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                                            <p className="text-gray-500 text-sm italic">Sin datos en este periodo</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
