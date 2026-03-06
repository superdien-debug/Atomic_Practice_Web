import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, PenTool, MessageSquare, ChevronRight, Zap } from 'lucide-react-native';

const BG = '#FDFBF7';
const JR_BRAND = '#6B21A8'; // Purple for Jim Rohn
const GOLD = '#D4AF37';

export default function JimRohnCoachScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
                    <ArrowLeft size={24} color={JR_BRAND} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Jim Rohn Coach</Text>
                    <Text style={styles.headerSub}>Kiến tạo buổi sáng, làm chủ cuộc đời</Text>
                </View>
                <View style={styles.badge}>
                    <Zap size={14} color="#FFF" />
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

                {/* Intro Section */}
                <View style={styles.introCard}>
                    <View style={styles.agentImage}>
                        <Image
                            source={require('../../../assets/AvatarJimRohn.jpg')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                    <Text style={styles.quote}>
                        "Người thành công không thức dậy để tồn tại, họ thức dậy để kiến tạo. Và sự thay đổi bắt đầu từ những giờ đầu tiên trong ngày."
                    </Text>
                    <Text style={styles.author}>— Triết lý Jim Rohn</Text>
                </View>

                <Text style={styles.sectionTitle}>Các Kỹ Năng Huấn Luyện</Text>

                {/* Skill 1: Tại sao 60 phút buổi sáng lại quan trọng? */}
                <TouchableOpacity
                    style={styles.skillCard}
                    onPress={() => router.push('/coach/jim-rohn/philosophy')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconWrap, { backgroundColor: '#F1F5F9' }]}>
                        <BookOpen size={24} color={JR_BRAND} />
                    </View>
                    <View style={styles.skillContent}>
                        <Text style={styles.skillTitle}>Tại sao cần 30 phút buổi sáng?</Text>
                        <Text style={styles.skillDesc} numberOfLines={2}>
                            Nguyên lý "Bánh Lái Tâm Trí", "Tàu Không La Bàn" và nền tảng của thành công.
                        </Text>
                    </View>
                    <ChevronRight size={20} color="#CBD5E1" />
                </TouchableOpacity>

                {/* Skill 2: Thiết kế buổi sáng thực hành */}
                <TouchableOpacity
                    style={styles.skillCard}
                    onPress={() => router.push('/coach/jim-rohn/morning-routine')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
                        <PenTool size={24} color="#D97706" />
                    </View>
                    <View style={styles.skillContent}>
                        <Text style={styles.skillTitle}>Thiết kế Buổi Sáng</Text>
                        <Text style={styles.skillDesc} numberOfLines={2}>
                            Lộ trình 4 bước (Tĩnh lặng - Kế hoạch - Vận động - Biết ơn).
                        </Text>
                    </View>
                    <ChevronRight size={20} color="#CBD5E1" />
                </TouchableOpacity>

                {/* Skill 3: Trò chuyện & Tư vấn trực tiếp */}
                <TouchableOpacity
                    style={styles.skillCard}
                    onPress={() => router.push('/coach/jim-rohn/chat')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconWrap, { backgroundColor: '#E0E7FF' }]}>
                        <MessageSquare size={24} color="#4338CA" />
                    </View>
                    <View style={styles.skillContent}>
                        <Text style={styles.skillTitle}>Trò chuyện trực tiếp</Text>
                        <Text style={styles.skillDesc} numberOfLines={2}>
                            Nhận lời khuyên thẳng thắn và thực tế từ Jim Rohn Coach.
                        </Text>
                    </View>
                    <ChevronRight size={20} color="#CBD5E1" />
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
    headerTitle: { fontSize: 20, fontWeight: '800', color: JR_BRAND },
    headerSub: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 1 },
    badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },

    introCard: {
        marginBottom: 32,
        alignItems: 'center',
    },
    agentImage: {
        width: 100, height: 100, borderRadius: 50, marginBottom: 16,
        borderWidth: 4, borderColor: '#FFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
        overflow: 'hidden'
    },
    quote: {
        fontSize: 16, color: '#334155', fontStyle: 'italic',
        textAlign: 'center', lineHeight: 26, marginBottom: 12
    },
    author: {
        fontSize: 13, fontWeight: '700', color: JR_BRAND,
        textTransform: 'uppercase', letterSpacing: 1
    },

    sectionTitle: {
        fontSize: 16, fontWeight: '800', color: JR_BRAND, marginBottom: 16,
        textTransform: 'uppercase', letterSpacing: 0.5
    },

    skillCard: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16,
        borderWidth: 1.5, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
    },
    iconWrap: {
        width: 52, height: 52, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center'
    },
    skillContent: { flex: 1 },
    skillTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    skillDesc: { fontSize: 13, color: '#64748B', lineHeight: 20 }
});
