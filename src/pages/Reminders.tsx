import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { CalendarDays, Plus, Trash2, Users, Clock, Loader2 } from 'lucide-react';

export const Reminders = () => {
    const { reminders, users, addReminder, deleteReminder, loading } = useAppContext();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) return;

        await addReminder({
            title,
            description,
            due_date: `${date}T${time || '00:00'}:00Z`,
            assigned_to: selectedParticipants,
            is_completed: false
        });

        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setSelectedParticipants([]);
    };

    const toggleParticipant = (userId: string) => {
        setSelectedParticipants(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-700 pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-panel border border-foreground/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-primary/20 p-5 rounded-[2.5rem] shrink-0 group-hover:rotate-12 transition-transform duration-500 shadow-lg border border-primary/20">
                        <CalendarDays className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">Agenda</h1>
                        <p className="text-text-dim mt-1 font-bold uppercase text-[10px] tracking-[0.4em] opacity-40">Eventos y Recordatorios</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleAdd} className="bg-panel border border-foreground/10 rounded-[2.5rem] p-8 shadow-xl space-y-6 lg:sticky lg:top-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">¿Qué hay que recordar?</label>
                                <input
                                    required
                                    value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-bold placeholder:opacity-30"
                                    placeholder="Comprar regalo, Cita médica..."
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Fecha</label>
                                    <input
                                        required type="date"
                                        value={date} onChange={e => setDate(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Hora (Opcional)</label>
                                    <input
                                        type="time"
                                        value={time} onChange={e => setTime(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1">Detalles</label>
                                <textarea
                                    value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-bold min-h-[100px] resize-none"
                                    placeholder="Añade una descripción..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim ml-1 flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Asignar a:
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => toggleParticipant(u.id)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedParticipants.includes(u.id) ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-foreground/5 text-text-dim border-foreground/10 hover:border-foreground/20'}`}
                                        >
                                            {u.full_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]">
                            <Plus className="w-5 h-5" />
                            Programar Evento
                        </button>
                    </form>
                </div>

                {/* Lista */}
                <div className="lg:col-span-2 space-y-4">
                    {reminders.length > 0 ? reminders.map(reminder => (
                        <div key={reminder.id} className="bg-panel border border-foreground/10 rounded-[2.5rem] p-8 shadow-xl hover:translate-x-2 transition-all flex items-center gap-8 group">
                            <div className="bg-primary/10 p-5 rounded-3xl shrink-0 group-hover:scale-110 transition-transform shadow-inner border border-primary/10">
                                <Clock className="w-8 h-8 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                                    <h3 className="text-2xl font-black text-foreground tracking-tight uppercase italic break-words shrink-1">{reminder.title}</h3>
                                    <span className="px-3 py-1 bg-foreground/5 text-text-dim text-[10px] font-black uppercase tracking-widest rounded-full border border-foreground/10">
                                        {new Date(reminder.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <p className="text-sm text-text-dim font-medium italic opacity-60 mb-4 whitespace-pre-wrap break-words">{reminder.description || 'Sin descripción'}</p>

                                <div className="flex items-center gap-2">
                                    {reminder.assigned_to.map(uid => {
                                        const user = users.find(u => u.id === uid);
                                        return user && (
                                            <div key={uid} className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg border-2 border-panel" style={{ backgroundColor: user.color_hex }} title={user.full_name}>
                                                {user.full_name[0]}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={() => deleteReminder(reminder.id)}
                                className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        </div>
                    )) : (
                        <div className="py-40 text-center bg-panel border-2 border-dashed border-foreground/10 rounded-[4rem]">
                            <CalendarDays className="w-20 h-20 text-text-dim/10 mx-auto mb-6" />
                            <p className="text-text-dim font-black uppercase tracking-[0.4em] italic">Agenda Despejada</p>
                            <p className="text-[10px] text-text-dim/60 uppercase mt-4">Todo bajo control por ahora</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
