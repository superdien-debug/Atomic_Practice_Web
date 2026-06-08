import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Easing as RNEasing, Dimensions, Modal, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Play, Pause, ArrowLeft, Info, RotateCcw, Volume2, VolumeX } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useT } from '../../i18n/useT';
import { practiceService } from '../../services/practiceService';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

// Colors
const GOLD = '#D4AF37';
const BG = '#FEF9EF';
const MAROON = '#800000';
const RED_SOFT = '#FFF5F5';
const RED_DEEP = '#C53030';

const TRACKS = [
    {
        id: 'vipassana',
        title: 'Thiền Vipassana',
        instructor: 'Thầy Minh Niệm',
        duration: 41 * 60 + 13,
        audio: require('../../assets/music/Vipassana_01.mp3'),
        color: '#C53030'
    },
    {
        id: 'buong',
        title: 'Thiền Buông Thư',
        instructor: 'Thầy Minh Niệm',
        duration: 61 * 60 + 44,
        audio: require('../../assets/music/buong.mp3'),
        color: '#2D3748'
    }
];

export default function VipassanaScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const t = useT();

    const [selectedTrack, setSelectedTrack] = useState(TRACKS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(TRACKS[0].duration);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [practiceId, setPracticeId] = useState<string | null>(null);

    // Animation values
    const circleAnim = useRef(new Animated.Value(0)).current;

    // 1. Load Audio for the selected track
    useEffect(() => {
        let isMounted = true;

        async function initAudio() {
            try {
                if (sound) {
                    await sound.unloadAsync();
                }
                const { sound: audioSound } = await Audio.Sound.createAsync(
                    selectedTrack.audio,
                    { shouldPlay: false }
                );
                if (isMounted) {
                    setSound(audioSound);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to init Meditation Audio:', err);
                if (isMounted) setLoading(false);
            }
        }

        initAudio();

        return () => {
            isMounted = false;
        };
    }, [selectedTrack]);

    // Use the global Vipassana practice ID to avoid creating multiple practice cards
    useEffect(() => {
        setPracticeId('00000000-0000-0000-0000-000000000001');
    }, []);

    const changeTrack = async (track: typeof TRACKS[0]) => {
        setIsPlaying(false);
        if (sound) {
            await sound.stopAsync();
        }
        setSelectedTrack(track);
        setSecondsLeft(track.duration);
        circleAnim.setValue(0);
        setShowTrackModal(false);
    };

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined = undefined;
        if (isPlaying && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        handleComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, secondsLeft]);

    // Animation Logic
    useEffect(() => {
        if (isPlaying) {
            Animated.timing(circleAnim, {
                toValue: 1 - (secondsLeft / selectedTrack.duration),
                duration: 1000,
                easing: RNEasing.linear,
                useNativeDriver: false,
            }).start();
        }
    }, [secondsLeft, isPlaying]);

    const handleComplete = async () => {
        setIsPlaying(false);
        if (sound) await sound.stopAsync();
        
        if (practiceId) {
            try {
                await practiceService.toggleCompletion(practiceId, undefined, true);
                console.log('Session logged');
                Alert.alert("Chúc mừng", "Đạo hữu đã hoàn thành xuất sắc phiên thiền Vipassana! (+15 Công đức & +15 MPoints)");
            } catch (err) {
                console.error('Failed to log session:', err);
            }
        }
    };

    const handleCompleteManual = async () => {
        if (!practiceId) {
            Alert.alert("Lỗi", "Không tìm thấy thẻ thiền Vipassana. Vui lòng đợi trong giây lát.");
            return;
        }

        try {
            await practiceService.toggleCompletion(practiceId, undefined, true);
            Alert.alert("Cát tường", "Đã ghi nhận thành công phiên thiền Vipassana hôm nay! (+15 Công đức & +15 MPoints)");
        } catch (err: any) {
            console.error(err);
            Alert.alert("Lỗi", err.message || "Không thể ghi nhận. Vui lòng thử lại!");
        }
    };

    const togglePlay = async () => {
        if (!sound) return;

        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            if (secondsLeft === 0) {
                setSecondsLeft(selectedTrack.duration);
                await sound.replayAsync();
            } else {
                await sound.playAsync();
            }
        }
        setIsPlaying(!isPlaying);
    };

    const reset = async () => {
        setIsPlaying(false);
        setSecondsLeft(selectedTrack.duration);
        circleAnim.setValue(0);
        if (sound) {
            await sound.stopAsync();
            await sound.setPositionAsync(0);
        }
    };

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progressValue = 1 - (secondsLeft / selectedTrack.duration);

    if (loading) {
        return (
            <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={MAROON} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <ArrowLeft size={24} color={GOLD} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hành Thiền</Text>
                <TouchableOpacity onPress={() => setShowInfo(true)} style={styles.headerBtn}>
                    <Info size={24} color={GOLD} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Track Selector Button */}
                <TouchableOpacity 
                    style={styles.trackSelector}
                    onPress={() => setShowTrackModal(true)}
                >
                    <Text style={styles.trackTitle}>{selectedTrack.title}</Text>
                    <Text style={styles.instructor}>{selectedTrack.instructor}</Text>
                    <View style={styles.chevronWrap}>
                         <Text style={{color: GOLD, fontSize: 12, marginRight: 5}}>Đổi bài thiền</Text>
                         <Info size={14} color={GOLD} />
                    </View>
                </TouchableOpacity>

                {/* Timer Circle */}
                <View style={styles.timerContainer}>
                    <View style={styles.circleBg}>
                         <View style={[
                             styles.circleProgress,
                             {
                                 borderColor: progressValue > 0 ? selectedTrack.color : 'transparent',
                                 transform: [{ rotate: '-90deg' }],
                             }
                         ]} />
                        <View style={styles.circleInner}>
                            <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
                            <Text style={styles.timerLabel}>TỔNG {formatTime(selectedTrack.duration)}</Text>
                        </View>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarWrap}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressValue * 100}%`, backgroundColor: selectedTrack.color }]} />
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity onPress={reset} style={styles.secondaryBtn}>
                        <RotateCcw size={28} color={MAROON} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
                        {isPlaying ? (
                            <Pause size={48} color="#FFF" fill="#FFF" />
                        ) : (
                            <Play size={48} color="#FFF" fill="#FFF" style={{ marginLeft: 4 }} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)} style={styles.secondaryBtn}>
                        {soundEnabled ? <Volume2 size={28} color={MAROON} /> : <VolumeX size={28} color={MAROON} />}
                    </TouchableOpacity>
                </View>

                {/* History card with Complete button */}
                <View style={styles.historyCard}>
                   <Text style={[styles.historyTitle, { color: selectedTrack.color }]}>Ghi nhận thực hành</Text>
                   <Text style={styles.historySub}>
                       Hệ thống tự động ghi nhận khi đếm ngược kết thúc. Đạo hữu cũng có thể bấm nút bên dưới để ghi nhận thủ công sau khi hoàn thành phiên thiền.
                   </Text>
                   
                   <TouchableOpacity
                       style={[styles.completeBtn, { backgroundColor: selectedTrack.color, marginTop: 12 }]}
                       onPress={handleCompleteManual}
                   >
                       <Text style={styles.completeBtnText}>✓ GHI NHẬN HOÀN THÀNH (+15đ)</Text>
                   </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Track Selection Modal */}
            <Modal visible={showTrackModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                    <View style={[styles.modalContent, { borderRadius: 24, marginHorizontal: 20 }]}>
                        <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 20 }]}>Chọn Bài Thiền</Text>
                        {TRACKS.map((t) => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.trackOption,
                                    selectedTrack.id === t.id && { backgroundColor: t.color + '10', borderColor: t.color }
                                ]}
                                onPress={() => changeTrack(t)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.trackOptionTitle, { color: t.color }]}>{t.title}</Text>
                                    <Text style={styles.trackOptionSub}>{t.instructor} • {formatTime(t.duration)}</Text>
                                </View>
                                {selectedTrack.id === t.id && <Info size={20} color={t.color} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.modalCloseBtn, { marginTop: 20 }]} onPress={() => setShowTrackModal(false)}>
                            <Text style={styles.modalCloseText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Info Modal */}
            <Modal visible={showInfo} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thiền Vipassana là gì?</Text>
                            <TouchableOpacity onPress={() => setShowInfo(false)}>
                                <Text style={styles.closeBtn}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.mdText}>
                                Thiền Vipassana (Pāli: Vipassanā) là một phương pháp thiền cổ xưa của Ấn Độ, được truyền dạy bởi Gautama Buddha, với mục tiêu giúp con người thấy rõ bản chất của thực tại thông qua việc quan sát trực tiếp thân và tâm.{"\n\n"}
                                “Vipassana” có nghĩa là “thấy như thật” – nhìn mọi sự vật, cảm giác, suy nghĩ đúng với bản chất của chúng:{"\n"}
                                👉 Vô thường (anicca) – Khổ (dukkha) – Vô ngã (anatta){"\n\n"}
                                Khác với các phương pháp thiền tập trung (samatha), Vipassana không nhằm đạt trạng thái thư giãn đơn thuần, mà hướng đến trí tuệ sâu sắc, giúp giải phóng khỏi khổ đau và các phản ứng tiêu cực trong cuộc sống.{"\n\n"}
                                📍 Các bước thực hành thiền Vipassana{"\n"}
                                1. Chuẩn bị (Giới & môi trường){"\n"}
                                - Chọn nơi yên tĩnh, ít bị gián đoạn{"\n"}
                                - Ngồi thoải mái (không cần quá cứng nhắc){"\n"}
                                - Giữ tâm ý nghiêm túc, không kỳ vọng quá cao{"\n\n"}
                                2. Anapana – Quan sát hơi thở{"\n"}
                                - Tập trung vào hơi thở ra vào ở vùng mũi{"\n"}
                                - Không điều khiển, chỉ quan sát tự nhiên{"\n\n"}
                                3. Vipassana – Quét thân (body scan){"\n"}
                                - Bắt đầu quan sát cảm giác trên cơ thể từ đầu đến chân{"\n"}
                                - Nhận biết mọi cảm giác: nóng, lạnh, tê, rung, đau…{"\n"}
                                - Không phản ứng (không thích – không ghét){"\n\n"}
                                🎯 Mục tiêu: Sống tỉnh thức và hiệu quả hơn (rất phù hợp với lãnh đạo & quản trị).
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 20, backgroundColor: MAROON
    },
    headerBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: GOLD, flex: 1, textAlign: 'center' },
    scrollContent: { alignItems: 'center', paddingBottom: 40 },
    instructor: { fontSize: 16, color: MAROON, fontWeight: '600', opacity: 0.8 },
    trackSelector: {
        width: '90%', marginTop: 24, padding: 16, backgroundColor: '#FFF',
        borderRadius: 16, borderWidth: 1, borderColor: GOLD + '30',
        alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05,
        shadowRadius: 10, elevation: 2
    },
    trackTitle: { fontSize: 20, fontWeight: '800', color: MAROON, marginBottom: 4 },
    chevronWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    timerContainer: { marginTop: 30, alignItems: 'center', justifyContent: 'center' },
    circleBg: {
        width: 240, height: 240, borderRadius: 120,
        backgroundColor: '#FFF', elevation: 8, shadowColor: MAROON,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
        borderWidth: 2, borderColor: GOLD + '40', alignItems: 'center', justifyContent: 'center'
    },
    circleProgress: {
        position: 'absolute', width: 240, height: 240, borderRadius: 120,
        borderWidth: 6, borderColor: 'transparent',
    },
    circleInner: { alignItems: 'center' },
    timerText: { fontSize: 48, fontWeight: '300', color: MAROON, fontVariant: ['tabular-nums'] },
    timerLabel: { fontSize: 12, color: MAROON, fontWeight: 'bold', opacity: 0.6, marginTop: 4 },
    progressBarWrap: { width: '80%', marginTop: 40 },
    progressBarBg: { height: 8, backgroundColor: MAROON + '10', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 40, marginTop: 50 },
    playBtn: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: MAROON,
        alignItems: 'center', justifyContent: 'center', elevation: 6
    },
    secondaryBtn: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: MAROON + '08',
        alignItems: 'center', justifyContent: 'center'
    },
    historyCard: {
        width: '90%', marginTop: 60, padding: 20, backgroundColor: RED_SOFT,
        borderRadius: 16, borderWidth: 1, borderColor: RED_DEEP + '20'
    },
    historyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    historySub: { fontSize: 13, color: MAROON, opacity: 0.7, lineHeight: 18 },
    completeBtn: {
        height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
    },
    completeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '80%', padding: 24
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: MAROON },
    closeBtn: { color: RED_DEEP, fontWeight: '700', fontSize: 16 },
    modalBody: { flex: 0 },
    mdText: { fontSize: 15, color: '#333', lineHeight: 24 },
    trackOption: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12,
        borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12
    },
    trackOptionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    trackOptionSub: { fontSize: 13, color: '#64748B' },
    modalCloseBtn: { padding: 16, alignItems: 'center' },
    modalCloseText: { fontSize: 16, fontWeight: '700', color: '#64748B' }
});
