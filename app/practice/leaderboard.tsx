import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Trophy, User } from 'lucide-react-native';
import { practiceService } from '../../services/practiceService';
import clsx from 'clsx';

type LeaderboardEntry = {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    total_completions: number;
    last_practice_date: string;
};

export default function PracticeLeaderboardScreen() {
    const router = useRouter();
    const { originId, title } = useLocalSearchParams<{ originId: string, title?: string }>();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (originId) {
            loadLeaderboard();
        }
    }, [originId]);

    const loadLeaderboard = async () => {
        try {
            const data = await practiceService.fetchPracticeLeaderboard(originId);
            setLeaderboard(data as any);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const isTop3 = index < 3;
        const rankColor = index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-orange-400" : "text-gray-500";

        return (
            <View className={clsx(
                "flex-row items-center p-4 mb-2 bg-white rounded-xl border",
                isTop3 ? "border-vajra-gold/30 bg-yellow-50/10" : "border-gray-100"
            )}>
                {/* Rank */}
                <View className="w-10 items-center justify-center mr-2">
                    {isTop3 ? (
                        <Trophy size={20} color={index === 0 ? "#EAB308" : index === 1 ? "#9CA3AF" : "#FB923C"} />
                    ) : (
                        <Text className="text-gray-500 font-bold text-lg">#{index + 1}</Text>
                    )}
                </View>

                {/* Avatar */}
                <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3 items-center justify-center border border-gray-100">
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} className="w-full h-full" />
                    ) : (
                        <User size={20} color="#828282" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    <Text className="font-bold text-vajra-dark text-base">
                        {item.display_name || 'Anonymous Yogi'}
                    </Text>
                    <Text className="text-xs text-gray-400">
                        Last Active: {new Date(item.last_practice_date).toLocaleDateString()}
                    </Text>
                </View>

                {/* Score */}
                <View className="items-end">
                    <Text className="text-vajra-burgundy font-bold text-lg">
                        {item.total_completions}
                    </Text>
                    <Text className="text-xs text-gray-400 uppercase tracking-wider">
                        Sessions
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-vajra-cream">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="pt-12 pb-4 px-4 bg-white border-b border-gray-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={24} color="#828282" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-xs text-vajra-gold font-bold uppercase tracking-wider">Leaderboard</Text>
                    <Text className="text-xl font-serif font-bold text-vajra-dark" numberOfLines={1}>
                        {title || 'Practice Rankings'}
                    </Text>
                </View>
            </View>

            <FlatList
                data={leaderboard}
                renderItem={renderItem}
                keyExtractor={(item) => item.user_id + '_' + item.total_completions}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center py-10 opacity-50">
                            <Text className="text-gray-500">No practitioners found yet.</Text>
                            <Text className="text-xs text-gray-400 mt-1">Be the first to complete this practice!</Text>
                        </View>
                    ) : null
                }
                refreshing={loading}
                onRefresh={loadLeaderboard}
            />
        </View>
    );
}
