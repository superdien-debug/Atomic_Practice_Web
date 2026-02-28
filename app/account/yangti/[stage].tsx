import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Target, Share2, Users, Send, CheckCircle2 } from 'lucide-react-native';
import { yangtiService, YangtiStage, YangtiComment } from '../../../services/yangtiService';

const VAJRA_BURGUNDY = '#5e0b0b';
const VAJRA_GOLD = '#D4AF37';
const VAJRA_CREAM = '#Fdfbf7';

export default function YangtiStageDetailScreen() {
    const { stage } = useLocalSearchParams();
    const stageNum = parseInt(stage as string, 10);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [stageData, setStageData] = useState<YangtiStage | null>(null);
    const [currentProgress, setCurrentProgress] = useState<number>(1);
    const [practitioners, setPractitioners] = useState<any[]>([]);
    const [comments, setComments] = useState<YangtiComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isNaN(stageNum)) {
            loadData();
        }
    }, [stageNum]);

    const loadData = async () => {
        setLoading(true);
        try {
            const stagesList = await yangtiService.getStages();
            // Try to find in DB, else use fallback 
            let found = stagesList.find(s => s.stage_number === stageNum);
            if (!found) {
                // Temporary mock if db is empty
                found = { stage_number: stageNum, stage_group: 'PATH', title: 'Giai đoạn ' + stageNum, description: 'Đang tải nội dung pháp tu...', metric_goal: '10.000' };
            }
            setStageData(found);

            const [progress, users, comms] = await Promise.all([
                yangtiService.getUserProgress(),
                yangtiService.getActivePractitioners(stageNum),
                yangtiService.getStageComments(stageNum)
            ]);

            setCurrentProgress(progress);
            setPractitioners(users);
            setComments(comms);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkActive = async () => {
        const success = await yangtiService.updateProgress(stageNum);
        if (success) {
            setCurrentProgress(stageNum);
            // Refresh practitioners
            const users = await yangtiService.getActivePractitioners(stageNum);
            setPractitioners(users);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        const success = await yangtiService.addComment(stageNum, newComment.trim());
        if (success) {
            setNewComment('');
            const updatedComms = await yangtiService.getStageComments(stageNum);
            setComments(updatedComms);
        }
    };

    if (loading || !stageData) {
        return (
            <View className="flex-1 bg-vajra-cream justify-center items-center">
                <ActivityIndicator size="large" color={VAJRA_GOLD} />
            </View>
        );
    }

    const isUsersCurrentStage = currentProgress === stageNum;
    const isCompleted = currentProgress > stageNum;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-vajra-cream">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-4 bg-vajra-burgundy border-b border-vajra-gold/20" style={{ paddingTop: Math.max(insets.top, 20) + 10 }}>
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color={VAJRA_GOLD} />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-vajra-gold/70 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Lộ trình Yangti Nakpo</Text>
                    <Text className="text-white text-base font-black tracking-wide leading-none">{stageData?.title}</Text>
                </View>
                <TouchableOpacity className="p-2 -mr-2">
                    <Share2 size={20} color={VAJRA_GOLD} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Hero Banner (Placeholder style) */}
                <View className="w-full h-48 bg-black/50 relative justify-end p-5">
                    {/* Optionally an Image component here if we store stage images */}
                    <View className="absolute top-0 left-0 right-0 bottom-0 bg-vajra-gold/10" />

                    <View className="bg-vajra-gold px-3 py-1 rounded-md self-start mb-2">
                        <Text className="text-black text-[10px] font-black uppercase tracking-widest">Mật Điển Yangti</Text>
                    </View>
                    <Text className="text-white text-3xl font-black text-shadow shadow-black">{stageData?.title}</Text>
                </View>

                <View className="p-5">
                    <View className="flex-row items-center gap-2 mb-3">
                        <Target size={16} color={VAJRA_GOLD} />
                        <Text className="text-vajra-burgundy text-xs font-black uppercase tracking-widest">Mô tả Pháp tu</Text>
                    </View>
                    <Text className="text-slate-700 text-sm leading-6 mb-8">
                        {stageData?.description || 'Giai đoạn này tập trung vào sự thanh tịnh hóa thân tâm thông qua nghi thức... Đây là nền tảng quan trọng trong lộ trình Yangti Nakpo để tích lũy công đức, tịnh hóa nghiệp chướng và phát khởi Bồ Đề Tâm chân chính.'}
                    </Text>

                    {/* Active Practitioners */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-2">
                            <Users size={16} color={VAJRA_BURGUNDY} />
                            <Text className="text-vajra-burgundy text-xs font-black uppercase tracking-widest">Đang thực hành ({practitioners.length})</Text>
                        </View>
                        {practitioners.length > 5 && (
                            <Text className="text-vajra-gold text-[10px] font-bold">Xem tất cả</Text>
                        )}
                    </View>

                    <View className="flex-row mb-2">
                        {practitioners.slice(0, 5).map((p, i) => (
                            <View key={i} className={`w-10 h-10 rounded-full border-2 border-vajra-cream bg-slate-200 overflow-hidden ${i > 0 ? '-ml-3' : ''}`}>
                                {p.avatar_url ? (
                                    <Image source={{ uri: p.avatar_url }} className="w-full h-full" />
                                ) : (
                                    <View className="w-full h-full items-center justify-center bg-slate-300">
                                        <Text className="text-slate-600 text-xs font-black">{p.display_name?.[0] || '?'}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                        {practitioners.length > 5 && (
                            <View className="w-10 h-10 rounded-full border-2 border-vajra-cream bg-vajra-gold/20 items-center justify-center -ml-3">
                                <Text className="text-vajra-burgundy text-[10px] font-black">+{practitioners.length - 5}</Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-slate-400 text-[10px] italic mb-8">Các đồng tu cùng khóa đang tinh tấn ở giai đoạn này.</Text>

                    {/* Action Button */}
                    <TouchableOpacity
                        disabled={isUsersCurrentStage || isCompleted}
                        onPress={handleMarkActive}
                        className={`py-4 rounded-xl items-center flex-row justify-center gap-2 mb-10 ${isUsersCurrentStage
                            ? 'bg-vajra-gold/20 border border-vajra-gold/40'
                            : isCompleted
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-vajra-burgundy shadow-lg shadow-vajra-burgundy/30'
                            }`}
                    >
                        {isCompleted ? (
                            <CheckCircle2 size={20} color="#22c55e" />
                        ) : (
                            <Target size={20} color={isUsersCurrentStage ? VAJRA_GOLD : 'white'} />
                        )}
                        <Text className={`font-black text-sm uppercase tracking-widest ${isUsersCurrentStage || isCompleted ? 'text-slate-800' : 'text-white'
                            }`}>
                            {isUsersCurrentStage
                                ? 'BẠN ĐANG Ở GIAI ĐOẠN NÀY'
                                : isCompleted
                                    ? 'ĐÃ HOÀN THÀNH GIAI ĐOẠN NÀY'
                                    : 'ĐÁNH DẤU: ĐANG THỰC HÀNH TẠI ĐÂY'}
                        </Text>
                    </TouchableOpacity>

                    {/* Discussions */}
                    <View className="flex-row items-center gap-2 mb-5">
                        <Text className="text-vajra-burgundy text-xs font-black uppercase tracking-widest">💬 Thảo luận đồng tu</Text>
                    </View>

                    {comments.length === 0 ? (
                        <Text className="text-slate-400 text-sm text-center py-4 italic">Chưa có chia sẻ nào. Hãy là người đầu tiên!</Text>
                    ) : (
                        comments.map(c => (
                            <View key={c.id} className="flex-row gap-3 mb-4">
                                <View className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                    {c.profiles?.avatar_url ? (
                                        <Image source={{ uri: c.profiles.avatar_url }} className="w-full h-full" />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center bg-slate-300">
                                            <Text className="text-slate-600 font-bold text-[10px]">{c.profiles?.display_name?.[0]}</Text>
                                        </View>
                                    )}
                                </View>
                                <View className="flex-1 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm p-4">
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-slate-800 font-bold">{c.profiles?.display_name}</Text>
                                        <Text className="text-slate-400 text-[10px]">{new Date(c.created_at).toLocaleDateString()}</Text>
                                    </View>
                                    <Text className="text-slate-600 text-sm leading-5">{c.content}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Comment Input */}
            <View className="bg-white p-3 border-t border-slate-200 flex-row items-center gap-3 pb-[env(safe-area-inset-bottom, 20px)]">
                <View className="flex-1 bg-slate-100 rounded-full flex-row items-center px-4 py-1.5">
                    <TextInput
                        placeholder="Viết chia sẻ hoặc câu hỏi..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 h-10 text-slate-800 font-medium"
                        value={newComment}
                        onChangeText={setNewComment}
                    />
                    <TouchableOpacity onPress={handleSendComment} disabled={!newComment.trim()}>
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${newComment.trim() ? 'bg-vajra-burgundy' : 'bg-slate-300'}`}>
                            <Send size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
