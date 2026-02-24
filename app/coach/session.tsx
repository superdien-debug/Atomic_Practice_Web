import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, CheckCircle2, Quote, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react-native';
import { aiCoachService, AtomicPracticeResponse } from '../../services/aiCoachService';

const BG = '#FDFBF7';
const MAROON = '#800000';
const GOLD = '#D4AF37';

export default function CoachSessionScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [practice, setPractice] = useState<AtomicPracticeResponse | null>(null);

    // Timer State
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadPractice();
    }, []);

    const loadPractice = async () => {
        try {
            setLoading(true);
            const req = {
                goal: params.goal as string || "Trì chú",
                minutes: parseInt(params.minutes as string) || 5,
                context: params.context as string || "Người dùng mới, muốn bắt đầu nhẹ nhàng",
                style: "ngắn gọn, truyền cảm hứng"
            };

            const data = await aiCoachService.getAtomicPractice(req);
            setPractice(data);
            setTimeLeft(data.duration_minutes * 60);

        } catch (error: any) {
            console.error('Failed to load atomic practice', error);
            const msg = (error.message && error.message.includes('Mpoint')) ? error.message : "Không thể kết nối tới AI Coach lúc này.";
            Alert.alert("Lỗi", msg);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // Timer Logic
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        if (practice) setTimeLeft(practice.duration_minutes * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const renderLoading = () => (
        <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={MAROON} />
            <Text style={{ marginTop: 20, color: '#666' }}>AI đang thiết kế bài thực hành cho bạn...</Text>
        </View>
    );

    if (loading) return renderLoading();
    if (!practice) return null;

    const progress = practice.duration_minutes > 0
        ? ((practice.duration_minutes * 60) - timeLeft) / (practice.duration_minutes * 60)
        : 0;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Coach Session</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {/* Title & Motivation */}
                <Text style={styles.title}>{practice.title}</Text>

                <View style={styles.motivationCard}>
                    <Quote size={20} color={GOLD} style={{ marginBottom: 10 }} />
                    <Text style={styles.motivationText}>{practice.motivation_line}</Text>
                </View>

                {/* Timer Section */}
                <View style={styles.timerSection}>
                    <View style={styles.timerCircle}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    </View>
                    <View style={styles.timerControls}>
                        <TouchableOpacity onPress={toggleTimer} style={styles.ctrlBtnBtn}>
                            {isActive ? <Pause size={24} color="#FFF" /> : <Play size={24} color="#FFF" style={{ marginLeft: 3 }} />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={resetTimer} style={styles.ctrlBtnOutline}>
                            <RotateCcw size={20} color={MAROON} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Steps */}
                <Text style={styles.sectionTitle}>Các bước thực hành &nbsp;🙏</Text>
                <View style={styles.stepsContainer}>
                    {practice.steps.map((step, idx) => (
                        <View key={idx} style={styles.stepItem}>
                            <View style={styles.stepNumberBadge}>
                                <Text style={styles.stepNumber}>{idx + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={styles.stepName}>{step.name}</Text>
                                    <Text style={styles.stepTime}>{step.duration_minutes} phút</Text>
                                </View>
                                <Text style={styles.stepDesc}>{step.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Reflection */}
                <View style={[styles.motivationCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                    <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Quán chiếu cuối buổi 🪷</Text>
                    <Text style={styles.motivationText}>{practice.reflection_question}</Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => {
                        Alert.alert("Hoàn thành", "Tuỳ hỷ công đức của bạn! 🙏");
                        router.back();
                    }}
                >
                    <CheckCircle2 size={20} color="#FFF" />
                    <Text style={styles.completeText}>Hoàn thành buổi tập</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 15, paddingVertical: 10
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },

    title: { fontSize: 26, fontWeight: '800', color: MAROON, marginBottom: 20, textAlign: 'center' },

    motivationCard: {
        backgroundColor: '#FFF8E7',
        padding: 20, borderRadius: 16,
        borderWidth: 1, borderColor: GOLD + '40',
        marginBottom: 30
    },
    motivationText: { fontSize: 16, color: '#555', fontStyle: 'italic', lineHeight: 24 },

    timerSection: { alignItems: 'center', marginBottom: 30 },
    timerCircle: {
        width: 150, height: 150, borderRadius: 75,
        backgroundColor: '#FFF',
        borderWidth: 4, borderColor: MAROON + '20',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
    },
    timerText: { fontSize: 40, fontWeight: '800', color: MAROON },
    timerControls: { flexDirection: 'row', gap: 15, marginTop: 20, alignItems: 'center' },
    ctrlBtnBtn: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: MAROON,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: MAROON, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4
    },
    ctrlBtnOutline: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF',
        borderWidth: 2, borderColor: MAROON,
        alignItems: 'center', justifyContent: 'center',
    },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15 },

    stepsContainer: { gap: 15, marginBottom: 30 },
    stepItem: {
        flexDirection: 'row', gap: 15,
        backgroundColor: '#FFF', padding: 15, borderRadius: 16,
        borderWidth: 1, borderColor: '#EEE'
    },
    stepNumberBadge: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: MAROON + '15',
        alignItems: 'center', justifyContent: 'center'
    },
    stepNumber: { color: MAROON, fontWeight: 'bold', fontSize: 14 },
    stepName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    stepTime: { fontSize: 12, fontWeight: '700', color: GOLD },
    stepDesc: { fontSize: 14, color: '#666', lineHeight: 20 },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingTop: 20,
        backgroundColor: 'rgba(253, 251, 247, 0.9)',
    },
    completeBtn: {
        backgroundColor: '#059669', // Emerald 600
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 18, borderRadius: 16,
        shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
    },
    completeText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
