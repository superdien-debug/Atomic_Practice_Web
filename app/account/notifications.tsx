import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Bell, Calendar, ChevronLeft, Inbox } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useT } from '../../i18n/useT';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';

type AppNotification = {
    id: string;
    title: string;
    content: string;
    scheduled_at: string;
    type: string;
};

export default function NotificationsScreen() {
    const router = useRouter();
    const t = useT();
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('is_sent', true)
                .order('scheduled_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    return (
        <View className="flex-1 bg-vajra-cream">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-5 pb-6 bg-white border-b border-gray-100 flex-row items-center"
                style={{ paddingTop: Math.max(insets.top, 20) + 12 }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4"
                >
                    <ChevronLeft size={24} color="#800000" />
                </TouchableOpacity>
                <View>
                    <Text className="text-gray-400 text-[10px] uppercase tracking-widest font-black mb-0.5">{t('tabAccount')}</Text>
                    <Text className="text-xl font-black text-vajra-burgundy">{t('notifications')}</Text>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: 20 }}
            >
                {notifications.length === 0 && !loading ? (
                    <View className="items-center justify-center py-20">
                        <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                            <Inbox size={40} color="#CCC" />
                        </View>
                        <Text className="text-gray-400 font-bold text-center">No notifications yet</Text>
                    </View>
                ) : (
                    notifications.map(notif => (
                        <View key={notif.id} className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-50">
                            <View className="flex-row items-center mb-3">
                                <View className="w-8 h-8 bg-vajra-cream rounded-lg items-center justify-center mr-3 border border-vajra-gold/20">
                                    <Bell size={18} color="#800000" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-black text-gray-800 text-lg leading-tight">{notif.title}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Calendar size={12} color="#AAA" />
                                        <Text className="text-[10px] text-gray-400 font-bold ml-1 uppercase">
                                            {format(new Date(notif.scheduled_at), 'MMM d, yyyy • HH:mm')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text className="text-gray-600 leading-relaxed font-medium">{notif.content}</Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
