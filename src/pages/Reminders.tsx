import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { CalendarDays, Plus, MapPin, Trash2, X, Users, Clock } from 'lucide-react';
import type { Reminder } from '../types';

export const Reminders = () => {
    const { reminders, addReminder, deleteReminder, users } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [location, setLocation] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

    const handleSave = () => {
        if (!title.trim() || !date) return;

        const newReminder: Reminder = {
            id: crypto.randomUUID(),
            title,
            description,
            date,
            startTime,
            location,
            participants: selectedParticipants,
            isCompleted: false
        };
        addReminder(newReminder);
        setIsModalOpen(false);
        // reset format
        setTitle(''); setDescription(''); setDate(''); setStartTime(''); setLocation(''); setSelectedParticipants([]);
    };

    const toggleParticipant = (id: string) => {
        if (selectedParticipants.includes(id)) {
            setSelectedParticipants(prev => prev.filter(x => x !== id));
        } else {
            setSelectedParticipants(prev => [...prev, id]);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-panel border border-foreground/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-primary/20 p-4 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-500">
                        <CalendarDays className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Recordatorios</h1>
                        <p className="text-text-dim mt-1 font-medium">Gestiona los eventos de tu hogar</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="relative z-10 bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nuevo Evento
                </button>
            </header>

            <div className="space-y-4">
                {reminders.length > 0 ? reminders.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(reminder => (
                    <div key={reminder.id} className="bg-panel border border-foreground/10 rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col sm:flex-row gap-4 sm:items-center justify-between group shadow-lg">
                        <div className="space-y-2 flex-1">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{reminder.title}</h3>
                            {reminder.description && <p className="text-text-dim text-sm italic">{reminder.description}</p>}

                            <div className="flex flex-wrap items-center gap-2 text-sm text-text-dim mt-2">
                                <div className="flex items-center gap-1.5 bg-foreground/5 px-3 py-1.5 rounded-lg border border-foreground/5 font-medium">
                                    <CalendarDays className="w-4 h-4 text-primary" />
                                    <span>{new Date(reminder.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                    {reminder.startTime && (
                                        <div className="flex items-center gap-1 ml-2 border-l border-foreground/10 pl-2">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-foreground font-bold">{reminder.startTime}</span>
                                        </div>
                                    )}
                                </div>
                                {reminder.location && (
                                    <div className="flex items-center gap-1.5 bg-foreground/5 px-3 py-1.5 rounded-lg border border-foreground/5 font-medium">
                                        <MapPin className="w-4 h-4 text-accent" />
                                        <span>{reminder.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-foreground/5 pt-4 sm:pt-0">
                            <div className="flex items-center -space-x-2">
                                {reminder.participants.length > 0 ? reminder.participants.map(pid => {
                                    const u = users.find(x => x.id === pid);
                                    if (!u) return null;
                                    return (
                                        <div key={u.id} className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 border-panel shadow-md hover:z-10 transition-all hover:-translate-y-1" style={{ backgroundColor: u.color, color: '#fff' }} title={u.name}>
                                            {u.name[0]}
                                        </div>
                                    )
                                }) : (
                                    <span className="text-xs text-text-dim italic">Sin participantes</span>
                                )}
                            </div>
                            <button
                                onClick={() => deleteReminder(reminder.id)}
                                className="p-2 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="bg-panel rounded-2xl p-16 text-center border-2 border-dashed border-foreground/10 flex flex-col items-center">
                        <CalendarDays className="w-16 h-16 text-primary/20 mb-4" />
                        <p className="text-foreground text-lg font-bold">Sin eventos pendientes</p>
                        <p className="text-text-dim mt-1 italic text-sm">Crea tu primer recordatorio pulsando en "Nuevo Evento".</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-panel border border-foreground/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-foreground/10 flex justify-between items-center bg-foreground/5 shrink-0">
                            <h2 className="text-xl font-bold text-foreground">Nuevo Recordatorio</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-dim hover:text-foreground p-1 bg-foreground/5 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-text-dim uppercase tracking-wider">Título del Evento *</label>
                                <input
                                    value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3.5 text-foreground focus:border-primary focus:outline-none transition-all font-medium"
                                    placeholder="Ej: Cita médico, Cena de Navidad..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-text-dim uppercase tracking-wider">Fecha *</label>
                                    <input
                                        type="date"
                                        value={date} onChange={e => setDate(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-text-dim uppercase tracking-wider">Hora <span className="opacity-50">(Opt.)</span></label>
                                    <input
                                        type="time"
                                        value={startTime} onChange={e => setStartTime(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-text-dim uppercase tracking-wider">Ubicación</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim/50" />
                                    <input
                                        value={location} onChange={e => setLocation(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-11 pr-4 py-3 text-foreground focus:border-primary focus:outline-none transition-all"
                                        placeholder="Ej: Clínica Centro, restaurante..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-text-dim uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Asignar a</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => toggleParticipant(u.id)}
                                            className={`px-4 py-3 rounded-xl border flex items-center gap-3 transition-all ${selectedParticipants.includes(u.id) ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary' : 'border-foreground/10 bg-foreground/5 text-text-dim hover:border-foreground/20'}`}
                                        >
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm" style={{ backgroundColor: u.color, color: '#fff' }}>{u.name[0]}</div>
                                            <span className="text-sm font-bold">{u.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-text-dim uppercase tracking-wider">Notas adicionales</label>
                                <textarea
                                    value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none min-h-[100px] transition-all"
                                    placeholder="Detalles sobre el evento..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-foreground/10 flex gap-3 bg-foreground/5 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-foreground/10 text-text-dim hover:bg-foreground/20 transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!title.trim() || !date}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg disabled:opacity-50 transition-all active:scale-95"
                            >
                                Guardar Evento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
