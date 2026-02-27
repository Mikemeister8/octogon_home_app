import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { UserPlus, ArrowRight, Loader2, ShieldCheck, Sparkles, Laptop, Moon } from 'lucide-react';

export const JoinHousehold = () => {
    const { inviteId } = useParams();
    const { joinHouseholdLink, currentUser, loading } = useAppContext();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'joining' | 'success' | 'checking'>('checking');

    useEffect(() => {
        const join = async () => {
            if (inviteId && currentUser) {
                setStatus('joining');
                await joinHouseholdLink(inviteId);
                setStatus('success');
            } else if (!loading && !currentUser) {
                sessionStorage.setItem('pendingInvite', inviteId || '');
                navigate('/auth');
            }
        };
        join();
    }, [inviteId, joinHouseholdLink, currentUser, loading, navigate]);

    if (loading || status === 'joining' || status === 'checking') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background text-foreground space-y-8 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="w-24 h-24 bg-panel border-2 border-primary/20 rounded-[2.5rem] flex items-center justify-center relative z-10 shadow-2xl">
                        <img src="/logo.png" alt="Octogon" className="w-12 h-12 object-contain" />
                    </div>
                </div>
                <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Vinculando Hogar</h2>
                    <p className="text-text-dim text-xs font-black uppercase tracking-[0.3em]">Preparando tu acceso seguro...</p>
                </div>

                <div className="pt-20 flex items-center gap-8 opacity-20">
                    <ShieldCheck className="w-5 h-5" />
                    <Laptop className="w-5 h-5" />
                    <Moon className="w-5 h-5" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
            <div className="max-w-md w-full bg-panel border border-foreground/10 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl animate-in fade-in zoom-in duration-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-primary/10 blur-[100px] rounded-full" />

                <div className="w-24 h-24 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl relative z-10 mb-2">
                    <UserPlus className="w-12 h-12 text-primary animate-pulse" />
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> Vinculación Exitosa
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-tight italic">¡Bienvenido al nuevo hogar!</h1>
                    <p className="text-text-dim text-sm font-medium italic">Ahora compartes tareas, ranking y agenda con el resto de miembros.</p>
                </div>

                <div className="pt-4 relative z-10">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/30 active:scale-95 text-sm uppercase tracking-widest"
                    >
                        Entrar ahora
                        <ArrowRight className="w-6 h-6" />
                    </button>
                    <p className="mt-6 text-[10px] font-black text-text-dim uppercase tracking-[0.4em] opacity-40">
                        Octogon Home Hub • Seguridad Certificada
                    </p>
                </div>
            </div>
        </div>
    );
};
