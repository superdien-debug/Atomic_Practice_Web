import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/authStore';
import { User, Phone, MapPin, Info, Check } from 'lucide-react-native';

const DEEP_MAROON = '#4a0404';
const GOLD_ACCENT = '#c5a059';
const INPUT_BG = 'rgba(74,4,4,0.40)';
const BORDER_GOLD = 'rgba(212,175,55,0.30)';
const BORDER_FOCUS = GOLD_ACCENT;

export default function ProfileSetupScreen() {
    const { user, setSession } = useAuthStore();
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [isMaratikaMember, setIsMaratikaMember] = useState<boolean | null>(null);
    const [knowledgeLevel, setKnowledgeLevel] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const insets = useSafeAreaInsets();

    React.useEffect(() => {
        if (user) fetchExistingProfile();
    }, [user]);

    const fetchExistingProfile = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
            if (data) {
                if (data.is_onboarding_complete) {
                    router.replace('/dashboard');
                    return;
                }

                // Smart jump: If basic profile info is already there, go straight to survey
                if (data.display_name && data.phone && data.location) {
                    router.replace('/auth/survey');
                    return;
                }

                setDisplayName(data.display_name || '');
                setPhone(data.phone || '');
                setLocation(data.location || '');
                setIsMaratikaMember(data.is_maratika_member);
                setKnowledgeLevel(data.buddhist_knowledge_level);
            }
        } catch (err) {
            console.warn('Profile fetch error:', err);
        }
    };

    const knowledgeLevels = [
        { id: 'none', label: 'Chưa biết' },
        { id: 'basic', label: 'Cơ bản' },
        { id: 'experienced', label: 'Đã thực tập' },
        { id: 'practitioner', label: 'Hành giả lâu năm' }
    ];

    const handleSave = async () => {
        if (!displayName || !phone || !location || isMaratikaMember === null || !knowledgeLevel) {
            Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các thông tin để tiếp tục.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName,
                    phone: phone,
                    location: location,
                    is_maratika_member: isMaratikaMember,
                    buddhist_knowledge_level: knowledgeLevel,
                    // We don't set is_onboarding_complete yet because we want to go to the survey
                })
                .eq('id', user?.id);

            if (error) throw error;

            // Navigate to survey
            router.push('/auth/survey');
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.root}>
            <StatusBar style="light" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[s.scroll, { paddingTop: insets.top + 40 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={s.header}>
                        <Text style={s.title}>HOÀN THIỆN HỒ SƠ</Text>
                        <Text style={s.subtitle}>Thông tin giúp chúng tôi đồng hành cùng bạn tốt hơn trên con đường thực hành.</Text>
                    </View>

                    <View style={s.card}>
                        {/* Display Name */}
                        <View style={s.field}>
                            <Text style={s.fieldLabel}>TÊN HIỂN THỊ</Text>
                            <View style={s.inputBox}>
                                <User size={18} color={GOLD_ACCENT} style={{ marginLeft: 12 }} />
                                <TextInput
                                    style={s.input}
                                    placeholder="Ví dụ: Minh Tâm"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={s.field}>
                            <Text style={s.fieldLabel}>SỐ ĐIỆN THOẠI LIÊN HỆ</Text>
                            <View style={s.inputBox}>
                                <Phone size={18} color={GOLD_ACCENT} style={{ marginLeft: 12 }} />
                                <TextInput
                                    style={s.input}
                                    placeholder="09xx xxx xxx"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Location */}
                        <View style={s.field}>
                            <Text style={s.fieldLabel}>NƠI SINH SỐNG (TỈNH/THÀNH)</Text>
                            <View style={s.inputBox}>
                                <MapPin size={18} color={GOLD_ACCENT} style={{ marginLeft: 12 }} />
                                <TextInput
                                    style={s.input}
                                    placeholder="Ví dụ: Hà Nội"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={location}
                                    onChangeText={setLocation}
                                />
                            </View>
                        </View>

                        {/* Maratika Membership */}
                        <View style={s.field}>
                            <Text style={s.fieldLabel}>BẠN CÓ PHẢI THÀNH VIÊN ĐẠO TRÀNG MARATIKA?</Text>
                            <View style={s.choiceRow}>
                                {[true, false].map((val) => (
                                    <TouchableOpacity
                                        key={String(val)}
                                        style={[s.choiceBtn, isMaratikaMember === val && s.choiceBtnActive]}
                                        onPress={() => setIsMaratikaMember(val)}
                                    >
                                        <Text style={[s.choiceText, isMaratikaMember === val && s.choiceTextActive]}>
                                            {val ? 'Đúng vậy' : 'Chưa phải'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Knowledge Level */}
                        <View style={s.field}>
                            <Text style={s.fieldLabel}>MỨC ĐỘ HIỂU BIẾT VỀ PHẬT PHÁP</Text>
                            <View style={s.grid}>
                                {knowledgeLevels.map((lvl) => (
                                    <TouchableOpacity
                                        key={lvl.id}
                                        style={[s.gridBtn, knowledgeLevel === lvl.id && s.gridBtnActive]}
                                        onPress={() => setKnowledgeLevel(lvl.id)}
                                    >
                                        <Text style={[s.choiceText, knowledgeLevel === lvl.id && s.choiceTextActive]}>
                                            {lvl.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            style={s.submitBtn}
                        >
                            {loading ? (
                                <ActivityIndicator color={DEEP_MAROON} />
                            ) : (
                                <Text style={s.submitBtnText}>TIẾP TỤC</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: DEEP_MAROON },
    scroll: { paddingHorizontal: 24, paddingBottom: 60 },
    header: { marginBottom: 32, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '900', color: GOLD_ACCENT, letterSpacing: 2 },
    subtitle: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 18 },
    card: { width: '100%', gap: 20 },
    field: { gap: 8 },
    fieldLabel: { color: 'rgba(212,175,55,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    inputBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: INPUT_BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER_GOLD
    },
    input: { flex: 1, padding: 14, color: '#fff', fontSize: 15 },
    choiceRow: { flexDirection: 'row', gap: 12 },
    choiceBtn: {
        flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER_GOLD,
        backgroundColor: INPUT_BG, alignItems: 'center'
    },
    choiceBtnActive: { backgroundColor: GOLD_ACCENT, borderColor: GOLD_ACCENT },
    choiceText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 14 },
    choiceTextActive: { color: DEEP_MAROON },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridBtn: {
        width: '48%', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER_GOLD,
        backgroundColor: INPUT_BG, alignItems: 'center'
    },
    gridBtnActive: { backgroundColor: GOLD_ACCENT, borderColor: GOLD_ACCENT },
    submitBtn: {
        backgroundColor: GOLD_ACCENT, padding: 16, borderRadius: 12, alignItems: 'center',
        marginTop: 20, shadowColor: GOLD_ACCENT, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
    },
    submitBtnText: { color: DEEP_MAROON, fontWeight: '800', fontSize: 16, letterSpacing: 2 },
});
