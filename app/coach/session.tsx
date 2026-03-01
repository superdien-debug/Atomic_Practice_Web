import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft, Sparkles, BookOpen, Clock, Leaf, Zap,
    CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react-native';
import {
    aiCoachService,
    type KarmaCoachingResponse,
    type KarmaPractice,
    type UserType
} from '../../services/aiCoachService';

const BG = '#FDFBF7';
const MAROON = '#800000';
const GOLD = '#D4AF37';
const TEAL = '#0F766E';
const EMERALD = '#059669';

// ─── Collapsible Practice Card ────────────────────────────────────────────────
function PracticeItem({
    item, index, userType
}: {
    item: { timeSlot: string; practice: string; seedType: string; durationMinutes: number };
    index: number;
    userType: UserType;
}) {
    const [expanded, setExpanded] = useState(index === 0);
    const isPractitioner = userType === 'Practitioner';

    return (
        <TouchableOpacity
            style={[
                styles.practiceItem,
                expanded && { borderColor: isPractitioner ? GOLD + '60' : TEAL + '60' }
            ]}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.85}
        >
            <View style={styles.practiceItemHeader}>
                <View style={[
                    styles.indexBadge,
                    { backgroundColor: isPractitioner ? GOLD + '20' : TEAL + '15' }
                ]}>
                    <Text style={[styles.indexNum, { color: isPractitioner ? GOLD : TEAL }]}>
                        {index + 1}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.timeSlot}>{item.timeSlot}</Text>
                    <View style={styles.seedTagRow}>
                        {isPractitioner ? <Zap size={10} color={GOLD} /> : <Leaf size={10} color={TEAL} />}
                        <Text style={[styles.seedTag, { color: isPractitioner ? GOLD : TEAL }]}>
                            {item.seedType}
                        </Text>
                        <View style={styles.durationPill}>
                            <Clock size={9} color="#999" />
                            <Text style={styles.durationText}>{item.durationMinutes} phút</Text>
                        </View>
                    </View>
                </View>
                {expanded
                    ? <ChevronUp size={18} color="#AAA" />
                    : <ChevronDown size={18} color="#AAA" />
                }
            </View>

            {expanded && (
                <View style={styles.practiceBody}>
                    <Text style={styles.practiceText}>{item.practice}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ─── Related Practice Card ────────────────────────────────────────────────────
function RelatedCard({ p }: { p: KarmaPractice }) {
    return (
        <View style={styles.relatedCard}>
            <Text style={styles.relatedTitle}>{p.title}</Text>
            {p.energy_type && (
                <Text style={styles.relatedEnergy}>{p.energy_type}</Text>
            )}
            <Text style={styles.relatedContent} numberOfLines={3}>{p.content}</Text>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function KarmaCoachResultScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const userType = (params.userType as UserType) || 'Normal';
    const isPractitioner = userType === 'Practitioner';

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<KarmaCoachingResponse | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadCoaching();
    }, []);

    const loadCoaching = async () => {
        try {
            setLoading(true);
            const data = await aiCoachService.getKarmaCoaching({
                userType,
                routine: params.routine as string || '',
                goals: params.goals as string || '',
                flaws: params.flaws as string || ''
            });
            setResult(data);
        } catch (error: any) {
            const msg = error.message?.includes('Mpoint')
                ? error.message
                : 'Không thể kết nối AI Coach lúc này. Vui lòng thử lại sau.';
            Alert.alert('Không thể tải', msg);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        setSaved(true);
        Alert.alert(
            isPractitioner ? '🔱 Công Đức đã được ghi nhận!' : '✨ Karmic Points đã được ghi nhận!',
            `+5 ${isPractitioner ? 'Merit Points' : 'Karmic Points'} cho phiên tư vấn này.\nHãy bắt đầu thực hành ngay hôm nay! 🙏`,
            [{ text: 'Về trang chủ', onPress: () => router.push('/dashboard') }]
        );
    };

    // ─ Loading state ─
    if (loading) {
        return (
            <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color={MAROON} />
                    <Text style={styles.loadingTitle}>Karma Coach đang phân tích...</Text>
                    <Text style={styles.loadingDesc}>
                        {isPractitioner
                            ? 'Đang chiếu soi Nhân Quả và thiết kế lộ trình tịnh hóa cho bạn 🔱'
                            : 'Đang phân tích lịch trình và thiết kế thói quen vi mô cho bạn 🌱'}
                    </Text>
                </View>
            </View>
        );
    }

    if (!result) return null;

    const accentColor = isPractitioner ? GOLD : TEAL;
    const pointsLabel = isPractitioner ? '🔱 Merit Points' : '✨ Karmic Points';

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>

            {/* Header with Agent Identity */}
            <View style={[styles.header, { backgroundColor: isPractitioner ? MAROON : TEAL }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
                        <ArrowLeft size={22} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerAgentThumb}>
                        <Image
                            source={require('../../assets/AIagent.jpg')}
                            style={styles.headerAgentImg}
                        />
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>
                        {isPractitioner ? '🔱 Lộ Trình Tịnh Hóa' : '🌱 Karma Coaching'}
                    </Text>
                    <Text style={styles.headerSub}>
                        {isPractitioner ? 'Hành giả Kim Cương Thừa' : 'Người bình thường'}
                    </Text>
                </View>
                <View style={styles.pointsBadge}>
                    <Sparkles size={12} color={isPractitioner ? GOLD : '#FFF'} />
                    <Text style={[styles.pointsBadgeText, { color: isPractitioner ? GOLD : '#FFF' }]}>
                        {pointsLabel}
                    </Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

                {/* ─ Karma Analysis ─ */}
                <View style={[styles.analysisCard, { borderColor: accentColor + '40' }]}>
                    <View style={styles.cardTitleRow}>
                        <BookOpen size={18} color={accentColor} />
                        <Text style={[styles.cardTitle, { color: accentColor }]}>
                            {isPractitioner ? '🔍 Phân tích Duyên Khởi & Tập Khí' : '🔍 Phân tích Nhân Quả'}
                        </Text>
                    </View>
                    <Text style={styles.analysisText}>{result.karmaAnalysis}</Text>
                </View>

                {/* ─ Atomic Practices ─ */}
                <Text style={styles.sectionTitle}>
                    {isPractitioner ? '📿 Lộ trình Tịnh hóa Vi mô' : '💊 Đơn thuốc Thói quen Vi mô'}
                </Text>
                <Text style={styles.sectionSub}>
                    Nhấn vào Each mục để xem chi tiết hành động cụ thể.
                </Text>
                {result.atomicPractices.map((item, idx) => (
                    <PracticeItem key={idx} item={item} index={idx} userType={userType} />
                ))}

                {/* ─ Related Practices from Library ─ */}
                {result.relatedPractices.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
                            📚 Bài thực hành từ Thư viện
                        </Text>
                        <Text style={styles.sectionSub}>
                            Karma Coach đã tìm thấy {result.relatedPractices.length} bài thực hành liên quan.
                        </Text>
                        {result.relatedPractices.map(p => (
                            <RelatedCard key={p.id} p={p} />
                        ))}
                    </>
                )}

                {/* ─ Encouragement ─ */}
                <View style={styles.encourageCard}>
                    <Text style={styles.encourageQuote}>{result.encouragement}</Text>
                    <Text style={styles.encourageSig}>— Karma Coach 🙏</Text>
                </View>

                {/* ─ Save Button ─ */}
                {!saved ? (
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: isPractitioner ? MAROON : EMERALD }]} onPress={handleSave} activeOpacity={0.85}>
                        <CheckCircle2 size={20} color="#FFF" />
                        <Text style={styles.saveBtnText}>
                            Ghi nhận & nhận {pointsLabel}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.savedBadge, { borderColor: accentColor }]}>
                        <CheckCircle2 size={18} color={accentColor} />
                        <Text style={[styles.savedText, { color: accentColor }]}>
                            Đã ghi nhận! +5 {isPractitioner ? 'Merit' : 'Karmic'} Points
                        </Text>
                    </View>
                )}

                <View style={{ height: Math.max(insets.bottom + 20, 40) }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
    },
    headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginTop: 1 },
    pointsBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20,
    },
    pointsBadgeText: { fontSize: 10, fontWeight: '700' },

    loadingCard: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 32, margin: 24,
        alignItems: 'center', gap: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    loadingTitle: { fontSize: 18, fontWeight: '700', color: MAROON, textAlign: 'center' },
    loadingDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },

    analysisCard: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        borderWidth: 1.5, marginBottom: 28,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: '700' },
    analysisText: { fontSize: 14, color: '#555', lineHeight: 22 },

    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
    sectionSub: { fontSize: 13, color: '#AAA', marginBottom: 14 },

    practiceItem: {
        backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12,
        borderWidth: 1.5, borderColor: '#EEE', overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    practiceItemHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    },
    indexBadge: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    indexNum: { fontSize: 16, fontWeight: '800' },
    timeSlot: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 4 },
    seedTagRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
    seedTag: { fontSize: 11, fontWeight: '700' },
    durationPill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#F5F5F5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginLeft: 6,
    },
    durationText: { fontSize: 10, color: '#999', fontWeight: '600' },
    practiceBody: {
        paddingHorizontal: 14, paddingBottom: 14,
        borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 12,
    },
    practiceText: { fontSize: 14, color: '#444', lineHeight: 22 },

    relatedCard: {
        backgroundColor: '#FFF8EF', borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: GOLD + '30', marginBottom: 10,
    },
    relatedTitle: { fontSize: 14, fontWeight: '700', color: MAROON, marginBottom: 3 },
    relatedEnergy: { fontSize: 11, color: GOLD, fontWeight: '700', marginBottom: 6 },
    relatedContent: { fontSize: 13, color: '#666', lineHeight: 19 },

    encourageCard: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 20,
        borderLeftWidth: 4, borderLeftColor: MAROON, marginTop: 28, marginBottom: 24,
    },
    encourageQuote: { fontSize: 15, color: '#444', fontStyle: 'italic', lineHeight: 24, marginBottom: 10 },
    encourageSig: { fontSize: 13, color: MAROON, fontWeight: '700', textAlign: 'right' },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 18, borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
        marginBottom: 12,
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    savedBadge: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
        marginBottom: 12,
    },
    savedText: { fontSize: 15, fontWeight: '700' },

    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBack: {
        padding: 5,
    },
    headerAgentThumb: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden',
        backgroundColor: '#FFF',
    },
    headerAgentImg: {
        width: '100%',
        height: '100%',
    },
});
