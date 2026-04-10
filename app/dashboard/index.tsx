import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, ScrollView, Image, TouchableOpacity,
    RefreshControl, StyleSheet, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Flame, CheckCircle, Trophy, Check, Plus, Users, MessageCircle, Calculator } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { practiceService, Practice } from '../../services/practiceService';
import { challengeService, Challenge } from '../../services/challengeService';
import { useT } from '../../i18n/useT';
import { userService, Profile, LeaderboardEntry } from '../../services/userService';
import { microLearningService, type MicroLearningPost } from '../../services/microLearningService';
import { getRank, MIN_CREATION_SCORE } from '../../utils/rankUtils';
import { yangtiService } from '../../services/yangtiService';
import { Animated, Easing as RNEasing, Alert, Platform } from 'react-native';

// ─── Colors (Consistent with Theme) ─────────────────────────────────────────
const GOLD = '#D4AF37';
const CARD = '#FFF';
const BG = '#FEF9EF';
const MAROON = '#800000';
const { width } = Dimensions.get('window');
import { BookOpen, Sparkles, Wind, Award } from 'lucide-react-native';
import { EventAnnouncementModal } from '../../components/EventAnnouncementModal';

// Session-based flag to ensure popup only shows once per boot
let hasShownEventPopup = false;

// ─── Circular Progress Ring ──────────────────────────────────────────────────
function CircularProgress({
    progress = 0,     // 0..1
    size = 48,
    strokeWidth = 4,
    trackColor = '#F5F5F5',
    progressColor = '#D4AF37',
    children,
}: {
    progress?: number; size?: number; strokeWidth?: number;
    trackColor?: string; progressColor?: string; children?: React.ReactNode;
}) {
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
                position: 'absolute', width: size, height: size,
                borderRadius: size / 2, borderWidth: strokeWidth, borderColor: trackColor,
            }} />
            {progress > 0 && (
                <View style={{
                    position: 'absolute', width: size, height: size,
                    borderRadius: size / 2,
                    borderWidth: strokeWidth,
                    borderColor: 'transparent',
                    borderTopColor: progress >= 0.25 ? progressColor : 'transparent',
                    borderRightColor: progress >= 0.5 ? progressColor : 'transparent',
                    borderBottomColor: progress >= 0.75 ? progressColor : 'transparent',
                    borderLeftColor: progress >= 1 ? progressColor : 'transparent',
                    transform: [{ rotate: '-90deg' }],
                }} />
            )}
            {children}
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function DashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const t = useT();
    const displayName = user?.user_metadata?.display_name || t('practitioner');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState({
        completedCount: 0,
        totalCount: 0,
        activeChallenges: 0,
        streak: 0,
        score: 0,
        practices: [] as Practice[],
        joinedChallengesList: [] as Challenge[],
        leaderboard: [] as LeaderboardEntry[],
        mpoints: 0,
        yangtiStage: 1,
    });

    const [showEventPopup, setShowEventPopup] = useState(false);

    useEffect(() => {
        // Show the popup automatically once dashboard mounts
        if (!hasShownEventPopup) {
            const timer = setTimeout(() => {
                setShowEventPopup(true);
                hasShownEventPopup = true;
            }, 1500); // Slight delay for better UX
            return () => clearTimeout(timer);
        }
    }, []);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const userProfile = await userService.getProfile();
            setProfile(userProfile);

            const today = new Date().toISOString().split('T')[0];
            const practices = await practiceService.fetchPracticesForDate(today);
            const completed = practices.filter(p => p.completed).length;

            const streak = await practiceService.calculateStreak();
            const score = await practiceService.calculateTotalScore();

            const challenges = await challengeService.fetchChallenges('ongoing');
            const joinedList = challenges.filter(c => c.is_joined);

            const leaderboard = await userService.fetchLeaderboard();

            const mpoints = await userService.getMPointsBalance();
            const yangtiStage = await yangtiService.getUserProgress();

            setStats({
                completedCount: completed,
                totalCount: practices.length,
                activeChallenges: joinedList.length,
                streak,
                score,
                practices,
                joinedChallengesList: joinedList,
                leaderboard: leaderboard || [],
                mpoints,
                yangtiStage: yangtiStage || 1,
            });
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [fetchDashboardData])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleTogglePractice = async (id: string, currentCompleted: boolean, logId?: string) => {
        try {
            await practiceService.toggleCompletion(id, logId, !currentCompleted);
            await fetchDashboardData();
        } catch (err) {
            console.error('Toggle error:', err);
            await fetchDashboardData();
        }
    };

    const handleCreateClick = () => {
        router.push('/counter');
    };

    const ZODIAC = ['🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐐', '🐵', '🐔', '🐶', '🐷'];
    const getZodiac = (uid: string) => {
        if (!uid) return ZODIAC[0];
        return ZODIAC[uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 12];
    };

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* ─ Header ─ */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {(() => {
                        const userRank = getRank(stats.score);
                        return (
                            <View style={[
                                styles.avatarRing,
                                { borderColor: userRank.color, borderWidth: userRank.borderWidth + 1 },
                                userRank.isGlowing && {
                                    shadowColor: userRank.color,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 10,
                                    elevation: 10
                                }
                            ]}>
                                <View style={styles.avatarInner}>
                                    {profile?.avatar_url ? (
                                        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                                    ) : (
                                        <Text style={{ fontSize: 22 }}>{getZodiac(user?.id || '')}</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })()}
                    <View>
                        <Text style={styles.headerTitle}>
                            {profile?.dharma_name || profile?.display_name || displayName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <View style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 4,
                                backgroundColor: getRank(stats.score).color + '20',
                                borderWidth: 1,
                                borderColor: getRank(stats.score).color + '40'
                            }}>
                                <Text style={{
                                    color: getRank(stats.score).color,
                                    fontSize: 10,
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5
                                }}>
                                    {getRank(stats.score).title}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                        <Text style={styles.scoreNum}>{stats.score.toLocaleString()}</Text>
                        <Text style={[styles.scoreLabel, { marginBottom: 4 }]}>{t('meritUpper')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                        <Sparkles size={12} color={GOLD} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: GOLD }}>{stats.mpoints.toLocaleString()}{t('mpointSpace')}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MAROON} />}
            >
                {/* ─ Micro Learning Ticker ─ */}
                <MicroLearningTicker />

                {/* ─ Stats Grid ─ */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon={<Flame size={24} color={stats.streak > 0 ? getStreakStyle(stats.streak).color : "#FF4500"} fill={stats.streak > 0 ? getStreakStyle(stats.streak).fill : "transparent"} />}
                        value={`${stats.streak} ${t('days')}`}
                        label={t('streak')}
                    />
                    <StatCard
                        icon={<CheckCircle size={24} color="#32CD32" />}
                        value={`${stats.completedCount}/${stats.totalCount}`}
                        label={t('completions')}
                    />
                    <StatCard
                        icon={<Trophy size={24} color={GOLD} />}
                        value={`${stats.activeChallenges} ${t('active')}`}
                        label={t('challenges')}
                    />
                </View>

                {/* ─ AI Practice Coach & Yangti ─ */}
                <View style={styles.section}>
                    {(() => {
                        const stageNum = stats.yangtiStage;
                        let progressPercent = 0;
                        if (stageNum > 10) {
                            progressPercent = 100;
                        } else if (stageNum <= 8) {
                            progressPercent = Math.round(((stageNum - 1) / 7) * 25);
                        } else {
                            progressPercent = Math.round(25 + (((stageNum - 8) / 3) * 75));
                        }

                        return (
                            <TouchableOpacity
                                onPress={() => router.push('/account/yangti' as any)}
                                style={[styles.coachBanner, { marginBottom: 15, backgroundColor: MAROON, borderColor: GOLD + '40' }]}
                                activeOpacity={0.9}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 12 }}>
                                    <Award size={24} color={GOLD} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.coachBannerTitle, { color: GOLD }]}>{t('yangtiRoadmap')}</Text>
                                        <Text style={[styles.coachBannerSub, { color: '#FFF', opacity: 0.8 }]}>{t('stageNof10', [Math.min(stageNum, 10).toString()])}</Text>
                                    </View>
                                </View>
                                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                                    <View style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: GOLD, borderRadius: 3 }} />
                                </View>
                                <Text style={{ fontSize: 10, color: GOLD, fontWeight: 'bold', marginTop: 6, textAlign: 'right' }}>{t('completedUpper', [progressPercent.toString()])}</Text>
                            </TouchableOpacity>
                        );
                    })()}

                    <TouchableOpacity
                        onPress={() => router.push('/coach')}
                        style={styles.coachBanner}
                        activeOpacity={0.9}
                    >
                        <View style={styles.coachBannerContent}>
                            <Sparkles size={24} color={GOLD} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.coachBannerTitle}>{t('aiCoachingHub')}</Text>
                                <Text style={styles.coachBannerSub}>{t('aiCoachingDesc')}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/breathe')}
                        style={[styles.coachBanner, { marginTop: 15, backgroundColor: '#E0F2F1', borderColor: '#38B2AC40', shadowColor: '#38B2AC' }]}
                        activeOpacity={0.9}
                    >
                        <View style={styles.coachBannerContent}>
                            <Wind size={24} color="#38B2AC" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.coachBannerTitle, { color: '#0F766E' }]}>{t('mindfulBreath')}</Text>
                                <Text style={styles.coachBannerSub}>{t('mindfulBreathDesc')}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/practice/vipassana' as any)}
                        style={[styles.coachBanner, { marginTop: 15, backgroundColor: '#FFF5F5', borderColor: '#E53E3E40', shadowColor: '#E53E3E' }]}
                        activeOpacity={0.9}
                    >
                        <View style={styles.coachBannerContent}>
                            <Sparkles size={24} color="#E53E3E" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.coachBannerTitle, { color: '#C53030' }]}>Thiền Vipassana | Thầy Minh Niệm</Text>
                                <Text style={styles.coachBannerSub}>41:13 phút thiền sâu</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ─ Top Practitioners ─ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('hallOfFame')}</Text>
                        <TouchableOpacity onPress={() => router.push('/leaderboard')}>
                            <Text style={styles.sectionLink}>{t('viewAll')}</Text>
                        </TouchableOpacity>
                    </View>
                    <LeaderboardPodium entries={
                        stats.leaderboard.map((e, i) => ({
                            name: e.display_name || t('anonymousPractitioner'),
                            avatar_url: e.avatar_url,
                            score: e.score,
                            rank: i + 1
                        }))
                    } />
                </View>

                {/* ─ Your Practices ─ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('dailyMantras')}</Text>
                        <TouchableOpacity onPress={() => router.push('/dashboard/practice')}>
                            <Text style={styles.sectionLink}>{t('fullList')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ gap: 12 }}>
                        {(() => {
                            const pendingPractices = stats.practices
                                .filter(p => !p.completed)
                                .sort((a, b) => {
                                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                                    return dateB - dateA;
                                })
                                .slice(0, 5);

                            if (pendingPractices.length === 0) {
                                return (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>{t('allTasksDone')}</Text>
                                    </View>
                                );
                            }

                            return pendingPractices.map((practice) => {
                                const target = practice.daily_target || 108;
                                const progress = practice.completed ? 1 : 0.3;
                                return (
                                    <PracticeRow
                                        key={practice.id}
                                        practice={practice}
                                        onToggle={() => handleTogglePractice(practice.id, practice.completed, practice.log_id)}
                                        onPress={() => router.push(`/practice/${practice.id}`)}
                                    />
                                );
                            });
                        })()}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <TouchableOpacity
                onPress={handleCreateClick}
                style={[styles.fab, { bottom: 20 + insets.bottom }]}
                activeOpacity={0.8}
            >
                <Calculator size={28} color="#FFF" />
            </TouchableOpacity>

            <EventAnnouncementModal
                visible={showEventPopup}
                onDismiss={() => setShowEventPopup(false)}
            />
        </View>
    );
}

// ─── Micro Learning Ticker (Marquee) ──────────────────────────────────────────
function MicroLearningTicker() {
    const router = useRouter();
    const t = useT();
    const [lesson, setLesson] = useState<MicroLearningPost | null>(null);
    const scrollX = React.useRef(new Animated.Value(width)).current;

    useEffect(() => {
        microLearningService.fetchPosts(5).then(posts => {
            if (posts.length > 0) {
                const random = posts[Math.floor(Math.random() * posts.length)];
                setLesson(random);
            }
        });
    }, []);

    useEffect(() => {
        if (lesson) {
            scrollX.setValue(width);
            Animated.loop(
                Animated.timing(scrollX, {
                    toValue: -1000, // Large enough for all text
                    duration: 20000,
                    easing: RNEasing.linear,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [lesson]);

    if (!lesson) return null;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/account/micro-learning/${lesson.id}`)}
            style={styles.tickerRoot}
        >
            <View style={styles.tickerIcon}>
                <BookOpen size={14} color={GOLD} fill={GOLD + '20'} />
            </View>
            <View style={{ flex: 1, overflow: 'hidden' }}>
                <Animated.View style={[{ flexDirection: 'row', transform: [{ translateX: scrollX }] }]}>
                    <Text style={styles.tickerText} numberOfLines={1}>
                        <Text style={{ fontWeight: '900', color: MAROON }}>{t('newLessonUpper')}: </Text>
                        {lesson.title} — {lesson.summary || t('tapToLearnMore')} 🙏
                    </Text>
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <View style={styles.statCard}>
            <View style={styles.statIconWrap}>{icon}</View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function PracticeRow({
    practice, onToggle, onPress,
}: {
    practice: Practice;
    onToggle: () => void; onPress: () => void;
}) {
    const { title, category, completed, real_participants_count } = practice;
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.practiceRow, completed && { opacity: 0.8 }]}
        >
            <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                    numberOfLines={1}
                    style={[
                        styles.practiceTitle,
                        completed && { textDecorationLine: 'line-through', color: '#999' }
                    ]}
                >
                    {title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: MAROON, fontWeight: '700', textTransform: 'uppercase' }}>
                        {category}
                    </Text>
                    <Text style={{ color: '#DDD', marginHorizontal: 8 }}>|</Text>

                    {/* Streak Badge */}
                    {practice.streak !== undefined && practice.streak > 0 && (() => {
                        const style = getStreakStyle(practice.streak);
                        return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: style.color + '20' }}>
                                <Flame size={10} color={style.color} fill={style.fill} />
                                <Text style={{ color: style.color, fontSize: 9, fontWeight: 'bold', marginLeft: 4 }}>
                                    {practice.streak}d
                                </Text>
                            </View>
                        );
                    })()}

                    <Users size={12} color="#717171" />
                    <Text style={{ fontSize: 11, color: '#666', fontWeight: '500', marginLeft: 4 }}>
                        {real_participants_count || 1}
                    </Text>
                    <Text style={{ color: '#DDD', marginHorizontal: 8 }}>|</Text>
                    <MessageCircle size={12} color="#717171" />
                    <Text style={{ fontSize: 11, color: '#666', fontWeight: '500', marginLeft: 4 }}>
                        {practice.comments_count || 0}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); onToggle(); }}
                style={[
                    styles.practiceBtn,
                    {
                        backgroundColor: completed ? '#22c55e' : '#FFF',
                        borderColor: completed ? '#22c55e' : '#EEE',
                        borderWidth: 1.5,
                        width: 40,
                        height: 40,
                        borderRadius: 20
                    }
                ]}
            >
                {completed
                    ? <Check size={20} color="#FFF" />
                    : <Plus size={20} color="#CCC" />
                }
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

// ─── Leaderboard Podium Component ────────────────────────────────────────────
type PodiumEntry = { name: string; score: number; rank: number; avatar_url: string | null };

function LeaderboardPodium({ entries }: { entries: PodiumEntry[] }) {
    const t = useT();
    const rank1 = entries.find(e => e.rank === 1);
    const rank2 = entries.find(e => e.rank === 2);
    const rank3 = entries.find(e => e.rank === 3);

    return (
        <View style={ps.podiumCard}>
            <View style={ps.podiumRow}>
                {rank2 && (() => {
                    const r2Info = getRank(rank2.score);
                    return (
                        <View style={ps.podiumSlot}>
                            <View style={ps.avatarWrap2}>
                                <View style={[
                                    ps.avatarCircle,
                                    ps.avatarCircle2,
                                    { borderColor: r2Info.color, borderWidth: r2Info.borderWidth }
                                ]}>
                                    {rank2.avatar_url ? (
                                        <Image source={{ uri: rank2.avatar_url }} style={ps.avatarImg} />
                                    ) : (
                                        <Text style={ps.avatarLetter}>{rank2.name ? rank2.name[0].toUpperCase() : '?'}</Text>
                                    )}
                                </View>
                                <View style={[ps.badge2, { backgroundColor: r2Info.color }]}><Text style={ps.badge2Text}>#2</Text></View>
                            </View>
                            <Text style={ps.name2} numberOfLines={1}>{rank2.name}</Text>
                            <Text style={[ps.rankTitle, { color: r2Info.color }]}>{r2Info.title}</Text>
                            <Text style={ps.score2}>{rank2.score.toLocaleString()} {t('pointsUnit')}</Text>
                        </View>
                    );
                })()}

                {rank1 && (() => {
                    const r1Info = getRank(rank1.score);
                    return (
                        <View style={[ps.podiumSlot, ps.podiumSlot1]}>
                            <Text style={ps.crown}>👑</Text>
                            <View style={ps.avatarWrap1}>
                                <View style={[
                                    ps.avatarCircle,
                                    ps.avatarCircle1,
                                    { borderColor: r1Info.color, borderWidth: r1Info.borderWidth + 1 },
                                    r1Info.isGlowing && { shadowColor: r1Info.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 }
                                ]}>
                                    {rank1.avatar_url ? (
                                        <Image source={{ uri: rank1.avatar_url }} style={ps.avatarImg} />
                                    ) : (
                                        <Text style={ps.avatarLetter}>{rank1.name ? rank1.name[0].toUpperCase() : '?'}</Text>
                                    )}
                                </View>
                                <View style={[ps.badge1, { backgroundColor: r1Info.color }]}><Text style={ps.badge1Text}>#1</Text></View>
                            </View>
                            <Text style={ps.name1} numberOfLines={1}>{rank1.name}</Text>
                            <Text style={[ps.rankTitleLarge, { color: r1Info.color }]}>{r1Info.title}</Text>
                            <Text style={ps.score1}>{rank1.score.toLocaleString()} {t('pointsUnit')}</Text>
                        </View>
                    );
                })()}

                {rank3 && (() => {
                    const r3Info = getRank(rank3.score);
                    return (
                        <View style={ps.podiumSlot}>
                            <View style={ps.avatarWrap2}>
                                <View style={[
                                    ps.avatarCircle,
                                    ps.avatarCircle3,
                                    { borderColor: r3Info.color, borderWidth: r3Info.borderWidth }
                                ]}>
                                    {rank3.avatar_url ? (
                                        <Image source={{ uri: rank3.avatar_url }} style={ps.avatarImg} />
                                    ) : (
                                        <Text style={ps.avatarLetter}>{rank3.name[0].toUpperCase()}</Text>
                                    )}
                                </View>
                                <View style={[ps.badge3, { backgroundColor: r3Info.color }]}><Text style={ps.badge3Text}>#3</Text></View>
                            </View>
                            <Text style={ps.name2} numberOfLines={1}>{rank3.name}</Text>
                            <Text style={[ps.rankTitle, { color: r3Info.color }]}>{r3Info.title}</Text>
                            <Text style={ps.score2}>{rank3.score.toLocaleString()} {t('pointsUnit')}</Text>
                        </View>
                    );
                })()}
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStreakStyle = (days: number) => {
    if (days >= 365) return { color: '#800000', fill: '#D4AF37', label: 'Vajra' };
    if (days >= 120) return { color: '#7C3AED', fill: '#C084FC', label: 'Eternal' };
    if (days >= 60) return { color: '#0891B2', fill: '#67E8F9', label: 'Diamond' };
    if (days >= 45) return { color: '#059669', fill: '#6EE7B7', label: 'Emerald' };
    if (days >= 30) return { color: '#B45309', fill: '#FDE047', label: 'Master' };
    if (days >= 15) return { color: '#DB2777', fill: '#F472B6', label: 'Energetic' };
    if (days >= 7) return { color: '#BE123C', fill: '#FB7185', label: 'Resilient' };
    return { color: '#F97316', fill: 'transparent', label: 'Beginner' };
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20,
        backgroundColor: MAROON,
    },
    avatarRing: {
        width: 54, height: 54, borderRadius: 27,
        borderWidth: 2, borderColor: GOLD, padding: 2,
    },
    avatarInner: {
        flex: 1, borderRadius: 999,
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)',
    },
    avatarImg: { width: '100%', height: '100%' },
    headerTitle: { color: GOLD, fontSize: 18, fontWeight: '800', fontFamily: 'Montserrat-Bold' },
    headerSub: { color: '#FFF', fontSize: 13, fontWeight: '600', opacity: 0.9, fontFamily: 'Montserrat-SemiBold' },
    scoreNum: { color: GOLD, fontSize: 20, fontWeight: '800', fontFamily: 'Montserrat-Bold' },
    scoreLabel: { color: '#FFF', fontSize: 10, fontWeight: '700', opacity: 0.7, textAlign: 'right', fontFamily: 'Montserrat' },

    tabTextActive: { color: '#FFF' },

    tickerRoot: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 20,
        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
        borderWidth: 1, borderColor: MAROON + '10',
        overflow: 'hidden',
    },
    tickerIcon: {
        backgroundColor: MAROON + '10', padding: 6, borderRadius: 8,
        zIndex: 2, // Stay above sliding text
    },
    tickerText: {
        fontSize: 13, fontWeight: '700', color: '#64748B',
        minWidth: 1000, fontFamily: 'Montserrat-SemiBold' // Ensure long text doesn't wrap
    },

    statsGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 10 },
    statCard: {
        flex: 1, backgroundColor: CARD, padding: 15, borderRadius: 16,
        alignItems: 'center', gap: 5,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4,
    },
    statIconWrap: { marginBottom: 5 },
    statValue: { fontSize: 16, fontWeight: '700', color: '#333', fontFamily: 'Montserrat-Bold' },
    statLabel: { fontSize: 11, color: '#666', fontFamily: 'Montserrat' },

    coachBanner: {
        backgroundColor: '#FFF8E7',
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: GOLD + '40',
        elevation: 2, shadowColor: GOLD, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4,
    },
    coachBannerContent: {
        flexDirection: 'row', alignItems: 'center', gap: 15,
    },
    coachBannerTitle: {
        fontSize: 16, fontWeight: '700', color: MAROON, marginBottom: 4, fontFamily: 'Montserrat-Bold'
    },
    coachBannerSub: {
        fontSize: 12, color: '#666', lineHeight: 18, fontFamily: 'Montserrat'
    },

    section: { marginTop: 25, paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', fontFamily: 'Montserrat-Bold' },
    sectionLink: { color: MAROON, fontSize: 14, fontWeight: '600', fontFamily: 'Montserrat-SemiBold' },

    practiceRow: {
        flexDirection: 'row', alignItems: 'center', gap: 15,
        backgroundColor: CARD, padding: 15, borderRadius: 16,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 3,
    },
    progressRing: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    ringTrack: {
        position: 'absolute', width: 44, height: 44, borderRadius: 22,
        borderWidth: 4, borderColor: '#F5F5F5',
    },
    ringArc: {
        position: 'absolute', width: 44, height: 44, borderRadius: 22,
        borderWidth: 4, borderColor: 'transparent', transform: [{ rotate: '-90deg' }],
    },
    ringCount: { fontSize: 11, fontWeight: '700', color: '#333', fontFamily: 'Montserrat-Bold' },
    practiceTitle: { fontSize: 16, fontWeight: '600', color: '#333', fontFamily: 'Montserrat-SemiBold' },
    practiceSub: { fontSize: 12, color: '#666', marginTop: 2, fontFamily: 'Montserrat' },
    practiceBtn: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },

    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },

    fab: {
        position: 'absolute', bottom: 30, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: MAROON,
        alignItems: 'center', justifyContent: 'center',
        elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 6,
    },
});

const ps = StyleSheet.create({
    podiumCard: {
        backgroundColor: CARD, borderRadius: 16, padding: 15,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4,
    },
    podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10 },
    podiumSlot: { flex: 1, alignItems: 'center' },
    podiumSlot1: { marginBottom: 10 },
    crown: { fontSize: 20, marginBottom: 5 },
    avatarWrap1: { position: 'relative', marginBottom: 5 },
    avatarWrap2: { position: 'relative', marginBottom: 5 },
    avatarCircle: {
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        overflow: 'hidden', // Add this to ensure images are clipped to circle
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarCircle1: {
        width: 60, height: 60, borderRadius: 30,
        borderWidth: 2, borderColor: GOLD,
    },
    avatarCircle2: {
        width: 50, height: 50, borderRadius: 25,
        borderWidth: 1.5, borderColor: '#94a3b8',
    },
    avatarCircle3: {
        width: 50, height: 50, borderRadius: 25,
        borderWidth: 1.5, borderColor: '#b45309',
    },
    avatarLetter: { color: '#333', fontWeight: '700', fontSize: 18 },
    badge1: {
        position: 'absolute', bottom: -5, alignSelf: 'center',
        backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 6,
    },
    badge1Text: { color: '#FFF', fontWeight: '800', fontSize: 10 },
    badge2: {
        position: 'absolute', bottom: -5, alignSelf: 'center',
        backgroundColor: '#475569', borderRadius: 10, paddingHorizontal: 6,
    },
    badge2Text: { color: '#FFF', fontWeight: '800', fontSize: 10 },
    badge3: {
        position: 'absolute', bottom: -5, alignSelf: 'center',
        backgroundColor: '#92400e', borderRadius: 10, paddingHorizontal: 6,
    },
    badge3Text: { color: '#FFF', fontWeight: '800', fontSize: 10 },
    name1: { color: '#333', fontWeight: '700', fontSize: 13, marginTop: 5 },
    name2: { color: '#666', fontWeight: '600', fontSize: 11, marginTop: 5 },
    rankTitle: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
    rankTitleLarge: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
    score1: { color: GOLD, fontWeight: '700', fontSize: 11 },
    score2: { color: '#999', fontWeight: '600', fontSize: 10 },
});
