import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView,
    TouchableOpacity, ActivityIndicator, KeyboardAvoidingView,
    Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Sparkles, User, MessageCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { userService } from '../../services/userService';
import { aiMemoryService, AIProfile } from '../../services/aiMemoryService';
import { tucsoService } from '../../services/tucsoService';
import { aiProfileUpdater } from '../../utils/aiProfileUpdater';

const BG = '#FDFBF7';
const MAROON = '#800000';
const GOLD = '#D4AF37';

type Message = {
    id: string;
    role: 'user' | 'model';
    content: string;
    action?: {
        type: string;
        message: string;
    };
};

export default function CompanionChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'model', content: 'Xin chào, tôi là người bạn đồng hành của bạn. Hôm nay bạn cảm thấy thế nào?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [mpoints, setMpoints] = useState<number | null>(null);
    const [profile, setProfile] = useState<AIProfile | null>(null);
    const [tucSoTotal, setTucSoTotal] = useState<number>(0);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [points, tucsoCount] = await Promise.all([
                userService.getMPointsBalance(),
                tucsoService.getTotalAccumulated()
            ]);
            setMpoints(points);
            setTucSoTotal(tucsoCount);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                let p = await aiMemoryService.getProfile(user.id);
                if (!p) {
                    p = await aiMemoryService.upsertProfile({
                        user_id: user.id,
                        companion_name: 'Người Bạn Đồng Hành',
                        emotional_state: 'Đang làm quen',
                        practice_stage: 'Khởi đầu'
                    });
                }
                setProfile(p);
            }
        } catch (e) {
            console.error('Failed to load user or profile', e);
        }
    };

    const handleActionPress = (type: string) => {
        if (type === 'breathing') {
            router.push('/breathe');
        } else if (type === 'chanting') {
            router.push('/counter');
        } else {
            router.push('/dashboard/practice');
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || isTyping) return;

        const ts = Date.now().toString();
        const userMsg: Message = { id: ts, role: 'user', content: inputText.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const points = await userService.getMPointsBalance();
            if (points < 1) {
                throw new Error("Bạn cần ít nhất 1 Mpoint để tiếp tục trò chuyện. Hãy thực hành thêm nhé!");
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Chưa đăng nhập");

            // 1. Build Stateful Context
            let statefulContext = `Bạn là ${profile?.companion_name || 'Người Khai Vấn'}, phiên bản AI đồng hành với người dùng trên con đường tâm linh Kim Cương Thừa (Yangti Nakpo) và đời sống. Tâm trạng người dùng hiện tại là: ${profile?.emotional_state || 'Chưa rõ'}.
TIẾN ĐỘ TU TẬP HIỆN TẠI: Đã tích lũy được ${tucSoTotal} biến/hành động Túc Số. Hãy khích lệ họ khi phù hợp.\n\n`;

            const memories = await aiMemoryService.getCoreMemories(user.id, 5);
            if (memories && memories.length > 0) {
                statefulContext += 'KÝ ỨC QUAN TRỌNG VỀ NGƯỜI DÙNG:\n';
                memories.forEach(m => statefulContext += `- ${m.content}\n`);
            }

            const unlockedSkills = await aiMemoryService.getUserUnlockedSkills(user.id);
            if (unlockedSkills && unlockedSkills.length > 0) {
                statefulContext += '\nCÁC KỸ NĂNG BẠN ĐƯỢC PHÉP DÙNG ĐỂ TƯ VẤN:\n';
                unlockedSkills.forEach(s => {
                    if (s.ai_skills) {
                        statefulContext += `- [${s.ai_skills.name}]: ${s.ai_skills.description}\n`;
                    }
                });
            }

            statefulContext += `\nBẠN LÀ AGENTIC AI. BẠN CÓ CÁC CÔNG CỤ (TOOLS) ĐỂ GIÚP NGƯỜI DÙNG THỰC HÀNH.
[QUAN TRỌNG]: Nếu người dùng than thở mệt mỏi, buồn chán, căng thẳng, lo âu -> BẠN PHẢI GỌI HÀM \`suggest_practice\` VỚI \`practice_type\` LÀ 'breathing'.
[QUAN TRỌNG]: Nếu người dùng muốn tịnh hóa, sám hối, tinh tấn, thiền định -> BẠN PHẢI GỌI HÀM \`suggest_practice\` VỚI \`practice_type\` LÀ 'chanting'.
Trò chuyện tự nhiên, ngắn gọn (2-3 câu), ấm áp. Không dùng markdown.`;

            // 2. Call companion-chat edge function
            // Avoid sending local UI-only actions in history
            const historyToSent = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

            const { data, error } = await supabase.functions.invoke('companion-chat', {
                body: {
                    systemPrompt: statefulContext,
                    messageHistory: historyToSent,
                    userId: user.id
                }
            });

            if (error) throw error;
            if (!data || !data.response) throw new Error("Không nhận được phản hồi từ Companion");

            const aiMsg: Message = {
                id: Date.now().toString(),
                role: 'model',
                content: data.response,
                action: data.action
            };
            setMessages(prev => [...prev, aiMsg]);

            await userService.spendMPoints(1);
            setMpoints(prev => (prev || 0) - 1);

            aiProfileUpdater.processInteraction(user.id, userMsg.content).catch(console.error);

        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể kết nối đến AI Companion.');
            setMessages(prev => prev.filter(m => m.id !== ts));
        } finally {
            setIsTyping(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{profile?.companion_name || 'Đồng hành'}</Text>
                    <Text style={styles.headerSub}>{profile?.emotional_state || 'Sẵn sàng kết nối'}</Text>
                </View>
                {mpoints !== null && (
                    <View style={styles.pointsBadge}>
                        <Sparkles size={12} color={GOLD} />
                        <Text style={styles.pointsBadgeText}>{mpoints} Mpt</Text>
                    </View>
                )}
                <TouchableOpacity onPress={() => router.push('/companion/profile')} style={{ padding: 4, marginLeft: 8 }}>
                    <User size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Chat List */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.chatArea}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map(msg => (
                    <View
                        key={msg.id}
                        style={[
                            styles.messageRow,
                            msg.role === 'user' ? styles.messageRowUser : styles.messageRowModel
                        ]}
                    >
                        {msg.role === 'model' && (
                            <View style={styles.agentIcon}>
                                <MessageCircle size={18} color={MAROON} />
                            </View>
                        )}

                        <View style={msg.role === 'user' ? { alignItems: 'flex-end', maxWidth: '75%' } : { alignItems: 'flex-start', maxWidth: '78%' }}>
                            <View style={[
                                styles.messageBubble,
                                msg.role === 'user' ? styles.bubbleUser : styles.bubbleModel
                            ]}>
                                <Text style={[
                                    styles.messageText,
                                    msg.role === 'user' ? styles.textUser : styles.textModel
                                ]}>
                                    {msg.content}
                                </Text>
                            </View>

                            {/* Action Card below AI bubble contextually */}
                            {msg.role === 'model' && msg.action && (
                                <View style={styles.actionCard}>
                                    <View style={styles.actionCardHeader}>
                                        <Sparkles size={14} color={GOLD} />
                                        <Text style={styles.actionCardTitle}>Đề xuất thực hành</Text>
                                    </View>
                                    <Text style={styles.actionCardMessage}>{msg.action.message}</Text>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleActionPress(msg.action!.type)}>
                                        <Text style={styles.actionBtnText}>
                                            {msg.action!.type === 'breathing' ? 'Tập thở ngay' : msg.action!.type === 'chanting' ? 'Tụng chú / Túc số' : 'Thực hành'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {msg.role === 'user' && (
                            <View style={styles.userIcon}>
                                <User size={18} color="#FFF" />
                            </View>
                        )}
                    </View>
                ))}

                {isTyping && (
                    <View style={[styles.messageRow, styles.messageRowModel]}>
                        <View style={styles.agentIcon}>
                            <MessageCircle size={18} color={MAROON} />
                        </View>
                        <View style={[styles.messageBubble, styles.bubbleModel, { paddingHorizontal: 20 }]}>
                            <ActivityIndicator size="small" color={MAROON} />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TextInput
                    style={styles.inputField}
                    placeholder="Trò chuyện với AI..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isTyping}
                >
                    <Send size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },

    header: {
        backgroundColor: MAROON,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 16,
    },
    headerBack: { padding: 4, marginRight: 8 },
    headerTitleContainer: { flex: 1 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', marginTop: 2 },
    pointsBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20,
    },
    pointsBadgeText: { color: GOLD, fontSize: 12, fontWeight: '700' },

    chatArea: { flex: 1 },
    chatContent: { padding: 16, gap: 16, paddingBottom: 30 },

    messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
    messageRowUser: { justifyContent: 'flex-end' },
    messageRowModel: { justifyContent: 'flex-start' },

    agentIcon: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#F5E1DA', alignItems: 'center', justifyContent: 'center',
        marginRight: 8,
    },
    userIcon: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#CCC', alignItems: 'center', justifyContent: 'center',
        marginLeft: 8,
    },

    messageBubble: {
        maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 20,
    },
    bubbleUser: {
        backgroundColor: MAROON,
        borderBottomRightRadius: 4,
    },
    bubbleModel: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1, borderColor: '#EEE',
    },

    messageText: { fontSize: 15, lineHeight: 22 },
    textUser: { color: '#FFF' },
    textModel: { color: '#333' },

    inputContainer: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 12,
        paddingHorizontal: 16, paddingTop: 12,
        backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE',
    },
    inputField: {
        flex: 1,
        backgroundColor: '#F8F8F8', borderRadius: 20,
        paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12,
        minHeight: 45, maxHeight: 100,
        fontSize: 15, color: '#333',
    },
    sendBtn: {
        width: 45, height: 45, borderRadius: 22.5,
        backgroundColor: MAROON,
        alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#CCC',
    },
    actionCard: {
        marginTop: 10,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    actionCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: GOLD,
        marginLeft: 6,
    },
    actionCardMessage: {
        fontSize: 14,
        color: '#444',
        marginBottom: 12,
        lineHeight: 20,
    },
    actionBtn: {
        backgroundColor: MAROON,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
});
