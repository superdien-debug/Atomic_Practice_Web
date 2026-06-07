import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HelpCircle, ChevronRight, ArrowLeft, Calendar } from 'lucide-react-native';

const DEEP_MAROON = '#4a0404';
const GOLD_ACCENT = '#c5a059';

export default function AdminPortal() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={s.root}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[s.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ArrowLeft size={24} color={GOLD_ACCENT} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>HỆ THỐNG QUẢN TRỊ</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={s.scroll}>
                <Text style={s.sectionTitle}>Cấu hình Khảo sát</Text>

                <TouchableOpacity
                    style={s.menuItem}
                    onPress={() => router.push('/admin/survey')}
                >
                    <View style={s.menuIcon}>
                        <HelpCircle size={22} color={GOLD_ACCENT} />
                    </View>
                    <View style={s.menuContent}>
                        <Text style={s.menuLabel}>Quản lý câu hỏi</Text>
                        <Text style={s.menuSub}>Thêm, sửa, xóa bộ 14 câu hỏi khảo sát Ngũ Đại.</Text>
                    </View>
                    <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: DEEP_MAROON },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.1)'
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { color: GOLD_ACCENT, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    scroll: { padding: 20 },
    sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)'
    },
    menuIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(197,160,89,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    menuContent: { flex: 1 },
    menuLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
    menuSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }
});
