import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ListTodo, Plus, Trash2, Trophy, Loader2, Sparkles, X, Clock, Edit3, Save, Undo2, Check, GripVertical } from 'lucide-react';
import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskCompletion, User } from '../types';

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

    const sensors = useSensors(
        // A small activation distance keeps a plain tap from being read as a
        // drag — only a deliberate press-and-move on the grip handle counts.
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

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

    const startEdit = (task: Task) => {
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

    // Drag-and-drop reorder (dnd-kit — unlike HTML5 native drag-and-drop, its
    // PointerSensor works from a finger as well as a mouse). Dropping a card
    // reindexes the whole list to a clean 0..n-1 sort_order, rather than
    // swapping just the two endpoints, so ordering can't drift over time.
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sortedTasks.findIndex(t => t.id === active.id);
        const newIndex = sortedTasks.findIndex(t => t.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = arrayMove(sortedTasks, oldIndex, newIndex);
        const changed = reordered.filter((t, i) => t.sort_order !== i);
        runPending('reorder', async () => {
            await Promise.all(changed.map((t) => updateTask({ ...t, sort_order: reordered.indexOf(t) })));
        });
    };

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

            {sortedTasks.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sortedTasks.map(t => t.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedTasks.map((task) => {
                                const todayStr = new Date().toDateString();
                                const todayCompletions = completions.filter(c =>
                                    c.task_id === task.id &&
                                    new Date(c.completed_at).toDateString() === todayStr
                                );
                                const myTodayCompletions = todayCompletions.filter(c => c.user_id === currentUser?.id);
                                const isCompletedToday = myTodayCompletions.length > 0;
                                const canComplete = task.allow_multiple_per_day || !isCompletedToday;

                                return (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        tokenName={tokenName}
                                        currentUser={currentUser}
                                        todayCompletions={todayCompletions}
                                        isCompletedToday={isCompletedToday}
                                        canComplete={canComplete}
                                        isEditing={editingId === task.id}
                                        editTitle={editTitle}
                                        editPoints={editPoints}
                                        setEditTitle={setEditTitle}
                                        setEditPoints={setEditPoints}
                                        startEdit={() => startEdit(task)}
                                        saveEdit={saveEdit}
                                        cancelEdit={() => setEditingId(null)}
                                        isConfirmingDelete={confirmDeleteId === task.id}
                                        askDelete={() => setConfirmDeleteId(task.id)}
                                        cancelDelete={() => setConfirmDeleteId(null)}
                                        confirmDelete={() => handleDelete(task.id)}
                                        onComplete={() => handleComplete(task.id, task.default_points)}
                                        onUndo={() => handleUndoCompletion(task.id)}
                                        isCompletingPending={pendingActions.has(`complete-${task.id}`)}
                                        isUndoingPending={pendingActions.has(`undo-${task.id}`)}
                                        isDeletingPending={pendingActions.has(`delete-${task.id}`)}
                                        isSavingPending={pendingActions.has(`save-${task.id}`)}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="py-40 text-center bg-panel border-2 border-dashed border-foreground/10 rounded-[4rem]">
                    <ListTodo className="w-20 h-20 text-text-dim/10 mx-auto mb-6" />
                    <p className="text-text-dim font-black uppercase tracking-[0.4em] italic">No hay tareas creadas</p>
                    <p className="text-[10px] text-text-dim/60 uppercase mt-4">Comienza agregando tareas para motivar al hogar</p>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// One task card — compact, and draggable by its grip handle only (dragging
// only starts from that handle, so tapping the card's own buttons never gets
// mistaken for a drag).
// ─────────────────────────────────────────────────────────────────────────────
const iconBtnClass = "p-2 rounded-lg transition-all disabled:opacity-40 disabled:pointer-events-none";

interface TaskCardProps {
    task: Task;
    tokenName: string;
    currentUser: User | null;
    todayCompletions: TaskCompletion[];
    isCompletedToday: boolean;
    canComplete: boolean;
    isEditing: boolean;
    editTitle: string;
    editPoints: number;
    setEditTitle: (v: string) => void;
    setEditPoints: (v: number) => void;
    startEdit: () => void;
    saveEdit: () => void;
    cancelEdit: () => void;
    isConfirmingDelete: boolean;
    askDelete: () => void;
    cancelDelete: () => void;
    confirmDelete: () => void;
    onComplete: () => void;
    onUndo: () => void;
    isCompletingPending: boolean;
    isUndoingPending: boolean;
    isDeletingPending: boolean;
    isSavingPending: boolean;
}

const TaskCard = ({
    task, tokenName, currentUser, todayCompletions, isCompletedToday, canComplete,
    isEditing, editTitle, editPoints, setEditTitle, setEditPoints, startEdit, saveEdit, cancelEdit,
    isConfirmingDelete, askDelete, cancelDelete, confirmDelete,
    onComplete, onUndo, isCompletingPending, isUndoingPending, isDeletingPending, isSavingPending,
}: TaskCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 30 : undefined,
        opacity: isDragging ? 0.85 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-panel border border-foreground/10 rounded-3xl p-5 shadow-lg hover:border-primary/20 transition-colors"
        >
            {/* Header row: drag handle, icon, title/badge, edit/delete — a
                single flex row instead of stacked absolute-positioned
                buttons, which is what used to overlap on narrow screens. */}
            <div className="flex items-start gap-2.5 mb-4">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1.5 -ml-1.5 mt-1 rounded-lg text-text-dim/30 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all cursor-grab active:cursor-grabbing touch-none shrink-0"
                    aria-label="Arrastrar para reordenar"
                    title="Arrastrar para reordenar"
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="space-y-2">
                            <input
                                autoFocus
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="w-full bg-foreground/5 border border-primary/30 rounded-lg p-2 text-sm font-bold focus:outline-none text-foreground"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="number" min="5" max="100" step="5"
                                    value={editPoints}
                                    onChange={e => setEditPoints(Number(e.target.value))}
                                    className="w-16 bg-foreground/5 border border-foreground/10 rounded-lg p-1.5 text-center text-sm font-bold focus:outline-none text-foreground"
                                />
                                <span className="text-[10px] text-text-dim font-bold">{tokenName}</span>
                                <button onClick={saveEdit} disabled={!editTitle.trim() || isSavingPending} className={`${iconBtnClass} ml-auto bg-green-500 text-white hover:bg-green-600`} aria-label="Guardar cambios">
                                    {isSavingPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={cancelEdit} className={`${iconBtnClass} bg-foreground/10 text-text-dim hover:bg-foreground/20`} aria-label="Cancelar edición">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-base font-black text-foreground tracking-tight uppercase italic leading-snug">{task.title}</h3>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 text-primary">+{task.default_points} {tokenName}</span>
                                {!task.allow_multiple_per_day && <span className="text-[8px] font-black uppercase opacity-40 italic text-text-dim">1x/día</span>}
                            </div>
                        </>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex gap-1 shrink-0">
                        {isConfirmingDelete ? (
                            <>
                                <button onClick={cancelDelete} className={`${iconBtnClass} bg-foreground/10 text-text-dim hover:bg-foreground/20`} aria-label="Cancelar borrado" title="Cancelar">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={confirmDelete} disabled={isDeletingPending} className={`${iconBtnClass} bg-red-500 text-white hover:bg-red-600`} aria-label="Confirmar borrado" title="Confirmar borrado">
                                    {isDeletingPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={startEdit} className={`${iconBtnClass} bg-primary/10 text-primary hover:bg-primary hover:text-white`} aria-label="Editar tarea" title="Editar">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={askDelete} className={`${iconBtnClass} bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white`} aria-label="Eliminar tarea" title="Eliminar">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Completion marks for today */}
            {todayCompletions.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {todayCompletions.map(c => {
                        const user = currentUser && c.user_id === currentUser.id ? currentUser : null;
                        return (
                            <div key={c.id} className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shadow border border-white/20" style={{ backgroundColor: user?.color_hex || '#666' }} title={`${user?.full_name || '?'} • +${c.points_earned}`}>
                                ✓
                            </div>
                        );
                    })}
                    <span className="text-[9px] font-bold text-text-dim opacity-50 ml-1">{todayCompletions.length}x hoy</span>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={onComplete}
                    disabled={!canComplete || isCompletingPending}
                    className={`flex-1 py-3 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest border border-foreground/10 disabled:pointer-events-none ${!canComplete
                        ? 'bg-foreground/5 text-text-dim/30 cursor-not-allowed'
                        : 'bg-foreground/5 hover:bg-primary text-text-dim hover:text-white hover:border-primary'
                        }`}
                >
                    {isCompletingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isCompletedToday && !task.allow_multiple_per_day ? 'Hecho hoy' : 'Completar'}
                </button>

                {isCompletedToday && (
                    <button
                        onClick={onUndo}
                        disabled={isUndoingPending}
                        className="py-3 px-3.5 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 text-[10px] tracking-widest border border-foreground/10 bg-foreground/5 hover:bg-red-500 text-text-dim hover:text-white hover:border-red-500 disabled:opacity-50 disabled:pointer-events-none"
                        title="Deshacer última realización de hoy"
                        aria-label="Deshacer última realización de hoy"
                    >
                        {isUndoingPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
};
