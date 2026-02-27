import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    user: User | null;
    role: 'admin' | 'user' | null;
    isOnboardingComplete: boolean;
    isLoading: boolean;
    setSession: (session: Session | null) => Promise<void>;
    setUser: (user: User | null) => void;
    setRole: (role: 'admin' | 'user' | null) => void;
    setIsOnboardingComplete: (status: boolean) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    role: null,
    isOnboardingComplete: true, // Default to true to prevent flickering redirects
    isLoading: true,
    setSession: async (session) => {
        if (!session) {
            set({ session: null, user: null, role: null, isOnboardingComplete: true, isLoading: false });
            return;
        }
        set({ session, user: session.user, isLoading: true });
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, is_onboarding_complete')
                .eq('id', session.user.id)
                .single();
            if (data) {
                set({
                    role: data.role,
                    isOnboardingComplete: data.is_onboarding_complete === true
                });
            } else {
                // If profile is missing, it should definitely be treated as incomplete
                set({ role: 'user', isOnboardingComplete: false });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            set({ isLoading: false });
        }
    },
    setUser: (user) => set({ user }),
    setRole: (role) => set({ role }),
    setIsOnboardingComplete: (status) => set({ isOnboardingComplete: status }),
    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, role: null, isOnboardingComplete: true });
    },
}));
