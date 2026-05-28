import "../global.css";
import { Stack, Redirect, useSegments, useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HolyDayPopup } from "../components/HolyDayPopup";
import * as Notifications from "expo-notifications";
import { useFonts } from 'expo-font';
import { Analytics } from '@vercel/analytics/react';


export default function RootLayout() {
    const { session, isLoading, setSession, isOnboardingComplete, forceUpdateLoading } = useAuthStore();
    const segments = useSegments();
    const navigationState = useRootNavigationState();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [isFailsafeTriggered, setIsFailsafeTriggered] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const [fontsLoaded] = useFonts({
        'Montserrat': require('../assets/Montserrat/static/Montserrat-Regular.ttf'),
        'Montserrat-SemiBold': require('../assets/Montserrat/static/Montserrat-SemiBold.ttf'),
        'Montserrat-Bold': require('../assets/Montserrat/static/Montserrat-Bold.ttf'),
    });


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
            try {
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Supabase getSession error:", error);
                }
                await setSession(currentSession);
            } catch (err) {
                console.error("Error during app initialization:", err);
            } finally {
                setIsReady(true);
            }
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            await setSession(newSession);
        });

        return () => subscription.unsubscribe();
    }, []);

    // ── Navigation guard ──────────────────────────────────────────────────────
    useEffect(() => {
        let timer: NodeJS.Timeout;

        // Logging for debug purposes to identify why it's stuck
        if (isLoading || !isReady || (!isFailsafeTriggered && !navigationState?.key)) {
            console.log("[RootLayout] Waiting for state:", {
                isLoading,
                isReady,
                hasNavKey: !!navigationState?.key,
                segments: segments.length,
                isFailsafeTriggered
            });
            // Do not return early so the failsafe timeout can be registered
        } else {
            const rootGroup = segments[0] as string | undefined;
            const isAuth = rootGroup === 'auth';
            const isWelcome = !rootGroup || rootGroup === 'index';
            const isApp = !isWelcome && !isAuth;

            // Perform redirect logic with timeout protection
            timer = setTimeout(() => {
                if (session) {
                    // If onboarding is NOT complete AND we are NOT currently in the auth flow, go to profile-setup
                    if (!isOnboardingComplete && !isAuth) {
                        console.log("[RootLayout] Redirecting to profile-setup (Incomplete onboarding)");
                        router.replace('/auth/profile-setup');
                        return;
                    }

                    // If onboarding IS complete and we are still on Welcome or Auth screens, go to Dashboard
                    if (isOnboardingComplete && (isWelcome || isAuth)) {
                        console.log("[RootLayout] Redirecting to dashboard (Onboarding complete)");
                        router.replace('/dashboard');
                    }
                } else {
                    // Logged Out: If in App area, move to Welcome
                    if (isApp) {
                        console.log("[RootLayout] Redirecting to welcome (No session)");
                        router.replace('/');
                    }
                }
            }, 1);
        }

        // Failsafe: if navigation gets stuck, force layout to render after 5s
        const failsafe = setTimeout(() => {
            if (isLoading || !isReady || !navigationState?.key) {
                console.warn("[RootLayout] Safety timeout reached. Forcing app to render to prevent hanging.");
                setIsReady(true);
                setIsFailsafeTriggered(true);
                forceUpdateLoading(false);
            }
        }, 5000);

        return () => {
            if (timer) clearTimeout(timer);
            clearTimeout(failsafe);
        };
    }, [session, isLoading, segments, navigationState?.key, isReady, isOnboardingComplete, isFailsafeTriggered]);

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
            {isHydrated && (!isFailsafeTriggered && (!isReady || isLoading || !navigationState?.key || !fontsLoaded)) && (
                <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { backgroundColor: '#1A0008', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}
                >
                    <ActivityIndicator size="large" color="#D4AF37" />
                </View>
            )}

            {/* Holy Day Checks */}
            {isHydrated && isReady && session && <HolyDayPopup />}
            <Analytics />
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
