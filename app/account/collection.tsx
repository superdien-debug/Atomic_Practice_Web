import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, Award, Flame, Shield, Trophy } from 'lucide-react-native';
import { userService } from '../../services/userService';
import { useT } from '../../i18n/useT';

// ── Colors ────────────────────────────────────────────────────────────────────
const GOLD = '#D4AF37';
const MAROON = '#800000';
const BG = '#FEF9EF';

export default function AchievementCollectionScreen() {
    const router = useRouter();
    const t = useT();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [achievements, setAchievements] = useState<{ challenges: any[], streaks: any[] }>({ challenges: [], streaks: [] });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const data = await userService.fetchUserAchievements();
            setAchievements(data);
        } catch (error) {
            console.error('Failed to load achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={28} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Spiritual Collection</Text>
                    <Text style={styles.headerSub}>Your path of merits</Text>
                </View>
                <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>
                        {(achievements.challenges?.length || 0) + (achievements.streaks?.length || 0)}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={MAROON} />
                    </View>
                ) : (
                    <>
                        {/* Section: Challenges */}
                        <View style={styles.sectionHeader}>
                            <Award size={18} color={MAROON} />
                            <Text style={styles.sectionTitle}>Conquered Challenges</Text>
                        </View>

                        <View style={styles.badgeGrid}>
                            {achievements.challenges.length > 0 ? achievements.challenges.map((c, i) => (
                                <BigBadge
                                    key={`chal-${i}`}
                                    type="challenge"
                                    title={c.title}
                                    sub={`Rank ${c.difficulty}★`}
                                    icon="award"
                                />
                            )) : (
                                <Text style={styles.emptyText}>No challenges completed yet. 🙏</Text>
                            )}
                        </View>

                        {/* Section: Streaks */}
                        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                            <Flame size={18} color="#DB2777" />
                            <Text style={styles.sectionTitle}>Dedication Streaks</Text>
                        </View>

                        <View style={styles.badgeGrid}>
                            {achievements.streaks.length > 0 ? achievements.streaks.map((s, i) => (
                                <BigBadge
                                    key={`streak-${i}`}
                                    type="streak"
                                    title={s.title}
                                    sub={`${s.streak} Days`}
                                    icon="flame"
                                />
                            )) : (
                                <Text style={styles.emptyText}>Maintain a 7-day streak to earn your first flame. 🔥</Text>
                            )}
                        </View>

                        <View style={{ height: 60 + insets.bottom }} />
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function BigBadge({ type, title, sub, icon }: { type: 'challenge' | 'streak', title: string, sub: string, icon: 'award' | 'flame' }) {
    const isStreak = type === 'streak';
    const accent = isStreak ? '#DB2777' : '#D4AF37'; // Flame pink or Gold

    return (
        <View style={styles.badgeItem}>
            <View
                style={[styles.badgeCircle, { borderColor: accent + '30' }]}
            >
                <View
                    style={[styles.badgeTier, { backgroundColor: accent + '10' }]}
                >
                    {icon === 'award' ? <Award size={24} color={accent} /> : <Flame size={24} color={accent} fill={accent} />}
                </View>
                <View style={[styles.badgeGlow, { backgroundColor: accent + '40' }]} />
            </View>
            <Text numberOfLines={2} style={styles.badgeTitle}>{title}</Text>
            <Text style={styles.badgeSub}>{sub}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        backgroundColor: MAROON,
        paddingBottom: 25, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 15,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { color: GOLD, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
    badgeCount: { marginLeft: 'auto', backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    badgeCountText: { color: MAROON, fontWeight: '900', fontSize: 14 },

    content: { flex: 1, padding: 20 },
    loader: { marginTop: 100 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#333', textTransform: 'uppercase', letterSpacing: 1 },

    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    badgeItem: { width: '30%', alignItems: 'center', marginBottom: 15 },
    badgeCircle: {
        width: 80, height: 80, borderRadius: 30, backgroundColor: '#FFF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
        borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    badgeTier: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    badgeGlow: { position: 'absolute', top: 4, right: 4, width: 4, height: 4, borderRadius: 2 },
    badgeTitle: { fontSize: 10, fontWeight: '900', color: '#333', textAlign: 'center', textTransform: 'uppercase', marginBottom: 2 },
    badgeSub: { fontSize: 9, fontWeight: '700', color: '#999', textTransform: 'uppercase' },
    emptyText: { color: '#AAA', fontSize: 13, fontStyle: 'italic', textAlign: 'center', width: '100%', padding: 20 },
});
