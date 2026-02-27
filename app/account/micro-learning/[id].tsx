import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, Share2, BookOpen, Lock, CheckCircle2 } from 'lucide-react-native';
import { microLearningService, type MicroLearningPost } from '../../../services/microLearningService';
import { practiceService } from '../../../services/practiceService';
import { useT } from '../../../i18n/useT';
import { Alert } from 'react-native';
import { format } from 'date-fns';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const MAROON = '#800000';
const GOLD = '#D4AF37';

export default function MicroLearningDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const [post, setPost] = useState<MicroLearningPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const t = useT();

    useEffect(() => {
        if (id) loadPost();
    }, [id]);

    const loadPost = async () => {
        try {
            const data = await microLearningService.getPostById(id as string);
            setPost(data);
        } catch (error) {
            console.error('Fetch post error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async () => {
        if (!post) return;

        Alert.alert(
            t('unlockLesson'),
            t('confirmUnlock').replace('{0}', post.price_mpoints.toString()),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('ok'),
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await microLearningService.unlockLesson(post.id, post.price_mpoints);
                            Alert.alert(t('lessonUnlocked'));
                            loadPost(); // Refresh state
                        } catch (error: any) {
                            Alert.alert(t('error'), error.message || t('insufficientPoints').replace('{0}', post.price_mpoints.toString()));
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleMarkAsComplete = async () => {
        if (!post) return;
        setActionLoading(true);
        try {
            await microLearningService.markAsComplete(post.id);
            loadPost(); // Refresh to show completed state
        } catch (error) {
            console.error('Mark complete error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={MAROON} />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={s.centered}>
                <Text>Post not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Text style={s.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={s.root}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Transparent Header */}
            <View style={[s.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.circleBtn}>
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={s.circleBtn}>
                    <Share2 size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                {post.image_url ? (
                    <Image source={{ uri: post.image_url }} style={s.heroImg} />
                ) : (
                    <View style={[s.heroImg, { backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }]}>
                        <BookOpen size={60} color="#E2E8F0" />
                    </View>
                )}

                <View style={s.content}>
                    <View style={s.meta}>
                        <View style={s.categoryTag}>
                            <Text style={s.categoryText}>{post.category}</Text>
                        </View>
                        <View style={s.dateRow}>
                            <Clock size={14} color="#94A3B8" />
                            <Text style={s.dateText}>{format(new Date(post.created_at), 'MMMM d, yyyy')}</Text>
                        </View>
                    </View>

                    <Text style={s.title}>{post.title}</Text>

                    <View style={s.divider} />

                    <RenderHTML
                        contentWidth={width - 40}
                        source={{ html: post.content }}
                        baseStyle={s.htmlBase}
                        tagsStyles={{
                            p: { marginBottom: 14, fontSize: 16, lineHeight: 24 },
                            h1: { color: MAROON, marginTop: 20, marginBottom: 10, fontSize: 22, fontWeight: '900' },
                            h2: { color: MAROON, marginTop: 18, marginBottom: 8, fontSize: 20, fontWeight: '800' },
                            h3: { color: MAROON, marginTop: 16, marginBottom: 6, fontSize: 18, fontWeight: '700' },
                            strong: { color: '#1E293B', fontWeight: '800' },
                            ul: { marginBottom: 16 },
                            ol: { marginBottom: 16 },
                            li: { marginBottom: 6, fontSize: 15 },
                            img: { borderRadius: 12, marginTop: 10, marginBottom: 10 }
                        }}
                    />

                    {post.is_unlocked && !post.is_completed && (
                        <TouchableOpacity
                            style={s.completeBtn}
                            onPress={handleMarkAsComplete}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <CheckCircle2 size={20} color="#FFF" />
                                    <Text style={s.completeBtnText}>{t('markAsLearned')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {post.is_completed && (
                        <View style={s.completedLabel}>
                            <CheckCircle2 size={20} color="#10B981" />
                            <Text style={s.completedText}>{t('learned')}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Paywall Overlay */}
            {!post.is_unlocked && (
                <View style={s.paywall}>
                    <View style={s.paywallCard}>
                        <View style={s.lockCircle}>
                            <Lock size={32} color={GOLD} />
                        </View>
                        <Text style={s.paywallTitle}>{t('locked')}</Text>
                        <Text style={s.paywallDesc}>
                            {t('confirmUnlock').replace('{0}', post.price_mpoints.toString())}
                        </Text>
                        <TouchableOpacity
                            style={s.unlockBtn}
                            onPress={handleUnlock}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={s.unlockBtnText}>
                                    {t('unlockLesson')} ({post.price_mpoints} M)
                                </Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.back()} style={s.laterBtn}>
                            <Text style={s.laterText}>{t('back')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFF' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 10, flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    circleBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center',
    },
    heroImg: { width: '100%', height: 260 },
    content: { padding: 20, marginTop: -20, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    categoryTag: {
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1, borderColor: '#FEF3C7',
    },
    categoryText: { color: '#B45309', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    title: { fontSize: 26, fontWeight: '900', color: MAROON, lineHeight: 34, marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 24 },
    htmlBase: {
        fontSize: 16, lineHeight: 26, color: '#334155',
    },
    backBtn: { marginTop: 20, padding: 12, backgroundColor: MAROON, borderRadius: 12 },
    backBtnText: { color: '#FFF', fontWeight: '700' },

    // Paywall & Completion
    paywall: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        zIndex: 100,
    },
    paywallCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    lockCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#FFFBEB',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    paywallTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
    paywallDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    unlockBtn: {
        backgroundColor: MAROON,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    unlockBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
    laterBtn: { marginTop: 16, padding: 10 },
    laterText: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },

    completeBtn: {
        backgroundColor: MAROON,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 30,
    },
    completeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
    completedLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        marginTop: 30,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    completedText: { color: '#166534', fontWeight: '800', fontSize: 16 },
});
