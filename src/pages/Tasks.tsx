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
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-panel p-6 rounded-2xl border border-foreground/10 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full filter blur-[80px] group-hover:bg-primary/20 transition-all duration-700"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-foreground mb-2">Tareas Domésticas</h2>
                    <p className="text-text-dim">Gana <span className="text-primary font-bold">{tokenName}</span> completando tus labores diarias</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="relative z-10 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nueva Tarea
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onEdit={() => handleOpenModal(task)} />
                ))}
                {tasks.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-foreground/5 border border-dashed border-foreground/10 rounded-2xl">
                        <h3 className="text-xl font-medium text-text-dim">Aún no hay tareas</h3>
                        <p className="text-text-dim/60 mt-2 italic">Crea tu primera tarea para empezar a ganar {tokenName}</p>
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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const taskCompletions = completions
        .filter(c => c.taskId === task.id && new Date(c.timestamp) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const today = new Date().toDateString();
    const myCompletionsToday = taskCompletions.filter(c => c.userId === currentUser.id && new Date(c.timestamp).toDateString() === today);

    const isCompletedOnce = task.frequency === 'once' && myCompletionsToday.length > 0;

    const handleComplete = () => {
        if (task.frequency === 'once' && isCompletedOnce) {
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
            removeCompletion(myCompletionsToday[0].id);
        }
    };

    return (
        <div className="bg-panel border border-foreground/10 rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 group shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{task.name}</h3>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg mt-2 inline-block">
                        +{task.points} {tokenName}
                    </span>
                </div>
                <button onClick={onEdit} className="text-text-dim hover:text-foreground transition-colors p-2 rounded-lg hover:bg-foreground/5">
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-col gap-3 mt-6">
                {task.frequency === 'once' ? (
                    <button
                        onClick={handleComplete}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${isCompletedOnce
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border border-green-500/30'
                            : 'bg-foreground/5 text-foreground hover:bg-primary hover:text-white border border-foreground/10 hover:border-primary shadow-sm'
                            }`}
                    >
                        {isCompletedOnce ? <><CheckCircle2 className="w-5 h-5" /> Completada (Deshacer)</> : 'Completar Tarea'}
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleComplete}
                            className="flex-1 bg-foreground/5 hover:bg-primary text-foreground hover:text-white py-3 rounded-xl font-bold transition-all active:scale-95 border border-foreground/10 hover:border-primary shadow-sm"
                        >
                            Hacer (+{task.points})
                        </button>
                        {myCompletionsToday.length > 0 && (
                            <button
                                onClick={handleUndoMultiple}
                                title="Deshacer última"
                                className="w-12 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all active:scale-95"
                            >
                                <Undo2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {task.frequency === 'multiple' && myCompletionsToday.length > 0 && (
                    <p className="text-xs text-center text-text-dim">
                        Completado <span className="font-bold text-primary">{myCompletionsToday.length} veces</span> hoy.
                    </p>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-foreground/10">
                <h4 className="text-[10px] font-bold text-text-dim flex items-center gap-1 mb-3 uppercase tracking-widest opacity-70">
                    <Clock className="w-3 h-3" /> Últimos 7 días
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {taskCompletions.length === 0 ? (
                        <p className="text-xs text-text-dim/50 italic">Sin actividad reciente.</p>
                    ) : (
                        taskCompletions.slice(0, 5).map(c => {
                            const user = users.find(u => u.id === c.userId);
                            const date = new Date(c.timestamp).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={c.id} className="flex justify-between items-center text-xs bg-foreground/5 p-2 rounded-lg border border-foreground/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: user?.color || '#6b7280' }} />
                                        <span className="text-foreground font-medium">{user?.name}</span>
                                    </div>
                                    <span className="text-text-dim opacity-70">{date}</span>
                                </div>
                            );
                        })
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-panel border border-foreground/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in duration-300">
                <div className="p-6 border-b border-foreground/10 flex justify-between items-center bg-foreground/5">
                    <h2 className="text-xl font-bold text-foreground">{task.id ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                    <button onClick={onClose} className="text-text-dim hover:text-foreground p-1 bg-foreground/5 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-text-dim mb-2 uppercase tracking-wide">Nombre</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                            placeholder="Ej: Fregar los platos"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-text-dim mb-2 uppercase tracking-wide">Frecuencia</label>
                            <select
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value as TaskFrequency })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                            >
                                <option value="once">1 vez al día</option>
                                <option value="multiple">Varias veces</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-dim mb-2 uppercase tracking-wide">Puntos</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.points}
                                    onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-4 pr-16 py-3 text-foreground focus:outline-none focus:border-primary transition-all font-bold"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <span className="text-primary text-xs font-bold">{tokenName}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold bg-foreground/10 text-foreground hover:bg-foreground/20 transition-all">
                        Cancelar
                    </button>
                    <button
                        onClick={() => { if (formData.name.trim()) onSave(formData); }}
                        disabled={!formData.name.trim()}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg disabled:opacity-50 transition-all active:scale-95"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
