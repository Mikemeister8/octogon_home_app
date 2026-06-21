import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Loader2 } from 'lucide-react';

/**
 * Landing page for invite links: /join/:code
 * - If user is logged in → join directly and redirect home
 * - If user is NOT logged in → save code + redirect to /auth
 */
export const JoinHousehold = () => {
    const { inviteId } = useParams<{ inviteId: string }>();
    const { currentUser, loading, joinHouseholdByCode } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return; // wait for auth state to be known

        const code = inviteId?.trim().toUpperCase() || '';
        if (!code) { navigate('/'); return; }

        if (!currentUser) {
            // Not logged in: store code and go to auth
            localStorage.setItem('octo_join_code', code);
            navigate('/auth');
            return;
        }

        // Logged in: join directly
        joinHouseholdByCode(code)
            .then(() => navigate('/'))
            .catch((err) => {
                console.error('[JOIN] Error joining:', err);
                navigate('/');
            });
    }, [loading, currentUser, inviteId]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <p className="text-text-dim text-sm font-bold uppercase tracking-widest">Procesando invitación...</p>
            </div>
        </div>
    );
};
