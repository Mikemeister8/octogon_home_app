import { useAppContext } from '../store/AppContext';
import { calculateRankings } from '../utils/ranking';
import { Award, Target, Trophy, CheckCircle2, Flame, ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
    const { users, tasks, completions, currentUser, tokenName, reminders } = useAppContext();

    const today = new Date();
    const currentMonthIdx = today.getMonth();
    const currentYear = today.getFullYear();

    const currentRankings = calculateRankings(users, tasks, completions, currentMonthIdx, currentYear);
    const top1 = currentRankings[0];
    const top2 = currentRankings[1];
    const isFirst = currentUser && top1 && top1.user.id === currentUser.id;

    const recentCompletions = [...completions]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

    const PodioMini = ({ top1, top2 }: { top1?: any, top2?: any }) => (
        <div className="flex items-end justify-center gap-4 h-32 sm:h-40 my-6">
            {top2 && (
                <div className="flex flex-col items-center justify-end h-full opacity-90">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-lg`} style={{ backgroundColor: top2.user.color, color: '#fff' }}>
                        {top2.user.name[0]}
                    </div>
                    <div className="bg-panel p-2 rounded-t-lg w-16 text-center border-t border-foreground/10 h-16 flex flex-col justify-start pt-2">
                        <span className="text-text-dim text-xs">{top2.points}</span>
                    </div>
                </div>
            )}
            {top1 && (
                <div className="flex flex-col items-center justify-end h-full z-10">
                    <Award className="w-8 h-8 text-yellow-500 animate-pulse mb-1" />
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mb-2 shadow-lg border-2 border-yellow-500`} style={{ backgroundColor: top1.user.color, color: '#fff' }}>
                        {top1.user.name[0]}
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
            {/* Featured Ranking Card */}
            <div className="bg-panel border border-foreground/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-12">

                    <div className="flex-1 text-center sm:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                            <Flame className="w-4 h-4" />
                            Ranking Mensual
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                            {top1 ? (
                                isFirst ? (
                                    <>¡Estás haciéndolo genial,<br />vas en cabeza! 🏆</>
                                ) : (
                                    <>¡<span className="text-primary">{top1.user.name}</span> va en cabeza,<br />no lo dejes escapar! 🚀</>
                                )
                            ) : (
                                <>¡Aún no hay puntos,<br />sé el primero en sumar! 🌟</>
                            )}
                        </h2>

                        <Link to="/competition" className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-xl font-medium transition-all hover:translate-x-1">
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
                    <div className="bg-panel border border-foreground/10 p-5 rounded-2xl shadow-lg hover:border-primary/20 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Tareas Hoy</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{tasks.length}</p>
                    </div>
                    <div className="bg-panel border border-foreground/10 p-5 rounded-2xl shadow-lg hover:border-accent/20 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                                <CheckCircle2 className="w-5 h-5 text-accent" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Completadas</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{completions.filter(c => new Date(c.timestamp).toDateString() === today.toDateString()).length}</p>
                    </div>
                    <div className="bg-panel border border-foreground/10 p-5 rounded-2xl shadow-lg hover:border-green-500/20 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                <CalendarDays className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Pendientes</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{tasks.length - completions.filter(c => new Date(c.timestamp).toDateString() === today.toDateString()).length}</p>
                    </div>
                    <div className="bg-panel border border-foreground/10 p-5 rounded-2xl shadow-lg hover:border-yellow-500/20 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                                <Award className="w-5 h-5 text-yellow-500" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{tokenName}</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{currentUser ? calculateRankings(users, tasks, completions, currentMonthIdx, currentYear).find(r => r.user.id === currentUser.id)?.points || 0 : 0}</p>
                    </div>
                </div>

                {/* News Feed / Reminders */}
                <div className="bg-panel border border-foreground/10 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            Próximos Recordatorios
                        </h3>
                        <Link to="/reminders" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
                    </div>

                    <div className="space-y-3">
                        {reminders.filter(r => !r.isCompleted).slice(0, 3).map(reminder => (
                            <div key={reminder.id} className="flex items-center gap-4 p-3 bg-foreground/5 rounded-xl border border-foreground/5 hover:border-primary/20 transition-all">
                                <div className="p-2 bg-panel rounded-lg shadow-sm">
                                    <MapPin className="w-4 h-4 text-text-dim" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{reminder.title}</p>
                                    <p className="text-xs text-text-dim">{new Date(reminder.date).toLocaleDateString([], { day: 'numeric', month: 'short' })} • {reminder.startTime}</p>
                                </div>
                            </div>
                        ))}
                        {reminders.filter(r => !r.isCompleted).length === 0 && (
                            <div className="py-8 text-center bg-foreground/5 rounded-2xl border border-dashed border-foreground/10">
                                <p className="text-text-dim text-sm italic">Todo al día por aquí</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* List Activities */}
            <div className="bg-panel border border-foreground/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between bg-foreground/5">
                    <h3 className="text-lg font-bold text-foreground">Actividad Reciente</h3>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div className="divide-y divide-foreground/10">
                    {recentCompletions.length > 0 ? recentCompletions.map(c => {
                        const user = users.find(u => u.id === c.userId);
                        const task = tasks.find(t => t.id === c.taskId);
                        if (!user || !task) return null;
                        return (
                            <div key={c.id} className="p-4 sm:px-6 flex items-center gap-4 hover:bg-foreground/5 transition-colors group">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white shadow-md group-hover:scale-110 transition-transform" style={{ backgroundColor: user.color }}>
                                    {user.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground">
                                        <span className="font-bold">{user.name}</span> ha completado <span className="text-primary font-medium">{task.title}</span>
                                    </p>
                                    <p className="text-xs text-text-dim">{new Date(c.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="text-xs font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
                                    +{task.points}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="p-12 text-center text-text-dim italic">
                            No hay actividad registrada todavía.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
