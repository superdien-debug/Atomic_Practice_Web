import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Alert,
    ActivityIndicator, StyleSheet, TextInput, Modal
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react-native';

const DEEP_MAROON = '#4a0404';
const GOLD_ACCENT = '#c5a059';

interface Question {
    id: string;
    text: string;
    is_buddhist_only: boolean;
    order_index: number;
}

export default function AdminSurveyScreen() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
    const [saving, setSaving] = useState(false);

    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('survey_questions')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) Alert.alert('Lỗi', error.message);
        else setQuestions(data || []);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!editingQuestion?.text) return;
        setSaving(true);
        try {
            if (editingQuestion.id) {
                const { error } = await supabase
                    .from('survey_questions')
                    .update({
                        text: editingQuestion.text,
                        is_buddhist_only: editingQuestion.is_buddhist_only
                    })
                    .eq('id', editingQuestion.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('survey_questions')
                    .insert([{
                        text: editingQuestion.text,
                        is_buddhist_only: editingQuestion.is_buddhist_only,
                        order_index: questions.length + 1
                    }]);
                if (error) throw error;
            }
            setModalVisible(false);
            fetchQuestions();
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteQuestion = (id: string) => {
        Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa câu hỏi này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('survey_questions').delete().eq('id', id);
                    if (error) Alert.alert('Lỗi', error.message);
                    else fetchQuestions();
                }
            }
        ]);
    };

    return (
        <View style={s.root}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[s.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ArrowLeft size={24} color={GOLD_ACCENT} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>QUẢN LÝ CÂU HỎI</Text>
                <TouchableOpacity
                    onPress={() => {
                        setEditingQuestion({ text: '', is_buddhist_only: false });
                        setModalVisible(true);
                    }}
                    style={s.addBtn}
                >
                    <Plus size={24} color={GOLD_ACCENT} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={s.loading}>
                    <ActivityIndicator color={GOLD_ACCENT} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={s.scroll}>
                    {questions.map((q, idx) => (
                        <View key={q.id} style={s.card}>
                            <View style={s.cardIndex}>
                                <Text style={s.indexText}>{idx + 1}</Text>
                            </View>
                            <View style={s.cardContent}>
                                <Text style={s.qText}>{q.text}</Text>
                                {q.is_buddhist_only && (
                                    <View style={s.badge}>
                                        <Text style={s.badgeText}>Hành giả</Text>
                                    </View>
                                )}
                            </View>
                            <View style={s.cardActions}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingQuestion(q);
                                        setModalVisible(true);
                                    }}
                                    style={s.iconBtn}
                                >
                                    <Edit2 size={18} color={GOLD_ACCENT} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => deleteQuestion(q.id)}
                                    style={s.iconBtn}
                                >
                                    <Trash2 size={18} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={s.modalRoot}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>{editingQuestion?.id ? 'SỬA CÂU HỎI' : 'THÊM CÂU HỎI'}</Text>

                        <TextInput
                            style={s.input}
                            multiline
                            placeholder="Nội dung câu hỏi..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={editingQuestion?.text}
                            onChangeText={(text) => setEditingQuestion(prev => ({ ...prev!, text }))}
                        />

                        <TouchableOpacity
                            style={s.checkboxRow}
                            onPress={() => setEditingQuestion(prev => ({ ...prev!, is_buddhist_only: !prev?.is_buddhist_only }))}
                        >
                            <View style={[s.checkbox, editingQuestion?.is_buddhist_only && s.checkboxChecked]}>
                                {editingQuestion?.is_buddhist_only && <Text style={s.checkMark}>✓</Text>}
                            </View>
                            <Text style={s.checkboxLabel}>Dành riêng cho người đã thực hành</Text>
                        </TouchableOpacity>

                        <View style={s.modalActions}>
                            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={s.cancelText}>HỦY</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color={DEEP_MAROON} /> : <Text style={s.saveText}>LƯU</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    addBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
    headerTitle: { color: GOLD_ACCENT, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16 },
    card: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16, marginBottom: 12, padding: 16, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)'
    },
    cardIndex: { width: 30 },
    indexText: { color: GOLD_ACCENT, fontWeight: 'bold', fontSize: 16 },
    cardContent: { flex: 1, paddingRight: 10 },
    qText: { color: '#fff', fontSize: 14, lineHeight: 20 },
    badge: { alignSelf: 'flex-start', backgroundColor: GOLD_ACCENT + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
    badgeText: { color: GOLD_ACCENT, fontSize: 10, fontWeight: 'bold' },
    cardActions: { flexDirection: 'row', gap: 10 },
    iconBtn: { padding: 8 },

    modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: DEEP_MAROON, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: GOLD_ACCENT },
    modalTitle: { color: GOLD_ACCENT, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16,
        color: '#fff', fontSize: 15, textAlignVertical: 'top', minHeight: 100, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)'
    },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 30 },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: GOLD_ACCENT, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: GOLD_ACCENT },
    checkMark: { color: DEEP_MAROON, fontSize: 12, fontWeight: 'black' },
    checkboxLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
    saveBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: GOLD_ACCENT, alignItems: 'center' },
    cancelText: { color: '#fff', fontWeight: 'bold' },
    saveText: { color: DEEP_MAROON, fontWeight: 'bold' }
});
