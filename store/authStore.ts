import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    user: User | null;
    role: 'admin' | 'user' | null;
    isLoading: boolean;
    setSession: (session: Session | null) => Promise<void>;
    setUser: (user: User | null) => void;
    setRole: (role: 'admin' | 'user' | null) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    role: null,
    isLoading: true,
    setSession: async (session) => {
        if (!session) {
            set({ session: null, user: null, role: null, isLoading: false });
            return;
        }
        set({ session, user: session.user, isLoading: true });
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
            if (data) set({ role: data.role });
        } catch (err) {
            console.error('Error fetching role:', err);
        } finally {
            set({ isLoading: false });
        }
    },
    setUser: (user) => set({ user }),
    setRole: (role) => set({ role }),
    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, role: null });
    },
}));
