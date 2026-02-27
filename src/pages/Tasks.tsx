import { useState } from 'react';
import { Plus, Edit2, Undo2, CheckCircle2, X, Clock } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import type { Task, TaskFrequency } from '../types';

export const Tasks = () => {
    const { tasks, tokenName, addTask, updateTask } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const handleOpenModal = (task?: Task) => {
        if (task) {
            setEditingTask(task);
        } else {
            setEditingTask({ id: '', name: '', frequency: 'once', points: 10 });
        }
        setIsModalOpen(true);
    };

    const handleSave = (task: Task) => {
        if (task.id) {
            updateTask(task);
        } else {
            addTask({ ...task, id: Date.now().toString() });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-panel p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-[80px]"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2">Tareas Domésticas</h2>
                    <p className="text-gray-400">Gana <span className="text-purple-400 font-medium">{tokenName}</span> completando tus labores diarias</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="relative z-10 bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nueva Tarea
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onEdit={() => handleOpenModal(task)} />
                ))}
                {tasks.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-panel/50 border border-dashed border-white/10 rounded-2xl">
                        <h3 className="text-xl font-medium text-gray-300">Aún no hay tareas</h3>
                        <p className="text-gray-500 mt-2">Crea tu primera tarea para empezar a ganar {tokenName}</p>
                    </div>
                )}
            </div>

            {isModalOpen && editingTask && (
                <TaskModal
                    task={editingTask}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

const TaskCard = ({ task, onEdit }: { task: Task, onEdit: () => void }) => {
    const { tokenName, currentUser, completions, addCompletion, removeCompletion, users } = useAppContext();

    if (!currentUser) return null;

    // Filter last 7 days completions for this task
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const taskCompletions = completions
        .filter(c => c.taskId === task.id && new Date(c.timestamp) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Completions today by current user
    const today = new Date().toDateString();
    const myCompletionsToday = taskCompletions.filter(c => c.userId === currentUser.id && new Date(c.timestamp).toDateString() === today);

    const isCompletedOnce = task.frequency === 'once' && myCompletionsToday.length > 0;

    const handleComplete = () => {
        if (task.frequency === 'once' && isCompletedOnce) {
            // Undo completion
            removeCompletion(myCompletionsToday[0].id);
            return;
        }
        addCompletion({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            taskId: task.id,
            userId: currentUser.id,
            timestamp: new Date().toISOString()
        });
    };

    const handleUndoMultiple = () => {
        if (myCompletionsToday.length > 0) {
            removeCompletion(myCompletionsToday[0].id); // removes the most recent one today
        }
    };

    return (
        <div className="bg-panel border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300 group shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">{task.name}</h3>
                    <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md mt-2 inline-block">
                        +{task.points} {tokenName}
                    </span>
                </div>
                <button onClick={onEdit} className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-col gap-3 mt-6">
                {task.frequency === 'once' ? (
                    <button
                        onClick={handleComplete}
                        className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${isCompletedOnce
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                            : 'bg-white/5 text-white hover:bg-purple-500 hover:text-white border border-white/10 hover:border-purple-500'
                            }`}
                    >
                        {isCompletedOnce ? <><CheckCircle2 className="w-5 h-5" /> Completada (Deshacer)</> : 'Completar Tarea'}
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleComplete}
                            className="flex-1 bg-white/5 hover:bg-purple-500 text-white py-3 rounded-xl font-medium transition-all active:scale-95 border border-white/10 hover:border-purple-500 shadow-md"
                        >
                            Hacer (+{task.points})
                        </button>
                        {myCompletionsToday.length > 0 && (
                            <button
                                onClick={handleUndoMultiple}
                                title="Deshacer última"
                                className="w-12 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all active:scale-95"
                            >
                                <Undo2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {task.frequency === 'multiple' && myCompletionsToday.length > 0 && (
                    <p className="text-xs text-center text-gray-400">
                        Has completado esto <span className="font-bold text-purple-400">{myCompletionsToday.length} veces</span> hoy.
                    </p>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
                <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-3 uppercase tracking-wider">
                    <Clock className="w-3 h-3" /> Últimos 7 días
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {taskCompletions.length === 0 ? (
                        <p className="text-xs text-gray-600 italic">Nadie la ha hecho todavía.</p>
                    ) : (
                        taskCompletions.slice(0, 5).map(c => {
                            const user = users.find(u => u.id === c.userId);
                            const date = new Date(c.timestamp).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={c.id} className="flex justify-between items-center text-xs bg-black/20 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: user?.color || '#6b7280' }} />
                                        <span className="text-gray-300 font-medium">{user?.name}</span>
                                    </div>
                                    <span className="text-gray-500">{date}</span>
                                </div>
                            );
                        })
                    )}
                    {taskCompletions.length > 5 && (
                        <p className="text-xs text-center text-gray-500 pt-1">+ {taskCompletions.length - 5} más</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const TaskModal = ({ task, onClose, onSave }: { task: Task, onClose: () => void, onSave: (task: Task) => void }) => {
    const [formData, setFormData] = useState<Task>(task);
    const { tokenName } = useAppContext();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animation-fade-in">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{task.id ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 bg-white/5 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Nombre de la tarea</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                            placeholder="Ej: Fregar los platos"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Frecuencia</label>
                            <select
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value as TaskFrequency })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none"
                            >
                                <option value="once">1 vez al día</option>
                                <option value="multiple">Varias veces</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Recompensa</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.points}
                                    onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-16 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-bold"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <span className="text-purple-400 text-xs font-semibold">{tokenName}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (formData.name.trim()) onSave(formData);
                        }}
                        disabled={!formData.name.trim()}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
