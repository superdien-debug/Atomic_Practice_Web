import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Clock, Target, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { userService } from '../../services/userService';

const BG = '#FDFBF7';
const MAROON = '#800000';
const GOLD = '#D4AF37';

const GOALS = ['Trì chú', 'Ngồi thiền', 'Quán tưởng', 'Lạy Phật', 'Sám hối', 'Kinh hành'];
const DURATIONS = [5, 10, 15, 30];

export default function CoachSetupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [goal, setGoal] = useState(GOALS[0]);
    const [minutes, setMinutes] = useState(5);
    const [context, setContext] = useState('');
    const [mpoints, setMpoints] = useState<number | null>(null);

    useEffect(() => {
        userService.getMPointsBalance().then(setMpoints).catch(console.error);
    }, []);

    const handleStart = () => {
        // Navigate to session screen and pass params
        router.push({
            pathname: '/coach/session',
            params: {
                goal,
                minutes: minutes.toString(),
                context
            }
        });
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
                <Sparkles size={24} color={GOLD} />
                <Text style={styles.headerTitle}>AI Practice Coach</Text>
                {mpoints !== null && (
                    <View style={{ backgroundColor: '#B49330', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 4 }}>
                        <Text style={{ fontSize: 10, color: '#FFF', fontWeight: 'bold' }}>{mpoints} Mpoint</Text>
                    </View>
                )}
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.subtitle}>
                    Bạn có bao nhiêu thời gian và muốn thực hành gì hôm nay? Coach sẽ tạo một bài tập nhỏ phù hợp với bạn.
                </Text>

                {/* ─ Goal Selection ─ */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <Target size={18} color={MAROON} />
                        <Text style={styles.sectionTitle}>Mục tiêu của bạn</Text>
                    </View>
                    <View style={styles.chipContainer}>
                        {GOALS.map((g) => (
                            <TouchableOpacity
                                key={g}
                                style={[styles.chip, goal === g && styles.chipActive]}
                                onPress={() => setGoal(g)}
                            >
                                <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ─ Duration Selection ─ */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <Clock size={18} color={MAROON} />
                        <Text style={styles.sectionTitle}>Thời gian (phút)</Text>
                    </View>
                    <View style={styles.chipContainer}>
                        {DURATIONS.map((d) => (
                            <TouchableOpacity
                                key={d}
                                style={[styles.chip, minutes === d && styles.chipActive]}
                                onPress={() => setMinutes(d)}
                            >
                                <Text style={[styles.chipText, minutes === d && styles.chipTextActive]}>{d} phút</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ─ Context Input ─ */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <Sparkles size={18} color={MAROON} />
                        <Text style={styles.sectionTitle}>Tâm trạng / Bối cảnh (tuỳ chọn)</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: Đang mệt mỏi sau ngày làm việc..."
                        placeholderTextColor="#999"
                        value={context}
                        onChangeText={setContext}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={styles.btn} onPress={handleStart} activeOpacity={0.8}>
                    <Text style={styles.btnText}>Bắt đầu tạo bài tập (10 Mpoint)</Text>
                    <ArrowRight size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: MAROON },
    subtitle: {
        fontSize: 15, color: '#666', lineHeight: 22, marginBottom: 30
    },
    section: { marginBottom: 30 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },

    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, backgroundColor: '#EEE',
        borderWidth: 1, borderColor: 'transparent'
    },
    chipActive: {
        backgroundColor: MAROON + '10',
        borderColor: MAROON
    },
    chipText: { fontSize: 14, color: '#555', fontWeight: '500' },
    chipTextActive: { color: MAROON, fontWeight: '700' },

    input: {
        backgroundColor: '#FFF',
        borderRadius: 12, borderWidth: 1, borderColor: '#EEE',
        padding: 15, fontSize: 15, color: '#333',
        minHeight: 100
    },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingTop: 20,
        backgroundColor: 'rgba(253, 251, 247, 0.9)',
    },
    btn: {
        backgroundColor: MAROON,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 18, borderRadius: 16,
        shadowColor: MAROON, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
    },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
