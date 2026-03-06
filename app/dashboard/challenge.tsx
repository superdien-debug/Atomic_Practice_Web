import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Trophy, Clock, Users, ChevronRight, MessageCircle, Star, Target } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import clsx from 'clsx';
import { challengeService, Challenge } from '../../services/challengeService';
import { practiceService } from '../../services/practiceService';
import { MIN_CREATION_SCORE } from '../../utils/rankUtils';
import { useT } from '../../i18n/useT';
import { Alert } from 'react-native';

export default function ChallengeScreen() {
    const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalScore, setTotalScore] = useState(0);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const t = useT();

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const data = await challengeService.fetchChallenges(activeTab);
            setChallenges(data);
            const score = await practiceService.calculateTotalScore();
            setTotalScore(score);
        } catch (error) {
            console.error('Error fetching challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchChallenges();
        }, [activeTab])
    );

    const getDaysLeft = (endDate: string) => {
        const end = new Date(endDate);
        const today = new Date();
        const diff = end.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const handleCreateClick = () => {
        console.log('[Challenge Dashboard] Create clicked. Current score:', totalScore);
        if (totalScore < MIN_CREATION_SCORE) {
            const title = t('permTitle');
            const msg = t('permDeniedCreation').replace('{0}', totalScore.toString());

            if (Platform.OS === 'web') {
                window.alert(`${title}\n\n${msg}`);
            } else {
                Alert.alert(title, msg, [{ text: t('understood') }]);
            }
            return;
        }
        router.push('/challenge/create');
    };

    return (
        <View className="flex-1 bg-vajra-cream">
            <StatusBar style="light" />

            {/* Header */}
            <View
                className="px-5 pb-6 bg-vajra-burgundy border-b border-vajra-gold/20 flex-row justify-between items-end"
                style={{
                    paddingTop: Math.max(insets.top, 20) + 12,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 5
                }}
            >
                <View>
                    <Text className="text-white/60 text-[10px] uppercase tracking-[3px] font-bold mb-1">{t('sangha')} Practice</Text>
                    <Text className="text-white text-2xl font-black">{t('challenges')}</Text>
                </View>
                <TouchableOpacity
                    onPress={handleCreateClick}
                    className="w-11 h-11 rounded-full items-center justify-center mb-1 bg-vajra-gold"
                    style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 }}
                >
                    <Text className="text-2xl text-white font-black leading-none pb-0.5">+</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View className="px-5 mt-6">
                <View className="flex-row bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    {(['ongoing', 'completed'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={clsx(
                                "flex-1 py-3 rounded-lg items-center",
                                activeTab === tab ? "bg-vajra-burgundy" : "bg-transparent"
                            )}
                        >
                            <Text className={clsx(
                                "font-bold text-xs uppercase tracking-wider",
                                activeTab === tab ? "text-white" : "text-gray-400"
                            )}>
                                {t(tab)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* List */}
            <ScrollView className="flex-1 px-5 mt-4" showsVerticalScrollIndicator={false}>
                {challenges.length === 0 && !loading && (
                    <View className="py-20 items-center">
                        <Trophy size={48} color="#DDD" />
                        <Text className="text-gray-400 italic text-center mt-4">{t('noChallengesYet').replace('{0}', t(activeTab).toLowerCase())}</Text>
                    </View>
                )}

                {/* Featured Section (First ongoing challenge) */}
                {activeTab === 'ongoing' && challenges.length > 0 && !loading && (
                    <View className="mb-8">
                        <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4">{t('featuredChallenge')}</Text>
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: challenges[0].id } })}
                            activeOpacity={0.9}
                            className="bg-vajra-burgundy rounded-[32px] p-6 shadow-xl overflow-hidden"
                        >
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="bg-vajra-gold/20 px-3 py-1 rounded-full border border-vajra-gold/30">
                                    <Text className="text-vajra-gold text-[10px] font-black uppercase">{t('activeNow')}</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <Users size={12} color="#D4AF37" />
                                    <Text className="text-vajra-gold text-xs font-bold">{challenges[0].real_participants_count || challenges[0].calculated_participants_count || challenges[0].participants_count}</Text>
                                </View>
                            </View>

                            <Text className="text-white text-2xl font-black mb-2 leading-tight">{challenges[0].title}</Text>
                            <Text numberOfLines={2} className="text-white/60 text-sm mb-6 leading-5">{challenges[0].description}</Text>

                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4">
                                    <View className="flex-row items-center gap-1">
                                        <Clock size={14} color="#FFF" opacity={0.6} />
                                        <Text className="text-white/60 text-xs font-bold">{t('daysLeftSuffix').replace('{0}', getDaysLeft(challenges[0].end_date).toString())}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <Target size={14} color="#FFF" opacity={0.6} />
                                        <Text className="text-white/60 text-xs font-bold">{challenges[0].target_goal}</Text>
                                    </View>
                                </View>
                                <View className="bg-white/10 p-2 rounded-full">
                                    <ChevronRight size={20} color="#FFF" />
                                </View>
                            </View>

                            {/* Decorative Glow */}
                            <View className="absolute -bottom-10 -right-10 w-40 h-40 bg-vajra-gold/10 rounded-full blur-3xl" />
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'ongoing' && challenges.length > 1 && (
                    <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4">{t('discovery')}</Text>
                )}

                {challenges.map((challenge, index) => {
                    if (activeTab === 'ongoing' && index === 0) return null; // Skip featured

                    const difficulty = Math.min(Math.max(challenge.difficulty || 1, 1), 5);

                    return (
                        <TouchableOpacity
                            key={challenge.id}
                            onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: challenge.id } })}
                            className="bg-white rounded-[28px] p-5 mb-5 flex-row items-center shadow-md border border-gray-50"
                            activeOpacity={0.8}
                        >
                            {/* Left Icon Block */}
                            <View
                                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                                style={{ backgroundColor: '#F9FAFB' }}
                            >
                                <Trophy size={26} color={challenge.is_joined ? "#D4AF37" : "#800000"} fill={challenge.is_joined ? "rgba(212,175,55,0.1)" : "transparent"} />
                            </View>

                            {/* Info */}
                            <View className="flex-1">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className="text-lg font-black text-gray-800 flex-1" numberOfLines={1}>{challenge.title}</Text>
                                    {challenge.is_joined && (
                                        <View className="bg-vajra-gold/10 px-2 py-0.5 rounded-lg border border-vajra-gold/20 ml-2">
                                            <Text className="text-vajra-gold text-[8px] font-black uppercase">{t('joined')}</Text>
                                        </View>
                                    )}
                                </View>

                                <View className="flex-row items-center gap-3 mb-2">
                                    <View className="flex-row items-center gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                size={10}
                                                color="#D4AF37"
                                                fill={i < difficulty ? "#D4AF37" : "transparent"}
                                            />
                                        ))}
                                    </View>
                                    <View className="h-3 w-px bg-gray-200" />
                                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                        {challenge.target_type === 'accumulation' ? t('accumulate') : t('maintain')} {challenge.target_goal}
                                    </Text>
                                </View>

                                <View className="flex-row items-center gap-4">
                                    <View className="flex-row items-center">
                                        <Users size={12} color="#9CA3AF" />
                                        <Text className="text-[11px] text-gray-400 ml-1.5 font-bold">
                                            {challenge.real_participants_count || challenge.calculated_participants_count || challenge.participants_count}
                                        </Text>
                                    </View>
                                    {activeTab === 'ongoing' && (
                                        <View className="flex-row items-center">
                                            <Clock size={12} color="#9CA3AF" />
                                            <Text className="text-[11px] text-gray-400 ml-1.5 font-bold">{t('daysLeftSuffix').replace('{0}', getDaysLeft(challenge.end_date).toString())}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View className="bg-gray-50 p-2 rounded-full ml-2">
                                <ChevronRight size={18} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <View className="h-24" />
            </ScrollView>
        </View>
    );
}
