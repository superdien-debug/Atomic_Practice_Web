import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, StyleSheet, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Check, Plus, Globe, Trash2, Lock, MessageCircle, Trophy, Users, Search, Flame } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { practiceService, Practice } from '../../services/practiceService';
import { notificationService } from '../../services/notificationService';
import { MIN_CREATION_SCORE } from '../../utils/rankUtils';
import { useT } from '../../i18n/useT';
import { aiMemoryService, AIProfile } from '../../services/aiMemoryService';
import { getLocalISODate } from '../../utils/dateUtils';

type TopStripDate = {
    day: string;
    date: number;
    fullDate: string;
    isToday?: boolean;
};

const getDates = () => {
    const dates: TopStripDate[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    for (let i = -7; i <= 3; i++) { // Show 7 days back
        const d = new Date();
        d.setDate(today.getDate() + i);
        dates.push({
            day: days[d.getDay()],
            date: d.getDate(),
            fullDate: getLocalISODate(d),
            isToday: i === 0,
        });
    }
    return dates;
};

type TabType = 'today' | 'library_ap' | 'library_ah';

export default function MyPracticeScreen() {
    const router = useRouter();
    const t = useT();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('today');
    const [selectedDate, setSelectedDate] = useState<string>(getLocalISODate());
    const [dates] = useState(getDates());
    const [practices, setPractices] = useState<Practice[]>([]);
    const [communityPractices, setCommunityPractices] = useState<Practice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [totalScore, setTotalScore] = useState(0);
    const [aiProfile, setAiProfile] = useState<AIProfile | null>(null);

    const isTodaySelected = selectedDate === getLocalISODate();
    const isLibrary = activeTab.startsWith('library');

    // Navigation callbacks
    const goToDetail = (id: string, isFromLibrary: boolean = false) => {
        router.push({
            pathname: '/practice/[id]',
            params: { id, library: isFromLibrary ? 'true' : 'false' }
        });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const myData = await practiceService.fetchPracticesForDate(selectedDate);
            setPractices(myData as any);

            // Sync local notifications with newest practice state
            await notificationService.rescheduleAllPractices(myData);

            if (isLibrary) {
                const group = activeTab === 'library_ah' ? 'AH' : 'AP';
                const publicData = await practiceService.fetchPublicPractices(group);
                setCommunityPractices(publicData);
            }

            const score = await practiceService.calculateTotalScore();
            setTotalScore(score);

            // Fetch AI Profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                let profile = await aiMemoryService.getProfile(user.id);
                if (!profile) {
                    // Initialize first-time profile
                    profile = await aiMemoryService.upsertProfile({
                        user_id: user.id,
                        companion_name: 'Người Bạn Đồng Hành',
                        emotional_state: 'Bình an tĩnh tại',
                        practice_stage: 'Khởi đầu'
                    });
                }
                setAiProfile(profile);
            }
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [selectedDate, activeTab])
    );

    const onRefresh = useCallback(async () => {
        await fetchData();
    }, [selectedDate, activeTab]);

    const toggleComplete = async (practice: Practice) => {
        const today = getLocalISODate();
        if (selectedDate !== today) return;

        const originalPractices = [...practices];
        setPractices(prev => prev.map(p =>
            p.id === practice.id ? { ...p, completed: !p.completed } : p
        ));
        try {
            await practiceService.toggleCompletion(practice.id, practice.log_id, !practice.completed, selectedDate);
            const myData = await practiceService.fetchPracticesForDate(selectedDate);
            setPractices(myData as any);
        } catch (error) {
            setPractices(originalPractices);
            console.error('Error toggling practice:', error);
        }
    };

    const handleDelete = async (practiceId: string, title: string) => {
        Alert.alert(
            t('practiceTitle') + ' – Remove',
            `Remove "${title}" from your list?`,
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await practiceService.archivePractice(practiceId);
                            await fetchData();
                        } catch {
                            Alert.alert(t('error'), 'Could not remove practice.');
                        } finally { setLoading(false); }
                    }
                }
            ]
        );
    };
    const handleCreateClick = () => {
        console.log('[Practice Dashboard] Create clicked. Current score:', totalScore);
        if (totalScore < MIN_CREATION_SCORE) {
            const title = '🔐 Phân quyền';
            const msg = `Chỉ những Hành giả đạt Cấp độ 2 (500 điểm Merit) mới được phép tự tạo bài thực hành mới. Hiện tại bạn đang có ${totalScore} điểm.`;

            if (Platform.OS === 'web') {
                window.alert(`${title}\n\n${msg}`);
            } else {
                Alert.alert(title, msg, [{ text: 'Đã hiểu' }]);
            }
            return;
        }
        router.push('/create');
    };

    const sortedPractices = useMemo(() => {
        return [...practices].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
    }, [practices]);

    const libraryCategories = useMemo(() => {
        return ['All', ...Array.from(new Set(communityPractices.map(p => p.category || 'General')))];
    }, [communityPractices]);

    const filteredCommunityPractices = useMemo(() => {
        return selectedCategory === 'All'
            ? communityPractices
            : communityPractices.filter(p => (p.category || 'General') === selectedCategory);
    }, [communityPractices, selectedCategory]);

    return (
        <View className="flex-1 bg-vajra-cream">
            <StatusBar style="light" />

            {/* Header Area */}
            <View className="px-5 pb-0 bg-vajra-burgundy"
                style={{
                    paddingTop: Math.max(insets.top, 20) + 8,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 5
                }}
            >
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-white text-2xl font-bold">{t('practiceTitle')}</Text>
                        <Text className="text-vajra-gold text-xs font-semibold uppercase">{isTodaySelected ? t('todaysPractice') : selectedDate}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleCreateClick}
                        className="w-10 h-10 rounded-full items-center justify-center bg-vajra-gold"
                    >
                        <Plus size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TabItem
                        active={activeTab === 'today'}
                        label={t('todaysPractice')}
                        onPress={() => setActiveTab('today')}
                    />
                    <TabItem
                        active={activeTab === 'library_ap'}
                        label={t('tabAP')}
                        onPress={() => {
                            setActiveTab('library_ap');
                            setSelectedCategory('All');
                        }}
                    />
                    <TabItem
                        active={activeTab === 'library_ah'}
                        label={t('tabAH')}
                        onPress={() => {
                            setActiveTab('library_ah');
                            setSelectedCategory('All');
                        }}
                    />
                </View>

                {/* Calendar Strip */}
                {activeTab === 'today' && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.dateStrip}
                        contentContainerStyle={{ paddingHorizontal: 0 }}
                    >
                        {dates.map((item, index) => {
                            const isSelected = selectedDate === item.fullDate;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedDate(item.fullDate)}
                                    style={[
                                        styles.dateItem,
                                        isSelected && styles.dateItemActive,
                                        !isSelected && item.isToday && { backgroundColor: 'rgba(255,255,255,0.1)' }
                                    ]}
                                >
                                    <Text style={[styles.dayText, isSelected && styles.dateTextActive]}>
                                        {item.day}
                                    </Text>
                                    <Text style={[styles.dateText, isSelected && styles.dateTextActive]}>
                                        {item.date}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </View>

            {/* List Content */}
            <ScrollView
                className="flex-1 px-4 pt-4"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#800000" />
                }
            >
                {/* AP/AH Library Category Filter */}
                {isLibrary && !loading && communityPractices.length > 0 && (
                    <View style={styles.filterBar}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterContent}
                        >
                            {libraryCategories.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setSelectedCategory(cat)}
                                    style={[
                                        styles.filterBadge,
                                        selectedCategory === cat && styles.filterBadgeActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.filterText,
                                        selectedCategory === cat && styles.filterTextActive
                                    ]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {activeTab === 'today' ? (
                    <>
                        {/* Companion AI Status Strip */}
                        {aiProfile && isTodaySelected && (
                            <View className="mb-4 bg-white/60 p-4 rounded-2xl border border-vajra-gold/20 flex-row items-center shadow-sm">
                                <View className="w-10 h-10 rounded-full bg-vajra-gold/20 items-center justify-center mr-3 border border-vajra-gold/40">
                                    <MessageCircle size={20} color="#800000" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-bold text-gray-800">{aiProfile.companion_name} đang thức</Text>
                                    <Text className="text-xs text-gray-500 mt-0.5">Tâm trạng hiện tại: {aiProfile.emotional_state}</Text>
                                </View>
                                {totalScore >= 10 ? (
                                    <TouchableOpacity
                                        onPress={() => router.push('/companion/chat')}
                                        className="bg-vajra-burgundy px-3 py-1.5 rounded-full"
                                    >
                                        <Text className="text-white text-xs font-bold">Trò chuyện</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View className="bg-gray-200 px-3 py-1.5 rounded-full">
                                        <Text className="text-gray-500 text-xs font-bold flex-row"><Lock size={12} /> Đang thiền</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {sortedPractices.length > 0 ? (
                            sortedPractices.map((practice) => (
                                <CompactPracticeCard
                                    key={practice.id}
                                    practice={practice}
                                    onPress={() => goToDetail(practice.id)}
                                    onToggle={() => toggleComplete(practice)}
                                    onDelete={() => handleDelete(practice.id, practice.title)}
                                    disabled={selectedDate !== getLocalISODate()}
                                />
                            ))
                        ) : (
                            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
                                <Text className="text-3xl mb-4">🙏</Text>
                                <Text className="text-vajra-gray italic">No practices for this date.</Text>
                                <TouchableOpacity onPress={handleCreateClick} className="mt-4">
                                    <Text className="text-vajra-burgundy font-bold">{t('createPractice')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        {filteredCommunityPractices.length > 0 ? (
                            filteredCommunityPractices.map((practice) => (
                                <LibraryCard
                                    key={practice.id}
                                    practice={practice}
                                    onPress={() => goToDetail(practice.id, true)}
                                    joinLabel={t('join')}
                                />
                            ))
                        ) : (
                            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
                                <Search size={40} color="#DDD" />
                                <Text className="text-gray-400 italic mt-4">
                                    {selectedCategory === 'All' ? "No public templates found." : `No practices found in "${selectedCategory}".`}
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <View className="h-20" />
            </ScrollView>
        </View>
    );
}

const getStreakStyle = (days: number) => {
    if (days >= 365) return { color: '#800000', fill: '#D4AF37', label: 'Vajra' }; // Vajra Mastery
    if (days >= 120) return { color: '#7C3AED', fill: '#C084FC', label: 'Eternal' }; // Infinity Purple
    if (days >= 60) return { color: '#0891B2', fill: '#67E8F9', label: 'Diamond' }; // Cyan Bất Biến
    if (days >= 45) return { color: '#059669', fill: '#6EE7B7', label: 'Emerald' }; // Xanh Ngọc
    if (days >= 30) return { color: '#B45309', fill: '#FDE047', label: 'Master' }; // Vàng Kim
    if (days >= 15) return { color: '#DB2777', fill: '#F472B6', label: 'Energetic' }; // Tím rực rỡ
    if (days >= 7) return { color: '#BE123C', fill: '#FB7185', label: 'Resilient' }; // Đỏ Crimson
    return { color: '#F97316', fill: 'transparent', label: 'Beginner' }; // Cam Khởi đầu
};

const styles = StyleSheet.create({
    dateStrip: { paddingVertical: 15 },
    dateItem: { width: 50, alignItems: 'center', paddingVertical: 8, borderRadius: 10, marginHorizontal: 4 },
    dateItemActive: { backgroundColor: '#FFF' },
    dayText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
    dateText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    dateTextActive: { color: '#800000' },

    filterBar: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingVertical: 12,
    },
    filterContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterBadgeActive: {
        backgroundColor: '#800000',
        borderColor: '#800000',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    filterTextActive: {
        color: '#FFF',
    },
});

function TabItem({ active, label, onPress }: { active: boolean, label: string, onPress: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 4,
                borderBottomColor: active ? '#D4AF37' : 'transparent'
            }}
        >
            <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-white/60'}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function CompactPracticeCard({ practice, onPress, onToggle, onDelete, disabled }: { practice: Practice, onPress: () => void, onToggle: () => void, onDelete: () => void, disabled?: boolean }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onDelete}
            activeOpacity={0.8}
            className="mb-3 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 flex-row items-center justify-between"
        >
            <View className="flex-1 mr-3">
                <Text
                    numberOfLines={1}
                    className={`text-lg font-bold ${practice.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                >
                    {practice.title}
                </Text>
                <View className="flex-row items-center mt-1">
                    <Text className="text-xs text-vajra-burgundy font-semibold uppercase">{practice.category}</Text>
                    <Text className="text-gray-300 mx-2">|</Text>

                    {/* Streak Badge */}
                    {practice.streak !== undefined && practice.streak > 0 ? (() => {
                        const style = getStreakStyle(practice.streak);
                        return (
                            <View className="flex-row items-center mr-2 px-2 py-0.5 rounded-full bg-white border" style={{ borderColor: style.color + '20' }}>
                                <Flame size={12} color={style.color} fill={style.fill} />
                                <Text style={{ color: style.color }} className="text-[10px] font-bold ml-1">
                                    {practice.streak}d
                                </Text>
                            </View>
                        );
                    })() : (
                        <View className="flex-row items-center mr-2 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                            <Plus size={10} color="#9CA3AF" />
                            <Text className="text-[10px] font-bold ml-1 text-gray-400">New</Text>
                        </View>
                    )}

                    <Users size={12} color="#717171" />
                    <Text className="text-xs text-gray-500 font-medium ml-1">
                        {practice.real_participants_count || 1}
                    </Text>
                    <Text className="text-gray-300 mx-2">|</Text>
                    <MessageCircle size={12} color="#717171" />
                    <Text className="text-xs text-gray-500 font-medium ml-1">
                        {practice.comments_count || 0}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); if (!disabled) onToggle(); }}
                disabled={disabled}
                className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                    practice.completed
                        ? disabled
                            ? 'bg-green-500/40 border-green-500/20'
                            : 'bg-green-500 border-green-500'
                        : disabled
                            ? 'bg-gray-100 border-gray-200'
                            : 'bg-white border-gray-200'
                }`}
            >
                {practice.completed ? (
                    <Check size={20} color="#FFF" />
                ) : disabled ? (
                    <Lock size={16} color="#94A3B8" />
                ) : (
                    <Plus size={20} color="#CCC" />
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

function LibraryCard({ practice, onPress, joinLabel }: { practice: Practice, onPress: () => void, joinLabel: string }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="mb-3 p-5 rounded-2xl bg-white shadow-sm border border-gray-100 flex-row justify-between items-center"
        >
            <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800 mb-1" numberOfLines={1}>{practice.title}</Text>
                <View className="flex-row items-center">
                    <Text className="text-xs text-vajra-burgundy font-bold uppercase">{practice.category}</Text>
                    <Text className="text-xs text-gray-500 mx-2">•</Text>

                    {/* Streak Badge */}
                    {practice.streak !== undefined && practice.streak > 0 && (() => {
                        const style = getStreakStyle(practice.streak);
                        return (
                            <View className="flex-row items-center mr-2 px-2 py-0.5 rounded-full bg-white border" style={{ borderColor: style.color + '20' }}>
                                <Flame size={11} color={style.color} fill={style.fill} />
                                <Text style={{ color: style.color }} className="text-[10px] font-bold ml-1">
                                    {practice.streak}d
                                </Text>
                            </View>
                        );
                    })()}

                    <Users size={12} color="#A0A0A0" />
                    <Text className="text-xs text-gray-500 font-medium ml-1">
                        {practice.real_participants_count || 1}
                    </Text>
                    <Text className="text-xs text-gray-300 mx-2">•</Text>
                    <MessageCircle size={12} color="#A0A0A0" />
                    <Text className="text-xs text-gray-500 font-medium ml-1">
                        {practice.comments_count || 0}
                    </Text>
                    <Text className="text-xs text-gray-300 mx-2">•</Text>
                    <Text className="text-xs text-gray-500">by {practice.profiles?.display_name || 'Sangha'}</Text>
                </View>
            </View>
            <View className="bg-vajra-cream px-4 py-2 rounded-full border border-vajra-gold/30">
                <Text className="text-vajra-burgundy text-xs font-bold uppercase">{joinLabel}</Text>
            </View>
        </TouchableOpacity>
    );
}
