import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, Lock, Flame, Info } from 'lucide-react-native';
import { yangtiService, YangtiStage } from '../../../services/yangtiService';

const VAJRA_BURGUNDY = '#5e0b0b';
const VAJRA_GOLD = '#D4AF37';
const VAJRA_CREAM = '#Fdfbf7';

export default function YangtiPathScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [stages, setStages] = useState<YangtiStage[]>([]);
    const [currentStageNum, setCurrentStageNum] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const [accumulationStats, setAccumulationStats] = useState<Record<number, number>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedStages = await yangtiService.getStages();
            const userProgress = await yangtiService.getUserProgress();

            // Fallback content if DB is empty
            if (fetchedStages.length === 0) {
                setStages([
                    { stage_number: 1, stage_group: 'NGONDRO FOUNDATIONS', title: 'Quy y Tam bảo', description: '', metric_goal: 'COMPLETED' },
                    { stage_number: 2, stage_group: 'NGONDRO FOUNDATIONS', title: '4 Niệm chuyển tâm', description: '', metric_goal: 'COMPLETED' },
                    { stage_number: 3, stage_group: 'NGONDRO FOUNDATIONS', title: 'Quy y và lễ lậy 108 lễ', description: '', metric_goal: '10.000 Lễ' },
                    { stage_number: 4, stage_group: 'ACCUMULATION PATH', title: 'Cúng dường Mandala 108 lễ', description: '', metric_goal: '10.000 Lễ' },
                    { stage_number: 5, stage_group: 'ACCUMULATION PATH', title: 'Sám hối KCTĐ 108 biến 100 âm', description: '', metric_goal: '10.000 Lễ' },
                    { stage_number: 6, stage_group: 'ACCUMULATION PATH', title: 'Guru Yoga', description: '', metric_goal: '10.000 Lễ' },
                    { stage_number: 7, stage_group: 'ACCUMULATION PATH', title: 'Tích lũy túc số 3Kaya', description: '', metric_goal: '1.400.000 Biến' },
                    { stage_number: 8, stage_group: 'SECRET MANTRAYANA', title: 'Nhập thất 3kaya', description: '', metric_goal: 'Thời gian: 6 tháng' },
                    { stage_number: 9, stage_group: 'SECRET MANTRAYANA', title: 'Nhập thất 3 căn', description: '', metric_goal: '3 năm 3 tháng 3 ngày' },
                    { stage_number: 10, stage_group: 'SECRET MANTRAYANA', title: 'Thiền bóng tối', description: '', metric_goal: 'Ultimate Stage' },
                ]);
            } else {
                setStages(fetchedStages);
            }
            setCurrentStageNum(userProgress);

            const stats = await yangtiService.getAccumulationStats();
            setAccumulationStats(stats);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const navToStage = (stage: YangtiStage) => {
        // Even locked stages can be viewed (read-only mode), but let's encourage linear progression.
        // Based on user request, maybe we allow them to view and see who's there.
        router.push({
            pathname: '/account/yangti/[stage]',
            params: { stage: stage.stage_number }
        });
    };

    // Group stages
    const ngondro = stages.filter(s => s.stage_group === 'NGONDRO FOUNDATIONS');
    const accumulation = stages.filter(s => s.stage_group === 'ACCUMULATION PATH');
    const secret = stages.filter(s => s.stage_group === 'SECRET MANTRAYANA');

    // Progress Logic Update
    // Total path weights: first 7 stages = 25% (So being at stage 8 = 25% done)
    // Remaining 3 stages (8,9,10) = 75% 
    let progressPercent = 0;
    if (currentStageNum > 10) {
        progressPercent = 100;
    } else if (currentStageNum <= 8) {
        progressPercent = Math.round(((currentStageNum - 1) / 7) * 25);
    } else {
        progressPercent = Math.round(25 + (((currentStageNum - 8) / 3) * 75));
    }

    const renderStageNode = (stage: YangtiStage) => {
        const isCompleted = stage.stage_number < currentStageNum;
        const isCurrent = stage.stage_number === currentStageNum;
        const isLocked = stage.stage_number > currentStageNum;

        let statusText = 'LOCKED';
        let statusColor = 'text-slate-400';
        let borderColor = 'border-slate-200';
        let bgColor = 'bg-white';
        let IconBadge = <Lock size={16} color="#94a3b8" />;

        if (isCompleted) {
            statusText = 'COMPLETED';
            statusColor = 'text-green-600';
            borderColor = 'border-green-100';
            bgColor = 'bg-white';
            IconBadge = <CheckCircle2 size={24} color="#16a34a" />;
        } else if (isCurrent) {
            statusText = 'CURRENT STAGE';
            statusColor = 'text-vajra-gold';
            borderColor = 'border-vajra-gold/40';
            bgColor = 'bg-vajra-gold/10';
            IconBadge = <Flame size={24} color={VAJRA_GOLD} />;
        }

        const targetMapping: Record<number, number> = {
            3: 10000,
            4: 10000,
            5: 10000,
            6: 10000,
            7: 1400000
        };
        const target = targetMapping[stage.stage_number];
        const currentCount = accumulationStats[stage.stage_number] || 0;
        let pBarPercent = 0;
        if (target) {
            pBarPercent = Math.min((currentCount / target) * 100, 100);
            if (pBarPercent >= 100 && !isCompleted && isCurrent) {
                pBarPercent = 100; // Ready to graduate
            }
        }

        return (
            <TouchableOpacity
                key={stage.stage_number}
                onPress={() => navToStage(stage)}
                activeOpacity={0.8}
                className={`p-4 rounded-2xl border ${borderColor} ${bgColor} mb-3 shadow-sm`}
            >
                <View className="flex-row items-center gap-4">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${isCompleted ? 'bg-green-50' : isCurrent ? 'bg-white' : 'bg-slate-50'}`}>
                        {IconBadge}
                    </View>
                    <View className="flex-1">
                        <Text className={`font-bold text-base ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                            {stage.stage_number}. {stage.title}
                        </Text>
                        <View className="flex-row justify-between items-center mt-1">
                            <Text className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                                {statusText}
                            </Text>
                            <Text className={`text-[10px] ${isLocked ? 'text-slate-400' : 'text-slate-500'}`}>
                                {stage.metric_goal}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Sub-Progress for Accumulation Stages */}
                {target !== undefined && !isLocked && (
                    <View style={{ marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>TIẾN ĐỘ TÚC SỐ</Text>
                            <Text style={{ fontSize: 10, color: '#334155', fontWeight: 'bold' }}>
                                {currentCount.toLocaleString()} / {target.toLocaleString()} ({Math.round(pBarPercent)}%)
                            </Text>
                        </View>
                        <View style={{ height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ width: `${pBarPercent}%`, height: '100%', backgroundColor: VAJRA_GOLD, borderRadius: 2 }} />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-vajra-cream">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-4 bg-vajra-burgundy border-b border-vajra-gold/20" style={{ paddingTop: Math.max(insets.top, 20) + 10 }}>
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color={VAJRA_GOLD} />
                </TouchableOpacity>
                <Text className="text-white text-lg font-black tracking-wide">Yangti Nakpo Practice</Text>
                <TouchableOpacity onPress={() => router.push('/account/yangti/info' as any)} className="p-2 -mr-2">
                    <Info size={22} color={VAJRA_GOLD} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={VAJRA_GOLD} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                    {/* Overall Progress Card */}
                    <View className="bg-vajra-burgundy p-5 rounded-3xl border border-vajra-gold/20 mb-8 shadow-sm">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-vajra-gold mb-1">
                            Overall Progress
                        </Text>
                        <View className="flex-row justify-between items-end mb-4">
                            <Text className="text-white text-2xl font-black">Path to Enlightenment</Text>
                            <Text className="text-vajra-gold text-xl font-black">{progressPercent}%</Text>
                        </View>

                        <View className="h-2 bg-black/20 rounded-full overflow-hidden mb-3">
                            <View style={{ width: `${progressPercent}%` }} className="h-full bg-vajra-gold rounded-full" />
                        </View>
                        <Text className="text-[11px] text-white/60 font-medium italic">
                            ⚙ ️ {currentStageNum - 1} of 10 stages completed
                        </Text>
                    </View>

                    {/* Groups */}
                    <Text className="text-[11px] font-black tracking-widest text-vajra-burgundy uppercase mb-4 ml-1">
                        🏔 NGONDRO FOUNDATIONS
                    </Text>
                    {ngondro.map(renderStageNode)}

                    <Text className="text-[11px] font-black tracking-widest text-vajra-burgundy uppercase mt-8 mb-4 ml-1">
                        💎 ACCUMULATION PATH
                    </Text>
                    {accumulation.map(renderStageNode)}

                    <Text className="text-[11px] font-black tracking-widest text-vajra-burgundy uppercase mt-8 mb-4 ml-1">
                        ❇️ SECRET MANTRAYANA
                    </Text>
                    {secret.map(renderStageNode)}

                </ScrollView>
            )}
        </View>
    );
}
