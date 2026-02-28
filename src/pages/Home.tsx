import { useAppContext } from '../store/AppContext';
import { calculateRankings } from '../utils/ranking';
import { Award, Trophy, CheckCircle2, Flame, ArrowRight, CalendarDays, Sparkles, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getIcon } from '../utils/icons';

const PodioMini = ({ top1, top2 }: { top1?: { user: { color_hex: string, full_name: string }, points: number }, top2?: { user: { color_hex: string, full_name: string }, points: number } }) => (
    <div className="flex items-end justify-center gap-4 h-32 sm:h-40 my-6">
        {top2 && (
            <div className="flex flex-col items-center justify-end h-full opacity-90">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-lg" style={{ backgroundColor: top2.user.color_hex, color: '#fff' }}>
                    {top2.user.full_name[0]}
                </div>
                <div className="bg-panel p-2 rounded-t-lg w-14 sm:w-16 text-center border-t border-foreground/10 h-14 sm:h-16 flex flex-col justify-start pt-2">
                    <span className="text-text-dim text-[10px] font-bold">{top2.points}</span>
                </div>
            </div>
        )}
        {top1 && (
            <div className="flex flex-col items-center justify-end h-full z-10">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 animate-pulse mb-1" />
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl mb-2 shadow-lg border-2 border-yellow-500" style={{ backgroundColor: top1.user.color_hex, color: '#fff' }}>
                    {top1.user.full_name[0]}
                </div>
                <div className="bg-yellow-500/20 p-2 rounded-t-lg w-16 sm:w-20 text-center border-t border-yellow-500/50 h-16 sm:h-20 flex flex-col justify-start pt-2 backdrop-blur-sm">
                    <span className="text-yellow-500 font-extrabold text-sm sm:text-base">{top1.points}</span>
                </div>
            </div>
        )}
    </div>
);

export const Home = () => {
    const { users, tasks, completions, currentUser, reminders, homeSettings, loading, tokenName } = useAppContext();

    if (loading || !homeSettings || !currentUser) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    const today = new Date();
    const currentRankings = calculateRankings(users, tasks, completions, today.getMonth(), today.getFullYear());
    const top1 = currentRankings[0];
    const top2 = currentRankings[1];
    const isFirst = currentUser && top1 && top1.user.id === currentUser.id;

    const HomeIconComponent = getIcon(homeSettings.logo || 'Home');

    // Activity feed: recent completions sorted by date (newest first)
    const recentCompletions = [...completions]
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .slice(0, 8);

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header: Solo el nombre del hogar, sin duplicar "Octogon" */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-foreground/5 rounded-3xl border border-foreground/10">
                <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-panel rounded-2xl shadow-lg border border-foreground/10 group-hover:rotate-12 transition-transform duration-500 shrink-0">
                        <HomeIconComponent className="w-7 h-7" style={{ color: homeSettings.themeColor }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none truncate max-w-[200px]" style={{ color: homeSettings.themeColor }}>{homeSettings.name}</h1>
                        <span className="text-[10px] font-bold text-text-dim flex items-center gap-1 mt-1 uppercase tracking-widest opacity-50">
                            <Users className="w-3 h-3" />
                            {users.length} Miembros
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[8px] font-black text-text-dim uppercase tracking-[0.3em] opacity-30">OCTOGON HOME APP</span>
                </div>
            </div>

            {/* Ranking Card */}
            <div className="bg-panel border border-foreground/10 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                    <div className="flex-1 text-center lg:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold uppercase tracking-wide">
                            <Flame className="w-4 h-4" />
                            Ranking Mensual
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-foreground leading-tight uppercase italic tracking-tighter">
                            {top1 ? (
                                isFirst ? (
                                    <>¡Estás en cabeza,<br />campeón! 🏆</>
                                ) : (
                                    <>¡<span className="text-primary">{top1.user.full_name}</span> va en<br />cabeza! 🚀</>
                                )
                            ) : (
                                <>¡Aún no hay puntos,<br />sé el primero! 🌟</>
                            )}
                        </h2>
                        <Link to="/competition" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground/5 hover:bg-primary hover:text-white rounded-2xl font-black transition-all hover:translate-x-1 border border-foreground/10 text-xs uppercase tracking-widest">
                            Ver competición
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="shrink-0">
                        {top1 ? <PodioMini top1={top1} top2={top2} /> : (
                            <div className="h-32 flex items-center justify-center">
                                <Trophy className="w-20 h-20 text-foreground/5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Activity Feed */}
                <div className="bg-panel border border-foreground/10 rounded-[2.5rem] p-8 shadow-xl">
                    <h3 className="text-xl font-black text-foreground tracking-tight uppercase italic mb-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Actividad Reciente
                    </h3>
                    <div className="space-y-3">
                        {recentCompletions.length > 0 ? recentCompletions.map(c => {
                            const user = users.find(u => u.id === c.user_id);
                            const task = tasks.find(t => t.id === c.task_id);
                            if (!user || !task) return null;
                            const date = new Date(c.completed_at);
                            const isToday = date.toDateString() === today.toDateString();
                            return (
                                <div key={c.id} className="flex items-center gap-3 p-3 bg-foreground/5 rounded-2xl border border-foreground/5 group hover:bg-foreground/10 transition-all">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow" style={{ backgroundColor: user.color_hex }}>
                                        {user.full_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-foreground truncate">
                                            <span style={{ color: user.color_hex }}>{user.full_name}</span> completó <span className="italic">{task.title}</span>
                                        </p>
                                        <p className="text-[10px] text-text-dim font-bold opacity-60">
                                            {isToday ? 'Hoy' : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • +{c.points_earned} {tokenName}
                                        </p>
                                    </div>
                                    <Sparkles className="w-3 h-3 text-primary shrink-0 opacity-40" />
                                </div>
                            );
                        }) : (
                            <p className="text-center py-10 text-text-dim text-[10px] font-bold uppercase tracking-widest opacity-40 italic">No hay actividad reciente</p>
                        )}
                    </div>
                </div>

                {/* Agenda Rápida */}
                <div className="bg-panel border border-foreground/10 rounded-[2.5rem] p-8 shadow-xl">
                    <h3 className="text-xl font-black text-foreground tracking-tight uppercase italic mb-6 flex items-center gap-3">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        Agenda Próxima
                    </h3>
                    <div className="space-y-4">
                        {reminders.slice(0, 3).map(r => (
                            <div key={r.id} className="flex items-center gap-4 p-4 bg-foreground/5 rounded-2xl border border-foreground/5 group hover:bg-foreground/10 transition-all">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex flex-col items-center justify-center shrink-0 border border-primary/10">
                                    <span className="text-[10px] font-black text-primary leading-none">{new Date(r.due_date).getDate()}</span>
                                    <span className="text-[8px] font-bold text-primary/60 uppercase">{new Date(r.due_date).toLocaleString('es-ES', { month: 'short' })}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-foreground truncate uppercase italic">{r.title}</p>
                                    <p className="text-[10px] text-text-dim font-bold uppercase opacity-60">
                                        {new Date(r.due_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {reminders.length === 0 && (
                            <p className="text-center py-10 text-text-dim text-[10px] font-bold uppercase tracking-widest opacity-40 italic">No hay eventos próximos</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
