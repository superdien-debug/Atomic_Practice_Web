import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView, Image,
    TouchableOpacity, Keyboard, TouchableWithoutFeedback, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft, ArrowRight, Sparkles, Leaf, Zap, ChevronRight, Lock
} from 'lucide-react-native';
import { userService } from '../../../services/userService';
import { type UserType } from '../../../services/aiCoachService';

const BG = '#FDFBF7';
const MAROON = '#800000';
const GOLD = '#D4AF37';
const TEAL = '#0F766E';

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
    return (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={{
                        width: i === current ? 20 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i === current ? MAROON : '#DDD',
                    }}
                />
            ))}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function KarmaCoachScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState(0);
    const [userType, setUserType] = useState<UserType>('Normal');
    const [routine, setRoutine] = useState('');
    const [goals, setGoals] = useState('');
    const [flaws, setFlaws] = useState('');
    const [mpoints, setMpoints] = useState<number | null>(null);

    useEffect(() => {
        userService.getMPointsBalance().then(setMpoints).catch(console.error);
    }, []);

    const handleStart = () => {
        if (!routine.trim() || !goals.trim() || !flaws.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng điền đủ cả 3 mục để Karma Coach có thể tư vấn chính xác nhé!');
            return;
        }
        router.push({
            pathname: '/coach/spiritual/session',
            params: { userType, routine, goals, flaws }
        });
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
                    <ArrowLeft size={24} color={step > 0 ? '#333' : MAROON} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>🌱 Karma Coaching</Text>
                    <Text style={styles.headerSub}>Gieo Nhân • Gặt Quả</Text>
                </View>
                {mpoints !== null && (
                    <View style={styles.mpointBadge}>
                        <Sparkles size={10} color={GOLD} />
                        <Text style={styles.mpointText}>{mpoints} Mpt</Text>
                    </View>
                )}
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >

                {/* ─ STEP 0: User Type Selection ─ */}
                {step === 0 && (
                    <View style={styles.stepContainer}>
                        <View style={styles.agentImageContainer}>
                            <Image
                                source={require('../../../assets/AIagent.jpg')}
                                style={styles.agentImage}
                                resizeMode="cover"
                            />
                            <View style={styles.agentBadge}>
                                <Sparkles size={14} color="#FFF" />
                                <Text style={styles.agentBadgeText}>AI Assistant</Text>
                            </View>
                        </View>

                        <Text style={styles.stepTitle}>AI Skills System</Text>
                        <Text style={styles.stepSub}>
                            Chọn một kỹ năng chuyên môn của Karma Coach mà bạn muốn nhận tư vấn ngay bây giờ.
                        </Text>

                        <TouchableOpacity
                            style={[styles.typeCard, userType === 'Normal' && styles.typeCardActive]}
                            onPress={() => setUserType('Normal')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.typeIconBg, { backgroundColor: TEAL + '15' }]}>
                                <Leaf size={28} color={TEAL} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.typeName, userType === 'Normal' && { color: MAROON }]}>
                                    🌱 Người bình thường
                                </Text>
                                <Text style={styles.typeDesc}>
                                    Tư vấn dựa trên Tâm lý học hành vi & Luật Nhân Quả đời thường. Không cần nền tảng tu tập.
                                </Text>
                                <Text style={styles.typePoints}>Nhận: Karmic Points ✨</Text>
                            </View>
                            {userType === 'Normal' && (
                                <View style={styles.typeCheck}><Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text></View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.typeCard, userType === 'Practitioner' && styles.typeCardActive]}
                            onPress={() => setUserType('Practitioner')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.typeIconBg, { backgroundColor: GOLD + '20' }]}>
                                <Zap size={28} color={GOLD} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.typeName, userType === 'Practitioner' && { color: MAROON }]}>
                                    🔱 Hành giả Kim Cương Thừa
                                </Text>
                                <Text style={styles.typeDesc}>
                                    Kết hợp Chú ngữ, Quán tưởng, Ngũ Đại & 5 Năng lượng Tác Pháp (Yangti Nakpo).
                                </Text>
                                <Text style={styles.typePoints}>Nhận: Merit Points 🔱</Text>
                            </View>
                            {userType === 'Practitioner' && (
                                <View style={styles.typeCheck}><Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text></View>
                            )}
                        </TouchableOpacity>

                        {/* Locked Skills */}
                        <View style={{ marginTop: 24 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Lock size={16} color="#999" />
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#555' }}>Kỹ năng sắp ra mắt (Locked)</Text>
                            </View>

                            {[
                                "Karma Mirror",
                                "Ngũ Độc Scanner",
                                "Ego Dissolver Micro-Challenge",
                                "Death Awareness Reminder",
                                "Merit Tracker",
                                "Relationship Micro-Healer",
                                "Emotion Regulator",
                                "Focus Copilot"
                            ].map((skill, index) => (
                                <View key={index} style={[styles.typeCard, { opacity: 0.6, marginBottom: 10, padding: 14 }]}>
                                    <View style={[styles.typeIconBg, { backgroundColor: '#F0F0F0', width: 44, height: 44 }]}>
                                        <Lock size={20} color="#999" />
                                    </View>
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <Text style={[styles.typeName, { color: '#666', marginBottom: 2, fontSize: 15 }]}>
                                            {skill}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#999' }}>Đang phát triển...</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={{ marginTop: 30 }}>
                            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(1)} activeOpacity={0.8}>
                                <Text style={styles.nextBtnText}>Tiếp theo</Text>
                                <ArrowRight size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ─ STEP 1: Input Form ─ */}
                {step === 1 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Mô tả cuộc sống của bạn</Text>
                        <Text style={styles.stepSub}>
                            Càng chi tiết, Karma Coach càng tư vấn chính xác. Viết tự nhiên như kể cho bạn bè nghe.
                        </Text>

                        {/* Routine */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>⏰ Lịch trình một ngày của tôi</Text>
                            <Text style={styles.fieldHint}>
                                VD: 6h dậy, 7h đi làm bằng xe, 12h ăn trưa ở công ty, 18h về, 22h‑23h lướt điện thoại, 23h ngủ.
                            </Text>
                            <TextInput
                                style={styles.textarea}
                                placeholder="Mô tả lịch trình ngày thường của bạn..."
                                placeholderTextColor="#AAA"
                                value={routine}
                                onChangeText={setRoutine}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Goals */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>🌟 Mong cầu của tôi</Text>
                            <Text style={styles.fieldHint}>
                                VD: Muốn thăng tiến công việc, tìm được người yêu, chữa lành bệnh dạ dày, gia đình hòa thuận.
                            </Text>
                            <TextInput
                                style={styles.textarea}
                                placeholder="Điều bạn mong muốn thay đổi hoặc đạt được..."
                                placeholderTextColor="#AAA"
                                value={goals}
                                onChangeText={setGoals}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Flaws */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>🔍 Thói quen tôi muốn từ bỏ</Text>
                            <Text style={styles.fieldHint}>
                                VD: Hay nổi nóng, trì hoãn công việc, hay phán xét, ngủ muộn, nghiện điện thoại.
                            </Text>
                            <TextInput
                                style={styles.textarea}
                                placeholder="Những thói quen xấu bạn nhận thấy ở bản thân..."
                                placeholderTextColor="#AAA"
                                value={flaws}
                                onChangeText={setFlaws}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 40 }}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
                                <ArrowLeft size={18} color={MAROON} />
                                <Text style={styles.backBtnText}>Quay lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={handleStart} activeOpacity={0.8}>
                                <Sparkles size={18} color="#FFF" />
                                <Text style={styles.nextBtnText}>Nhận tư vấn (10 Mpt)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </ScrollView>

            {/* Step dots */}
            <View style={[styles.dotsBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <StepDots current={step} total={2} />
                <Text style={styles.dotsLabel}>Bước {step + 1} / 2</Text>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: MAROON },
    headerSub: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 1 },
    mpointBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: GOLD + '15', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1, borderColor: GOLD + '30'
    },
    mpointText: { fontSize: 11, color: GOLD, fontWeight: '700' },

    stepContainer: { padding: 24 },
    stepTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
    stepSub: { fontSize: 14, color: '#777', lineHeight: 21, marginBottom: 28 },

    typeCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 14,
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        borderWidth: 2, borderColor: '#EEE',
        marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    typeCardActive: {
        borderColor: MAROON, backgroundColor: MAROON + '06',
    },
    typeIconBg: {
        width: 52, height: 52, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    typeName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 5 },
    typeDesc: { fontSize: 13, color: '#777', lineHeight: 19, marginBottom: 6 },
    typePoints: { fontSize: 12, color: GOLD, fontWeight: '700' },
    typeCheck: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: MAROON,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        alignSelf: 'center',
    },

    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
    fieldHint: { fontSize: 12, color: '#999', marginBottom: 8, lineHeight: 17 },
    textarea: {
        backgroundColor: '#FFF', borderRadius: 12,
        borderWidth: 1.5, borderColor: '#E5E5E5',
        padding: 14, fontSize: 14, color: '#333',
        minHeight: 90, lineHeight: 20,
    },

    nextBtn: {
        backgroundColor: MAROON, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: 14,
        shadowColor: MAROON, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
    },
    nextBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14,
        borderWidth: 1.5, borderColor: MAROON + '40',
    },
    backBtnText: { color: MAROON, fontSize: 14, fontWeight: '600' },

    dotsBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 28, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#F0EDE8',
    },
    dotsLabel: { fontSize: 12, color: '#BBB', fontWeight: '600' },

    agentImageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
        position: 'relative',
        backgroundColor: '#E5E5E5',
    },
    agentImage: {
        width: '100%',
        height: '100%',
    },
    agentBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    agentBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
