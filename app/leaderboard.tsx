import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Trophy, User } from 'lucide-react-native';
import { userService, LeaderboardEntry } from '../services/userService';
import clsx from 'clsx';
import { useT } from '../i18n/useT';
import { getRank } from '../utils/rankUtils';

export default function LeaderboardScreen() {
    const router = useRouter();
    const t = useT();
    const insets = useSafeAreaInsets();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const data = await userService.fetchLeaderboard();
            setLeaderboard(data);
        } catch (error) {
            console.error('Error loading global leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const isTop3 = index < 3;
        const userRank = getRank(item.score);

        return (
            <TouchableOpacity
                onPress={() => router.push(`/practitioner/${item.user_id}` as any)}
                className={clsx(
                    "flex-row items-center p-4 mb-2 bg-white rounded-xl border",
                    isTop3 ? "border-vajra-gold/30 bg-yellow-50/10" : "border-gray-50"
                )}
            >
                {/* Rank */}
                <View className="w-10 items-center justify-center mr-2">
                    {isTop3 ? (
                        <Trophy size={20} color={index === 0 ? "#EAB308" : index === 1 ? "#9CA3AF" : "#FB923C"} />
                    ) : (
                        <Text className="text-gray-400 font-bold text-lg">#{index + 1}</Text>
                    )}
                </View>

                {/* Avatar */}
                <View
                    className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden mr-3 items-center justify-center border"
                    style={{ borderColor: userRank.color, borderWidth: userRank.borderWidth }}
                >
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} className="w-full h-full" />
                    ) : (
                        <User size={24} color="#A0A0A0" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    <Text className="font-bold text-gray-800 text-base">
                        {item.display_name || t('anonymousPractitioner')}
                    </Text>
                    <View className="flex-row items-center">
                        <View
                            className="px-2 py-0.5 rounded-sm"
                            style={{ backgroundColor: userRank.color + '20' }}
                        >
                            <Text
                                className="text-[9px] uppercase tracking-widest font-black"
                                style={{ color: userRank.color }}
                            >
                                {userRank.title}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Score */}
                <View className="items-end">
                    <Text className="text-vajra-burgundy font-black text-xl">
                        {item.score.toLocaleString()}
                    </Text>
                    <Text className="text-[9px] text-gray-400 uppercase font-bold">
                        {t('pointsLabel')}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />

            {/* Header */}
            <View
                className="px-5 pb-6 bg-vajra-burgundy border-b border-vajra-gold/20 flex-row items-center justify-between"
                style={{
                    paddingTop: Math.max(insets.top, 20) + 8,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 5
                }}
            >
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
                    <ChevronLeft size={24} color="#d4af37" />
                </TouchableOpacity>

                <View className="flex-1 items-center mr-8">
                    <Text className="text-white/60 text-[10px] uppercase tracking-[3px] font-bold mb-1">{t('sangha')}</Text>
                    <Text className="text-white text-2xl font-black">
                        {t('leaderboard')}
                    </Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#800000" size="large" />
                    <Text className="mt-4 text-gray-400 font-medium">{t('loadingSangha')}</Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboard}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.user_id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 60 + insets.bottom }}
                    ListEmptyComponent={
                        <View className="items-center py-20 opacity-50">
                            <Trophy size={48} color="#cbd5e1" />
                            <Text className="text-gray-400 italic mt-4">{t('noPractitionersFound')}</Text>
                        </View>
                    }
                    onRefresh={loadLeaderboard}
                    refreshing={loading}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
