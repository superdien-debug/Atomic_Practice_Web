import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { jimRohnService, JimRohnPlan, JimRohnTask, JimRohnAssessment } from '../services/jimRohnService';
import { CheckCircle2, Circle, Plus, Trash2, Save, Info, BarChart2, ClipboardList } from 'lucide-react-native';

const MAROON = '#6B1B1B';
const GOLD = '#D4AF37';

export const JimRohnRituals = () => {
    const [view, setView] = useState<'plan' | 'assess' | 'history'>('plan');
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<JimRohnPlan | null>(null);
    const [tasks, setTasks] = useState<JimRohnTask[]>([]);
    const [assessment, setAssessment] = useState<JimRohnAssessment | null>(null);
    const [history, setHistory] = useState<JimRohnAssessment[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadData();
    }, []);

    const toggleTaskExpand = (id: string) => {
        setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const planData = await jimRohnService.getOrCreatePlan(today);
            setPlan(planData.plan);
            setTasks(planData.tasks);

            const assessData = await jimRohnService.getAssessment(today);
            setAssessment(assessData);

            const historyData = await jimRohnService.getAssessmentHistory(15);
            setHistory(historyData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async () => {
        if (!plan || tasks.length >= 3) {
            Alert.alert('Giới hạn', 'Jim Rohn khuyên bạn chỉ nên tập trung vào 3 mục tiêu quan trọng nhất mỗi ngày.');
            return;
        }
        try {
            const newTask = await jimRohnService.addTask(plan.id, {
                title: '',
                why_text: '',
                how_text: '',
                completed: false
            });
            setTasks([...tasks, newTask]);
            setExpandedTasks(prev => ({ ...prev, [newTask.id]: true })); // Auto-expand new task
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateTask = async (id: string, updates: Partial<JimRohnTask>) => {
        try {
            // Optimistic update
            setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
            await jimRohnService.updateTask(id, updates);
        } catch (e) {
            console.error(e);
            loadData(); // Revert on error
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            await jimRohnService.deleteTask(id);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveAssessment = async (scores: Partial<JimRohnAssessment>) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const saved = await jimRohnService.saveAssessment({ ...scores, plan_date: today });
            setAssessment(saved);
        } catch (e) {
            console.error('Save Assessment Error:', e);
            Alert.alert('Lỗi', 'Không thể lưu đánh giá. Hãy thử lại.');
        }
    };

    if (loading) return <ActivityIndicator color={MAROON} style={{ marginTop: 40 }} />;

    return (
        <View style={s.container}>
            <View style={s.tabBar}>
                <TouchableOpacity onPress={() => setView('plan')} style={[s.tab, view === 'plan' && s.tabActive]}>
                    <ClipboardList size={20} color={view === 'plan' ? MAROON : '#94A3B8'} />
                    <Text style={[s.tabText, view === 'plan' && s.tabTextActive]}>Kế hoạch</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setView('assess')} style={[s.tab, view === 'assess' && s.tabActive]}>
                    <CheckCircle2 size={20} color={view === 'assess' ? MAROON : '#94A3B8'} />
                    <Text style={[s.tabText, view === 'assess' && s.tabTextActive]}>Đánh giá</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setView('history')} style={[s.tab, view === 'history' && s.tabActive]}>
                    <BarChart2 size={20} color={view === 'history' ? MAROON : '#94A3B8'} />
                    <Text style={[s.tabText, view === 'history' && s.tabTextActive]}>Lịch sử</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {view === 'plan' && (
                    <View style={s.content}>
                        <View style={s.titleRow}>
                            <Text style={s.title}>Thiết kế ngày mới (hoặc To-do list)</Text>
                            <Text style={s.subtitle}>Tuyệt đối đừng bắt đầu một ngày cho đến khi bạn hoàn thành nó trên giấy.</Text>
                        </View>

                        {tasks.map((task, idx) => (
                            <View key={task.id} style={s.taskCard}>
                                <View style={s.taskHeader}>
                                    <TouchableOpacity onPress={() => handleUpdateTask(task.id, { completed: !task.completed })} style={s.checkBtn}>
                                        {task.completed ? <CheckCircle2 size={24} color="#059669" /> : <Circle size={24} color="#CBD5E1" />}
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[s.taskTitle, task.completed && { textDecorationLine: 'line-through', opacity: 0.6 }]}
                                        value={task.title}
                                        onChangeText={(text) => handleUpdateTask(task.id, { title: text })}
                                        placeholder="Tên mục tiêu..."
                                        placeholderTextColor="#94A3B8"
                                    />
                                    <TouchableOpacity onPress={() => toggleTaskExpand(task.id)} style={s.iconBtn}>
                                        <Info size={20} color={expandedTasks[task.id] ? MAROON : '#94A3B8'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteTask(task.id)} style={s.iconBtn}>
                                        <Trash2 size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>

                                {expandedTasks[task.id] && (
                                    <View style={s.taskDetails}>
                                        <View style={s.inputGroup}>
                                            <Text style={s.label}>Vì sao nó quan trọng?</Text>
                                            <TextInput
                                                style={s.input}
                                                value={task.why_text}
                                                onChangeText={(text) => handleUpdateTask(task.id, { why_text: text })}
                                                placeholder="Lý do thúc đẩy bạn..."
                                                placeholderTextColor="#CBD5E1"
                                                multiline
                                            />
                                        </View>
                                        <View style={s.inputGroup}>
                                            <Text style={s.label}>Tôi sẽ làm bằng cách nào?</Text>
                                            <TextInput
                                                style={s.input}
                                                value={task.how_text}
                                                onChangeText={(text) => handleUpdateTask(task.id, { how_text: text })}
                                                placeholder="Thời gian, địa điểm, hành động..."
                                                placeholderTextColor="#CBD5E1"
                                                multiline
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}

                        {tasks.length < 3 && (
                            <TouchableOpacity style={s.addBtn} onPress={handleAddTask}>
                                <Plus size={20} color="#FFF" />
                                <Text style={s.addBtnText}>Thêm mục tiêu ({tasks.length}/3)</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {view === 'assess' && (
                    <View style={s.content}>
                        <View style={s.titleRow}>
                            <Text style={s.title}>Tự soi chiếu cuối ngày</Text>
                            <Text style={s.subtitle}>Điểm số không phải bản án, nó là chẩn đoán để bạn bắt đầu sự biến đổi.</Text>
                        </View>

                        <AssessmentSlider
                            label="1. Mức độ tỉnh thức đầu ngày"
                            desc="Bạn có 10 phút tĩnh lặng để quan sát thay vì phản ứng?"
                            value={assessment?.wakefulness_score || 5}
                            onChange={(v: number) => handleSaveAssessment({ wakefulness_score: v })}
                        />
                        <AssessmentSlider
                            label="2. Sự rõ ràng của kế hoạch"
                            desc="Bạn có viết ra 3 nhiệm vụ trọng tâm kèm lý do không?"
                            value={assessment?.plan_clarity_score || 5}
                            onChange={(v: number) => handleSaveAssessment({ plan_clarity_score: v })}
                        />
                        <AssessmentSlider
                            label="3. Sự khởi động của cơ thể"
                            desc="Bạn có vận động, hít thở hay chỉ 'cà phê và điện thoại'?"
                            value={assessment?.movement_score || 5}
                            onChange={(v: number) => handleSaveAssessment({ movement_score: v })}
                        />
                        <AssessmentSlider
                            label="4. Thực hành lòng biết ơn"
                            desc="Bạn đã dành khoảnh khắc nào để thực sự cảm ơn ngày mới chưa?"
                            value={assessment?.gratitude_score || 5}
                            onChange={(v: number) => handleSaveAssessment({ gratitude_score: v })}
                        />
                        <AssessmentSlider
                            label="5. Độ rõ nét của sự hình dung"
                            desc="Bạn có thấy rõ con người bạn muốn trở thành trong tương lai?"
                            value={assessment?.visualization_score || 5}
                            onChange={(v: number) => handleSaveAssessment({ visualization_score: v })}
                        />

                        <View style={s.totalScoreBox}>
                            <Text style={s.totalLabel}>Điểm trung bình hôm nay</Text>
                            <Text style={s.totalValue}>{assessment?.total_score != null ? assessment.total_score.toFixed(1) : '-'}/10</Text>
                        </View>
                    </View>
                )}

                {view === 'history' && (
                    <View style={s.content}>
                        <Text style={s.title}>Thống kê {history.length} ngày qua</Text>
                        <View style={s.historyGrid}>
                            {history.length === 0 ? (
                                <Text style={s.emptyText}>Chưa có dữ liệu đánh giá nào.</Text>
                            ) : (
                                history.map((h, i) => (
                                    <View key={i} style={s.historyRow}>
                                        <Text style={s.historyDate}>{h.plan_date}</Text>
                                        <View style={s.barContainer}>
                                            <View style={[s.bar, { width: `${h.total_score * 10}%` }]} />
                                        </View>
                                        <Text style={s.historyScore}>{h.total_score.toFixed(1)}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const AssessmentSlider = ({ label, desc, value, onChange }: any) => {
    return (
        <View style={s.sliderCard}>
            <Text style={s.sliderLabel}>{label}</Text>
            <Text style={s.sliderDesc}>{desc}</Text>
            <View style={s.dotsRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(dot => (
                    <TouchableOpacity
                        key={dot}
                        onPress={() => onChange(dot)}
                        style={[s.dot, value >= dot && s.dotActive, value === dot && s.dotSelected]}
                    >
                        <Text style={[s.dotText, value >= dot && { color: '#FFF' }]}>{dot}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFBF7' },
    tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 10 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 4 },
    tabActive: { borderBottomColor: MAROON },
    tabText: { fontSize: 12, color: '#94A3B8', fontWeight: '600', fontFamily: 'Montserrat-SemiBold' },
    tabTextActive: { color: MAROON },

    content: { padding: 16 },
    titleRow: { marginBottom: 20 },
    title: { fontSize: 18, fontWeight: '800', color: MAROON, fontFamily: 'Montserrat-Bold', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#64748B', lineHeight: 18, fontFamily: 'Montserrat' },

    taskCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checkBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    taskTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1E293B', fontFamily: 'Montserrat-Bold', paddingVertical: 4 },
    iconBtn: { padding: 6 },
    taskDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC', gap: 12 },
    inputGroup: { gap: 4 },
    label: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'Montserrat-Bold' },
    input: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, fontSize: 14, color: '#334155', fontFamily: 'Montserrat' },

    addBtn: { backgroundColor: MAROON, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, gap: 8 },
    addBtnText: { color: '#FFF', fontWeight: '800', fontFamily: 'Montserrat-Bold' },

    sliderCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    sliderLabel: { fontSize: 14, fontWeight: '800', color: MAROON, fontFamily: 'Montserrat-Bold' },
    sliderDesc: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12, fontFamily: 'Montserrat' },
    dotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    dotActive: { backgroundColor: MAROON + '80' },
    dotSelected: { backgroundColor: MAROON },
    dotText: { fontSize: 11, fontWeight: '800', color: '#64748B', fontFamily: 'Montserrat-Bold' },

    totalScoreBox: { marginTop: 20, backgroundColor: '#FFF8E7', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: GOLD },
    totalLabel: { fontSize: 14, fontWeight: '700', color: '#92400E', fontFamily: 'Montserrat-Bold' },
    totalValue: { fontSize: 32, fontWeight: '900', color: MAROON, marginTop: 4, fontFamily: 'Montserrat-Bold' },

    historyGrid: { gap: 12 },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyDate: { width: 90, fontSize: 11, color: '#64748B', fontFamily: 'Montserrat-SemiBold' },
    barContainer: { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    bar: { height: '100%', backgroundColor: MAROON },
    historyScore: { width: 30, fontSize: 12, fontWeight: '800', color: MAROON, textAlign: 'right', fontFamily: 'Montserrat-Bold' },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40 }
});
