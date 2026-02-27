import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, Platform, StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Star } from 'lucide-react-native';
import { challengeService } from '../../services/challengeService';
import { practiceService } from '../../services/practiceService';
import { MIN_CREATION_SCORE } from '../../utils/rankUtils';
import { VajraModal } from '../../components/VajraModal';
import { useT } from '../../i18n/useT';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
    bg: '#FEF9EF',
    burgundy: '#800000',
    gold: '#D4AF37',
    text: '#1A1A1A',
    textMute: '#717171',
    border: '#E5E5E5',
    cardBg: '#FFFFFF',
};

const DURATIONS = ['7', '21', '30', '108', '365'] as const;

export default function CreateChallengeScreen() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetGoal, setTargetGoal] = useState('20');
    const [durationDays, setDuration] = useState('7');
    const [difficulty, setDifficulty] = useState(3);   // 1–5
    const [isDaily, setIsDaily] = useState(false);
    const [loading, setLoading] = useState(false);
    const t = useT();

    // Modal state
    const [modal, setModal] = useState<{
        visible: boolean; icon: string; title: string;
        message: string; variant: 'success' | 'warning' | 'danger'; onDismiss?: () => void;
    }>({ visible: false, icon: '', title: '', message: '', variant: 'success' });

    const [score, setScore] = useState<number | null>(null);

    React.useEffect(() => {
        checkLevel();
    }, []);

    const checkLevel = async () => {
        try {
            const currentScore = await practiceService.calculateTotalScore();
            setScore(currentScore);
            if (currentScore < MIN_CREATION_SCORE) {
                const title = '🔐 Phân quyền';
                const msg = `Chỉ những Hành giả đạt Cấp độ 2 (từ 500 điểm Merit) mới được phép tạo Thử thách mới. Hiện tại bạn đang có ${currentScore} điểm.`;

                if (Platform.OS === 'web') {
                    window.alert(`${title}\n\n${msg}`);
                    router.back();
                } else {
                    showModal(
                        '🔐',
                        title,
                        msg,
                        'warning',
                        () => router.back()
                    );
                }
            }
        } catch (error) {
            console.error('[Create Challenge] Level check error:', error);
        }
    };

    const showModal = (icon: string, title: string, message: string,
        variant: 'success' | 'warning' | 'danger' = 'success', onDismiss?: () => void) => {
        setModal({ visible: true, icon, title, message, variant, onDismiss });
    };
    const closeModal = () => {
        const cb = modal.onDismiss;
        setModal(m => ({ ...m, visible: false }));
        cb?.();
    };

    const difficultyLabel = ['', 'Beginner', 'Beginner+', 'Intermediate', 'Advanced', 'Master'][difficulty] || '';

    const handleCreate = async (asDraft = false) => {
        if (!title || !targetGoal) {
            showModal('⚠️', t('error'), t('fillAllFields'), 'warning');
            return;
        }
        setLoading(true);
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + parseInt(durationDays));

            const toDateStr = (d: Date) => d.toISOString().split('T')[0]; // YYYY-MM-DD

            await challengeService.createChallenge({
                title,
                description,
                target_type: 'accumulation',
                target_goal: parseInt(targetGoal),
                difficulty,
                is_daily: isDaily,
                start_date: toDateStr(startDate),
                end_date: toDateStr(endDate),
            });

            showModal(
                asDraft ? '📝' : '🚀',
                asDraft ? t('saveAsDraft') : t('challengeLaunched'),
                asDraft ? 'Your challenge has been saved as a draft.' : t('broadcastToSangha'),
                'success',
                () => router.back(),
            );
        } catch (e: any) {
            showModal('❌', t('error'), e.message || 'Failed to create challenge.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.root}>
            <VajraModal
                visible={modal.visible}
                icon={modal.icon}
                title={modal.title}
                message={modal.message}
                variant={modal.variant}
                onDismiss={closeModal}
            />
            <StatusBar style="light" />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>New Challenge</Text>
                <TouchableOpacity onPress={() => handleCreate(false)} style={s.headerBtn}>
                    <Text style={s.headerSave}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Section 1: Challenge Identity */}
                <Card>
                    <SectionHeader icon="🏅" label="Identity" />

                    <FieldLabel>Challenge Name</FieldLabel>
                    <TextInput
                        style={s.input}
                        placeholder="e.g., 100k Mantra Marathon"
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />

                    <FieldLabel style={{ marginTop: 20 }}>Instructions / Motivation</FieldLabel>
                    <TextInput
                        style={[s.input, s.textarea]}
                        placeholder="Why should others join this?"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </Card>

                {/* Section 2: Goal & Duration */}
                <Card style={{ marginTop: 16 }}>
                    <SectionHeader icon="🎯" label="Goal & Duration" />

                    <FieldLabel>Target (Accumulation)</FieldLabel>
                    <View style={s.inputRow}>
                        <TextInput
                            style={[s.input, { flex: 1 }]}
                            placeholder="e.g. 108"
                            keyboardType="numeric"
                            value={targetGoal}
                            onChangeText={setTargetGoal}
                        />
                    </View>

                    <FieldLabel style={{ marginTop: 20 }}>Duration (Days)</FieldLabel>
                    <View style={s.durationGrid}>
                        {DURATIONS.map(d => {
                            const active = durationDays === d;
                            return (
                                <TouchableOpacity
                                    key={d}
                                    onPress={() => setDuration(d)}
                                    style={[s.durationBtn, active && s.durationBtnActive]}
                                >
                                    <Text style={[s.durationText, active && s.durationTextActive]}>{d}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', padding: 12, borderRadius: 12 }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <FieldLabel style={{ marginBottom: 2 }}>Tích lũy hàng ngày</FieldLabel>
                            <Text style={{ fontSize: 11, color: '#999', fontWeight: '500' }}>Cho phép nhập túc số mỗi ngày</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsDaily(!isDaily)}
                            style={{
                                width: 50, height: 28, borderRadius: 14,
                                backgroundColor: isDaily ? C.gold : '#DDD',
                                padding: 2, justifyContent: 'center'
                            }}
                        >
                            <View style={{
                                width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF',
                                transform: [{ translateX: isDaily ? 22 : 0 }]
                            }} />
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Section 3: Difficulty */}
                <Card style={{ marginTop: 16 }}>
                    <SectionHeader icon="⭐" label="Difficulty" />

                    <View style={s.starCard}>
                        <View style={s.starRow}>
                            {Array.from({ length: 5 }).map((_, i) => {
                                const filled = i < difficulty;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setDifficulty(i + 1)}
                                    >
                                        <Star
                                            size={42}
                                            color={filled ? C.gold : '#EEE'}
                                            fill={filled ? C.gold : 'transparent'}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <Text style={s.diffLabel}>{difficultyLabel} Practice</Text>
                    </View>
                </Card>

                {/* Launch Button */}
                <TouchableOpacity
                    onPress={() => handleCreate(false)}
                    disabled={loading}
                    style={[s.launchBtn, loading && { opacity: 0.6 }]}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={s.launchText}>LAUNCH CHALLENGE</Text>
                    )}
                </TouchableOpacity>

                {/* Save as Draft */}
                <TouchableOpacity
                    onPress={() => handleCreate(true)}
                    disabled={loading}
                    style={{ alignItems: 'center', marginTop: 16, paddingVertical: 12 }}
                >
                    <Text style={s.draftText}>Save as Draft</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
    return <View style={[s.card, style]}>{children}</View>;
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
            <Text style={s.sectionLabel}>{label}</Text>
        </View>
    );
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: any }) {
    return <Text style={[s.fieldLabel, style]}>{children}</Text>;
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FEF9EF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: '#800000',
    },
    headerBtn: { width: 44, alignItems: 'center' },
    headerTitle: { color: '#FFF', fontWeight: '800', fontSize: 18 },
    headerSave: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20, padding: 20,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    sectionLabel: { color: '#800000', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
    fieldLabel: { color: '#717171', fontSize: 12, fontWeight: '700', marginBottom: 8 },
    input: {
        backgroundColor: '#F5F5F5', borderRadius: 12, padding: 15,
        fontSize: 16, color: '#1A1A1A',
    },
    textarea: { minHeight: 100, textAlignVertical: 'top' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    durationGrid: { flexDirection: 'row', gap: 10 },
    durationBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F5F5F5',
    },
    durationBtnActive: { backgroundColor: '#800000' },
    durationText: { color: '#717171', fontWeight: '700', fontSize: 16 },
    durationTextActive: { color: '#FFF' },
    starCard: { padding: 20, alignItems: 'center' },
    starRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    diffLabel: { color: '#717171', fontSize: 14, fontWeight: '700' },
    launchBtn: {
        marginTop: 24, height: 60, borderRadius: 30,
        backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#D4AF37', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    launchText: { color: '#800000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    draftText: { color: '#717171', fontWeight: '700', fontSize: 14, textDecorationLine: 'underline' },
});
