import { useState, useEffect, useCallback } from 'react';
import type { Session } from '../types';

export const useSession = () => {
    const [activeSession, setActiveSession] = useState<Session | null>(null);

    const checkActiveSession = useCallback(async () => {
        const session = await window.api.invoke('session:get-active');
        setActiveSession(session || null);
    }, []);

    useEffect(() => {
        checkActiveSession();

        const handleSessionUpdate = () => {
            checkActiveSession();
        };

        window.addEventListener('session-updated', handleSessionUpdate);
        return () => window.removeEventListener('session-updated', handleSessionUpdate);
    }, [checkActiveSession]);

    const startSession = async (taskId: string) => {
        const session = await window.api.invoke('session:start', taskId);
        window.dispatchEvent(new Event('session-updated'));
        setActiveSession(session);
        return session;
    };

    const stopSession = async (taskId: string) => {
        await window.api.invoke('session:stop', taskId);
        window.dispatchEvent(new Event('session-updated'));
        setActiveSession(null);
    };

    return { activeSession, startSession, stopSession, refreshSession: checkActiveSession };
};
