import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput, Image,
    KeyboardAvoidingView, Platform, StyleSheet, Alert, ActivityIndicator, Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Flame, Users, LayoutGrid, Trophy, Send, Plus, Star, Trash2 } from 'lucide-react-native';
import { practiceService, Practice } from '../../services/practiceService';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { VajraModal } from '../../components/VajraModal';
import { useT } from '../../i18n/useT';
import { useAuthStore } from '../../store/authStore';
import { getRank } from '../../utils/rankUtils';
import { Bell, Clock, Calculator } from 'lucide-react-native';
import { tucsoService } from '../../services/tucsoService';
import { getLocalISODate } from '../../utils/dateUtils';
import { HabitTracker } from '../../components/HabitTracker';

// ─── Colors (Mirroring Challenge Detail Style) ──────────────────────────────
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

const getStreakStyle = (days: number) => {
    if (days >= 365) return { color: '#800000', fill: '#D4AF37' };
    if (days >= 120) return { color: '#7C3AED', fill: '#C084FC' };
    if (days >= 60) return { color: '#0891B2', fill: '#67E8F9' };
    if (days >= 45) return { color: '#059669', fill: '#6EE7B7' };
    if (days >= 30) return { color: '#B45309', fill: '#FDE047' };
    if (days >= 15) return { color: '#DB2777', fill: '#F472B6' };
    if (days >= 7) return { color: '#BE123C', fill: '#FB7185' };
    return { color: '#F97316', fill: 'transparent' };
};

export default function PracticeDetailScreen() {
    const { id, library } = useLocalSearchParams<{ id: string; library?: string }>();
    const isLibraryView = library === 'true';
    const router = useRouter();
    const t = useT();
    const insets = useSafeAreaInsets();
    const { role } = useAuthStore();

    const [practice, setPractice] = useState<Practice | null>(null);
    const [loading, setLoading] = useState(true);
    const [cloning, setCloning] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [updatingReminders, setUpdatingReminders] = useState(false);

    // Reminder state
    const [remindersEnabled, setRemindersEnabled] = useState(false);
    const [reminderTimes, setReminderTimes] = useState<string[]>([]);
    const [isOwner, setIsOwner] = useState(false);

    // Community data
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);

    // Completion state
    const [isCompleted, setIsCompleted] = useState(false);
    const [logId, setLogId] = useState<string | undefined>();
    const [completing, setCompleting] = useState(false);
    const [logHistory, setLogHistory] = useState<{ date: string; completed: boolean; streak: number }[]>([]);

    // Modal state
    const [modal, setModal] = useState<{
        visible: boolean; icon: string; title: string; message: string;
        variant: 'success' | 'warning' | 'danger';
        confirmLabel?: string; cancelLabel?: string;
        onConfirm?: () => void;
    }>({ visible: false, icon: '', title: '', message: '', variant: 'success' });

    // Sync Túc Số
    const [accType, setAccType] = useState<any>(null);
    const [accStats, setAccStats] = useState({ total_count: 0, total_duration: 0 });
    const [newLogCount, setNewLogCount] = useState('');
    const [logging, setLogging] = useState(false);

    const showModal = (
        icon: string, title: string, message: string,
        variant: 'success' | 'warning' | 'danger' = 'success',
        opts?: { confirmLabel?: string; cancelLabel?: string; onConfirm?: () => void }
    ) => setModal({ visible: true, icon, title, message, variant, ...opts });

    const closeModal = () => setModal(m => ({ ...m, visible: false }));

    useEffect(() => { loadData(); }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await practiceService.fetchPracticeById(id);
            if (!data) throw new Error('Not found');
            setPractice(data);

            const { data: { user } } = await supabase.auth.getUser();
            const own = data.user_id === user?.id;
            setIsOwner(own);

            if (own) {
                setRemindersEnabled((data.reminder_times?.length || 0) > 0);
                setReminderTimes(data.reminder_times || []);
            }

            // Fetch leaderboard and comments if practice is public
            if (data.is_public || data.origin_id) {
                const originId = data.origin_id || data.id;
                try {
                    const [lb, cmts] = await Promise.all([
                        practiceService.fetchPracticeLeaderboard(originId),
                        practiceService.fetchPracticeComments(originId)
                    ]);
                    setLeaderboard(lb || []);
                    setComments(cmts || []);
                } catch (dbErr) {
                    console.warn('DB Fetch warning:', dbErr);
                }
            }

            // Fetch today's log status
            const today = new Date().toISOString().split('T')[0];
            const { data: logs } = await supabase
                .from('practice_logs')
                .select('*')
                .eq('practice_id', id)
                .eq('log_date', today)
                .maybeSingle();

            if (logs) {
                setIsCompleted(logs.completed);
                setLogId(logs.id);
            }

            // Sync with Túc Số if it's a Yangti Stage
            const yangtiStages = ['Quy y và lễ lạy', 'Cúng dường Mandala', 'Sám hối Kim Cương Tát Đỏa', 'Guru Yoga', 'Tích lũy túc số 3Kaya'];
            if (yangtiStages.includes(data.title)) {
                try {
                    const type = await tucsoService.getOrCreateType(data.title);
                    setAccType(type);
                    const stats = await tucsoService.getStatsForType(type.id);
                    setAccStats(stats);
                } catch (err) {
                    console.error('Failed to init tucso:', err);
                }
            }

            // Fetch history to calculate running streaks for the chart
            const chartDays = 15;
            const bufferDays = 100; // Enough to calculate streaks effectively
            const oldestDate = new Date();
            oldestDate.setDate(oldestDate.getDate() - (chartDays + bufferDays));
            const dateStr = getLocalISODate(oldestDate);

            const { data: history } = await supabase
                .from('practice_logs')
                .select('log_date, completed')
                .eq('practice_id', id)
                .gte('log_date', dateStr)
                .order('log_date', { ascending: true });

            const historyMap = (history || []).reduce((acc: any, curr) => {
                acc[curr.log_date] = curr.completed;
                return acc;
            }, {});

            // Calculate running streaks for each day in the chart window (last 15 days)
            const fullHistory = [];
            let runningStreak = 0;

            // Anchor point for the display window
            const todayStr = getLocalISODate();
            const startOfWindow = new Date();
            startOfWindow.setDate(startOfWindow.getDate() - (chartDays - 1));
            const startStr = getLocalISODate(startOfWindow);

            // Loop from oldestDate up to today
            const tempDate = new Date(oldestDate);
            while (getLocalISODate(tempDate) <= todayStr) {
                const ds = getLocalISODate(tempDate);
                const completed = !!historyMap[ds];

                if (completed) {
                    runningStreak++;
                } else {
                    runningStreak = 0;
                }

                // If this date is within our 15-day display window, record it
                if (ds >= startStr) {
                    fullHistory.push({ date: ds, completed, streak: runningStreak });
                }

                tempDate.setDate(tempDate.getDate() + 1);
            }
            setLogHistory(fullHistory);

        } catch (err) {
            console.error('Detail fetch error:', err);
            showModal('❌', t('error'), 'Could not load practice details.', 'danger');
            router.back();
        } finally { setLoading(false); }
    };

    const handleLogTucSo = async () => {
        if (!accType || !newLogCount.trim()) return;
        const count = parseInt(newLogCount.trim(), 10);
        if (isNaN(count) || count <= 0) return;
        setLogging(true);
        try {
            await tucsoService.saveLog(accType.id, 0, count);
            const stats = await tucsoService.getStatsForType(accType.id);
            setAccStats(stats);
            setNewLogCount('');

            // Auto complete AP if not done
            if (!isCompleted) {
                await handleToggleComplete();
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Lỗi', 'Không thể lưu số đếm.');
        } finally {
            setLogging(false);
        }
    };

    const handleJoin = async () => {
        if (!practice) return;
        setCloning(true);
        try {
            await practiceService.clonePractice(practice.id);
            showModal('🙏', t('addToMyPlan'), 'Practice added to your plan! 🙏', 'success');
            router.replace('/dashboard/practice');
        } catch (err) {
            console.error('Clone error:', err);
            showModal('❌', t('error'), 'Failed to add practice to your plan.', 'danger');
        } finally { setCloning(false); }
    };

    const handleLeave = () => {
        if (!practice) return;
        showModal('⚠️', 'Từ bỏ bài thực hành', 'Bạn có chắc chắn muốn bỏ bài này không? Nó sẽ biến mất khỏi lịch trình của bạn.', 'warning', {
            confirmLabel: 'Đồng ý',
            cancelLabel: 'Hủy',
            onConfirm: async () => {
                setLeaving(true);
                try {
                    await practiceService.archivePractice(practice.id);
                    router.replace('/dashboard/practice');
                } catch (err) {
                    console.error('Leave error:', err);
                    showModal('❌', 'Lỗi', 'Không thể gỡ bỏ bài thực hành.', 'danger');
                } finally { setLeaving(false); }
            }
        });
    };

    const handleDelete = () => {
        if (!practice) return;
        showModal('🗑️', 'Xóa vĩnh viễn', 'Bạn có chắc chắn muốn xóa bài thực hành này khỏi hệ thống không? Hành động này không thể hoàn tác.', 'danger', {
            confirmLabel: 'XÓA NGAY',
            cancelLabel: 'Hủy',
            onConfirm: async () => {
                setDeleting(true);
                try {
                    await practiceService.deletePractice(practice.id);
                    router.replace('/dashboard/practice');
                } catch (err) {
                    console.error('Delete error:', err);
                    showModal('❌', 'Lỗi', 'Không thể xóa bài thực hành.', 'danger');
                } finally { setDeleting(false); }
            }
        });
    };

    const handleToggleComplete = async () => {
        if (!practice || completing) return;
        setCompleting(true);
        try {
            const nextStatus = !isCompleted;
            const res: any = await practiceService.toggleCompletion(practice.id, logId, nextStatus);
            if (res.data) {
                setIsCompleted(res.data.completed);
                setLogId(res.data.id);
            }
            showModal(nextStatus ? '🏆' : '✅', nextStatus ? 'Congratulation!' : 'Updated', nextStatus ? 'Tùy hỷ công đức! 🙏' : 'Status reverted.');
        } catch (err) {
            console.error('Toggle error:', err);
            showModal('❌', 'Error', 'Failed to update status.', 'danger');
        } finally { setCompleting(false); }
    };

    const handlePostComment = async () => {
        if (!commentText.trim() || !practice || posting) return;
        setPosting(true);
        try {
            const originId = practice.origin_id || practice.id;
            await practiceService.addPracticeComment(originId, commentText);
            setCommentText('');
            const cmts = await practiceService.fetchPracticeComments(originId);
            setComments(cmts || []);
        } catch (err) {
            console.error('Post comment error:', err);
            showModal('❌', 'Lỗi', 'Không thể gửi bình luận. Bạn có thể cần chạy SQL migration mới nhất.', 'danger');
        } finally { setPosting(false); }
    };

    const handleUpdateReminders = async () => {
        if (!practice || !isOwner) return;
        setUpdatingReminders(true);
        try {
            const finalTimes = remindersEnabled ? reminderTimes : [];
            await practiceService.updateReminderTimes(practice.id, finalTimes);

            // Reschedule local notifications
            const { notificationService } = require('../../services/notificationService');
            await notificationService.rescheduleAllPractices([{ ...practice, reminder_times: finalTimes }]);

            showModal('🔔', 'Success', 'Reminders updated successfully! 🙏', 'success');
        } catch (err) {
            console.error('Update reminders error:', err);
            showModal('❌', t('error'), 'Failed to update reminders.', 'danger');
        } finally { setUpdatingReminders(false); }
    };

    if (loading) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.gold} />
                <Text style={{ color: C.textMute, marginTop: 12 }}>Loading...</Text>
            </View>
        );
    }

    if (!practice) return null;

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

            {/* ── Header (Mirroring Challenge Style) ── */}
            <View style={s.header}>
                <View style={s.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
                        <ArrowLeft size={22} color={C.gold} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle} numberOfLines={1}>{practice.title}</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Badge Row (Mirroring Difficulty Row) */}
                <View style={s.badgeRow}>
                    <View style={s.categoryBadge}>
                        <Text style={s.badgeLabel}>{practice.category?.toUpperCase() || 'PRACTICE'}</Text>
                        <View style={s.badgeDot} />
                        <Text style={s.badgeSubLabel}>{practice.is_public ? 'PUBLIC' : 'PRIVATE'}</Text>
                    </View>
                </View>
            </View>

            {/* ── Content ── */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Stats Grid */}
                    <View style={s.statsGrid}>
                        <StatCard
                            icon={(() => {
                                const style = getStreakStyle(practice.streak || 0);
                                return <Flame size={22} color={style.color} fill={style.fill} />;
                            })()}
                            label="Streak"
                            value={`${practice.streak || 0} Days`}
                        />
                        <StatCard
                            icon={<Users size={22} color={C.maroonRed} />}
                            label="Sangha"
                            value={`${practice.real_participants_count || 1} users`}
                        />
                        <StatCard
                            icon={<LayoutGrid size={22} color={C.maroonRed} />}
                            label="Type"
                            value={practice.target_type || 'Count'}
                        />
                    </View>

                    {/* Personal Reminders (Only for joined practices) */}
                    {isOwner && !isLibraryView && (
                        <View style={s.section}>
                            <SectionHeading label="Personal Reminders" />
                            <View style={s.reminderCard}>
                                <View style={s.reminderHeader}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Bell size={18} color={C.maroonRed} />
                                        <Text style={s.reminderTitle}>Daily Reminders</Text>
                                    </View>
                                    <Switch
                                        value={remindersEnabled}
                                        onValueChange={setRemindersEnabled}
                                        trackColor={{ false: '#DDD', true: C.maroonRed }}
                                    />
                                </View>

                                {remindersEnabled && (
                                    <View style={{ marginTop: 16 }}>
                                        {reminderTimes.map((time, idx) => (
                                            <View key={idx} style={s.reminderRow}>
                                                <Clock size={16} color={C.textFaint} />
                                                <TextInput
                                                    style={s.timeInput}
                                                    value={time}
                                                    onChangeText={(newTime) => {
                                                        const newTimes = [...reminderTimes];
                                                        newTimes[idx] = newTime;
                                                        setReminderTimes(newTimes);
                                                    }}
                                                    placeholder="08:00"
                                                />
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (reminderTimes.length > 1) {
                                                            setReminderTimes(reminderTimes.filter((_, i) => i !== idx));
                                                        } else {
                                                            setRemindersEnabled(false);
                                                        }
                                                    }}
                                                    style={s.removeBtn}
                                                >
                                                    <Text style={s.removeBtnText}>Remove</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                                            <TouchableOpacity
                                                onPress={() => setReminderTimes([...reminderTimes, '08:00'])}
                                                style={s.addTimeBtn}
                                            >
                                                <Plus size={14} color={C.maroonRed} />
                                                <Text style={s.addTimeText}>Add Time</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={handleUpdateReminders}
                                    disabled={updatingReminders}
                                    style={[s.saveRemindersBtn, { opacity: updatingReminders ? 0.6 : 1 }]}
                                >
                                    {updatingReminders ? (
                                        <ActivityIndicator size="small" color={C.gold} />
                                    ) : (
                                        <Text style={s.saveRemindersText}>Update Schedule</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Sync Túc Số Logger */}
                    {accType && (
                        <View style={s.section}>
                            <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <Calculator size={18} color={C.gold} />
                                    <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>Ghi nhận Túc Số (Đồng bộ Yangti)</Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 12, color: C.textMute }}>Đã tích lũy:</Text>
                                    <Text style={{ fontSize: 14, color: C.maroonRed, fontWeight: '800' }}>{accStats.total_count.toLocaleString()}</Text>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                    <TextInput
                                        style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 16, fontWeight: '600', color: C.text }}
                                        placeholder="Nhập số lần / biến..."
                                        placeholderTextColor={C.textFaint}
                                        keyboardType="numeric"
                                        value={newLogCount}
                                        onChangeText={setNewLogCount}
                                    />
                                    <TouchableOpacity
                                        onPress={handleLogTucSo}
                                        disabled={!newLogCount.trim() || logging}
                                        style={{ backgroundColor: C.maroonRed, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' }}
                                    >
                                        {logging ? <ActivityIndicator color={C.gold} /> : <Text style={{ color: C.gold, fontWeight: '800' }}>Lưu</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Habit Tracker (Only for joined practices) */}
                    {isOwner && !isLibraryView && (
                        <View style={s.section}>
                            <SectionHeading label="Habit Mastery" />
                            <HabitTracker
                                currentStreak={practice.streak || 0}
                                logHistory={logHistory}
                                habitStacking={{
                                    trigger: practice.title.includes('buổi sáng') ? 'uống nước' : 'thức dậy',
                                    action: practice.title.toLowerCase()
                                }}
                                twoMinVersion={practice.title.includes('buổi sáng') ? 'Chỉ cần ngồi yên 1 phút.' : 'Bắt đầu ngay với phiên bản tập trung.'}
                            />
                        </View>
                    )}

                    {/* Rules/Description */}
                    <View style={s.section}>
                        <SectionHeading label="Practice Instruction" />
                        <View style={s.ruleCard}>
                            <Text style={s.ruleText}>
                                {practice.description || t('practiceTitle')}
                            </Text>
                        </View>
                    </View>



                    {/* Community Section */}
                    {(practice.is_public || practice.origin_id) && (
                        <View style={s.section}>
                            <SectionHeading label={`Leaderboard (${leaderboard.length})`} />
                            <View style={s.listCard}>
                                {leaderboard.length > 0 ? (
                                    leaderboard.map((p, i) => {
                                        const userRank = getRank(p.global_score || 0);
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                onPress={() => router.push(`/practitioner/${p.user_id}` as any)}
                                                style={[s.participantRow, i > 0 && s.participantBorder]}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View
                                                        style={[
                                                            s.avatar,
                                                            { borderColor: userRank.color, borderWidth: userRank.borderWidth }
                                                        ]}
                                                    >
                                                        {p.avatar_url ? (
                                                            <Image source={{ uri: p.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
                                                        ) : (
                                                            <Text style={s.avatarLetter}>{p.display_name?.charAt(0) || 'S'}</Text>
                                                        )}
                                                    </View>
                                                    <View>
                                                        <Text style={s.participantName}>{p.display_name || 'Sangha'}</Text>
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
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={{ color: C.text, fontWeight: '700' }}>{p.total_completions || 0}</Text>
                                                    <Trophy size={16} color={C.gold} fill={C.gold} />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <Text style={s.emptyText}>Be the first to join the Sangha! 🙏</Text>
                                )}
                            </View>

                            <View style={{ marginTop: 28 }}>
                                <SectionHeading label="Discussions" />
                                <View style={s.listCard}>
                                    {comments.length > 0 ? (
                                        comments.map((c, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                onPress={() => router.push(`/practitioner/${c.user_id}` as any)}
                                                style={[s.commentRow, i > 0 && s.participantBorder]}
                                            >
                                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                                    <View style={[s.avatar, { width: 32, height: 32, borderRadius: 16 }]}>
                                                        <Text style={[s.avatarLetter, { fontSize: 13 }]}>{c.profiles?.display_name?.charAt(0) || 'U'}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                            <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>{c.profiles?.display_name}</Text>
                                                            <Text style={{ color: C.textFaint, fontSize: 10 }}>{new Date(c.created_at).toLocaleDateString()}</Text>
                                                        </View>
                                                        <Text style={{ color: C.textMute, marginTop: 4, fontSize: 14, lineHeight: 20 }}>{c.content}</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={s.emptyText}>No discussions yet. Share your insights! 🙏</Text>
                                    )}
                                </View>

                                {/* Comment Input */}
                                <View style={s.chatInputRow}>
                                    <TextInput
                                        style={s.chatField}
                                        placeholder="Add a comment..."
                                        placeholderTextColor={C.textFaint}
                                        value={commentText}
                                        onChangeText={setCommentText}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        onPress={handlePostComment}
                                        disabled={!commentText.trim() || posting}
                                        style={[s.sendBtn, { backgroundColor: commentText.trim() ? C.gold : '#e2e8f0' }]}
                                    >
                                        {posting ? <ActivityIndicator size="small" color={C.maroonDark} /> : <Send size={18} color={commentText.trim() ? C.maroonDark : '#94a3b8'} />}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 120 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Bottom Action Button ── */}
            <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {!isOwner ? (
                    <TouchableOpacity
                        onPress={handleJoin}
                        disabled={cloning}
                        activeOpacity={0.88}
                        style={s.actionBtn}
                    >
                        {cloning
                            ? <ActivityIndicator color={C.maroonDark} />
                            : <><Plus size={20} color={C.maroonDark} strokeWidth={3} /><Text style={s.actionBtnText}>JOIN Sangha 🙏</Text></>
                        }
                    </TouchableOpacity>
                ) : (
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

                        <TouchableOpacity
                            onPress={handleLeave}
                            disabled={leaving}
                            activeOpacity={0.8}
                            style={[s.actionBtn, { flex: 1, backgroundColor: '#ef4444', shadowColor: '#ef4444' }]}
                        >
                            {leaving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={[s.actionBtnText, { color: '#fff' }]}>TỪ BỎ </Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleToggleComplete}
                            disabled={completing}
                            activeOpacity={0.8}
                            style={[s.actionBtn, { flex: 1.2 }, isCompleted && s.actionBtnDone]}
                        >
                            {completing ? (
                                <ActivityIndicator color={isCompleted ? C.textMute : C.maroonDark} />
                            ) : (
                                <>
                                    <Text style={[s.actionBtnText, isCompleted && { color: C.textMute }]}>
                                        {isCompleted ? 'XONG RỒI' : 'HOÀN THÀNH'}
                                    </Text>
                                    <Trophy size={18} color={isCompleted ? C.textMute : C.maroonDark} fill={isCompleted ? C.textMute : 'none'} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View >
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
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.2)',
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    backBtn: { padding: 8, borderRadius: 999, width: 44, alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '800', fontSize: 18, fontFamily: 'Montserrat-Bold' },
    badgeRow: { alignItems: 'center' },
    categoryBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(212,175,55,0.12)',
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
        borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5,
    },
    badgeLabel: { color: C.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, fontFamily: 'Montserrat-Bold' },
    badgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, opacity: 0.5 },
    badgeSubLabel: { color: '#fff', fontSize: 9, fontWeight: '600', opacity: 0.8, fontFamily: 'Montserrat-SemiBold' },

    // Content
    content: { flex: 1, backgroundColor: C.bg },

    statsGrid: {
        flexDirection: 'row', gap: 8,
        padding: 16,
    },
    section: { paddingHorizontal: 16, paddingBottom: 20 },

    ruleCard: {
        borderLeftWidth: 4, borderLeftColor: C.maroonRed,
        backgroundColor: C.cardBg, padding: 16, borderRadius: 4,
    },
    ruleText: { color: '#475569', fontSize: 14, lineHeight: 22, fontFamily: 'Montserrat' },

    listCard: {
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#f1f5f9',
        overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    participantRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    participantBorder: { borderTopWidth: 1, borderTopColor: '#f8f8f8' },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: C.maroonRed,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 18, fontFamily: 'Montserrat-Bold' },
    participantName: { color: C.text, fontWeight: '600', fontSize: 14, fontFamily: 'Montserrat-SemiBold' },
    participantRole: { color: C.textMute, fontSize: 10, marginTop: 1, fontFamily: 'Montserrat' },
    emptyText: { color: C.textFaint, fontStyle: 'italic', textAlign: 'center', padding: 20 },

    // Chat / Comments
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
        fontSize: 14, color: C.text, fontFamily: 'Montserrat'
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
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: C.gold, height: 56, borderRadius: 16,
        shadowColor: C.gold, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    actionBtnDone: {
        backgroundColor: '#f1f5f9',
        shadowOpacity: 0, elevation: 0,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    actionBtnText: { color: C.maroonDark, fontSize: 14, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'Montserrat-Bold' },

    // Reminders
    reminderCard: {
        backgroundColor: '#fff', borderRadius: 16,
        padding: 16, borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
    },
    reminderHeader: { flexDirection: 'row', alignItems: 'center' },
    reminderTitle: { color: C.text, fontWeight: '700', fontSize: 15, fontFamily: 'Montserrat-Bold' },
    reminderRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#f8fafc', paddingHorizontal: 12,
        borderRadius: 10, marginBottom: 10, height: 48,
    },
    timeInput: { flex: 1, color: C.text, fontWeight: '600', fontSize: 15, fontFamily: 'Montserrat-SemiBold' },
    removeBtn: { padding: 4 },
    removeBtnText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
    addTimeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
        borderWidth: 1, borderColor: C.maroonRed + '20',
    },
    addTimeText: { color: C.maroonRed, fontSize: 12, fontWeight: '700' },
    saveRemindersBtn: {
        backgroundColor: C.maroonRed, borderRadius: 12, height: 44,
        alignItems: 'center', justifyContent: 'center', marginTop: 12,
    },
    saveRemindersText: { color: C.gold, fontWeight: '800', fontSize: 13, letterSpacing: 0.5, fontFamily: 'Montserrat-Bold' },
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
        letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Montserrat-Bold'
    },
    statValue: { color: C.text, fontSize: 12, fontWeight: '800', textAlign: 'center', fontFamily: 'Montserrat-Bold' },

    sectionHeadRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    headDash: { width: 24, height: 1.5, backgroundColor: 'rgba(94,11,11,0.2)' },
    sectionTitle: {
        color: C.maroonRed, fontSize: 10, fontWeight: '800',
        letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat-Bold'
    },
});
