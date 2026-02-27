import { useState } from 'react';
import { Trophy, Calendar, Medal, Clock, Award } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { calculateRankings, type UserStats } from '../utils/ranking';

type Tab = 'current' | 'months' | 'all-time';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const Competition = () => {
    const { users, tasks, completions, tokenName } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('current');

    const today = new Date();
    const currentMonthIdx = today.getMonth();
    const currentYear = today.getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);
    const [selectedYear] = useState(currentYear); // Assuming only current year for now

    // Calculate stats based on active tab
    let currentRankings: UserStats[];

    if (activeTab === 'current') {
        currentRankings = calculateRankings(users, tasks, completions, currentMonthIdx, currentYear);
    } else if (activeTab === 'months') {
        currentRankings = calculateRankings(users, tasks, completions, selectedMonth, selectedYear);
    } else {
        currentRankings = calculateRankings(users, tasks, completions); // No date filter means all-time
    }

    // Determine top 3
    const top1 = currentRankings[0];
    const top2 = currentRankings[1];
    const top3 = currentRankings[2];

    // --- Sub-components for Lint Bliss ---
    const Podium = ({ top1, top2, top3, tokenName }: { top1?: UserStats, top2?: UserStats, top3?: UserStats, tokenName: string }) => (
        <div className="flex items-end justify-center gap-2 mt-12 mb-8 h-48 sm:h-64">
            {/* 2nd Place */}
            {top2 && (
                <div className="flex flex-col items-center justify-end h-full">
                    <div className="relative mb-4">
                        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg`} style={{ backgroundColor: top2.user.color }}>
                            {top2.user.name[0]}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-800 shadow-lg border-2 border-gray-100">
                            2
                        </div>
                    </div>
                    <div className="bg-gray-800/60 p-2 sm:p-4 rounded-t-xl w-20 sm:w-28 text-center border-t border-l border-r border-gray-700 h-24 sm:h-32 flex flex-col justify-start pt-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-300/10 to-transparent"></div>
                        <p className="font-semibold text-sm sm:text-base truncate w-full">{top2.user.name}</p>
                        <p className="text-gray-400 text-xs sm:text-sm">{top2.points} {tokenName}</p>
                    </div>
                </div>
            )}

            {/* 1st Place */}
            {top1 && (
                <div className="flex flex-col items-center justify-end h-full z-10">
                    <div className="relative mb-4">
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-yellow-500 animate-bounce group-hover:animate-none">
                            <Award className="w-10 h-10 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                        </div>
                        <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-lg border-4 border-yellow-500`} style={{ backgroundColor: top1.user.color }}>
                            {top1.user.name[0]}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 w-10 h-10 rounded-full flex items-center justify-center font-bold text-yellow-900 shadow-lg border-2 border-yellow-200">
                            1
                        </div>
                    </div>
                    <div className="bg-yellow-900/30 p-2 sm:p-4 rounded-t-xl w-24 sm:w-32 text-center border-t border-l border-r border-yellow-700 h-32 sm:h-44 flex flex-col justify-start pt-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent"></div>
                        <p className="font-bold text-base sm:text-lg text-yellow-400 truncate w-full">{top1.user.name}</p>
                        <p className="text-yellow-200/80 text-xs sm:text-sm font-medium">{top1.points} {tokenName}</p>
                    </div>
                </div>
            )}

            {/* 3rd Place */}
            {top3 && (
                <div className="flex flex-col items-center justify-end h-full">
                    <div className="relative mb-4">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg`} style={{ backgroundColor: top3.user.color }}>
                            {top3.user.name[0]}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-amber-100 shadow-lg border-2 border-amber-600">
                            3
                        </div>
                    </div>
                    <div className="bg-gray-800/40 p-2 sm:p-4 rounded-t-xl w-16 sm:w-24 text-center border-t border-l border-r border-gray-700 h-16 sm:h-24 flex flex-col justify-start pt-2 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-700/10 to-transparent"></div>
                        <p className="font-semibold text-xs sm:text-sm truncate w-full">{top3.user.name}</p>
                        <p className="text-gray-400 text-xs">{top3.points} pts</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Ranking
                    </h1>
                    <p className="text-gray-400 mt-1">Sigue el progreso de todos en la casa.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row p-1 bg-white/5 rounded-xl gap-1">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'current'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Trophy className="w-4 h-4" />
                    Mes Actual
                </button>
                <button
                    onClick={() => setActiveTab('months')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'months'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    Por Meses
                </button>
                <button
                    onClick={() => setActiveTab('all-time')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'all-time'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Medal className="w-4 h-4" />
                    Acumulado
                </button>
            </div>

            {activeTab === 'months' && (
                <div className="flex items-center gap-2 bg-panel p-4 rounded-xl border border-white/5 overflow-x-auto">
                    <Clock className="w-5 h-5 text-purple-400 shrink-0" />
                    <div className="flex gap-2 min-w-max">
                        {MONTHS.map((monthName, idx) => {
                            if (idx > currentMonthIdx) return null; // Can't see future months
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedMonth(idx)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedMonth === idx
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'text-gray-400 border border-transparent hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {monthName} {currentYear}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {currentRankings.length > 0 ? (
                <>
                    <Podium top1={top1} top2={top2} top3={top3} tokenName={tokenName} />

                    <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                            <h3 className="font-semibold text-white">Clasificación Completa</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {currentRankings.map((stat, idx) => (
                                <div key={stat.user.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500 font-bold w-6 text-center">{idx + 1}</span>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg`} style={{ backgroundColor: stat.user.color }}>
                                            {stat.user.name[0]}
                                        </div>
                                        <span className="font-medium text-white group-hover:text-purple-400 transition-colors">{stat.user.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                        <span className="font-bold text-purple-400">{stat.points}</span>
                                        <span className="text-gray-400 text-sm">{tokenName}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-panel rounded-2xl border border-white/5 p-12 text-center">
                    <Trophy className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No hay datos para mostrar en este periodo.</p>
                    <p className="text-gray-500 mt-2">¡Completa tareas para ganar {tokenName}!</p>
                </div>
            )}
        </div>
    );
};
