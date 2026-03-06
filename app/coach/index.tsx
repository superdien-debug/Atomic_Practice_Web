import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Leaf, Briefcase, Zap, ChevronRight } from 'lucide-react-native';

const BG = '#FDFBF7';
const MAROON = '#800000';
const GOLD = '#D4AF37';

export default function CoachSelectorScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
                    <ArrowLeft size={24} color={MAROON} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>AI Coaching</Text>
                    <Text style={styles.headerSub}>Chọn người hướng dẫn của bạn</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
                <Text style={styles.title}>Bạn đang cần trợ giúp về vấn đề gì?</Text>

                {/* Spiritual Coach */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/coach/spiritual')}
                    activeOpacity={0.85}
                >
                    <View style={styles.imageWrap}>
                        <Image source={require('../../assets/AIagent.jpg')} style={styles.image} />
                        <View style={[styles.badge, { backgroundColor: MAROON }]}>
                            <Leaf size={12} color="#FFF" />
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardSubtitle}>KARMA COACH</Text>
                        <Text style={styles.cardTitle}>Spiritual Coach</Text>
                        <Text style={styles.cardDesc}>
                            Tư vấn và giải quyết vấn đề dựa trên Triết học Nhân Quả và thực hành tịnh hóa Kim Cương Thừa.
                        </Text>
                        <View style={styles.actionRow}>
                            <Text style={[styles.actionText, { color: MAROON }]}>Bắt đầu gieo nhân</Text>
                            <ChevronRight size={16} color={MAROON} />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Jim Rohn Coach */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/coach/jim-rohn')}
                    activeOpacity={0.85}
                >
                    <View style={styles.imageWrap}>
                        <Image source={require('../../assets/JimRohn.jpg')} style={styles.image} resizeMode="cover" />
                        <View style={[styles.badge, { backgroundColor: GOLD }]}>
                            <Zap size={12} color="#FFF" />
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardSubtitle, { color: '#64748B' }]}>LIFE COACH</Text>
                        <Text style={styles.cardTitle}>Jim Rohn Coach</Text>
                        <Text style={styles.cardDesc}>
                            "Thức dậy để kiến tạo, không phải tồn tại." Thiết lập kỷ luật và kiểm soát cuộc đời từ 60 phút buổi sáng đầu tiên.
                        </Text>
                        <View style={styles.actionRow}>
                            <Text style={[styles.actionText, { color: '#1E293B' }]}>Vào phòng huấn luyện</Text>
                            <ChevronRight size={16} color="#1E293B" />
                        </View>
                    </View>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: MAROON },
    headerSub: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 1 },

    title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },

    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden'
    },
    imageWrap: { position: 'relative', width: '100%', height: 160 },
    image: { width: '100%', height: '100%' },
    badge: {
        position: 'absolute', bottom: -12, right: 24,
        width: 24, height: 24, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFF'
    },
    cardContent: { padding: 24, paddingTop: 20 },
    cardSubtitle: { fontSize: 11, fontWeight: '800', color: MAROON, letterSpacing: 0.5, marginBottom: 4 },
    cardTitle: { fontSize: 22, fontWeight: '800', color: '#222', marginBottom: 8 },
    cardDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { fontSize: 14, fontWeight: '700' }
});
