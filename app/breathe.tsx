import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Easing as RNEasing, Dimensions, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Play, Pause, ArrowLeft, Volume2, VolumeX, Settings, ChevronDown } from 'lucide-react-native';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

// Vajrayana Theme Colors
const GOLD = '#D4AF37';
const CARD = '#FFF';
const BG = '#FEF9EF';
const MAROON = '#800000';
const MAROON_LIGHT = '#A02020';
const GOLD_LIGHT = '#FDE047';

type BreathPhase = 'INHALE' | 'HOLD_IN' | 'EXHALE' | 'HOLD_OUT';

interface BreathingMode {
    id: string;
    name: string;
    description: string;
    sequence: { phase: BreathPhase, duration: number, color: string }[];
}

const MODES: BreathingMode[] = [
    {
        id: 'equal',
        name: 'Cân bằng (4-4)',
        description: 'Khám phá sức mạnh của việc hít thở đều, một kỹ thuật đã được chứng minh để giảm áp lực và tăng cường sự bình tâm tĩnh lặng.',
        sequence: [
            { phase: 'INHALE', duration: 4, color: '#38bdf8' }, // sky-400
            { phase: 'EXHALE', duration: 4, color: '#34d399' }  // emerald-400
        ]
    },
    {
        id: 'box',
        name: 'Thở hộp (4-4-4-4)',
        description: 'Tăng cường sự tập trung và giảm căng thẳng tức thì với kỹ thuật thở hộp của đặc nhiệm.',
        sequence: [
            { phase: 'INHALE', duration: 4, color: '#38bdf8' },
            { phase: 'HOLD_IN', duration: 4, color: '#818cf8' }, // indigo-400
            { phase: 'EXHALE', duration: 4, color: '#34d399' },
            { phase: 'HOLD_OUT', duration: 4, color: '#a78bfa' }  // indigo-400 (light)
        ]
    },
    {
        id: '478',
        name: 'Thư giãn (4-7-8)',
        description: 'Làm dịu hệ thần kinh để dễ dàng đi vào giấc ngủ hoặc giảm lo âu sâu sắc.',
        sequence: [
            { phase: 'INHALE', duration: 4, color: '#38bdf8' },
            { phase: 'HOLD_IN', duration: 7, color: '#818cf8' },
            { phase: 'EXHALE', duration: 8, color: '#34d399' }
        ]
    }
];

function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const PhaseLabels: Record<BreathPhase, string> = {
    INHALE: 'HÍT VÀO',
    HOLD_IN: 'GIỮ HƠI',
    EXHALE: 'THỞ RA',
    HOLD_OUT: 'GIỮ HƠI'
};

export default function BreatheScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [mode, setMode] = useState<BreathingMode>(MODES[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sequenceIndex, setSequenceIndex] = useState(0);
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(MODES[0].sequence[0].duration);
    const [totalElapsed, setTotalElapsed] = useState(0);
    const [cycles, setCycles] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showModeModal, setShowModeModal] = useState(false);

    const currentPhaseData = mode.sequence[sequenceIndex];

    // Audio players
    const [inhaleSound, setInhaleSound] = useState<Audio.Sound | null>(null);
    const [exhaleSound, setExhaleSound] = useState<Audio.Sound | null>(null);
    const [sound7, setSound7] = useState<Audio.Sound | null>(null);
    const [sound8, setSound8] = useState<Audio.Sound | null>(null);

    // Animation values
    const circleScale = useRef(new Animated.Value(1)).current;

    // Load sounds on mount
    useEffect(() => {
        let isMounted = true;
        async function loadSounds() {
            try {
                const { sound: sIn } = await Audio.Sound.createAsync(
                    require('../assets/music/inhale.wav')
                );
                const { sound: sEx } = await Audio.Sound.createAsync(
                    require('../assets/music/exhale.wav')
                );
                const { sound: s7 } = await Audio.Sound.createAsync(
                    require('../assets/music/7.wav')
                );
                const { sound: s8 } = await Audio.Sound.createAsync(
                    require('../assets/music/8.wav')
                );
                if (isMounted) {
                    setInhaleSound(sIn);
                    setExhaleSound(sEx);
                    setSound7(s7);
                    setSound8(s8);
                } else {
                    sIn.unloadAsync();
                    sEx.unloadAsync();
                    s7.unloadAsync();
                    s8.unloadAsync();
                }
            } catch (error) {
                console.error('Error loading sounds:', error);
            }
        }
        loadSounds();

        return () => {
            isMounted = false;
            if (inhaleSound) inhaleSound.unloadAsync();
            if (exhaleSound) exhaleSound.unloadAsync();
            if (sound7) sound7.unloadAsync();
            if (sound8) sound8.unloadAsync();
        };
    }, []);

    // Main timer & animation logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isPlaying) {
            // First tick trigger
            if (phaseTimeLeft === mode.sequence[sequenceIndex].duration && totalElapsed === 0) {
                triggerPhaseChange(sequenceIndex);
            }

            interval = setInterval(() => {
                setTotalElapsed(prev => prev + 1);

                setPhaseTimeLeft(prev => {
                    const next = prev - 1;
                    if (next <= 0) {
                        return handlePhaseTransition();
                    }
                    return next;
                });
            }, 1000);
        } else {
            // Pause animation
            circleScale.stopAnimation();
        }

        return () => clearInterval(interval);
    }, [isPlaying, sequenceIndex, phaseTimeLeft, soundEnabled, inhaleSound, exhaleSound, sound7, sound8, mode]);

    const handlePhaseTransition = () => {
        const nextIndex = (sequenceIndex + 1) % mode.sequence.length;
        setSequenceIndex(nextIndex);

        if (nextIndex === 0) {
            setCycles(prev => prev + 1);
        }

        triggerPhaseChange(nextIndex);
        return mode.sequence[nextIndex].duration;
    };

    const triggerPhaseChange = (idx: number) => {
        const pData = mode.sequence[idx];

        // Play sound if enabled
        if (soundEnabled) {
            if (mode.id === '478') {
                if (pData.phase === 'INHALE' && inhaleSound) {
                    inhaleSound.replayAsync();
                } else if (pData.duration === 7 && sound7) {
                    sound7.replayAsync();
                } else if (pData.duration === 8 && sound8) {
                    sound8.replayAsync();
                }
            } else {
                if (pData.phase === 'INHALE' && inhaleSound) {
                    inhaleSound.replayAsync();
                } else if (pData.phase === 'EXHALE' && exhaleSound) {
                    exhaleSound.replayAsync();
                }
            }
        }

        // Animate Circle
        let toValue = 1; // Default/Exhale
        if (pData.phase === 'INHALE') toValue = 1.6;
        else if (pData.phase === 'HOLD_IN') toValue = 1.6;
        else if (pData.phase === 'HOLD_OUT') toValue = 1;

        Animated.timing(circleScale, {
            toValue,
            duration: pData.duration * 1000,
            easing: RNEasing.linear,
            useNativeDriver: true,
        }).start();
    };

    const togglePlay = () => {
        if (!isPlaying) {
            // Re-trigger animation from current position based on remaining time
            const pData = mode.sequence[sequenceIndex];
            const remainingDuration = phaseTimeLeft * 1000;

            let toValue = 1;
            if (pData.phase === 'INHALE') toValue = 1.6;
            else if (pData.phase === 'HOLD_IN') toValue = 1.6;
            else if (pData.phase === 'HOLD_OUT') toValue = 1;

            Animated.timing(circleScale, {
                toValue,
                duration: remainingDuration,
                easing: RNEasing.linear,
                useNativeDriver: true,
            }).start();
        }
        setIsPlaying(!isPlaying);
    };

    const resetSession = () => {
        setIsPlaying(false);
        setSequenceIndex(0);
        setPhaseTimeLeft(mode.sequence[0].duration);
        setTotalElapsed(0);
        setCycles(0);

        // Reset animations
        circleScale.stopAnimation();
        circleScale.setValue(1);
    };

    const changeMode = (selectedMode: BreathingMode) => {
        setMode(selectedMode);
        setIsPlaying(false);
        setSequenceIndex(0);
        setPhaseTimeLeft(selectedMode.sequence[0].duration);
        setTotalElapsed(0);
        setCycles(0);
        circleScale.stopAnimation();
        circleScale.setValue(1);
        setShowModeModal(false);
    };

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <ArrowLeft size={24} color={GOLD} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hơi Thở Chánh Niệm</Text>
                <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)} style={styles.headerBtn}>
                    {soundEnabled ? <Volume2 size={24} color={GOLD} /> : <VolumeX size={24} color={GOLD} />}
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1, alignItems: 'center' }}>
                {/* Mode Selector */}
                <TouchableOpacity
                    style={styles.modeSelector}
                    onPress={() => setShowModeModal(true)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.modeSelectorText}>{mode.name}</Text>
                    <ChevronDown size={20} color={MAROON} />
                </TouchableOpacity>

                {/* Subtitle */}
                <Text style={styles.subtitle}>{mode.description}</Text>

                {/* Animation Area */}
                <View style={styles.animationContainer}>
                    <Animated.View style={[
                        styles.circleOuter,
                        {
                            transform: [{ scale: circleScale }],
                            backgroundColor: currentPhaseData.color
                        }
                    ]} />
                    <View style={styles.circleInner}>
                        <Text style={styles.phaseText}>{PhaseLabels[currentPhaseData.phase]}</Text>
                        <Text style={styles.timeText}>{phaseTimeLeft}</Text>
                    </View>
                </View>

                {/* Pattern Bar */}
                <View style={styles.patternBar}>
                    {mode.sequence.map((seq, i) => (
                        <View key={i} style={[
                            styles.patternSegment,
                            { backgroundColor: seq.color, flex: seq.duration },
                            i === sequenceIndex ? { opacity: 1, borderWidth: 2, borderColor: '#FFF' } : { opacity: 0.6 }
                        ]}>
                            <Text style={styles.patternText} numberOfLines={1}>
                                {PhaseLabels[seq.phase]}
                            </Text>
                            <Text style={styles.patternSubText}>{seq.duration}s</Text>
                        </View>
                    ))}
                </View>

                {/* Controls */}
                <View style={styles.controlsContainer}>
                    <TouchableOpacity
                        style={[styles.playPauseBtn, isPlaying ? { backgroundColor: '#F59E0B' } : { backgroundColor: MAROON }]}
                        onPress={togglePlay}
                    >
                        {isPlaying ? <Pause size={36} color="#FFF" /> : <Play size={36} color="#FFF" style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>

                    <Text style={styles.totalTime}>{formatTime(totalElapsed)}</Text>
                    <Text style={styles.cyclesText}>Số chu kỳ đã hoàn thành: <Text style={{ fontWeight: 'bold' }}>{cycles}</Text></Text>

                    <TouchableOpacity onPress={resetSession} style={styles.resetBtn}>
                        <Text style={styles.resetText}>Làm Lại</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Mode Selection Modal */}
            <Modal visible={showModeModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn bài tập thở</Text>
                        {MODES.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.modeOption, mode.id === m.id && styles.modeOptionActive]}
                                onPress={() => changeMode(m)}
                            >
                                <Text style={[styles.modeOptionName, mode.id === m.id && { color: MAROON }]}>
                                    {m.name}
                                </Text>
                                <Text style={styles.modeOptionDesc} numberOfLines={2}>
                                    {m.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowModeModal(false)}>
                            <Text style={styles.modalCloseText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 20,
        backgroundColor: MAROON
    },
    headerBtn: {
        padding: 8
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: GOLD,
        flex: 1,
        textAlign: 'center'
    },
    modeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: MAROON + '20'
    },
    modeSelectorText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: MAROON,
        marginRight: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 30,
        marginTop: 20,
        lineHeight: 22
    },
    animationContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 280,
        width: '100%'
    },
    circleOuter: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        opacity: 0.3,
    },
    circleInner: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#FFF',
        elevation: 8,
        shadowColor: MAROON,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        borderWidth: 4,
        borderColor: GOLD + '50'
    },
    phaseText: {
        fontSize: 16,
        fontWeight: '900',
        color: MAROON,
        letterSpacing: 1
    },
    timeText: {
        fontSize: 48,
        fontWeight: '300',
        color: MAROON,
        marginTop: 0
    },
    patternBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        height: 50,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 30,
        width: width - 40,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    patternSegment: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2
    },
    patternText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 10,
        textTransform: 'uppercase'
    },
    patternSubText: {
        color: '#FFF',
        fontSize: 10,
        opacity: 0.8
    },
    controlsContainer: {
        alignItems: 'center',
        paddingBottom: 40,
        width: '100%'
    },
    playPauseBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        marginBottom: 20
    },
    totalTime: {
        fontSize: 28,
        fontWeight: '300',
        color: MAROON,
        marginBottom: 8,
        fontVariant: ['tabular-nums']
    },
    cyclesText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20
    },
    resetBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(128,0,0,0.1)',
        borderRadius: 20
    },
    resetText: {
        color: MAROON,
        fontSize: 14,
        fontWeight: 'bold'
    },

    // Modal
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: MAROON,
        marginBottom: 20,
        textAlign: 'center'
    },
    modeOption: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent'
    },
    modeOptionActive: {
        backgroundColor: 'rgba(212,175,55,0.1)',
        borderColor: GOLD
    },
    modeOptionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    modeOptionDesc: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18
    },
    modalCloseBtn: {
        marginTop: 10,
        paddingVertical: 12,
        alignItems: 'center'
    },
    modalCloseText: {
        color: '#999',
        fontWeight: 'bold',
        fontSize: 16
    }
});
