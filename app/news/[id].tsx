import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { newsService, NewsArticle } from '../../services/newsService';
import { StatusBar } from 'expo-status-bar';
import RenderHTML from 'react-native-render-html';

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

export default function NewsDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const [article, setArticle] = useState<NewsArticle | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadArticle();
    }, [id]);

    const loadArticle = async () => {
        try {
            const data = await newsService.fetchNewsById(id!);
            setArticle(data);
        } catch (err) {
            console.error('Fetch article error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.gold} />
            </View>
        );
    }

    if (!article) return null;

    return (
        <View style={s.root}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
                {/* Hero / Header Image */}
                <View style={s.imageContainer}>
                    {article.image_url ? (
                        <Image source={{ uri: article.image_url }} style={s.heroImage} />
                    ) : (
                        <View style={[s.heroImage, { backgroundColor: C.maroonDark, alignItems: 'center', justifyContent: 'center' }]}>
                            <Text style={s.logoText}>VAJRAYANA</Text>
                        </View>
                    )}

                    {/* Back Button Overlay */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[s.backBtn, { top: Math.max(insets.top, 20) + 10 }]}
                        activeOpacity={0.8}
                    >
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={s.articleBody}>
                    <Text style={s.title}>{article.title}</Text>

                    <View style={s.metaRow}>
                        <View style={s.authorInfo}>
                            <View style={s.avatar}>
                                <Text style={s.avatarLetter}>{article.profiles?.display_name?.charAt(0) || 'A'}</Text>
                            </View>
                            <View>
                                <Text style={s.authorName}>{article.profiles?.display_name || 'Admin'}</Text>
                                <Text style={s.dateText}>{new Date(article.created_at).toLocaleDateString()} • 5 min read</Text>
                            </View>
                        </View>
                    </View>

                    <View style={s.divider} />

                    <View style={s.mainContent}>
                        <RenderHTML
                            contentWidth={width - 40}
                            source={{ html: article.content }}
                            baseStyle={s.htmlBase}
                            tagsStyles={{
                                p: { marginBottom: 14, fontSize: 16, lineHeight: 24 },
                                h1: { color: C.maroonRed, marginTop: 20, marginBottom: 10, fontSize: 22, fontWeight: '900' },
                                h2: { color: C.maroonRed, marginTop: 18, marginBottom: 8, fontSize: 20, fontWeight: '800' },
                                h3: { color: C.maroonRed, marginTop: 16, marginBottom: 6, fontSize: 18, fontWeight: '700' },
                                strong: { color: C.text, fontWeight: '800' },
                                ul: { marginBottom: 16 },
                                ol: { marginBottom: 16 },
                                li: { marginBottom: 6, fontSize: 15 },
                                img: { borderRadius: 12, marginTop: 10, marginBottom: 10 }
                            }}
                        />
                    </View>
                </View>
                <View style={{ height: 60 }} />
            </ScrollView>

            <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
                <TouchableOpacity style={s.shareBtn}>
                    <Share2 size={20} color={C.maroonRed} />
                    <Text style={s.shareText}>Chia sẻ tin tức</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1 },
    imageContainer: { width: '100%', height: 300, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    logoText: { color: 'rgba(255,255,255,0.2)', fontSize: 40, fontWeight: '900', letterSpacing: 4 },

    backBtn: {
        position: 'absolute', left: 20,
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center',
    },

    articleBody: { padding: 20 },
    title: { fontSize: 24, fontWeight: '800', color: C.text, lineHeight: 32, marginBottom: 20 },

    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.maroonRed, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { color: '#fff', fontWeight: '700', fontSize: 16 },
    authorName: { color: C.text, fontWeight: '700', fontSize: 14 },
    dateText: { color: C.textFaint, fontSize: 12, marginTop: 2 },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 24 },

    mainContent: { minHeight: 400 },
    htmlBase: { fontSize: 16, color: '#334155', lineHeight: 26 },

    bottomBar: {
        paddingHorizontal: 20, paddingBottom: 34, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
        backgroundColor: '#fff',
    },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#f8fafc', height: 50, borderRadius: 12,
    },
    shareText: { color: C.maroonRed, fontWeight: '700', fontSize: 14 },
});
