import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { UserPlus, Home, ArrowRight } from 'lucide-react';

export const JoinHousehold = () => {
    const { inviteId } = useParams();
    const { joinHousehold, homeSettings } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (inviteId) {
            joinHousehold(inviteId);
        }
    }, [inviteId, joinHousehold]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="max-w-md w-full bg-panel border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-10 h-10 text-purple-400" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">¡Te han invitado!</h1>
                    <p className="text-gray-400">Te has unido correctamente al hogar:</p>
                    <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5 inline-flex items-center gap-3">
                        <Home className="w-5 h-5 text-purple-400" />
                        <span className="text-lg font-bold text-white">{homeSettings.name}</span>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
                    >
                        Entrar al Hogar
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="mt-4 text-xs text-gray-500 italic">
                        Ahora compartes tareas, ranking y agenda con los demás miembros.
                    </p>
                </div>
            </div>
        </div>
    );
};
