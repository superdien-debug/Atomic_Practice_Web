import React, { useEffect, useState, useRef } from 'react';
import { Stack, usePathname } from 'expo-router';
import { Audio } from 'expo-av';
import { AppState, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Music, Play } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JimRohnLayout() {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const pathname = usePathname();
    const appState = useRef(AppState.currentState);
    const [isPlaying, setIsPlaying] = useState(true);
    const insets = useSafeAreaInsets();

    // We only play audio if we are in the jim-rohn route tree
    const isJimRohnRoute = pathname.includes('jim-rohn');

    useEffect(() => {
        let currentSound: Audio.Sound | null = null;
        let isMounted = true;

        const loadAndPlayAudio = async () => {
            try {
                // Setup audio mode for the app
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });

                // Pick a random track
                const tracks = [
                    require('../../../assets/Idea22Icarus.mp3'),
                    require('../../../assets/SolarEclipse.mp3')
                ];
                const selectedTrack = tracks[Math.floor(Math.random() * tracks.length)];

                const { sound: newSound } = await Audio.Sound.createAsync(
                    selectedTrack,
                    { shouldPlay: true, isLooping: true, volume: 0.4 }
                );

                if (isMounted) {
                    currentSound = newSound;
                    setSound(newSound);
                } else {
                    newSound.unloadAsync();
                }
            } catch (err) {
                console.warn("Failed to load or play Jim Rohn audio.", err);
            }
        };

        if (isJimRohnRoute) {
            loadAndPlayAudio();
        }

        return () => {
            isMounted = false;
            if (currentSound) {
                currentSound.stopAsync().then(() => {
                    currentSound?.unloadAsync();
                });
            }
        };
    }, []);

    // Pause audio when app goes to background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (sound && isJimRohnRoute && isPlaying) {
                    sound.playAsync();
                }
            } else if (nextAppState.match(/inactive|background/)) {
                if (sound) {
                    sound.pauseAsync();
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [sound, isJimRohnRoute, isPlaying]);

    const toggleAudio = async () => {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
        } else {
            await sound.playAsync();
            setIsPlaying(true);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />

            {/* Floating Audio Control */}
            {isJimRohnRoute && (
                <TouchableOpacity
                    style={[styles.floatingBtn, { top: insets.top + 16 }]}
                    onPress={toggleAudio}
                    activeOpacity={0.8}
                >
                    {isPlaying ? (
                        <Music size={20} color="#6B21A8" />
                    ) : (
                        <Play size={20} color="#94A3B8" />
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    floatingBtn: {
        position: 'absolute',
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    }
});
