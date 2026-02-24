import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Send, ArrowLeft, Sparkles, Moon } from 'lucide-react-native';
import { aiAstrologerService } from '../../services/aiAstrologerService';
import { tibetanCalendarService } from '../../services/tibetanCalendarService';
import { userService } from '../../services/userService';

const { width } = Dimensions.get('window');

const C = {
    bg: '#F9FAFB', // Light gray background
    surface: '#FFFFFF', // White cards/bubbles
    primary: '#D4AF37', // Gold
    primaryDark: '#B49330', // Darker Gold
    text: '#1E293B', // Dark slate text
    textMute: '#64748B', // Muted text
    red: '#800000', // Primary app red
    headerText: '#FFFFFF', // White text for header
    userBubble: '#800000', // Red for user messages
    aiBubble: '#FFFFFF', // White for AI
};

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'ai';
};

export default function AstrologerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<Message[]>([{
        id: 'initial',
        text: 'Hoan hỷ chào Đạo hữu. Ta là Chiêm tinh gia Mật Tông. Hôm nay Đạo hữu muốn hỏi về ngày cắt tóc, hướng xuất hành, hay mong muốn chọn ngày lành cho một việc trọng đại?\n\n(Lưu ý: Mỗi lần thỉnh giáo sẽ cần 10 Mpoint năng lượng nhé 🙏)',
        sender: 'ai'
    }]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mpoints, setMpoints] = useState<number | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        userService.getMPointsBalance().then(setMpoints).catch(console.error);
    }, []);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), text: inputText.trim(), sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            // Get current context
            const dailyData = tibetanCalendarService.getCalendarData(new Date());
            const context = `
Hôm nay là Ngày Âm lịch/Tạng: ${dailyData.lunarDay}/${dailyData.lunarMonth}. 
Can chi: Ngày ${dailyData.lunarDayName}, Tháng ${dailyData.lunarMonthName}, Năm ${dailyData.lunarYear}.
Giờ tốt hôm nay: ${dailyData.goodHours.join(', ')}.
Kết quả cắt tóc hôm nay: ${dailyData.haircut.description}.
Hướng hỷ thần/tài thần: ${dailyData.travelDirection}.
            `.trim();

            const aiResponseText = await aiAstrologerService.askAstrologer(userMsg.text, context);

            const aiMsg: Message = { id: (Date.now() + 1).toString(), text: aiResponseText, sender: 'ai' };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), text: 'Hệ thống năng lượng đang gián đoạn, xin hỏi lại sau.', sender: 'ai' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            userService.getMPointsBalance().then(setMpoints).catch(console.error);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    return (
        <KeyboardAvoidingView
            style={s.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style="light" />
            <View style={[s.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ArrowLeft size={24} color={C.headerText} />
                </TouchableOpacity>
                <View style={s.headerTitleBox}>
                    <Sparkles size={16} color={C.primary} />
                    <Text style={s.headerTitle}>Chiêm Tinh Gia</Text>
                    {mpoints !== null && (
                        <View style={{ backgroundColor: '#B49330', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 4 }}>
                            <Text style={{ fontSize: 10, color: '#FFF', fontWeight: 'bold' }}>{mpoints} Mpoint</Text>
                        </View>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={s.chatContainer}
                contentContainerStyle={s.chatContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={s.astrologerProfile}>
                    <View style={s.avatarGlow}>
                        <View style={s.avatar}>
                            <Sparkles size={32} color={C.primary} />
                        </View>
                    </View>
                    <Text style={s.profileName}>Hỏi Đáp AI</Text>
                    <Text style={s.profileSub}>Giải đáp lịch tạng, tử vi, trạch cát</Text>
                </View>

                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            s.messageBubble,
                            msg.sender === 'user' ? s.userBubble : s.aiBubble
                        ]}
                    >
                        <Text style={[
                            s.messageText,
                            msg.sender === 'user' ? s.userText : s.aiText
                        ]}>
                            {msg.text}
                        </Text>
                    </View>
                ))}

                {isLoading && (
                    <View style={[s.messageBubble, s.aiBubble, { width: 80, alignItems: 'center' }]}>
                        <ActivityIndicator size="small" color={C.primary} />
                    </View>
                )}
            </ScrollView>

            <View style={[s.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TextInput
                    style={s.input}
                    placeholder="Hỏi về ngày, giờ tốt... (10 Mpoint)"
                    placeholderTextColor="#64748B"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={isLoading || !inputText.trim()}
                    style={[s.sendBtn, (!inputText.trim() || isLoading) && s.sendBtnDisabled]}
                >
                    <Send size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
            {Platform.OS === 'ios' && <View style={{ height: insets.bottom }} />}
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 16,
        backgroundColor: C.red,
        borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { color: C.headerText, fontSize: 18, fontWeight: 'bold' },

    chatContainer: { flex: 1 },
    chatContent: { padding: 16, paddingBottom: 32 },

    astrologerProfile: { alignItems: 'center', marginVertical: 32 },
    avatarGlow: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)'
    },
    avatar: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: C.surface,
        alignItems: 'center', justifyContent: 'center'
    },
    profileName: { color: C.primary, fontSize: 16, fontWeight: 'bold', marginTop: 16 },
    profileSub: { color: C.textMute, fontSize: 13, marginTop: 4 },

    messageBubble: {
        maxWidth: width * 0.8,
        padding: 16, borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: C.userBubble,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: C.aiBubble,
        borderBottomLeftRadius: 4,
    },
    messageText: { fontSize: 15, lineHeight: 24 },
    userText: { color: '#FFFFFF' },
    aiText: { color: C.text },

    inputContainer: {
        flexDirection: 'row', alignItems: 'flex-end',
        padding: 16, paddingTop: 12,
        backgroundColor: C.surface,
        borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)'
    },
    input: {
        flex: 1, backgroundColor: '#F1F5F9',
        color: C.text, fontSize: 15,
        borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
        minHeight: 48, maxHeight: 120,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)'
    },
    sendBtn: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: C.primary,
        alignItems: 'center', justifyContent: 'center',
        marginLeft: 12
    },
    sendBtnDisabled: {
        backgroundColor: '#475569', opacity: 0.5
    }
});
