import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Newspaper, ChevronRight, Calendar, User, ArrowLeft } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { newsService, NewsArticle } from '../../services/newsService';
import { StatusBar } from 'expo-status-bar';

const C = {
    maroonRed: '#5e0b0b',
    maroonDark: '#3d0808',
    gold: '#d4af37',
    bg: '#ffffff',
    cardBg: '#f8f8f8',
    cardBorder: '#f0f0f0',
    text: '#1e293b',
    textMute: '#64748b',
    textFaint: '#94a3b8',
};

export default function NewsListScreen() {
    const router = useRouter();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNews = async () => {
        try {
            const data = await newsService.fetchNews();
            setNews(data || []);
        } catch (err) {
            console.error('Fetch news error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadNews();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadNews();
    }, []);

    if (loading) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.gold} />
                <Text style={{ color: C.textMute, marginTop: 12 }}>Loading news...</Text>
            </View>
        );
    }

    return (
        <View style={s.root}>
            <StatusBar style="light" />
            <Stack.Screen options={{ title: 'Tin tức Sangha', headerShown: false }} />

            {/* Header */}
            <View
                className="pt-12 px-5 pb-6 bg-vajra-burgundy border-b border-vajra-gold/20 flex-row items-center gap-4"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 5 }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    style={s.headerBackBtn}
                >
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>

                <View>
                    <Text className="text-white/60 text-[10px] uppercase tracking-[3px] font-bold mb-1">Hành Trình Tỉnh Thức</Text>
                    <Text className="text-white text-2xl font-black">Tin tức</Text>
                </View>
            </View>

            <ScrollView
                style={s.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
            >
                <View style={s.list}>
                    {news.length > 0 ? (
                        news.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={s.card}
                                activeOpacity={0.9}
                                onPress={() => router.push(`/news/${item.id}`)}
                            >
                                {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={s.cardImage} />
                                ) : (
                                    <View style={[s.cardImage, { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }]}>
                                        <Newspaper size={40} color="#cbd5e1" />
                                    </View>
                                )}
                                <View style={s.cardBody}>
                                    <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={s.cardExcerpt} numberOfLines={2}>{item.excerpt || item.content}</Text>

                                    <View style={s.cardFooter}>
                                        <View style={s.footerMeta}>
                                            <Calendar size={12} color={C.textFaint} />
                                            <Text style={s.footerText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                            <View style={s.metaDot} />
                                            <User size={12} color={C.textFaint} />
                                            <Text style={s.footerText}>{item.profiles?.display_name || 'Admin'}</Text>
                                        </View>
                                        <ChevronRight size={16} color={C.gold} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={s.emptyState}>
                            <Newspaper size={48} color={C.textFaint} />
                            <Text style={s.emptyTitle}>Chưa có tin tức</Text>
                            <Text style={s.emptyDesc}>Các bản tin mới nhất sẽ xuất hiện ở đây.</Text>
                        </View>
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fdfbf7' }, // Matches bg-vajra-cream

    content: { flex: 1 },
    list: { padding: 20, gap: 20 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    cardImage: { width: '100%', height: 180 },
    cardBody: { padding: 16 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: C.text, lineHeight: 24, marginBottom: 8 },
    cardExcerpt: { fontSize: 13, color: C.textMute, lineHeight: 20, marginBottom: 16 },

    headerBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    cardFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f8fafc',
    },
    footerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' },
    footerText: { fontSize: 11, color: C.textFaint, fontWeight: '500' },

    emptyState: { padding: 80, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginTop: 16 },
    emptyDesc: { color: C.textMute, fontSize: 14, textAlign: 'center', marginTop: 8 },
});
