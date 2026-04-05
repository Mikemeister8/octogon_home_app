import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { calculateRankings } from '../utils/ranking';
import { Trophy, Award, Flame, Medal, Star, Loader2, Calendar, History, Crown } from 'lucide-react';

type RankingView = 'current' | 'previous' | 'champions' | 'alltime';

export const Competition = () => {
    const { users, tasks, completions, tokenName, loading } = useAppContext();
    const [view, setView] = useState<RankingView>('current');

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Current month
    const currentRankings = calculateRankings(users, tasks, completions, currentMonth, currentYear);

    // Get all months that have completions
    const monthsWithData: { month: number, year: number, label: string }[] = [];
    const seen = new Set<string>();
    completions.forEach(c => {
        const d = new Date(c.completed_at);
        const key = `${d.getMonth()}-${d.getFullYear()}`;
        if (!seen.has(key) && !(d.getMonth() === currentMonth && d.getFullYear() === currentYear)) {
            seen.add(key);
            monthsWithData.push({
                month: d.getMonth(),
                year: d.getFullYear(),
                label: new Date(d.getFullYear(), d.getMonth()).toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            });
        }
    });
    monthsWithData.sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));

    // Champions: winner of each past month
    const champions = monthsWithData.map(m => {
        const r = calculateRankings(users, tasks, completions, m.month, m.year);
        return { ...m, winner: r[0] };
    }).filter(c => c.winner);

    // All-time totals
    const allTimePoints = users.map(u => ({
        user: u,
        points: completions.filter(c => c.user_id === u.id).reduce((sum, c) => sum + c.points_earned, 0)
    })).sort((a, b) => b.points - a.points);

    const [selectedPrevMonth, setSelectedPrevMonth] = useState(0);

    const tabs = [
        { key: 'current' as RankingView, label: 'Este Mes', icon: Flame },
        { key: 'previous' as RankingView, label: 'Anteriores', icon: Calendar },
        { key: 'champions' as RankingView, label: 'Campeones', icon: Crown },
        { key: 'alltime' as RankingView, label: 'Histórico', icon: History },
    ];

    const RankingList = ({ rankings }: { rankings: ReturnType<typeof calculateRankings> }) => (
        <div className="space-y-4">
            {rankings.map((item, idx) => (
                <div key={item.user.id} className={`bg-panel border border-foreground/10 rounded-[2rem] p-5 flex items-center gap-5 hover:translate-x-2 transition-all group shadow-xl ${idx === 0 ? 'border-yellow-500/30' : ''}`}>
                    <div className={`w-10 text-2xl font-black flex items-center justify-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-text-dim'}`}>
                        {idx === 0 ? <Medal className="w-7 h-7" /> : idx === 1 ? <Medal className="w-6 h-6" /> : `#${idx + 1}`}
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: item.user.color_hex }}>
                        {item.user.full_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-foreground tracking-tight uppercase truncate">{item.user.full_name}</h3>
                        <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden mt-1">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${rankings[0] ? (item.points / rankings[0].points) * 100 : 0}%`, backgroundColor: item.user.color_hex }} />
                        </div>
                    </div>
                    <div className="text-right pl-4 border-l border-foreground/10">
                        <p className="text-xl font-black text-foreground font-mono tracking-tighter">{item.points}</p>
                        <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">{tokenName}</p>
                    </div>
                </div>
            ))}
            {rankings.length === 0 && (
                <div className="p-20 text-center bg-foreground/5 rounded-[3rem] border border-dashed border-foreground/10">
                    <Trophy className="w-16 h-16 text-text-dim/10 mx-auto mb-4" />
                    <p className="text-text-dim font-black uppercase tracking-widest">Sin datos</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-700 pb-20">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                    <Trophy className="w-4 h-4" /> Ranking
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tighter uppercase italic">Competición</h1>
            </header>

            {/* Tabs */}
            <div className="flex flex-wrap bg-foreground/5 p-1.5 rounded-2xl border border-foreground/10 gap-1">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setView(tab.key)}
                        className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all ${view === tab.key ? 'bg-primary text-white shadow-xl' : 'text-text-dim hover:bg-foreground/5'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Current Month */}
            {view === 'current' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">
                        <Flame className="w-6 h-6 text-primary inline mr-2" />
                        {today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <RankingList rankings={currentRankings} />
                </div>
            )}

            {/* Previous Months */}
            {view === 'previous' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {monthsWithData.length > 0 ? (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {monthsWithData.map((m, idx) => (
                                    <button
                                        key={`${m.month}-${m.year}`}
                                        onClick={() => setSelectedPrevMonth(idx)}
                                        className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${selectedPrevMonth === idx ? 'bg-primary text-white border-primary shadow-lg' : 'bg-foreground/5 text-text-dim border-foreground/10'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                            <RankingList rankings={calculateRankings(users, tasks, completions, monthsWithData[selectedPrevMonth].month, monthsWithData[selectedPrevMonth].year)} />
                        </>
                    ) : (
                        <div className="p-20 text-center bg-foreground/5 rounded-[3rem] border border-dashed border-foreground/10">
                            <Calendar className="w-16 h-16 text-text-dim/10 mx-auto mb-4" />
                            <p className="text-text-dim font-black uppercase tracking-widest">Sin meses anteriores</p>
                        </div>
                    )}
                </div>
            )}

            {/* Champions */}
            {view === 'champions' && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">
                        <Crown className="w-6 h-6 text-yellow-500 inline mr-2" />
                        Campeones Mensuales
                    </h2>
                    {champions.length > 0 ? champions.map(c => (
                        <div key={`${c.month}-${c.year}`} className="bg-panel border border-yellow-500/10 rounded-[2rem] p-6 flex items-center gap-5 shadow-xl group hover:border-yellow-500/30 transition-all">
                            <div className="shrink-0 relative">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg" style={{ backgroundColor: c.winner!.user.color_hex }}>
                                    {c.winner!.user.full_name[0]}
                                </div>
                                <Award className="w-5 h-5 text-yellow-500 absolute -top-2 -right-2" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{c.winner!.user.full_name}</h3>
                                <p className="text-xs text-text-dim font-bold uppercase tracking-widest capitalize">{c.label}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-yellow-500 font-mono">{c.winner!.points}</p>
                                <p className="text-[9px] font-bold text-text-dim uppercase">{tokenName}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center bg-foreground/5 rounded-[3rem] border border-dashed border-foreground/10">
                            <Crown className="w-16 h-16 text-text-dim/10 mx-auto mb-4" />
                            <p className="text-text-dim font-black uppercase tracking-widest">Aún no hay campeones</p>
                            <p className="text-[10px] text-text-dim/60 uppercase mt-2">Los campeones se registran al acabar cada mes</p>
                        </div>
                    )}
                </div>
            )}

            {/* All-Time */}
            {view === 'alltime' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">
                        <Star className="w-6 h-6 text-primary inline mr-2" />
                        Puntuación Histórica Total
                    </h2>
                    <div className="space-y-4">
                        {allTimePoints.map((item, idx) => (
                            <div key={item.user.id} className="bg-panel border border-foreground/10 rounded-[2rem] p-6 flex items-center gap-5 shadow-xl group hover:translate-x-2 transition-all">
                                <div className={`w-10 text-2xl font-black flex items-center justify-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-text-dim'}`}>
                                    #{idx + 1}
                                </div>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg" style={{ backgroundColor: item.user.color_hex }}>
                                    {item.user.full_name[0]}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{item.user.full_name}</h3>
                                </div>
                                <div className="text-right pl-4 border-l border-foreground/10">
                                    <p className="text-2xl font-black text-foreground font-mono tracking-tighter">{item.points}</p>
                                    <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">{tokenName} totales</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
