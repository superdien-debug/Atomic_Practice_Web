import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    Alert, ActivityIndicator, StyleSheet,
    ScrollView, Dimensions, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, ArrowRight, X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const DEEP_MAROON = '#4a0404';
const GOLD_ACCENT = '#c5a059';
const DARK_CARD = 'rgba(20,0,0,0.4)';

interface Question {
    id: string;
    text: string;
    isBuddhistOnly?: boolean;
    labels?: string[]; // Custom labels for the 5 levels
}

export default function SurveyScreen() {
    const { user, setSession } = useAuthStore();
    const [profile, setProfile] = useState<any>(null);
    const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isFinished, setIsFinished] = useState(false);

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const fadeAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        if (useAuthStore.getState().isOnboardingComplete) {
            router.replace('/dashboard');
            return;
        }

        const init = async () => {
            setLoading(true);
            await Promise.all([fetchProfile(), fetchQuestions()]);
            setLoading(false);
        };
        init();
    }, []);

    const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
        setProfile(data);
    };

    const fetchQuestions = async () => {
        const { data } = await supabase
            .from('survey_questions')
            .select('*')
            .order('order_index', { ascending: true });

        if (data) {
            setDbQuestions(data.map(q => ({
                id: q.id, // Keep UUID from DB
                text: q.text,
                isBuddhistOnly: q.is_buddhist_only
            })));
        }
    };

    // Filter questions based on buddhist knowledge
    const activeQuestions = dbQuestions.filter(q =>
        !q.isBuddhistOnly || (profile?.buddhist_knowledge_level && profile.buddhist_knowledge_level !== 'none')
    );

    const currentQuestion = activeQuestions[currentIndex];

    const handleAnswer = (value: number) => {
        setAnswers({ ...answers, [currentQuestion.id]: value });

        if (currentIndex < activeQuestions.length - 1) {
            // Animate transition
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
            ]).start();

            setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
        } else {
            setIsFinished(true);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            // Update onboarding complete status in DB FIRST for reliability
            const { error } = await supabase
                .from('profiles')
                .update({ is_onboarding_complete: true })
                .eq('id', user?.id);

            if (error) throw error;

            // Then update local state and navigate
            useAuthStore.getState().setIsOnboardingComplete(true);
            router.replace('/dashboard');
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể lưu trạng thái: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateResult = () => {
        const orderedAnswers: number[] = activeQuestions.map(q => answers[q.id] || 0);

        const evaluate = (score: number, isExcessQuestion: boolean) => {
            if (score === 5) return { intensity: 5, type: isExcessQuestion ? 'excess' : 'deficiency' };
            if (score === 4) return { intensity: 4, type: isExcessQuestion ? 'excess' : 'deficiency' };
            return { intensity: 0, type: null };
        };

        const adviceMap: Record<string, Record<string, string>> = {
            "Đất": {
                excess: "• THỪA ĐẤT: Năng lượng đang bị trì trệ, dẫn đến sự lười biếng, buồn tẻ và vô minh. Cần tăng Không khí và Lửa.",
                deficiency: "• THIẾU ĐẤT: Năng lượng bị mất gốc rễ, thiếu bám rễ vào hiện tại. Cần thực hành sự ổn định và tập trung."
            },
            "Nước": {
                excess: "• THỪA NƯỚC: Bị sóng cảm xúc nhấn chìm, thiếu sự rõ ràng. Cần tăng Đất để làm bờ bao vững chắc.",
                deficiency: "• THIẾU NƯỚC: Thiếu sự thoải mái và niềm vui sống."
            },
            "Lửa": {
                excess: "• THỪA LỬA: Dẫn đến sự kích động, nóng nảy, thiếu bám rễ. Cần tăng Nước để làm dịu.",
                deficiency: "• THIẾU LỬA: Thiếu ý chí, sự sáng tạo và hạnh phúc."
            },
            "Không khí": {
                excess: "• THỪA KHÍ (GIÓ): Gây ra bồn chồn, lo âu, thiếu sự kiên định. Cần tăng Đất và Nước để giữ lại.",
                deficiency: "• THIẾU KHÍ: Thiếu đi động lực để chuyển hóa, dễ mắc kẹt và cứng nhắc."
            },
            "Không gian": {
                excess: "• THỪA KHÔNG GIAN: Dẫn đến việc lơ lửng, mất kết nối, tâm trí trôi dạt thiếu sự hiện diện.",
                deficiency: "• THIẾU KHÔNG GIAN: Tầm nhìn bị thu hẹp, chỉ đồng nhất bản thân với ngoại cảnh và để rắc rối nuốt chửng mình."
            }
        };

        const signals: { element: string, type: 'excess' | 'deficiency', intensity: number }[] = [];

        const mappings = [
            { el: "Đất", qIdx: 0, isEx: true },
            { el: "Đất", qIdx: 1, isEx: false },
            { el: "Nước", qIdx: 2, isEx: true },
            { el: "Nước", qIdx: 3, isEx: false },
            { el: "Lửa", qIdx: 4, isEx: true },
            { el: "Lửa", qIdx: 5, isEx: false },
            { el: "Không khí", qIdx: 6, isEx: true },
            { el: "Không khí", qIdx: 7, isEx: false },
            { el: "Không gian", qIdx: 8, isEx: true },
            { el: "Không gian", qIdx: 9, isEx: false },
            { el: "Không gian", qIdx: 10, isEx: false }
        ];

        mappings.forEach(m => {
            const rawScore = orderedAnswers[m.qIdx];
            if (!rawScore) return;
            const evalResult = evaluate(rawScore, m.isEx);
            if (evalResult.intensity > 0) {
                signals.push({ element: m.el, type: evalResult.type as any, intensity: evalResult.intensity });
            }
        });

        const finalCandidates: { element: string, type: 'excess' | 'deficiency', intensity: number }[] = [];
        const elements = ["Đất", "Nước", "Lửa", "Không khí", "Không gian"];

        elements.forEach(el => {
            const elSignals = signals.filter(s => s.element === el);
            if (elSignals.length === 0) return;
            elSignals.sort((a, b) => b.intensity - a.intensity);
            finalCandidates.push(elSignals[0]);
        });

        finalCandidates.sort((a, b) => b.intensity - a.intensity);
        const topTwo = finalCandidates.slice(0, 2);

        if (topTwo.length === 0) {
            return {
                advice: "Bạn đang ở trạng thái cân bằng tương đối. Hãy tiếp tục duy trì việc thực hành hàng ngày để trưởng dưỡng các phẩm chất tốt đẹp.",
                element: "balanced"
            };
        }

        return {
            advice: topTwo.map(c => adviceMap[c.element][c.type]).join("\n\n"),
            element: "imbalanced"
        };
    };


    const saveResult = async () => {
        setLoading(true);
        const result = calculateResult();
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_onboarding_complete: true,
                    five_elements_survey: { answers, result }
                })
                .eq('id', user?.id);

            if (error) throw error;

            // Update local state to unblock navigation guard
            useAuthStore.getState().setIsOnboardingComplete(true);
            router.replace('/dashboard');
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={GOLD_ACCENT} size="large" />
            </View>
        );
    }

    if (activeQuestions.length === 0) {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff' }}>Đang tải câu hỏi...</Text>
            </View>
        );
    }

    if (isFinished) {
        const result = calculateResult();
        return (
            <View style={s.root}>
                <StatusBar style="light" />
                <View style={[s.scroll, { paddingTop: insets.top + 60, alignItems: 'center' }]}>
                    <Sparkles size={64} color={GOLD_ACCENT} />
                    <Text style={s.resultTitle}>KẾT QUẢ KHẢO SÁT</Text>

                    <View style={s.resultCard}>
                        <Text style={s.adviceText}>{result.advice}</Text>
                    </View>

                    <Text style={s.resultNote}>
                        Lời khuyên trên dựa trên sự mất cân bằng hiện tại của bạn. Bạn có thể thay đổi cách thực hành để cải thiện sự ổn định.
                    </Text>

                    <TouchableOpacity style={s.submitBtn} onPress={saveResult}>
                        <Text style={s.submitBtnText}>BẮT ĐẦU HÀNH TRÌNH</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={s.root}>
            <StatusBar style="light" />
            <View style={[s.headerTop, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => currentIndex > 0 ? setCurrentIndex(currentIndex - 1) : router.back()}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={s.progressText}>Câu {currentIndex + 1} / {activeQuestions.length}</Text>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={s.skipText}>Bỏ qua</Text>
                </TouchableOpacity>
            </View>

            <View style={s.container}>
                <Animated.View style={[s.questionBox, { opacity: fadeAnim }]}>
                    <View style={s.quoteBox}>
                        <Text style={s.quoteText}>
                            "Cuộc sống quá ngắn ngủi để lãng phí vào việc thực hành tâm linh không phù hợp hoặc không hiệu quả"
                        </Text>
                    </View>

                    <Text style={s.questionText}>{currentQuestion?.text}</Text>

                    <View style={s.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((val) => (
                            <TouchableOpacity
                                key={val}
                                style={[s.rateCircle, answers[currentQuestion.id] === val && s.rateCircleActive]}
                                onPress={() => handleAnswer(val)}
                            >
                                <Text style={[s.rateText, answers[currentQuestion.id] === val && s.rateTextActive]}>
                                    {val}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={s.labelRow}>
                        <Text style={s.indicatorLabel}>Rất ít / Không</Text>
                        <Text style={s.indicatorLabel}>Rất nhiều / Thường xuyên</Text>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: DEEP_MAROON },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 60 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
    progressText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    skipText: { color: GOLD_ACCENT, fontSize: 14 },
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    questionBox: { gap: 40, alignItems: 'center' },
    quoteBox: {
        padding: 20, backgroundColor: DARK_CARD, borderRadius: 16,
        borderLeftWidth: 4, borderLeftColor: GOLD_ACCENT
    },
    quoteText: { color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', textAlign: 'center', lineHeight: 22, fontSize: 14 },
    questionText: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', lineHeight: 30 },
    ratingContainer: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    rateCircle: {
        width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: GOLD_ACCENT,
        justifyContent: 'center', alignItems: 'center'
    },
    rateCircleActive: { backgroundColor: GOLD_ACCENT },
    rateText: { color: GOLD_ACCENT, fontSize: 20, fontWeight: 'bold' },
    rateTextActive: { color: DEEP_MAROON },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: -20 },
    indicatorLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

    resultTitle: { color: GOLD_ACCENT, fontSize: 24, fontWeight: '900', marginTop: 24, letterSpacing: 2 },
    resultCard: {
        backgroundColor: DARK_CARD, padding: 30, borderRadius: 24, marginTop: 40, width: '100%',
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)'
    },
    adviceText: { color: '#fff', fontSize: 16, textAlign: 'left', lineHeight: 28, fontWeight: '600' },
    resultNote: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20, fontSize: 13, lineHeight: 18 },
    submitBtn: {
        backgroundColor: GOLD_ACCENT, padding: 16, borderRadius: 12, alignItems: 'center',
        marginTop: 40, width: '100%', shadowColor: GOLD_ACCENT, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
    },
    submitBtnText: { color: DEEP_MAROON, fontWeight: '800', fontSize: 16, letterSpacing: 2 },
});
