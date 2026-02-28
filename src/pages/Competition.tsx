import { useAppContext } from '../store/AppContext';
import { calculateRankings } from '../utils/ranking';
import { Trophy, Award, Target, Flame, Medal, Star, CheckCircle2, Loader2 } from 'lucide-react';

export const Competition = () => {
    const { users, tasks, completions, tokenName, loading } = useAppContext();

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const today = new Date();
    const rankings = calculateRankings(users, tasks, completions, today.getMonth(), today.getFullYear());

    const top1 = rankings[0];
    const rest = rankings.slice(1);

    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-yellow-500';
        if (index === 1) return 'text-gray-400';
        if (index === 2) return 'text-amber-600';
        return 'text-text-dim';
    };

    return (
        <div className="p-4 sm:p-8 space-y-12 max-w-5xl mx-auto animate-in fade-in duration-700">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-black uppercase tracking-[0.2em] animate-bounce-slow">
                    <Trophy className="w-4 h-4" /> Sala de Campeones
                </div>
                <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase italic">Ranking {today.toLocaleString('es-ES', { month: 'long' })}</h1>
                <p className="text-text-dim font-bold uppercase text-[10px] tracking-[0.4em]">¿Quién se llevará la gloria este mes?</p>
            </header>

            {/* Podio Principal */}
            {top1 && (
                <div className="relative group perspective-1000">
                    <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000" />
                    <div className="relative bg-panel border-4 border-yellow-500/30 rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-700">
                        <div className="absolute -top-10 flex flex-col items-center">
                            <Award className="w-16 h-16 text-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                        </div>

                        <div className="w-32 h-32 rounded-[2.5rem] bg-yellow-500 p-1 mb-6 shadow-2xl group-hover:rotate-6 transition-transform duration-500">
                            <div className="w-full h-full rounded-[2.2rem] flex items-center justify-center text-4xl font-black text-white shadow-inner" style={{ backgroundColor: top1.user.color_hex }}>
                                {top1.user.full_name[0]}
                            </div>
                        </div>

                        <h2 className="text-4xl font-black text-foreground tracking-tight mb-2 uppercase">{top1.user.full_name}</h2>
                        <div className="flex items-center gap-4 bg-yellow-500/10 px-8 py-3 rounded-2xl border border-yellow-500/20">
                            <Flame className="w-6 h-6 text-yellow-500" />
                            <span className="text-3xl font-black text-yellow-500 font-mono tracking-tighter">{top1.points}</span>
                            <span className="text-xs font-black text-yellow-500/60 uppercase ml-2">{tokenName}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-10 w-full max-w-sm border-t border-foreground/5 pt-8">
                            <div className="flex flex-col items-center">
                                <Target className="w-5 h-5 text-text-dim mb-1" />
                                <span className="text-[10px] font-black uppercase text-text-dim">Eficacia</span>
                                <span className="text-lg font-black text-foreground font-mono">100%</span>
                            </div>
                            <div className="flex flex-col items-center border-y sm:border-y-0 sm:border-x border-foreground/5 py-4 sm:py-0">
                                <Star className="w-5 h-5 text-yellow-500 mb-1" />
                                <span className="text-[10px] font-black uppercase text-text-dim">Nivel</span>
                                <span className="text-lg font-black text-foreground font-mono uppercase">Gold</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                                <span className="text-[10px] font-black uppercase text-text-dim">Racha</span>
                                <span className="text-lg font-black text-foreground font-mono">7D</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista del resto */}
            <div className="space-y-4">
                {rest.length > 0 ? rest.map((item, idx) => (
                    <div key={item.user.id} className="bg-panel border border-foreground/10 rounded-[2rem] p-5 flex items-center gap-6 hover:translate-x-2 transition-all group shadow-xl">
                        <div className={`w-12 text-2xl font-black flex items-center justify-center ${getMedalColor(idx + 1)}`}>
                            {idx === 0 ? <Medal className="w-8 h-8" /> : `#${idx + 2}`}
                        </div>

                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: item.user.color_hex }}>
                            {item.user.full_name[0]}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-black text-foreground tracking-tight uppercase">{item.user.full_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-2 flex-1 bg-foreground/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-1000"
                                        style={{ width: `${(item.points / (top1?.points || 1)) * 100}%`, backgroundColor: item.user.color_hex }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="text-right px-6 border-l border-foreground/10">
                            <p className="text-2xl font-black text-foreground font-mono leading-none tracking-tighter">{item.points}</p>
                            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1">{tokenName}</p>
                        </div>
                    </div>
                )) : !top1 && (
                    <div className="p-20 text-center bg-panel border-2 border-dashed border-foreground/10 rounded-[3rem]">
                        <Trophy className="w-16 h-16 text-text-dim/10 mx-auto mb-4" />
                        <p className="text-text-dim font-black uppercase tracking-widest">El campo de batalla esta vacio</p>
                        <p className="text-[10px] text-text-dim/60 uppercase mt-2">Suma puntos completando tareas para aparecer aqui</p>
                    </div>
                )}
            </div>

            <footer className="text-center pt-10 text-[10px] font-black uppercase tracking-[0.5em] text-text-dim opacity-20">
                Octogon Competitive Engine • 2026
            </footer>
        </div>
    );
};
