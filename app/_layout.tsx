import "../global.css";
import { Stack, Redirect, useSegments, useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HolyDayPopup } from "../components/HolyDayPopup";
import * as Notifications from "expo-notifications";

export default function RootLayout() {
    const { session, isLoading, setSession } = useAuthStore();
    const segments = useSegments();
    const navigationState = useRootNavigationState();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    // ── Register Notifications ────────────────────────────────────────────────
    useEffect(() => {
        const { notificationService } = require('../services/notificationService');
        notificationService.registerForPushNotificationsAsync();

        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            import("expo-router").then(({ router: globalRouter }) => {
                if (data?.practiceId) {
                    globalRouter.push(`/practice/${data.practiceId}`);
                }
                if (data?.challengeId) {
                    globalRouter.push(`/challenge/${data.challengeId}`);
                }
            });
        });

        return () => subscription.remove();
    }, []);

    // ── Sync Supabase auth state ──────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            await setSession(currentSession);
            setIsReady(true);
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            await setSession(newSession);
        });

        return () => subscription.unsubscribe();
    }, []);

    // ── Navigation guard ──────────────────────────────────────────────────────
    useEffect(() => {
        // Wait until navigation and session are stabilized
        if (!navigationState?.key || isLoading || !isReady) return;

        const rootGroup = segments[0] as string | undefined;
        const isAuth = rootGroup === 'auth';
        const isWelcome = !rootGroup || rootGroup === 'index';
        const isApp = !isWelcome && !isAuth;

        // Perform redirect logic with timeout protection
        const timer = setTimeout(() => {
            if (session) {
                // Logged In: Check onboarding status
                const { isOnboardingComplete } = useAuthStore.getState();

                // If onboarding is NOT complete AND we are NOT currently in the auth flow, go to profile-setup
                if (!isOnboardingComplete && !isAuth) {
                    router.replace('/auth/profile-setup');
                    return;
                }

                // If onboarding IS complete and we are still on Welcome or Auth screens, go to Dashboard
                if (isOnboardingComplete && (isWelcome || isAuth)) {
                    router.replace('/dashboard');
                }
            } else {
                // Logged Out: If in App area, move to Welcome
                if (isApp) {
                    router.replace('/');
                }
            }
        }, 1);

        // Failsafe: if navigation gets stuck, force layout to render after 3s
        const failsafe = setTimeout(() => {
            if (isLoading || !isReady) {
                console.warn("[RootLayout] Safety timeout reached. Forcing app to render to prevent hanging.");
                setIsReady(true);
            }
        }, 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(failsafe);
        };
    }, [session, isLoading, segments, navigationState?.key, isReady]);

    // Keep Stack ALWAYS mounted to provide navigation context to children
    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar style="light" />

            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="dashboard" />
                <Stack.Screen name="create" />
                <Stack.Screen name="practice/[id]" />
                <Stack.Screen name="challenge/[id]" />
                <Stack.Screen name="challenge/create" />
                <Stack.Screen name="practice/leaderboard" options={{ presentation: 'modal' }} />
            </Stack>

            {/* Splash Overlay — only shows while initialization is pending */}
            {(!isReady || isLoading || !navigationState?.key) && (
                <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { backgroundColor: '#1A0008', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}
                >
                    <ActivityIndicator size="large" color="#D4AF37" />
                </View>
            )}

            {/* Holy Day Checks */}
            {isReady && session && <HolyDayPopup />}
        </View>
    );
}

const s = StyleSheet.create({
    overlay: {
        backgroundColor: '#2A0505',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999
    }
});
