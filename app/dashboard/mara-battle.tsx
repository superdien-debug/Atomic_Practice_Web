import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Animated, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, ShieldAlert, Zap, Skull, Shield, Dices } from 'lucide-react-native';
import { maraService } from '../../services/maraService';
import { rebirthService } from '../../services/rebirthService';
import { useAuthStore } from '../../store/authStore';

const DARK_BG = '#0f172a'; // slate-900
const DARK_ACCENT = '#1e293b'; // slate-800
const MARA_RED = '#dc2626'; // red-600
const GLITCH_PINK = '#db2777'; // pink-600
const WIN_GOLD = '#F59E0B';
const { width, height } = Dimensions.get('window');

export default function MaraBattleScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();

    // From route params
    const targetRealmId = parseInt(params.targetRealmId as string);
    const targetRealmName = params.targetRealmName as string;
    const fromRealmId = parseInt(params.fromRealmId as string);
    const diceResult = parseInt(params.dice as string);

    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState<'taunt' | 'evaluating' | 'dice_duel' | 'result'>('taunt');
    const [timeLeft, setTimeLeft] = useState(60);
    const [result, setResult] = useState<{ win: boolean, score: number, feedback: string, finalRealmName?: string, meritChange?: number } | null>(null);

    // Dice Duel states
    const [questionScore, setQuestionScore] = useState(0);
    const [playerDice, setPlayerDice] = useState(1);
    const [maraDice, setMaraDice] = useState(1);
    const [isRolling, setIsRolling] = useState(false);

    // Animations
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.9, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === 'taunt' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTimeOut();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    const handleTimeOut = async () => {
        setStatus('evaluating');
        await processBattleResult(false, 0, "Ngươi đã im lặng vì sợ hãi. Định lực quá yếu kém!", 1, 6);
    };

    const handleSubmit = async () => {
        if (!userInput.trim()) return;
        setStatus('evaluating');

        try {
            const evalResult = await maraService.evaluateResponse(userInput.trim(), targetRealmName);
            setQuestionScore(evalResult.score);
            setResult({
                win: false,
                score: evalResult.score,
                feedback: evalResult.feedback
            });
            // Transition to Dice Duel
            setStatus('dice_duel');
        } catch (error) {
            console.error(error);
            setQuestionScore(0);
            setResult({
                win: false,
                score: 0,
                feedback: "Tâm trí ngươi đang rối loạn, không vượt qua được ảo ảnh!"
            });
            setStatus('dice_duel');
        }
    };

    const startDiceRolling = () => {
        setIsRolling(true);
        let rollCount = 0;
        const interval = setInterval(() => {
            setPlayerDice(Math.floor(Math.random() * 6) + 1);
            setMaraDice(Math.floor(Math.random() * 6) + 1);
            rollCount++;
            if (rollCount >= 10) {
                clearInterval(interval);
                finalizeDiceDuel();
            }
        }, 120);
    };

    const finalizeDiceDuel = async () => {
        const pDice = Math.floor(Math.random() * 6) + 1;
        const mDice = Math.floor(Math.random() * 6) + 1;
        setPlayerDice(pDice);
        setMaraDice(mDice);

        const modifier = questionScore >= 7 ? 2 : 0;
        const playerTotal = pDice + modifier;
        const isWin = playerTotal > mDice;

        setIsRolling(false);
        await processBattleResult(isWin, questionScore, result?.feedback || "", pDice, mDice);
    };

    const processBattleResult = async (isWin: boolean, score: number, feedback: string, pDice: number, mDice: number) => {
        try {
            if (user?.id) {
                const finishResult = await rebirthService.processMaraBattleResult(
                    user.id,
                    isWin,
                    fromRealmId,
                    targetRealmId,
                    diceResult
                );

                const finalFeedback = feedback + `\n\n[Quyết đấu Xúc xắc: Bạn đổ ⚂ ${pDice}${score >= 7 ? ' (+2)' : ''} vs Mara đổ ⚁ ${mDice}. Kết quả: ${isWin ? 'THẮNG' : 'THUA'}]`;

                setResult({
                    win: isWin,
                    score,
                    feedback: finalFeedback,
                    finalRealmName: finishResult.finalRealm.name || (isWin ? targetRealmName : 'Cõi Bắc Câu Lư Châu (Thiên Giới)'),
                    meritChange: finishResult.meritChange
                });
            }
        } catch (e: any) {
            console.error("Failed to process mara result:", e);
            setResult({
                win: isWin,
                score,
                feedback: feedback + " (Lỗi lưu kết quả, nhưng ngươi đã nhận hình phạt!)",
                finalRealmName: "Cõi Trần", 
                meritChange: 0
            });
        }

        setStatus('result');
    };

    const getDiceEmoji = (val: number) => {
        switch (val) {
            case 1: return '⚀';
            case 2: return '⚁';
            case 3: return '⚂';
            case 4: return '⚃';
            case 5: return '⚄';
            case 6: return '⚅';
            default: return '🎲';
        }
    };

    const finishEncounter = () => {
        router.back();
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar style="light" />

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Skull size={24} color={MARA_RED} />
                    <Text style={styles.headerTitle}>THỬ THÁCH CỦA MA VƯƠNG</Text>
                </View>
                {status === 'taunt' && (
                    <View style={styles.timerBadge}>
                        <Text style={[styles.timerText, timeLeft <= 10 && styles.timerDanger]}>
                            {timeLeft}s
                        </Text>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* Mara's Avatar/VFX */}
                <View style={styles.maraAvatarContainer}>
                    <Animated.View style={[styles.maraAura, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={styles.maraCore}>
                        <ShieldAlert size={60} color="#fff" />
                    </View>
                </View>

                {/* Mara's Dialogue */}
                <View style={styles.chatBubble}>
                    <Text style={styles.maraName}>Ma Vương:</Text>
                    {status === 'taunt' && (
                        <Text style={styles.maraMessage}>
                            "Ngươi nghĩ mình đủ tư cách tiến vào {targetRealmName} sao? Những kẻ như ngươi chỉ mang theo đầy bần tiện và tham cầu giả dối. Ở lại đây hưởng thụ luân hồi không tốt hơn việc tu tập cực khổ hay sao? Nói đi, sự tu tập của ngươi đáng giá cái gì?"
                        </Text>
                    )}
                    {status === 'evaluating' && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={MARA_RED} />
                            <Text style={styles.evalText}>Ma Vương đang soi xét tâm trí ngươi...</Text>
                        </View>
                    )}
                    {status === 'dice_duel' && (
                        <Text style={styles.maraMessage}>
                            "Hahaha! Hãy xem vận mệnh có đứng về phía ngươi trước xúc xắc định mệnh của ta không!"
                        </Text>
                    )}
                    {status === 'result' && result && (
                        <Text style={styles.maraMessage}>{result.feedback}</Text>
                    )}
                </View>

                {/* Dice Duel Phase */}
                {status === 'dice_duel' && (
                    <View style={styles.diceCard}>
                        <View style={styles.diceHeader}>
                            <Dices size={28} color={WIN_GOLD} />
                            <Text style={styles.diceTitle}>QUYẾT ĐẤU XÚC XẮC</Text>
                        </View>
                        
                        <Text style={styles.diceDesc}>
                            Điểm chánh kiến đạt <Text style={{fontWeight: 'bold', color: WIN_GOLD}}>{questionScore}/10</Text>. {'\n'}
                            {questionScore >= 7 ? (
                                <Text style={{color: '#10B981', fontWeight: 'bold'}}>Nhận được +2 Điểm Xúc Xắc (Định Lực) !</Text>
                            ) : (
                                <Text style={{color: '#94a3b8'}}>Định lực chưa đủ, gieo xúc xắc cơ bản.</Text>
                            )}
                        </Text>

                        <View style={styles.duelContainer}>
                            {/* Player Dice */}
                            <View style={styles.diceBox}>
                                <Text style={styles.diceBoxLabel}>Bạn</Text>
                                <View style={[styles.diceGraphic, isRolling && styles.diceRolling]}>
                                    <Text style={styles.diceEmoji}>{getDiceEmoji(playerDice)}</Text>
                                    <Text style={styles.diceValText}>{playerDice}</Text>
                                </View>
                                {questionScore >= 7 && (
                                    <Text style={styles.diceModifierText}>+2 Bonus</Text>
                                )}
                            </View>

                            <Text style={styles.vsText}>VS</Text>

                            {/* Mara Dice */}
                            <View style={styles.diceBox}>
                                <Text style={[styles.diceBoxLabel, {color: MARA_RED}]}>Mara</Text>
                                <View style={[styles.diceGraphic, styles.maraDiceGraphic, isRolling && styles.diceRolling]}>
                                    <Text style={styles.diceEmoji}>{getDiceEmoji(maraDice)}</Text>
                                    <Text style={styles.diceValText}>{maraDice}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Roll Action Button */}
                        <TouchableOpacity 
                            style={[styles.rollBtn, isRolling && styles.rollBtnDisabled]}
                            onPress={startDiceRolling}
                            disabled={isRolling}
                        >
                            <Text style={styles.rollBtnText}>
                                {isRolling ? 'Đang gieo...' : 'Gieo Quyết Đấu!'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Result Section */}
                {status === 'result' && result && (
                    <View style={[styles.resultCard, result.win ? styles.resultWin : styles.resultLoss]}>
                        <View style={styles.resultHeader}>
                            {result.win ? <Shield size={30} color={WIN_GOLD} /> : <Zap size={30} color={MARA_RED} />}
                            <Text style={[styles.resultTitle, { color: result.win ? WIN_GOLD : MARA_RED }]}>
                                {result.win ? 'CHIẾN THẮNG MA VƯƠNG' : 'THẤT BẠI'}
                            </Text>
                        </View>

                        <Text style={styles.scoreText}>Điểm Định Lực: {result.score}/10</Text>

                        {result.win ? (
                            <Text style={styles.resultDesc}>
                                Ngươi đã bảo vệ được sơ tâm. Cửa vào {result.finalRealmName} đã mở. {'\n'}
                                <Text style={{ color: WIN_GOLD }}>Nhận được {result.meritChange} Điểm Công Đức.</Text>
                            </Text>
                        ) : (
                            <Text style={styles.resultDesc}>
                                Tâm ngươi còn bám chấp. Ngươi bị lực hút của Ma Vương kéo rớt lại, sa vào {result.finalRealmName} - nơi u mê hưởng lạc mà quên đi con đường giải thoát.
                            </Text>
                        )}

                        <TouchableOpacity style={styles.continueBtn} onPress={finishEncounter}>
                            <Text style={styles.continueBtnText}>Tiếp tục</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

            {/* Input Section */}
            {status === 'taunt' && (
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Hãy dùng chánh kiến để đáp lại..."
                        placeholderTextColor="#64748b"
                        value={userInput}
                        onChangeText={setUserInput}
                        multiline
                        maxLength={300}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !userInput.trim() && styles.sendBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={!userInput.trim() || status !== 'taunt'}
                    >
                        <Send size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_BG,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#334155'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2
    },
    timerBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#475569'
    },
    timerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    timerDanger: {
        color: MARA_RED
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    maraAvatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        marginBottom: 20
    },
    maraAura: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: MARA_RED,
        opacity: 0.3,
        shadowColor: MARA_RED,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 10
    },
    maraCore: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#000',
        borderWidth: 2,
        borderColor: MARA_RED,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: GLITCH_PINK,
        shadowOffset: { width: -2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    chatBubble: {
        backgroundColor: DARK_ACCENT,
        padding: 20,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    maraName: {
        color: MARA_RED,
        fontWeight: '900',
        fontSize: 14,
        marginBottom: 8,
        letterSpacing: 1
    },
    maraMessage: {
        color: '#e2e8f0',
        fontSize: 16,
        lineHeight: 24,
        fontStyle: 'italic'
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10
    },
    evalText: {
        color: '#94a3b8',
        fontSize: 14
    },
    inputArea: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: DARK_ACCENT,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        alignItems: 'flex-end',
        gap: 10
    },
    input: {
        flex: 1,
        backgroundColor: DARK_BG,
        borderWidth: 1,
        borderColor: '#475569',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        maxHeight: 120,
        minHeight: 50
    },
    sendBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: MARA_RED,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#334155',
        opacity: 0.5
    },
    resultCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        marginTop: 10
    },
    resultWin: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: WIN_GOLD
    },
    resultLoss: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderColor: MARA_RED
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1
    },
    scoreText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    resultDesc: {
        color: '#cbd5e1',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20
    },
    continueBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25
    },
    continueBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16
    },
    diceCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#475569',
        backgroundColor: DARK_ACCENT,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20
    },
    diceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15
    },
    diceTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1
    },
    diceDesc: {
        color: '#cbd5e1',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20
    },
    duelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        marginBottom: 25
    },
    diceBox: {
        alignItems: 'center',
        gap: 5
    },
    diceBoxLabel: {
        color: WIN_GOLD,
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    diceGraphic: {
        width: 85,
        height: 85,
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5
    },
    maraDiceGraphic: {
        backgroundColor: '#fecaca',
        borderColor: MARA_RED
    },
    diceEmoji: {
        fontSize: 38,
        color: '#000'
    },
    diceValText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
        marginTop: 2
    },
    diceModifierText: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    vsText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#64748b'
    },
    rollBtn: {
        backgroundColor: WIN_GOLD,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        shadowColor: WIN_GOLD,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    rollBtnDisabled: {
        backgroundColor: '#475569',
        opacity: 0.5
    },
    rollBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold'
    },
    diceRolling: {
        transform: [{ rotate: '45deg' }]
    }
});
