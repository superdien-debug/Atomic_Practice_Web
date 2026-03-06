import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, PenTool, Activity, Heart, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

const BG = '#FDFBF7';
const JR_BRAND = '#6B21A8';

export default function MorningRoutineScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const handleCreatePractice = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const templateId = '0cbb574e-5cd5-4526-85e2-50e1eea046ce';
            const { practiceService } = require('../../../services/practiceService');

            // 1. Check if user already joined this practice
            const { data: existing } = await supabase
                .from('practices')
                .select('id')
                .eq('user_id', user.id)
                .eq('origin_id', templateId)
                .is('is_active', true)
                .limit(1)
                .maybeSingle();

            let targetId = existing?.id;

            if (!targetId) {
                // 2. Clone it if not exists
                const cloned = await practiceService.clonePractice(templateId);
                targetId = cloned.id;
            }

            // 3. Navigate directly to practice detail [id].tsx
            router.push(`/practice/${targetId}`);

        } catch (error: any) {
            console.error('Catch Error:', error);
            if (Platform.OS === 'web') {
                window.alert("Không thể thêm bài thực hành lúc này. Vui lòng thử lại.");
            } else {
                Alert.alert("Lỗi", "Không thể thêm bài thực hành lúc này. Vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
                    <ArrowLeft size={24} color={JR_BRAND} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Thiết kế Buổi sáng</Text>
                    <Text style={styles.headerSub}>Bản thiết kế 30 phút</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                <Text style={styles.introText}>
                    "Sự thay đổi không đến từ phép màu, nó đến từ những thói quen nhỏ được lặp đi lặp lại. Đây là bản thiết kế 30 phút đầu tiên của bạn."
                </Text>

                {/* Step 1 */}
                <View style={styles.stepCard}>
                    <View style={[styles.iconWrap, { backgroundColor: '#F1F5F9' }]}>
                        <Clock size={24} color="#475569" />
                    </View>
                    <View style={styles.stepContent}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>1. Tĩnh lặng (10-15 phút)</Text>
                            <Text style={styles.stepTime}>Khởi đầu</Text>
                        </View>
                        <Text style={styles.stepDesc}>
                            Đừng cầm vào điện thoại. Hãy uống một cốc nước, ngồi yên tĩnh, lấy lại quyền kiểm soát bản thân trước khi thế giới bên ngoài đòi hỏi.
                        </Text>
                    </View>
                </View>

                {/* Step 2 */}
                <View style={styles.stepCard}>
                    <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
                        <PenTool size={24} color="#D97706" />
                    </View>
                    <View style={styles.stepContent}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>2. Kế hoạch trên giấy (10 phút)</Text>
                            <Text style={styles.stepTime}>Sau tĩnh lặng</Text>
                        </View>
                        <Text style={styles.stepDesc}>
                            Viết ra 3 việc quan trọng nhất phải hoàn thành hôm nay. Tại sao chúng quan trọng? Làm thế nào để thực hiện? Đừng bắt đầu ngày mới mà chưa có bản vẽ.
                        </Text>
                    </View>
                </View>

                {/* Step 3 */}
                <View style={styles.stepCard}>
                    <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
                        <Activity size={24} color="#DC2626" />
                    </View>
                    <View style={styles.stepContent}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>3. Vận động (3-5 phút)</Text>
                            <Text style={styles.stepTime}>Kích hoạt</Text>
                        </View>
                        <Text style={styles.stepDesc}>
                            Năng lượng sinh ra từ vận động. Chống đẩy, vươn vai, hoặc plank tốn ít thời gian nhưng kích hoạt toàn bộ hệ thống cơ thể.
                        </Text>
                    </View>
                </View>

                {/* Step 4 */}
                <View style={styles.stepCard}>
                    <View style={[styles.iconWrap, { backgroundColor: '#ECFCCB' }]}>
                        <Heart size={24} color="#65A30D" />
                    </View>
                    <View style={styles.stepContent}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>4. Biết ơn & Tầm nhìn (3 phút)</Text>
                            <Text style={styles.stepTime}>Kết thúc chuỗi</Text>
                        </View>
                        <Text style={styles.stepDesc}>
                            Nhắc nhở bản thân về tầm nhìn tương lai để giữ vững la bàn. Sống như con người bạn muốn trở thành ngay trong hôm nay.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleCreatePractice}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <CheckCircle2 size={20} color="#FFF" />
                            <Text style={styles.actionBtnText}>Thêm vào Lịch Trình</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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

    introText: {
        fontSize: 15, fontStyle: 'italic', color: '#475569', lineHeight: 24,
        marginBottom: 24, textAlign: 'center'
    },

    stepCard: {
        flexDirection: 'row', gap: 16, marginBottom: 20,
    },
    iconWrap: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center'
    },
    stepContent: { flex: 1, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    stepTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    stepTime: { fontSize: 11, color: '#94A3B8', fontWeight: '600', backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    stepDesc: { fontSize: 14, color: '#64748B', lineHeight: 22 },

    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 24, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 10,
    },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: JR_BRAND, paddingVertical: 18, borderRadius: 16,
    },
    actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
