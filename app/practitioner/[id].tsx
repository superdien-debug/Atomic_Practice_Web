import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Trophy, User, ShieldCheck, Flame, LayoutGrid, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { getRank } from '../../utils/rankUtils';
import { practiceService } from '../../services/practiceService';
import { userService } from '../../services/userService';
import { useT } from '../../i18n/useT';
import clsx from 'clsx';

export default function PractitionerProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const t = useT();
    const insets = useSafeAreaInsets();

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadPractitionerData();
    }, [id]);

    const loadPractitionerData = async () => {
        try {
            setLoading(true);

            // Fetch everything in parallel for better sync and performance
            const [lbSnapshot, streak, userStats, totalScore, mpointsBalance] = await Promise.all([
                supabase.from('leaderboard').select('*').eq('user_id', id).single(),
                practiceService.calculateStreak(id),
                userService.getUserStats(id),
                practiceService.calculateTotalScore(id),
                userService.getMPointsBalance(id)
            ]);

            if (lbSnapshot.data) {
                setProfile({
                    ...lbSnapshot.data,
                    score: totalScore, // Override with real-time score
                    mpoints: mpointsBalance
                });
            }

            // Sync stats object for the UI
            setStats({
                globalStreak: streak,
                totalCompletions: userStats.totalPractices
            });

            // 3. Fetch Achievements (Spiritual Collection)
            const achievements = await userService.fetchUserAchievements(id);

            const earnedBadges: any[] = [];

            // Add Completed Challenges as badges
            achievements.challenges.forEach(c => {
                earnedBadges.push({
                    id: `challenge-${c.id}`,
                    label: c.title,
                    count: 1,
                    type: 'challenge',
                    difficulty: c.difficulty
                });
            });

            // Add High Streaks as badges
            achievements.streaks.forEach(s => {
                earnedBadges.push({
                    id: `streak-${s.practice_id}`,
                    label: s.title,
                    count: s.streak,
                    type: 'streak',
                    category: s.category
                });
            });

            setBadges(earnedBadges);

        } catch (error) {
            console.error('Error loading practitioner data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator color="#800000" size="large" />
                <Text className="mt-4 text-gray-400 font-medium">{t('seekingPractitioner')}</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-10">
                <Text className="text-gray-400 font-bold text-center">{t('practitionerNotFound')}</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-6">
                    <Text className="text-vajra-burgundy font-black">{t('goBack')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const userRank = getRank(profile.score || 0);

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header Background */}
                <View className="h-64 bg-vajra-burgundy relative items-center justify-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute left-5 w-10 h-10 rounded-full bg-white/20 items-center justify-center z-10"
                        style={{ top: Math.max(insets.top, 20) + 14 }}
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>

                    {/* Rank Glow Effect */}
                    <View
                        className="w-48 h-48 rounded-full absolute opacity-20"
                        style={{ backgroundColor: userRank.color }}
                    />

                    <View
                        className="w-32 h-32 rounded-full border-[3px] bg-white p-1 overflow-hidden"
                        style={{ borderColor: userRank.color }}
                    >
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} className="w-full h-full rounded-full" />
                        ) : (
                            <View className="w-full h-full bg-gray-100 items-center justify-center rounded-full">
                                <User size={48} color="#CCC" />
                            </View>
                        )}
                    </View>
                </View>

                {/* Info Section */}
                <View
                    className="px-6 -mt-10 bg-white rounded-t-[40px] pt-8"
                    style={{ paddingBottom: 60 + insets.bottom }}
                >
                    <View className="items-center text-center">
                        <View
                            className="px-4 py-1.5 rounded-full mb-3 shadow-lg shadow-black/10 border border-white"
                            style={{ backgroundColor: userRank.color }}
                        >
                            <Text className="text-white font-black uppercase text-xs tracking-widest">{userRank.title}</Text>
                        </View>
                        <Text className="text-2xl font-black text-gray-900">{profile.display_name || t('anonymousPractitioner')}</Text>
                        <Text className="text-gray-400 font-bold mt-1">{t('practitionerId')} {id?.slice(0, 8)}</Text>
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row justify-between mt-10">
                        <View className="items-center flex-1">
                            <Text className="text-2xl font-black text-vajra-burgundy">{profile.score?.toLocaleString() || 0}</Text>
                            <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-center">{t('karma')}</Text>
                        </View>
                        <View className="w-[1px] h-10 bg-gray-100" />
                        <View className="items-center flex-1">
                            <Text className="text-2xl font-black text-vajra-gold">{profile.mpoints?.toLocaleString() || 0}</Text>
                            <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-center">{t('mpoint')}</Text>
                        </View>
                        <View className="w-[1px] h-10 bg-gray-100" />
                        <View className="items-center flex-1">
                            <Text className="text-2xl font-black text-gray-800">{stats?.globalStreak || 0}</Text>
                            <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-center">{t('streak')}</Text>
                        </View>
                        <View className="w-[1px] h-10 bg-gray-100" />
                        <View className="items-center flex-1">
                            <Text className="text-2xl font-black text-gray-800">{stats?.totalCompletions || 0}</Text>
                            <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-center">{t('logs')}</Text>
                        </View>
                    </View>

                    {/* Spiritual Collection */}
                    <View className="mt-12">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-lg font-black text-gray-900 uppercase tracking-wider">{t('spiritualCollection')}</Text>
                            <View className="px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200">
                                <Text className="text-yellow-700 font-black text-[10px]">{badges.length} {t('badges')}</Text>
                            </View>
                        </View>

                        {badges.length === 0 ? (
                            <View className="bg-gray-50 border border-dashed border-gray-200 rounded-[28px] p-8 items-center">
                                <Star size={32} color="#CBD5E1" />
                                <Text className="text-gray-400 italic mt-3 font-medium text-center">{t('collectionWaiting')}</Text>
                            </View>
                        ) : (
                            <View className="flex-row flex-wrap gap-4">
                                {badges.map((badge) => (
                                    <View key={badge.id} className="w-[47%] bg-white p-4 rounded-3xl border border-gray-100 shadow-sm items-center">
                                        <View className={clsx(
                                            "w-12 h-12 rounded-2xl items-center justify-center mb-3",
                                            badge.type === 'challenge' ? "bg-yellow-50" : "bg-orange-50"
                                        )}>
                                            {badge.type === 'challenge' ? (
                                                <Trophy size={20} color="#D4AF37" />
                                            ) : (
                                                <Flame size={20} color="#EA580C" />
                                            )}
                                        </View>
                                        <Text className="font-black text-gray-800 text-center text-xs" numberOfLines={1}>
                                            {badge.label}
                                        </Text>
                                        <Text className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                            {badge.type === 'challenge' ? t('achieved') : `${badge.count} ${t('dayStreakSuffix')}`}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
