import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, BookOpen, Clock } from 'lucide-react-native';
import { microLearningService, type MicroLearningPost } from '../../../services/microLearningService';
import { format } from 'date-fns';

const MAROON = '#800000';
const GOLD = '#D4AF37';

export default function MicroLearningListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [posts, setPosts] = useState<MicroLearningPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const loadPosts = async () => {
        try {
            const data = await microLearningService.fetchPosts();
            setPosts(data);
        } catch (error) {
            console.error('Fetch posts error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadPosts(); }, []);

    const categories = ['All', ...Array.from(new Set(posts.map(p => p.category || 'General')))];

    const filteredPosts = selectedCategory === 'All'
        ? posts
        : posts.filter(p => (p.category || 'General') === selectedCategory);

    const onRefresh = () => {
        setRefreshing(true);
        loadPosts();
    };

    const renderItem = ({ item }: { item: MicroLearningPost }) => (
        <TouchableOpacity
            style={s.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/account/micro-learning/${item.id}`)}
        >
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={s.cardImg} />
            ) : (
                <View style={[s.cardImg, s.imgPlaceholder]}>
                    <BookOpen size={40} color="#E2E8F0" />
                </View>
            )}
            <View style={s.cardContent}>
                <View style={s.categoryTag}>
                    <Text style={s.categoryText}>{item.category || 'General'}</Text>
                </View>
                <Text style={s.title} numberOfLines={2}>{item.title}</Text>
                <Text style={s.summary} numberOfLines={2}>{item.summary}</Text>
                <View style={s.footer}>
                    <Clock size={12} color="#94A3B8" />
                    <Text style={s.date}>{format(new Date(item.created_at), 'MMM d, yyyy')}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={s.root}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[s.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Micro Learning</Text>
                <View style={s.headerBtn} />
            </View>

            {/* Category Filter */}
            {!loading && posts.length > 0 && (
                <View style={s.filterBar}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.filterContent}
                    >
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                style={[
                                    s.filterBadge,
                                    selectedCategory === cat && s.filterBadgeActive
                                ]}
                            >
                                <Text style={[
                                    s.filterText,
                                    selectedCategory === cat && s.filterTextActive
                                ]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {loading ? (
                <View style={s.centered}>
                    <ActivityIndicator size="large" color={MAROON} />
                </View>
            ) : (
                <FlatList
                    data={filteredPosts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MAROON} />}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <BookOpen size={48} color="#CBD5E1" />
                            <Text style={s.emptyText}>
                                {selectedCategory === 'All'
                                    ? "No lessons available yet. Check back soon! 🙏"
                                    : `No lessons found in "${selectedCategory}".`}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FEF9EF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: MAROON,
    },
    headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontWeight: '800', fontSize: 18 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 20 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardImg: { width: '100%', height: 160 },
    imgPlaceholder: { backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
    cardContent: { padding: 16 },
    categoryTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        marginBottom: 8,
    },
    categoryText: { color: '#B45309', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    title: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    summary: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 12 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    date: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 16 },
    emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },

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
        backgroundColor: MAROON,
        borderColor: MAROON,
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
