import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Calendar, Search, Check, X, ShieldAlert } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const DEEP_MAROON = '#4a0404';
const GOLD_ACCENT = '#c5a059';
const RICH_WHITE = '#ffffff';

const SUNDAYS_LIST = [
    { label: 'Chủ Nhật 1 (31/05/2026) - Khai Mạc', date: '2026-05-31' },
    { label: 'Chủ Nhật 2 (07/06/2026)', date: '2026-06-07' },
    { label: 'Chủ Nhật 3 (14/06/2026)', date: '2026-06-14' },
    { label: 'Chủ Nhật 4 (21/06/2026)', date: '2026-06-21' },
    { label: 'Chủ Nhật 5 (28/06/2026) - Chung Kết', date: '2026-06-28' },
];

export default function SundayCheckin() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [selectedSunday, setSelectedSunday] = useState(SUNDAYS_LIST[0].date);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdminRole();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [selectedSunday, isAdmin]);

    async function checkAdminRole() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            console.error('[Admin] Error checking admin role:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchData() {
        setLoading(true);
        try {
            // 1. Fetch profiles
            const { data: profileRows, error: profilesError } = await supabase
                .from('profiles')
                .select('id, display_name, dharma_name, email, avatar_url')
                .order('display_name', { ascending: true });

            if (profilesError) throw profilesError;

            // 2. Fetch attendance for selected Sunday
            const { data: attendRows, error: attendError } = await supabase
                .from('practice_center_attendance')
                .select('user_id')
                .eq('attended_date', selectedSunday);

            if (attendError) throw attendError;

            setProfiles(profileRows || []);
            setAttendance(new Set(attendRows?.map(r => r.user_id) || []));
        } catch (error: any) {
            Alert.alert('Lỗi tải dữ liệu', error.message || 'Có lỗi xảy ra khi tải dữ liệu từ máy chủ.');
        } finally {
            setLoading(false);
        }
    }

    async function toggleAttendance(userId: string) {
        if (actionLoading) return;
        setActionLoading(userId);

        const isAttended = attendance.has(userId);

        try {
            if (isAttended) {
                // Remove attendance check-in
                const { error } = await supabase
                    .from('practice_center_attendance')
                    .delete()
                    .eq('user_id', userId)
                    .eq('attended_date', selectedSunday);

                if (error) throw error;
                
                const updated = new Set(attendance);
                updated.delete(userId);
                setAttendance(updated);
            } else {
                // Add attendance check-in
                const { error } = await supabase
                    .from('practice_center_attendance')
                    .insert({
                        user_id: userId,
                        attended_date: selectedSunday
                    });

                if (error) throw error;

                const updated = new Set(attendance);
                updated.add(userId);
                setAttendance(updated);
            }
        } catch (error: any) {
            Alert.alert('Thao tác thất bại', error.message || 'Không thể cập nhật điểm danh.');
        } finally {
            setActionLoading(null);
        }
    }

    const filteredProfiles = profiles.filter(p => {
        const name = (p.display_name || '').toLowerCase();
        const dharma = (p.dharma_name || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || dharma.includes(query);
    });

    if (loading && profiles.length === 0) {
        return (
            <View style={[s.root, s.center]}>
                <ActivityIndicator size="large" color={GOLD_ACCENT} />
                <Text style={s.loadingText}>Đang tải dữ liệu kết nối...</Text>
            </View>
        );
    }

    if (!isAdmin) {
        return (
            <View style={[s.root, s.center, { padding: 30 }]}>
                <ShieldAlert size={64} color={GOLD_ACCENT} style={{ marginBottom: 20 }} />
                <Text style={s.unauthorizedTitle}>QUYỀN TRUY CẬP BỊ HẠN CHẾ</Text>
                <Text style={s.unauthorizedDesc}>
                    Chỉ có tài khoản được cấp quyền Admin mới được truy cập cổng điểm danh lên trung tâm thực hành.
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={s.errorBackBtn}>
                    <Text style={s.errorBackText}>Trở về</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={s.root}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ArrowLeft size={24} color={GOLD_ACCENT} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>ĐIỂM DANH CHỦ NHẬT</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Sunday Selection */}
            <View style={s.dateSection}>
                <Text style={s.sectionLabel}>LỰA CHỌN CHỦ NHẬT SỰ KIỆN (+100 ĐIỂM THƯỞNG)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateScroll}>
                    {SUNDAYS_LIST.map((sun) => {
                        const active = selectedSunday === sun.date;
                        return (
                            <TouchableOpacity
                                key={sun.date}
                                style={[s.dateTab, active && s.dateTabActive]}
                                onPress={() => setSelectedSunday(sun.date)}
                            >
                                <Calendar size={14} color={active ? DEEP_MAROON : GOLD_ACCENT} style={{ marginRight: 6 }} />
                                <Text style={[s.dateTabText, active && s.dateTabTextActive]}>{sun.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Search Input */}
            <View style={s.searchContainer}>
                <Search size={18} color="rgba(255,255,255,0.4)" style={s.searchIcon} />
                <TextInput
                    style={s.searchInput}
                    placeholder="Tìm tên đồng tu hoặc pháp danh..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearBtn}>
                        <X size={16} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Members List */}
            <ScrollView contentContainerStyle={s.listScroll} style={{ flex: 1 }}>
                <Text style={s.listHeader}>DANH SÁCH HÀNH GIẢ ({filteredProfiles.length})</Text>
                {filteredProfiles.length === 0 ? (
                    <View style={s.emptyState}>
                        <Text style={s.emptyText}>Không tìm thấy đồng tu trùng khớp.</Text>
                    </View>
                ) : (
                    filteredProfiles.map((item) => {
                        const attended = attendance.has(item.id);
                        const loadingItem = actionLoading === item.id;
                        return (
                            <View key={item.id} style={s.memberCard}>
                                <View style={s.memberInfo}>
                                    <Text style={s.memberName}>{item.display_name || 'Đồng tu ẩn danh'}</Text>
                                    {item.dharma_name && (
                                        <Text style={s.memberDharma}>Pháp danh: {item.dharma_name}</Text>
                                    )}
                                    <Text style={s.memberEmail}>{item.email || 'Không có email'}</Text>
                                </View>
                                
                                <TouchableOpacity
                                    onPress={() => toggleAttendance(item.id)}
                                    disabled={loadingItem}
                                    style={[
                                        s.checkBtn,
                                        attended ? s.checkBtnAttended : s.checkBtnUnattended
                                    ]}
                                >
                                    {loadingItem ? (
                                        <ActivityIndicator size="small" color={attended ? DEEP_MAROON : GOLD_ACCENT} />
                                    ) : attended ? (
                                        <>
                                            <Check size={16} color={DEEP_MAROON} style={{ marginRight: 4 }} />
                                            <Text style={s.checkTextAttended}>Đã điểm danh</Text>
                                        </>
                                    ) : (
                                        <Text style={s.checkTextUnattended}>Điểm danh</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: DEEP_MAROON },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: GOLD_ACCENT, marginTop: 16, fontSize: 14, fontWeight: '600' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.1)'
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { color: GOLD_ACCENT, fontSize: 17, fontWeight: '900', letterSpacing: 1.2 },
    
    dateSection: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.1)' },
    sectionLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12, letterSpacing: 0.8 },
    dateScroll: { paddingHorizontal: 16 },
    dateTab: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(197,160,89,0.3)', marginRight: 10,
        backgroundColor: 'rgba(255,255,255,0.02)'
    },
    dateTabActive: { backgroundColor: GOLD_ACCENT, borderColor: GOLD_ACCENT },
    dateTabText: { color: GOLD_ACCENT, fontSize: 12, fontWeight: '700' },
    dateTabTextActive: { color: DEEP_MAROON, fontWeight: '800' },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)',
        margin: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.08)',
        paddingHorizontal: 12, height: 46
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: RICH_WHITE, fontSize: 14, fontWeight: '600' },
    clearBtn: { padding: 4 },

    listScroll: { padding: 16, paddingBottom: 40 },
    listHeader: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', marginBottom: 12, letterSpacing: 1, paddingLeft: 4 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: 13 },

    memberCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.08)', marginBottom: 12
    },
    memberInfo: { flex: 1, marginRight: 12 },
    memberName: { color: RICH_WHITE, fontSize: 15, fontWeight: '700' },
    memberDharma: { color: GOLD_ACCENT, fontSize: 12, marginTop: 4, fontWeight: '600' },
    memberEmail: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },

    checkBtn: {
        paddingHorizontal: 12, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
        minWidth: 100
    },
    checkBtnAttended: { backgroundColor: GOLD_ACCENT },
    checkBtnUnattended: { borderWidth: 1, borderColor: 'rgba(197,160,89,0.3)', backgroundColor: 'rgba(255,255,255,0.01)' },
    checkTextAttended: { color: DEEP_MAROON, fontSize: 12, fontWeight: '800' },
    checkTextUnattended: { color: GOLD_ACCENT, fontSize: 12, fontWeight: '700' },

    unauthorizedTitle: { color: GOLD_ACCENT, fontSize: 18, fontWeight: '900', marginBottom: 12 },
    unauthorizedDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    errorBackBtn: {
        marginTop: 30, paddingHorizontal: 30, height: 44, borderRadius: 22,
        backgroundColor: GOLD_ACCENT, alignItems: 'center', justifyContent: 'center'
    },
    errorBackText: { color: DEEP_MAROON, fontSize: 14, fontWeight: '800' }
});
