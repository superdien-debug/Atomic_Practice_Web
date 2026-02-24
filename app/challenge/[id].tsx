import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, FlatList, StyleSheet, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Calendar, Users, Settings2, Trophy, Send, Star, Trash2, Heart, MessageSquare, Info, Medal } from 'lucide-react-native';
import { challengeService, Challenge, ChallengeMessage } from '../../services/challengeService';
import { useCallback, useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getRank } from '../../utils/rankUtils';
import { VajraModal } from '../../components/VajraModal';
import { useT } from '../../i18n/useT';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
    maroonRed: '#5e0b0b',
    maroonDark: '#3d0808',
    gold: '#d4af37',
    goldLight: '#f4cf6d',
    bg: '#ffffff',
    cardBg: '#f8f8f8',
    cardBorder: '#f0f0f0',
    text: '#1e293b',
    textMute: '#64748b',
    textFaint: '#94a3b8',
};

export default function ChallengeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user, role } = useAuthStore();
    const insets = useSafeAreaInsets();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [messages, setMessages] = useState<ChallengeMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [participants, setParticipants] = useState<any[]>([]);
    const [refreshingChat, setRefreshingChat] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [dailyInput, setDailyInput] = useState('');
    const [savingAccumulation, setSavingAccumulation] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'leaderboard' | 'chat'>('details');
    const t = useT();


    // Modal state
    const [modal, setModal] = useState<{
        visible: boolean; icon: string; title: string; message: string;
        variant: 'success' | 'warning' | 'danger';
        confirmLabel?: string; cancelLabel?: string;
        onConfirm?: () => void;
    }>({ visible: false, icon: '', title: '', message: '', variant: 'success' });

    const showModal = (
        icon: string, title: string, message: string,
        variant: 'success' | 'warning' | 'danger' = 'success',
        opts?: { confirmLabel?: string; cancelLabel?: string; onConfirm?: () => void }
    ) => setModal({ visible: true, icon, title, message, variant, ...opts });

    const closeModal = () => setModal(m => ({ ...m, visible: false }));

    const fetchChallenge = async () => {
        if (!user || typeof id !== 'string') return;
        try {
            const data = await challengeService.fetchChallengeById(id);
            setChallenge(data);
            const parts = await challengeService.fetchParticipants(id);
            setParticipants(parts || []);
        } catch {
            showModal('❌', 'Error', 'Could not load challenge details', 'danger');
        } finally { setLoading(false); }
    };

    const fetchChat = async () => {
        if (!user || typeof id !== 'string') return;
        const msgs = await challengeService.fetchMessages(id);
        setMessages(msgs || []);
    };

    useFocusEffect(useCallback(() => {
        fetchChallenge();
        fetchChat();
    }, [id, user]));

    useEffect(() => {
        const t = setInterval(fetchChat, 5000);
        return () => clearInterval(t);
    }, []);

    const handleJoin = async () => {
        if (!challenge) return;
        setJoining(true);
        try {
            await challengeService.joinChallenge(challenge.id);
            showModal('🙏', t('joinChallenge'), 'You have joined the sangha for this challenge 🙏');
            fetchChallenge();
        } catch { showModal('❌', t('error'), 'Failed to join challenge', 'danger'); }
        finally { setJoining(false); }
    };

    const handleDelete = () => {
        if (!challenge) return;
        showModal('🗑️', 'Xóa Thử Thách', 'Bạn có chắc chắn muốn xóa thử thách này khỏi hệ thống? Tất cả dữ liệu sẽ biến mất.', 'danger', {
            confirmLabel: 'XÓA NGAY',
            cancelLabel: 'Hủy',
            onConfirm: async () => {
                setDeleting(true);
                try {
                    await challengeService.deleteChallenge(challenge.id);
                    router.replace('/dashboard/challenge');
                } catch (err) {
                    console.error('Delete error:', err);
                    showModal('❌', 'Lỗi', 'Không thể xóa thử thách.', 'danger');
                } finally { setDeleting(false); }
            }
        });
    };

    const handleToggleComplete = async () => {
        if (!challenge) return;
        const willComplete = challenge.participant_status !== 'completed';
        if (willComplete) {
            showModal('🏆', t('markAsDone'), 'Have you really finished the target?', 'warning', {
                confirmLabel: 'Yes, I did it!',
                cancelLabel: t('cancel'),
                onConfirm: () => executeToggle(true),
            });
        } else {
            executeToggle(false);
        }
    };

    const executeToggle = async (done: boolean) => {
        if (!challenge) return;
        setJoining(true);
        try {
            await challengeService.toggleCompletion(challenge.id, done);
            showModal(done ? '🏆' : '✅', done ? 'Congratulations!' : 'Updated',
                done ? 'Marked as Completed!' : 'Status reverted.');
            fetchChallenge();
        } catch { showModal('❌', 'Error', 'Failed to update status', 'danger'); }
        finally { setJoining(false); }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !challenge) return;
        try {
            await challengeService.sendMessage(challenge.id, newMessage);
            setNewMessage('');
            fetchChat();
        } catch { showModal('❌', 'Error', 'Failed to send message', 'danger'); }
    };

    const handleUpdateAccumulation = async () => {
        if (!challenge || !dailyInput.trim()) return;
        const count = parseInt(dailyInput);
        if (isNaN(count)) return;

        setSavingAccumulation(true);
        try {
            const newTotal = (challenge.accumulated_count || 0) + count;
            await challengeService.updateAccumulation(challenge.id, newTotal);
            showModal('🙏', 'Cập nhật thành công', `Bạn đã tích lũy thêm ${count} túc số. Tổng cộng: ${newTotal}`);
            setDailyInput('');
            fetchChallenge();
        } catch (err) {
            console.error(err);
            showModal('❌', 'Lỗi', 'Không thể cập nhật túc số.', 'danger');
        } finally {
            setSavingAccumulation(false);
        }
    };

    if (loading || !challenge) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.gold} />
            </View>
        );
    }

    const isCompleted = challenge.participant_status === 'completed';
    const completedParticipants = participants.filter(p => p.status === 'completed');
    const difficulty = Math.min(Math.max(challenge.difficulty || 3, 1), 5);

    return (
        <View style={s.root}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />
            <VajraModal
                visible={modal.visible}
                icon={modal.icon}
                title={modal.title}
                message={modal.message}
                variant={modal.variant}
                confirmLabel={modal.confirmLabel}
                cancelLabel={modal.cancelLabel}
                onConfirm={modal.onConfirm}
                onDismiss={closeModal}
            />

            {/* ── Header (dark maroon) ── */}
            <View style={s.header}>
                <View style={s.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
                        <ArrowLeft size={22} color={C.gold} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle} numberOfLines={1}>{challenge.title}</Text>
                    <View style={{ width: 44 }} />
                </View>
                {/* Difficulty badge */}
                <View style={s.difficultyRow}>
                    <View style={s.difficultyBadge}>
                        <Text style={s.difficultyLabel}>DIFFICULTY</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={11}
                                    color={C.gold}
                                    fill={i < difficulty ? C.gold : 'transparent'}
                                />
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* ── Tab Bar ── */}
            <View style={s.tabBar}>
                <TouchableOpacity onPress={() => setActiveTab('details')} style={[s.tabItem, activeTab === 'details' && s.tabItemActive]}>
                    <Info size={18} color={activeTab === 'details' ? C.gold : 'rgba(255,255,255,0.4)'} />
                    <Text style={[s.tabText, activeTab === 'details' && s.tabTextActive]}>DETAILS</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('leaderboard')} style={[s.tabItem, activeTab === 'leaderboard' && s.tabItemActive]}>
                    <Medal size={18} color={activeTab === 'leaderboard' ? C.gold : 'rgba(255,255,255,0.4)'} />
                    <Text style={[s.tabText, activeTab === 'leaderboard' && s.tabTextActive]}>RANKING</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('chat')} style={[s.tabItem, activeTab === 'chat' && s.tabItemActive]}>
                    <MessageSquare size={18} color={activeTab === 'chat' ? C.gold : 'rgba(255,255,255,0.4)'} />
                    <Text style={[s.tabText, activeTab === 'chat' && s.tabTextActive]}>SANGHA</Text>
                </TouchableOpacity>
            </View>

            {/* ── Content ── */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={s.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {activeTab === 'details' && (
                        <>
                            {/* Daily Accumulation Input (Only if is_daily and joined) */}
                            {challenge.is_daily && challenge.is_joined && !isCompleted && (
                                <View style={[s.section, { marginTop: 16 }]}>
                                    <SectionHeading label="Tích lũy hàng ngày" />
                                    <View style={s.accumulationCard}>
                                        <View style={s.accRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.accMainLabel}>Đã tích lũy</Text>
                                                <Text style={s.accValue}>{challenge.accumulated_count || 0}</Text>
                                            </View>
                                            <View style={s.accDivider} />
                                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                                <Text style={s.accMainLabel}>Mục tiêu</Text>
                                                <Text style={s.accValue}>{challenge.target_goal}</Text>
                                            </View>
                                        </View>

                                        <View style={s.inputContainer}>
                                            <View style={{ flex: 1, marginRight: 12 }}>
                                                <Text style={s.inputHint}>Nhập số túc số cho hôm nay</Text>
                                                <TextInput
                                                    style={s.accInput}
                                                    placeholder="e.g. 1000"
                                                    keyboardType="numeric"
                                                    value={dailyInput}
                                                    onChangeText={setDailyInput}
                                                />
                                            </View>
                                            <TouchableOpacity
                                                onPress={handleUpdateAccumulation}
                                                disabled={savingAccumulation || !dailyInput.trim()}
                                                style={[s.accSyncBtn, (!dailyInput.trim() || savingAccumulation) && { opacity: 0.5 }]}
                                            >
                                                {savingAccumulation ? (
                                                    <ActivityIndicator size="small" color="#FFF" />
                                                ) : (
                                                    <Text style={s.accSyncText}>CẬP NHẬT</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Stats Grid */}
                            <View style={s.statsGrid}>
                                <StatCard
                                    icon={<Calendar size={22} color={C.maroonRed} />}
                                    label="Start Date"
                                    value={new Date(challenge.start_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                />
                                <StatCard
                                    icon={<Users size={22} color={C.maroonRed} />}
                                    label="Sangha"
                                    value={`${participants.length} practitioners`}
                                />
                                <StatCard
                                    icon={<Settings2 size={22} color={C.maroonRed} />}
                                    label="Target"
                                    value={String(challenge.target_goal || '108')}
                                />
                            </View>

                            {/* Rules of Engagement */}
                            <View style={s.section}>
                                <SectionHeading label="Rules of Engagement" />
                                <View style={s.ruleCard}>
                                    <Text style={s.ruleText}>
                                        {challenge.description || 'Accumulate mantras as a community to generate merit for all beings. Your daily practice contributes to the collective liberation.'}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}

                    {activeTab === 'leaderboard' && (
                        <View style={s.section}>
                            <View style={{ marginTop: 20 }}>
                                <SectionHeading label="Sangha Leaderboard" />
                                <View style={s.listCard}>
                                    {participants.length > 0 ? (
                                        participants
                                            .sort((a, b) => (b.accumulated_count || 0) - (a.accumulated_count || 0))
                                            .map((p, i) => {
                                                const name = p.profiles?.display_name || 'Unknown';
                                                const userRank = getRank(p.global_score || 0);
                                                const isGold = i === 0;
                                                const isSilver = i === 1;
                                                const isBronze = i === 2;

                                                return (
                                                    <TouchableOpacity
                                                        key={i}
                                                        onPress={() => router.push(`/practitioner/${p.user_id}` as any)}
                                                        style={[s.participantRow, i > 0 && s.participantBorder]}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                            <View style={[
                                                                s.avatar,
                                                                { borderColor: userRank.color, borderWidth: userRank.borderWidth },
                                                                (isGold || isSilver || isBronze) && { borderColor: isGold ? '#FFD700' : isSilver ? '#C0C0C0' : '#CD7F32', borderWidth: 2.5 }
                                                            ]}>
                                                                <Text style={s.avatarLetter}>{name[0].toUpperCase()}</Text>
                                                            </View>
                                                            <View>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                                    <Text style={s.participantName}>{name}</Text>
                                                                    {p.user_id === user?.id && <Text style={{ fontSize: 10, color: C.maroonRed, fontWeight: '700' }}>(YOU)</Text>}
                                                                </View>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                                                                    <View
                                                                        style={{
                                                                            backgroundColor: userRank.color + '20',
                                                                            paddingHorizontal: 6,
                                                                            paddingVertical: 1,
                                                                            borderRadius: 3
                                                                        }}
                                                                    >
                                                                        <Text style={{ color: userRank.color, fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>
                                                                            {userRank.title}
                                                                        </Text>
                                                                    </View>
                                                                    <Text style={[s.participantRole, { marginLeft: 6 }]}>Rank #{i + 1}</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={{ fontWeight: '900', color: C.maroonRed }}>{p.accumulated_count?.toLocaleString() || 0}</Text>
                                                            <Text style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase' }}>Tích lũy</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })
                                    ) : (
                                        <Text style={s.emptyText}>Be the first to join and lead! 🙏</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === 'chat' && (
                        <View style={s.section}>
                            <View style={{ marginTop: 20 }}>
                                <SectionHeading label="Community Discussion" />
                                <View style={s.listCard}>
                                    {messages.length > 0 ? (
                                        messages.map((m: ChallengeMessage, i: number) => (
                                            <TouchableOpacity
                                                key={m.id}
                                                onPress={() => router.push(`/practitioner/${m.user_id}` as any)}
                                                style={[s.commentRow, i > 0 && s.participantBorder]}
                                            >
                                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                                    <View style={[s.avatar, { width: 32, height: 32, borderRadius: 16 }]}>
                                                        <Text style={[s.avatarLetter, { fontSize: 13 }]}>{m.profiles?.display_name?.charAt(0) || 'U'}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                            <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>{m.profiles?.display_name}</Text>
                                                            <Text style={{ color: C.textFaint, fontSize: 10 }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                                        </View>
                                                        <Text style={{ color: C.textMute, marginTop: 4, fontSize: 14, lineHeight: 20 }}>{m.message}</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={s.emptyText}>No messages yet. Greet the Sangha! 🙏</Text>
                                    )}
                                </View>

                                {/* Message Input */}
                                <View style={s.chatInputRow}>
                                    <TextInput
                                        style={s.chatField}
                                        placeholder="Send a message..."
                                        placeholderTextColor={C.textFaint}
                                        value={newMessage}
                                        onChangeText={setNewMessage}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        onPress={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        style={[s.sendBtn, { backgroundColor: newMessage.trim() ? C.gold : '#f1f5f9' }]}
                                    >
                                        <Send size={18} color={newMessage.trim() ? C.maroonDark : '#94a3b8'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Bottom Action Button (Details tab only) ── */}
            <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    {role === 'admin' && (
                        <TouchableOpacity
                            onPress={handleDelete}
                            disabled={deleting}
                            activeOpacity={0.7}
                            style={[s.actionBtn, { width: 56, backgroundColor: '#fee2e2', shadowColor: '#ef4444' }]}
                        >
                            {deleting ? <ActivityIndicator size="small" color="#ef4444" /> : <Trash2 size={22} color="#ef4444" />}
                        </TouchableOpacity>
                    )}

                    {challenge.is_joined ? (
                        <TouchableOpacity
                            onPress={handleToggleComplete}
                            disabled={joining}
                            activeOpacity={0.88}
                            style={[s.actionBtn, { flex: 1 }, isCompleted && s.actionBtnDone]}
                        >
                            <Text style={[s.actionBtnText, isCompleted && { color: '#64748b' }]}>
                                {joining ? 'Updating...' : isCompleted ? '✅ Achieved — Revert' : 'Mark as Done'}
                            </Text>
                            {!isCompleted && !joining && <Trophy size={18} color={C.maroonDark} fill={C.maroonDark} />}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleJoin}
                            disabled={joining}
                            activeOpacity={0.88}
                            style={[s.actionBtn, { flex: 1, backgroundColor: C.maroonRed }]}
                        >
                            <Text style={[s.actionBtnText, { color: C.gold }]}>
                                {joining ? 'Joining...' : 'Join the Sangha 🙏'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <View style={sc.statCard}>
            <View style={sc.iconWrap}>{icon}</View>
            <Text style={sc.statLabel}>{label}</Text>
            <Text style={sc.statValue}>{value}</Text>
        </View>
    );
}

function SectionHeading({ label }: { label: string }) {
    return (
        <View style={sc.sectionHeadRow}>
            <View style={sc.headDash} />
            <Text style={sc.sectionTitle}>{label}</Text>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        backgroundColor: C.maroonRed,
        paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.2)',
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    backBtn: { padding: 8, borderRadius: 999, width: 44, alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '800', fontSize: 17 },
    difficultyRow: { alignItems: 'center' },
    difficultyBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(212,175,55,0.12)',
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
        borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5,
    },
    difficultyLabel: { color: C.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

    // Tabs
    tabBar: {
        flexDirection: 'row',
        backgroundColor: C.maroonRed,
        borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.2)',
        paddingHorizontal: 10,
    },
    tabItem: {
        flex: 1, paddingVertical: 14, alignItems: 'center',
        borderBottomWidth: 3, borderBottomColor: 'transparent',
    },
    tabItemActive: { borderBottomColor: C.gold },
    tabText: { fontWeight: '800', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: 1 },
    tabTextActive: { color: C.gold },

    // Content
    content: { flex: 1, backgroundColor: C.bg },

    accumulationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    accRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    accMainLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    accValue: { color: C.maroonRed, fontSize: 24, fontWeight: '900' },
    accDivider: { width: 1, height: 30, backgroundColor: '#f1f5f9', marginHorizontal: 20 },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end' },
    inputHint: { color: '#64748b', fontSize: 12, fontWeight: '600', marginBottom: 8 },
    accInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    accSyncBtn: {
        backgroundColor: C.maroonRed,
        height: 48,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accSyncText: { color: C.gold, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

    statsGrid: {
        flexDirection: 'row', gap: 8,
        padding: 16,
    },
    section: { paddingHorizontal: 16, paddingBottom: 20 },

    ruleCard: {
        borderLeftWidth: 4, borderLeftColor: C.maroonRed,
        backgroundColor: '#f8f8f8', padding: 16, borderRadius: 4,
    },
    ruleText: { color: '#475569', fontSize: 14, lineHeight: 22 },

    listCard: {
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#f1f5f9',
        overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    participantRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14,
    },
    participantBorder: { borderTopWidth: 1, borderTopColor: '#f8f8f8' },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: C.maroonRed,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
    participantName: { color: '#1e293b', fontWeight: '600', fontSize: 14 },
    participantRole: { color: '#94a3b8', fontSize: 10, marginTop: 1 },
    emptyText: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: 20 },

    // Chat
    commentRow: { padding: 14 },
    chatInputRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginTop: 16,
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    chatField: {
        flex: 1, backgroundColor: '#f1f5f9', borderRadius: 999,
        paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 14, color: '#1e293b',
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },

    // Bottom bar
    bottomBar: {
        paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
        backgroundColor: C.gold, height: 56, borderRadius: 16,
        shadowColor: C.gold, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    actionBtnDone: {
        backgroundColor: '#f1f5f9',
        shadowOpacity: 0, elevation: 0,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    actionBtnText: { color: C.maroonDark, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});

const sc = StyleSheet.create({
    statCard: {
        flex: 1, alignItems: 'center', backgroundColor: C.cardBg,
        borderRadius: 14, padding: 14, gap: 6,
        borderWidth: 1, borderColor: C.cardBorder,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    iconWrap: { marginBottom: 2 },
    statLabel: {
        color: C.textFaint, fontSize: 9, fontWeight: '700',
        letterSpacing: 1.2, textTransform: 'uppercase',
    },
    statValue: { color: C.text, fontSize: 12, fontWeight: '800', textAlign: 'center' },

    sectionHeadRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    headDash: { width: 24, height: 1.5, backgroundColor: 'rgba(94,11,11,0.2)' },
    sectionTitle: {
        color: C.maroonRed, fontSize: 10, fontWeight: '800',
        letterSpacing: 1.5, textTransform: 'uppercase',
    },
});
