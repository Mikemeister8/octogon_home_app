import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { CalendarDays, Plus, MapPin, Trash2, X, Users } from 'lucide-react';
import type { Reminder } from '../types';

export const Reminders = () => {
    const { reminders, addReminder, deleteReminder, users } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

    const handleSave = () => {
        if (!title.trim() || !date) return;

        const newReminder: Reminder = {
            id: crypto.randomUUID(),
            title,
            description,
            date,
            time,
            location,
            participants: selectedParticipants
        };
        addReminder(newReminder);
        setIsModalOpen(false);
        // reset format
        setTitle(''); setDescription(''); setDate(''); setTime(''); setLocation(''); setSelectedParticipants([]);
    };

    const toggleParticipant = (id: string) => {
        if (selectedParticipants.includes(id)) {
            setSelectedParticipants(prev => prev.filter(x => x !== id));
        } else {
            setSelectedParticipants(prev => [...prev, id]);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-panel border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-indigo-500/20 p-4 rounded-xl shrink-0">
                        <CalendarDays className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Recordatorios</h1>
                        <p className="text-gray-400 mt-1">Tu agenda personal y familiar</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="relative z-10 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nuevo Evento
                </button>
            </header>

            <div className="space-y-4">
                {reminders.length > 0 ? reminders.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(reminder => (
                    <div key={reminder.id} className="bg-panel border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row gap-4 sm:items-center justify-between group">
                        <div className="space-y-2 flex-1">
                            <h3 className="text-xl font-bold text-white">{reminder.title}</h3>
                            {reminder.description && <p className="text-gray-400 text-sm">{reminder.description}</p>}

                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                    <CalendarDays className="w-4 h-4 text-indigo-400" />
                                    <span>{new Date(reminder.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                    {reminder.time && <span className="ml-1 font-medium text-white">{reminder.time}</span>}
                                </div>
                                {reminder.location && (
                                    <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                        <MapPin className="w-4 h-4 text-pink-400" />
                                        <span>{reminder.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                            <div className="flex items-center gap-1">
                                {reminder.participants.length > 0 ? reminder.participants.map(pid => {
                                    const u = users.find(x => x.id === pid);
                                    if (!u) return null;
                                    return (
                                        <div key={u.id} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm" style={{ backgroundColor: u.color, color: '#fff' }} title={u.name}>
                                            {u.name[0]}
                                        </div>
                                    )
                                }) : (
                                    <span className="text-xs text-gray-500 italic">Sin asignar</span>
                                )}
                            </div>
                            <button
                                onClick={() => deleteReminder(reminder.id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="bg-panel rounded-2xl p-12 text-center border-2 border-dashed border-white/10">
                        <CalendarDays className="w-16 h-16 text-indigo-500/20 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No hay recordatorios.</p>
                        <p className="text-gray-500 mt-1">Aparecerán también en la portada (Home).</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animation-fade-in max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-white">Nuevo Recordatorio</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 bg-white/5 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Título *</label>
                                <input
                                    value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="Ej: Cita médico"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Fecha *</label>
                                    <input
                                        type="date"
                                        value={date} onChange={e => setDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Hora <span className="text-gray-600 text-xs font-normal">(Opcional)</span></label>
                                    <input
                                        type="time"
                                        value={time} onChange={e => setTime(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Ubicación <span className="text-gray-600 text-xs font-normal">(Opcional)</span></label>
                                <input
                                    value={location} onChange={e => setLocation(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="Ej: Clínica Centro"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Participantes</label>
                                <div className="flex flex-wrap gap-2">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => toggleParticipant(u.id)}
                                            className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${selectedParticipants.includes(u.id) ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-white/10 bg-black/40 text-gray-400'}`}
                                        >
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]" style={{ backgroundColor: u.color, color: '#fff' }}>{u.name[0]}</div>
                                            <span className="text-sm font-medium">{u.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Descripción / Notas <span className="text-gray-600 text-xs font-normal">(Opcional)</span></label>
                                <textarea
                                    value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none min-h-[80px]"
                                    placeholder="Detalles del recordatorio..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 flex gap-3 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!title.trim() || !date}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
