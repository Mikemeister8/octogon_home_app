import { useAppContext } from '../store/AppContext';
import { calculateRankings } from '../utils/ranking';
import { Award, Target, Trophy, CheckCircle2, Flame, ArrowRight, CalendarDays, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getIcon } from '../utils/icons';

export const Home = () => {
    const { users, tasks, completions, currentUser, tokenName, reminders, homeSettings, loading } = useAppContext();

    if (loading || !homeSettings || !currentUser) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    const today = new Date();
    const currentMonthIdx = today.getMonth();
    const currentYear = today.getFullYear();

    // Map completions for the ranking utility if needed or use directly
    const currentRankings = calculateRankings(users, tasks, completions, currentMonthIdx, currentYear);
    const top1 = currentRankings[0];
    const top2 = currentRankings[1];
    const isFirst = currentUser && top1 && top1.user.id === currentUser.id;

    const recentCompletions = [...completions]
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .slice(0, 5);

    const HomeIconComponent = getIcon(homeSettings.logo || 'Home');

    const PodioMini = ({ top1, top2 }: { top1?: any, top2?: any }) => (
        <div className="flex items-end justify-center gap-4 h-32 sm:h-40 my-6">
            {top2 && (
                <div className="flex flex-col items-center justify-end h-full opacity-90">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-lg`} style={{ backgroundColor: top2.user.color_hex, color: '#fff' }}>
                        {top2.user.full_name[0]}
                    </div>
                    <div className="bg-panel p-2 rounded-t-lg w-16 text-center border-t border-foreground/10 h-16 flex flex-col justify-start pt-2">
                        <span className="text-text-dim text-xs font-bold">{top2.points}</span>
                    </div>
                </div>
            )}
            {top1 && (
                <div className="flex flex-col items-center justify-end h-full z-10">
                    <Award className="w-8 h-8 text-yellow-500 animate-pulse mb-1" />
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mb-2 shadow-lg border-2 border-yellow-500`} style={{ backgroundColor: top1.user.color_hex, color: '#fff' }}>
                        {top1.user.full_name[0]}
                    </div>
                    <div className="bg-yellow-500/20 p-2 rounded-t-lg w-20 text-center border-t border-yellow-500/50 h-20 flex flex-col justify-start pt-2 backdrop-blur-sm">
                        <span className="text-yellow-500 font-extrabold">{top1.points}</span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* NEW HEADER: App & Home Branding */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 py-2 bg-foreground/5 rounded-3xl border border-foreground/5">
                <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-panel rounded-2xl shadow-lg border border-foreground/10 group-hover:rotate-12 transition-transform duration-500">
                        <img src="/logo.png" alt="Octogon" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Octogon</h1>
                        <p className="text-[10px] font-bold text-text-dim opacity-40 uppercase">The Home Hub</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-panel px-6 py-3 rounded-[2rem] shadow-xl border border-foreground/10 group">
                    <div className="p-2 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                        <HomeIconComponent className="w-6 h-6" style={{ color: homeSettings.themeColor }} />
                    </div>
                    <div className="text-right">
                        <h2 className="font-black text-lg tracking-tight leading-none" style={{ color: homeSettings.themeColor }}>{homeSettings.name}</h2>
                        <span className="text-[10px] font-bold text-text-dim flex items-center justify-end gap-1 mt-1 uppercase tracking-widest">
                            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                            {users.length} Miembros
                        </span>
                    </div>
                </div>
            </div>

            {/* Featured Ranking Card */}
            <div className="bg-panel border border-foreground/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-12">

                    <div className="flex-1 text-center sm:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold uppercase tracking-wide">
                            <Flame className="w-4 h-4" />
                            Ranking Mensual
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                            {top1 ? (
                                isFirst ? (
                                    <>¡Estás haciéndolo genial,<br />vas en cabeza! 🏆</>
                                ) : (
                                    <>¡<span className="text-primary">{top1.user.full_name}</span> va en cabeza,<br />no lo dejes escapar! 🚀</>
                                )
                            ) : (
                                <>¡Aún no hay puntos,<br />sé el primero en sumar! 🌟</>
                            )}
                        </h2>

                        <Link to="/competition" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-2xl font-bold transition-all hover:translate-x-1 border border-foreground/5">
                            Ver clasificación completa
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="w-full sm:w-auto">
                        {top1 ? <PodioMini top1={top1} top2={top2} /> : (
                            <div className="h-32 flex items-center justify-center">
                                <Trophy className="w-20 h-20 text-foreground/5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-panel border border-foreground/10 p-6 rounded-2xl shadow-lg hover:border-primary/20 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-text-dim">Tareas Hoy</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{tasks.filter(t => t.is_active).length}</p>
                    </div>
                    <div className="bg-panel border border-foreground/10 p-6 rounded-2xl shadow-lg hover:border-accent/20 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                                <CheckCircle2 className="w-5 h-5 text-accent" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-text-dim">Completadas</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{completions.filter(c => new Date(c.completed_at).toDateString() === today.toDateString()).length}</p>
                    </div>
                    <div className="bg-panel border border-foreground/10 p-6 rounded-2xl shadow-lg hover:border-green-500/20 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                <CalendarDays className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-text-dim">Pendientes</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{tasks.filter(t => t.is_active).length - completions.filter(c => new Date(c.completed_at).toDateString() === today.toDateString()).length}</p>
                    </div>
                    <div className="bg-panel border border-foreground/10 p-6 rounded-2xl shadow-lg hover:border-yellow-500/20 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                                <Award className="w-5 h-5 text-yellow-500" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-text-dim">{tokenName}</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground font-mono">{currentUser ? calculateRankings(users, tasks, completions, currentMonthIdx, currentYear).find(r => r.user.id === currentUser.id)?.points || 0 : 0}</p>
                    </div>
                </div>

                {/* News Feed / Reminders */}
                <div className="bg-panel border border-foreground/10 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            Próximos Eventos
                        </h3>
                        <Link to="/reminders" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">Ver todos</Link>
                    </div>

                    <div className="space-y-3">
                        {reminders.filter(r => !r.is_completed).slice(0, 3).map(reminder => (
                            <div key={reminder.id} className="flex items-center gap-4 p-3 bg-foreground/5 rounded-2xl border border-foreground/5 hover:border-primary/20 transition-all">
                                <div className="p-2 bg-panel rounded-xl shadow-sm border border-foreground/5">
                                    <MapPin className="w-4 h-4 text-text-dim" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{reminder.title}</p>
                                    <p className="text-[10px] text-text-dim font-black uppercase mt-0.5 tracking-wider">
                                        {new Date(reminder.due_date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {reminders.filter(r => !r.is_completed).length === 0 && (
                            <div className="py-12 text-center bg-foreground/5 rounded-[2rem] border border-dashed border-foreground/10">
                                <p className="text-text-dim text-xs font-medium italic">Sin eventos próximos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* List Activities */}
            <div className="bg-panel border border-foreground/10 rounded-[2rem] overflow-hidden shadow-xl">
                <div className="px-8 py-5 border-b border-foreground/10 flex items-center justify-between bg-foreground/5">
                    <h3 className="text-xs font-black text-text-dim uppercase tracking-[0.2em]">Registro de Actividad</h3>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="divide-y divide-foreground/10">
                    {recentCompletions.length > 0 ? recentCompletions.map(c => {
                        const user = users.find(u => u.id === c.user_id);
                        const task = tasks.find(t => t.id === c.task_id);
                        if (!user || !task) return null;
                        return (
                            <div key={c.id} className="p-5 sm:px-8 flex items-center gap-4 hover:bg-foreground/2 transition-colors group">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: user.color_hex }}>
                                    {user.full_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground leading-tight">
                                        <span className="font-black">{user.full_name}</span> ha completado <span className="text-primary font-bold">{task.title}</span>
                                    </p>
                                    <p className="text-[10px] text-text-dim font-black uppercase mt-1 tracking-widest">{new Date(c.completed_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="text-xs font-black text-green-500 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 shadow-sm">
                                    +{c.points_earned}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="p-16 text-center text-text-dim italic text-sm font-medium">
                            No hay actividad registrada en la nube todavia.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
