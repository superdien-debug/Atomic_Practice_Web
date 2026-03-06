import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

const BG = '#FDFBF7';
const JR_BRAND = '#6B21A8';
const USER_BG = '#F1F5F9';

type Message = { id: string; role: 'user' | 'assistant'; content: string; };

export default function JimRohnChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);

    const [messages, setMessages] = useState<Message[]>([
        { id: 'start', role: 'assistant', content: 'Chào bạn. Bạn đang gặp phải giới hạn nào trong công việc, hay cảm thấy "mắc kẹt" ở đâu trong thói quen hàng ngày?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Provide the system prompt directly to the Edge Function since we might not have it in the DB yet
    const jimRohnPrompt = `
Vai trò và Sứ mệnh (Role & Mission):
Bạn là Jim Rohn, một nhà triết học kinh doanh, diễn giả và huấn luyện viên cuộc sống vĩ đại. Sứ mệnh của bạn trên ứng dụng này là giúp người dùng thay đổi cuộc đời họ thông qua việc thiết lập tính kỷ luật, bắt đầu từ những giờ đầu tiên trong ngày. Bạn tin rằng người thành công không thức dậy để "tồn tại" mà để "kiến tạo", và sự thay đổi không đến từ phép màu mà từ những thói quen nhỏ được lặp đi lặp lại.

Phong cách giao tiếp (Tone & Voice):
- Thực tế và Trực diện: Không dùng những lời lẽ truyền cảm hứng sáo rỗng. Hãy nói thẳng vào vấn đề.
- Áp dụng các Phép ẩn dụ (Metaphors): Giống như Jim Rohn thật, hãy sử dụng quy luật mùa vụ, hạt giống, kiến trúc xây nhà.
- Hỏi để Mở (Socratic Questioning): Luôn kết thúc bằng những câu hỏi để người dùng tự ngẫm.
- Điềm tĩnh, Cổ điển và Sâu sắc: Nói nhịp độ chậm, ngôn từ súc tích. Chào hỏi/Xưng hô: "Chào bạn" / "Tôi".

Nguyên Tắc Cốt Lõi (Core Philosophies) cần đưa vào lời khuyên:
1. Kỷ luật buổi sáng: "Làm chủ buổi sáng, làm chủ cuộc đời."
2. Quy tắc cây bút: "Luôn suy nghĩ trên giấy."
3. Năng lượng và Cấu tạo Cơ thể: Cần có sinh khí để phát triển.
4. Tầm nhìn: Có la bàn rõ ràng.

Quy tắc phản hồi:
- Xác nhận vấn đề của người dùng.
- Liên kết nó với sự thiếu kỷ luật hoặc thiếu thiết kế mục tiêu.
- Đưa ra một nguyên tắc của Jim Rohn để giải quyết.
- Chốt lại bằng một câu hỏi đanh thép.
`.trim();

    const fetchAIResponse = async (userPrompt: string) => {
        try {
            // Note: Assuming there is a generic chat Edge function or using the existing karma-coach with overrides
            const { data, error } = await supabase.functions.invoke('karma-coach', {
                body: {
                    systemPrompt: jimRohnPrompt,
                    userPrompt: userPrompt,
                    userType: 'Normal', // bypass logic
                    bypassSchema: true // Signal edge function to return text not JSON, if supported.
                }
            });

            if (error) {
                // If it fails because of the structure we can fallback to hitting a standard chat endpoint if available, but for now we try to extract
                console.error(error);
                return "Đã có lỗi xảy ra. Kỷ luật đôi khi cũng gặp trở ngại. Hãy thử lại.";
            }

            // Extract the result based on whatever structure comes back
            if (data?.response) return data.response;
            if (data?.text) return data.text;
            if (data?.reply) return data.reply;
            if (data?.persona_response?.encouragement) return data.persona_response.encouragement;
            return JSON.stringify(data);

        } catch (e) {
            console.error(e);
            return "Hãy chuẩn bị lại và thử lại. Không có gì sai khi vấp ngã.";
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Scroll to bottom
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        const aiText = await fetchAIResponse(userMsg.content);

        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiText };
        setMessages(prev => [...prev, aiMsg]);
        setLoading(false);

        // Scroll to bottom
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    return (
        <KeyboardAvoidingView
            style={[styles.root, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
                    <ArrowLeft size={24} color={JR_BRAND} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Jim Rohn</Text>
                    <Text style={styles.headerSub}>Life & Business Coach</Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                        <View key={msg.id} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
                            {!isUser && (
                                <View style={styles.aiAvatar}>
                                    <Image
                                        source={require('../../../assets/AvatarJimRohn.jpg')}
                                        style={{ width: '100%', height: '100%', borderRadius: 18 }}
                                    />
                                </View>
                            )}
                            <View style={[styles.msgBubble, isUser ? styles.msgUser : styles.msgAI]}>
                                <Text style={[styles.msgText, isUser ? { color: '#1E293B' } : { color: '#FFF' }]}>{msg.content}</Text>
                            </View>
                        </View>
                    );
                })}
                {loading && (
                    <View style={[styles.msgRow, styles.msgRowAI]}>
                        <View style={styles.aiAvatar}>
                            <Image
                                source={require('../../../assets/AvatarJimRohn.jpg')}
                                style={{ width: '100%', height: '100%', borderRadius: 18 }}
                            />
                        </View>
                        <View style={[styles.msgBubble, styles.msgAI, { padding: 12 }]}>
                            <ActivityIndicator color="#FFF" size="small" />
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TextInput
                    style={styles.input}
                    placeholder="Viết vấn đề của bạn..."
                    placeholderTextColor="#94A3B8"
                    value={input}
                    onChangeText={setInput}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]}
                    onPress={handleSend}
                    disabled={loading || !input.trim()}
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
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
        backgroundColor: '#FFF'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: JR_BRAND, fontFamily: 'Montserrat-Bold' },
    headerSub: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 1, fontFamily: 'Montserrat-SemiBold' },

    msgRow: { flexDirection: 'row', marginBottom: 16, maxWidth: '90%' },
    msgRowUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    msgRowAI: { alignSelf: 'flex-start', alignItems: 'flex-end' },

    aiAvatar: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: JR_BRAND,
        alignItems: 'center', justifyContent: 'center', marginRight: 8,
        marginBottom: 0, overflow: 'hidden'
    },

    msgBubble: {
        padding: 14, borderRadius: 18, flexShrink: 1
    },
    msgUser: {
        backgroundColor: USER_BG,
        borderBottomRightRadius: 4,
    },
    msgAI: {
        backgroundColor: JR_BRAND,
        borderBottomLeftRadius: 4,
    },
    msgText: { fontSize: 15, lineHeight: 22, flexShrink: 1, fontFamily: 'Montserrat' },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingTop: 12,
        backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: '#E2E8F0'
    },
    input: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 12, paddingBottom: 12,
        fontSize: 15, color: '#1E293B',
        minHeight: 50, maxHeight: 120,
        fontFamily: 'Montserrat'
    },
    sendBtn: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: JR_BRAND,
        alignItems: 'center', justifyContent: 'center'
    }
});
