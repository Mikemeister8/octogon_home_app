import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ListTodo, Plus, Trash2, CheckCircle2, Trophy, Loader2, Sparkles, X, Clock, Edit3, Save, Undo2, ChevronUp, ChevronDown, Check } from 'lucide-react';

export const Tasks = () => {
    const { tasks, completions, addTask, updateTask, deleteTask, addCompletion, removeCompletion, currentUser, homeSettings, tokenName } = useAppContext();
    const [title, setTitle] = useState('');
    const [points, setPoints] = useState(10);
    const [allowMultiple, setAllowMultiple] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editPoints, setEditPoints] = useState(10);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

    if (!homeSettings) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const sortedTasks = [...tasks].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

    // Runs an async action with immediate button feedback (disabled + spinner)
    // and guards against double-taps firing the same action twice.
    const runPending = async (key: string, fn: () => Promise<void>) => {
        if (pendingActions.has(key)) return;
        setPendingActions(prev => new Set(prev).add(key));
        try {
            await fn();
        } finally {
            setPendingActions(prev => { const next = new Set(prev); next.delete(key); return next; });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !currentUser || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await addTask({
                title: title.trim(),
                default_points: points,
                is_active: true,
                allow_multiple_per_day: allowMultiple,
                sort_order: tasks.length
            });
            setTitle('');
            setPoints(10);
            setIsAdding(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = (taskId: string, tPoints: number) => {
        if (!currentUser) return;
        return runPending(`complete-${taskId}`, () => addCompletion(taskId, currentUser.id, tPoints));
    };

    const handleUndoCompletion = (taskId: string) => {
        if (!currentUser) return;
        return runPending(`undo-${taskId}`, async () => {
            // Find the most recent completion for this task by this user today
            const todayStr = new Date().toDateString();
            const todayCompletions = completions
                .filter(c => c.task_id === taskId && c.user_id === currentUser.id && new Date(c.completed_at).toDateString() === todayStr)
                .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
            if (todayCompletions.length > 0) {
                await removeCompletion(todayCompletions[0].id);
            }
        });
    };

    const handleDelete = (taskId: string) => {
        return runPending(`delete-${taskId}`, async () => {
            await deleteTask(taskId);
            setConfirmDeleteId(null);
        });
    };

    const startEdit = (task: typeof tasks[0]) => {
        setEditingId(task.id);
        setEditTitle(task.title);
        setEditPoints(task.default_points);
    };

    const saveEdit = () => {
        if (!editingId || !editTitle.trim()) return;
        const task = tasks.find(t => t.id === editingId);
        if (!task) return;
        return runPending(`save-${editingId}`, async () => {
            await updateTask({ ...task, title: editTitle.trim(), default_points: editPoints });
            setEditingId(null);
        });
    };

    // Reorder via explicit up/down controls — works on touch devices, unlike
    // HTML5 drag-and-drop (which only fires from a mouse, not a finger).
    const moveTask = (taskId: string, direction: -1 | 1) => {
        const idx = sortedTasks.findIndex(t => t.id === taskId);
        const swapIdx = idx + direction;
        if (swapIdx < 0 || swapIdx >= sortedTasks.length) return;
        const a = sortedTasks[idx];
        const b = sortedTasks[swapIdx];
        return runPending(`move-${taskId}`, async () => {
            await Promise.all([
                updateTask({ ...a, sort_order: swapIdx }),
                updateTask({ ...b, sort_order: idx }),
            ]);
        });
    };

    const iconBtnClass = "p-2.5 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none";

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-primary/20 p-5 rounded-[2.5rem] shrink-0 group-hover:rotate-12 transition-transform shadow-lg border border-primary/20">
                        <ListTodo className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">Tareas</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-[0.4em] opacity-40">Tareas del Hogar</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-primary hover:bg-primary/90 active:bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-primary/30 relative z-10 text-xs uppercase tracking-widest"
                >
                    {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isAdding ? 'Cerrar' : 'Nueva Tarea'}
                </button>
            </header>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-panel border border-foreground/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase text-text-dim tracking-widest ml-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" /> Nombre de la Tarea
                            </label>
                            <input
                                required
                                autoFocus
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-5 focus:outline-none focus:border-primary transition-all font-bold placeholder:opacity-30"
                                placeholder="Ej: Lavar el coche, Sacar la basura..."
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase text-text-dim tracking-widest ml-1 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" /> Recompensa ({tokenName})
                            </label>
                            <div className="flex items-center gap-6 bg-foreground/5 rounded-2xl p-2 border border-foreground/10">
                                <input
                                    type="range"
                                    min="5" max="100" step="5"
                                    value={points}
                                    onChange={e => setPoints(Number(e.target.value))}
                                    className="flex-1 h-2 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-primary ml-4"
                                />
                                <div className="bg-primary px-6 py-3 rounded-xl font-black text-white text-lg shadow-lg min-w-[4.5rem] text-center">
                                    {points}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase text-text-dim tracking-widest ml-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" /> Frecuencia
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAllowMultiple(false)}
                                    className={`py-4 rounded-2xl font-bold transition-all border active:scale-95 ${!allowMultiple ? 'bg-primary text-white border-primary shadow-lg' : 'bg-foreground/5 text-text-dim border-foreground/10 hover:border-primary/30'}`}
                                >
                                    Una vez al día
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAllowMultiple(true)}
                                    className={`py-4 rounded-2xl font-bold transition-all border active:scale-95 ${allowMultiple ? 'bg-primary text-white border-primary shadow-lg' : 'bg-foreground/5 text-text-dim border-foreground/10 hover:border-primary/30'}`}
                                >
                                    Varias veces
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        disabled={!title.trim() || isSubmitting}
                        className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {isSubmitting ? 'Creando...' : 'Crear Tarea'}
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTasks.length > 0 ? sortedTasks.map((task, idx) => {
                    const todayStr = new Date().toDateString();
                    const todayCompletions = completions.filter(c =>
                        c.task_id === task.id &&
                        new Date(c.completed_at).toDateString() === todayStr
                    );
                    const myTodayCompletions = todayCompletions.filter(c => c.user_id === currentUser?.id);
                    const isCompletedToday = myTodayCompletions.length > 0;
                    const canComplete = task.allow_multiple_per_day || !isCompletedToday;
                    const isEditing = editingId === task.id;
                    const isCompletingPending = pendingActions.has(`complete-${task.id}`);
                    const isUndoingPending = pendingActions.has(`undo-${task.id}`);
                    const isDeletingPending = pendingActions.has(`delete-${task.id}`);
                    const isSavingPending = pendingActions.has(`save-${task.id}`);
                    const isMovingPending = pendingActions.has(`move-${task.id}`);

                    return (
                        <div
                            key={task.id}
                            className="bg-panel border border-foreground/10 rounded-[2.5rem] p-8 shadow-xl group hover:border-primary/20 hover:translate-y-[-4px] transition-all relative overflow-hidden"
                        >
                            {/* Reorder controls — always visible and touch-friendly */}
                            <div className="absolute top-4 left-4 flex flex-col gap-0.5 z-10">
                                <button
                                    onClick={() => moveTask(task.id, -1)}
                                    disabled={idx === 0 || isMovingPending}
                                    className="p-1.5 rounded-lg text-text-dim/40 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all disabled:opacity-20 disabled:pointer-events-none"
                                    aria-label="Subir tarea"
                                    title="Subir"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => moveTask(task.id, 1)}
                                    disabled={idx === sortedTasks.length - 1 || isMovingPending}
                                    className="p-1.5 rounded-lg text-text-dim/40 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all disabled:opacity-20 disabled:pointer-events-none"
                                    aria-label="Bajar tarea"
                                    title="Bajar"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Actions: Edit + Delete (always visible on touch, fades in on desktop hover) */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                                {confirmDeleteId === task.id ? (
                                    <>
                                        <button
                                            onClick={() => setConfirmDeleteId(null)}
                                            className={`${iconBtnClass} bg-foreground/10 text-text-dim hover:bg-foreground/20`}
                                            aria-label="Cancelar borrado"
                                            title="Cancelar"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            disabled={isDeletingPending}
                                            className={`${iconBtnClass} bg-red-500 text-white hover:bg-red-600`}
                                            aria-label="Confirmar borrado"
                                            title="Confirmar borrado"
                                        >
                                            {isDeletingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {!isEditing && (
                                            <button
                                                onClick={() => startEdit(task)}
                                                className={`${iconBtnClass} bg-primary/10 text-primary hover:bg-primary hover:text-white`}
                                                aria-label="Editar tarea"
                                                title="Editar"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setConfirmDeleteId(task.id)}
                                            className={`${iconBtnClass} bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white`}
                                            aria-label="Eliminar tarea"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="mb-6 mt-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="w-6 h-6 text-primary" />
                                </div>

                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input
                                            autoFocus
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            className="w-full bg-foreground/5 border border-primary/30 rounded-xl p-3 font-bold focus:outline-none text-foreground"
                                        />
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number" min="5" max="100" step="5"
                                                value={editPoints}
                                                onChange={e => setEditPoints(Number(e.target.value))}
                                                className="w-20 bg-foreground/5 border border-foreground/10 rounded-xl p-2 text-center font-bold focus:outline-none text-foreground"
                                            />
                                            <span className="text-xs text-text-dim font-bold">{tokenName}</span>
                                            <button
                                                onClick={saveEdit}
                                                disabled={!editTitle.trim() || isSavingPending}
                                                className={`${iconBtnClass} ml-auto bg-green-500 text-white hover:bg-green-600`}
                                                aria-label="Guardar cambios"
                                            >
                                                {isSavingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className={`${iconBtnClass} bg-foreground/10 text-text-dim hover:bg-foreground/20`}
                                                aria-label="Cancelar edición"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-black text-foreground tracking-tight uppercase italic mb-2">{task.title}</h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20 text-primary">+{task.default_points} {tokenName}</span>
                                            {!task.allow_multiple_per_day && <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 italic text-text-dim">1x al día</span>}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Completion marks for today */}
                            {todayCompletions.length > 0 && (
                                <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                                    {todayCompletions.map(c => {
                                        const user = currentUser && c.user_id === currentUser.id ? currentUser : null;
                                        return (
                                            <div key={c.id} className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow border border-white/20" style={{ backgroundColor: user?.color_hex || '#666' }} title={`${user?.full_name || '?'} • +${c.points_earned}`}>
                                                ✓
                                            </div>
                                        );
                                    })}
                                    <span className="text-[9px] font-bold text-text-dim opacity-50 ml-1">{todayCompletions.length}x hoy</span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleComplete(task.id, task.default_points)}
                                    disabled={!canComplete || isCompletingPending}
                                    className={`flex-1 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg uppercase text-[10px] tracking-widest border border-foreground/10 disabled:pointer-events-none ${!canComplete
                                        ? 'bg-foreground/5 text-text-dim/30 cursor-not-allowed'
                                        : 'bg-foreground/5 hover:bg-primary text-text-dim hover:text-white hover:border-primary'
                                        }`}
                                >
                                    {isCompletingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {isCompletedToday && !task.allow_multiple_per_day ? 'Hecho hoy' : 'Completar'}
                                </button>

                                {isCompletedToday && (
                                    <button
                                        onClick={() => handleUndoCompletion(task.id)}
                                        disabled={isUndoingPending}
                                        className="py-4 px-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg text-[10px] tracking-widest border border-foreground/10 bg-foreground/5 hover:bg-red-500 text-text-dim hover:text-white hover:border-red-500 disabled:opacity-50 disabled:pointer-events-none"
                                        title="Deshacer última realización de hoy"
                                        aria-label="Deshacer última realización de hoy"
                                    >
                                        {isUndoingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-40 text-center bg-panel border-2 border-dashed border-foreground/10 rounded-[4rem]">
                        <ListTodo className="w-20 h-20 text-text-dim/10 mx-auto mb-6" />
                        <p className="text-text-dim font-black uppercase tracking-[0.4em] italic">No hay tareas creadas</p>
                        <p className="text-[10px] text-text-dim/60 uppercase mt-4">Comienza agregando tareas para motivar al hogar</p>
                    </div>
                )}
            </div>
        </div>
    );
};
