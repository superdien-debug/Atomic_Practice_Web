import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions, Platform, Animated, Modal, useWindowDimensions, TextInput } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Dices, History, Users, ShieldAlert, Check, ChevronDown, ChevronUp, MessageSquare, Send, Gift, Map, Flame, HeartHandshake, Trophy, Award, Lock, Sparkles, X } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { rebirthService, RebirthState, Realm, RebirthComment, MaraComplaint } from '../../services/rebirthService';
import { useT } from '../../i18n/useT';
import { format } from 'date-fns';
import { practiceService, Practice } from '../../services/practiceService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { treasureService, GameTreasure } from '../../services/treasureService';
import { supabase } from '../../lib/supabase';
import { mandalaService, MandalaSlot, MandalaContribution, MandalaBuildingType } from '../../services/mandalaService';

const GOLD = '#D4AF37';
const BG_LIGHT = '#FEF9EF';
const MAROON = '#800000';
const BRONZE = '#CD7F32';
const { width, height } = Dimensions.get('window');

interface BlessingRequest {
    id: string;
    user_id: string;
    realm_id: number;
    message: string;
    is_fulfilled: boolean;
    profiles: {
        display_name: string;
        avatar_url: string | null;
    } | null;
    realm: {
        name: string;
    } | null;
}

interface LeaderboardUser {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    practices_count: number;
    blessings_count: number;
    mara_wins_count: number;
    streak_score: number;
    attendance_count: number;
    realm_score: number;
    guru_3kaya_count?: number;
    quy_y_count?: number;
    mandala_count?: number;
    sam_hoi_count?: number;
    ap_library_count?: number;
    total_score: number;
}

const getMonthlyRewardName = (rankIdx: number): string | null => {
    if (rankIdx === 0) return "Torma 3kaya";
    if (rankIdx === 1) return "Chuỗi San Hô Đỏ";
    if (rankIdx === 2) return "Bình Tẩy Tịnh Bumpa";
    if (rankIdx === 3 || rankIdx === 4) return "Hương Maratika";
    if (rankIdx === 5 || rankIdx === 6) return "Mặt phật trường thọ nhựa";
    if (rankIdx === 7 || rankIdx === 8 || rankIdx === 9) return "Áo đồng phục Maratika";
    return null;
};

const getQuarterlyRewardName = (rankIdx: number): string | null => {
    if (rankIdx === 0) return "Bình tài bảo Maratika";
    if (rankIdx === 1) return "Dakar (Mũi tên trường thọ)";
    if (rankIdx === 2) return "Thangkar";
    if (rankIdx === 3 || rankIdx === 4) return "Cốc sọ bằng nhựa";
    if (rankIdx === 5 || rankIdx === 6) return "Túi bọc nghi quỹ";
    if (rankIdx === 7 || rankIdx === 8 || rankIdx === 9) return "Bài cúng trên bàn ăn";
    return null;
};

export default function RebirdScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const t = useT();
    const { user } = useAuthStore();
    const { width, height } = useWindowDimensions();

    const [state, setState] = useState<RebirthState | null>(null);
    const [travelers, setTravelers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rolling, setRolling] = useState(false);
    const [diceResult, setDiceResult] = useState<number | null>(null);
    const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
    const [mpoints, setMpoints] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);
    const [rollMessage, setRollMessage] = useState<string | null>(null);
    const [targetRealmName, setTargetRealmName] = useState<string>('');
    const [descExpanded, setDescExpanded] = useState(false);

    // Cooldown Reduce Modal
    const [showReduceModal, setShowReduceModal] = useState(false);
    const [reduceDays, setReduceDays] = useState(1);

    // Blessing requests (cõi thấp thỉnh cầu / cõi cao hộ trì)
    const [blessingRequests, setBlessingRequests] = useState<BlessingRequest[]>([]);
    const [myRequestMessage, setMyRequestMessage] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

    // Tournament Leaderboard Modal
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
    const [periodTab, setPeriodTab] = useState<'month' | 'quarter'>('month');
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [selectedUserForDetails, setSelectedUserForDetails] = useState<LeaderboardUser | null>(null);
    const [userHistory, setUserHistory] = useState<any[]>([]);
    const [loadingUserHistory, setLoadingUserHistory] = useState(false);

    // Comments state
    const [comments, setComments] = useState<RebirthComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    // Treasure state
    const [treasures, setTreasures] = useState<GameTreasure[]>([]);
    const [digging, setDigging] = useState(false);

    // Event countdown state
    const eventStartDate = React.useMemo(() => new Date('2026-05-31T12:00:00+07:00'), []);
    const [eventTimeLeft, setEventTimeLeft] = useState<number>(0);

    // Klesha-mara state variables
    const [showKleshaModal, setShowKleshaModal] = useState(false);
    const [kleshaQuestions, setKleshaQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [kleshaTimer, setKleshaTimer] = useState(20);
    const [kleshaRollData, setKleshaRollData] = useState<any>(null);
    const [processingKlesha, setProcessingKlesha] = useState(false);

    // Mara-complaints state variables
    const [showComplaintsModal, setShowComplaintsModal] = useState(false);
    const [complaints, setComplaints] = useState<MaraComplaint[]>([]);
    const [newComplaintText, setNewComplaintText] = useState('');
    const [sendingComplaint, setSendingComplaint] = useState(false);
    const [loadingComplaints, setLoadingComplaints] = useState(false);

    // Mandala Grid System States
    const [mandalaSlots, setMandalaSlots] = useState<MandalaSlot[]>([]);
    const [mandalaContributions, setMandalaContributions] = useState<Record<string, MandalaContribution[]>>({});
    const [selectedSlotCoord, setSelectedSlotCoord] = useState<{ x: number, y: number } | null>(null);
    const [selectedMandalaSlot, setSelectedMandalaSlot] = useState<MandalaSlot | null>(null);
    const [showMandalaModal, setShowMandalaModal] = useState(false);
    const [contribAmount, setContribAmount] = useState('1000');
    const [contribLoading, setContribLoading] = useState(false);
    const [selectedBuildingType, setSelectedBuildingType] = useState<MandalaBuildingType>('stupa_8');
    const [initLoading, setInitLoading] = useState(false);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    
    // Practice mini-game states
    const [practiceTimer, setPracticeTimer] = useState(0);
    const [isPracticing, setIsPracticing] = useState(false);
    const [blessingProgress, setBlessingProgress] = useState(0);

    useEffect(() => {
        const updateEventTimer = () => {
            const now = new Date();
            const diff = eventStartDate.getTime() - now.getTime();
            setEventTimeLeft(Math.max(0, diff));
        };

        updateEventTimer();
        const interval = setInterval(updateEventTimer, 1000);
        return () => clearInterval(interval);
    }, [eventStartDate]);

    // Klesha-mara Quiz Timer useEffect
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        
        if (showKleshaModal && kleshaTimer > 0 && !processingKlesha) {
            interval = setInterval(() => {
                setKleshaTimer(prev => prev - 1);
            }, 1000);
        } else if (showKleshaModal && kleshaTimer === 0 && !processingKlesha) {
            // Timer expired! Trigger failure automatically (vô minh đọa lạc)
            handleKleshaAnswer(-1);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showKleshaModal, kleshaTimer, processingKlesha]);

    const handleKleshaAnswer = async (selectedOptionIndex: number) => {
        if (processingKlesha) return;

        const currentQuestion = kleshaQuestions[currentQuestionIndex];
        const isCorrect = selectedOptionIndex === currentQuestion.correct_option_index;

        if (isCorrect && currentQuestionIndex < 2) {
            // Correct answer, move to next question (need 3 correct answers)
            setCurrentQuestionIndex(prev => prev + 1);
            setKleshaTimer(20);
            return;
        }

        // We either got a wrong answer/timeout, or successfully answered all 3 questions correctly!
        const isAllCorrect = isCorrect && currentQuestionIndex === 2;
        setProcessingKlesha(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const result = await rebirthService.processKleshaResult(
                user.id,
                isAllCorrect,
                kleshaRollData.from,
                kleshaRollData.to,
                kleshaRollData.dice
            );

            setProcessingKlesha(false);
            setShowKleshaModal(false);

            if (isAllCorrect) {
                // Success: proceed to target realm
                setDiceResult(kleshaRollData.dice);
                setRollMessage(`Chúc mừng đạo hữu đã vượt qua phiền não ma thành công! ${result.message || ''}`);
                setTargetRealmName(result.finalRealm?.name || kleshaRollData.toName);
                setShowResultModal(true);
            } else {
                // Failure: Desended to Súc sinh / Ngạ quỷ
                Alert.alert(
                    "Đọa Lạc Cõi Dữ",
                    `Đạo hữu đã bị phiền não ma lôi kéo do vô minh chướng ngại! Đọa lạc vào: ${result.finalRealm?.name} (${result.meritChange !== 0 ? result.meritChange : ''} Công đức). Hãy nỗ lực tu tập thiền định để hóa giải tập khí!`
                );
            }

            // Reload user state & details
            await loadData();
        } catch (err: any) {
            setProcessingKlesha(false);
            Alert.alert("Lỗi", err.message || "Không thể xử lý kết quả thử thách.");
        }
    };

    const formatEventCountdown = (ms: number) => {
        if (ms <= 0) return 'Đang diễn ra!';
        const totalSecs = Math.floor(ms / 1000);
        const days = Math.floor(totalSecs / (24 * 3600));
        const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        parts.push(`${hours.toString().padStart(2, '0')}h`);
        parts.push(`${minutes.toString().padStart(2, '0')}m`);
        parts.push(`${seconds.toString().padStart(2, '0')}s`);

        return parts.join(' ');
    };

    const shakeAnim = React.useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            if (user) loadData();
        }, [user])
    );

    useEffect(() => {
        if (!state) return;

        const interval = setInterval(() => {
            const expires = new Date(state.expires_at);
            let expiresTs = expires.getTime();

            if (isNaN(expiresTs)) {
                const days = parseInt(state.expires_at as any);
                if (!isNaN(days)) {
                    expiresTs = Date.now() + (days * 24 * 60 * 60 * 1000);
                }
            }

            const now = new Date().getTime();
            const diff = Math.max(0, (expiresTs || now) - now);
            setTimeLeftMs(diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [state]);

    const loadComplaints = async () => {
        setLoadingComplaints(true);
        try {
            const list = await rebirthService.getMaraComplaints();
            setComplaints(list);
        } catch (err) {
            console.error('Failed to load complaints:', err);
        } finally {
            setLoadingComplaints(false);
        }
    };

    const handleSendComplaint = async () => {
        if (!newComplaintText.trim() || sendingComplaint) return;
        setSendingComplaint(true);
        try {
            await rebirthService.sendMaraComplaint(newComplaintText.trim());
            setNewComplaintText('');
            await loadComplaints();
        } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Không thể gửi phàn nàn.");
        } finally {
            setSendingComplaint(false);
        }
    };

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [currentState, mpointsBalance] = await Promise.all([
                rebirthService.getState(user.id),
                userService.getMPointsBalance()
            ]);
            setState(currentState);
            setMpoints(mpointsBalance);
            console.log('[RebirdScreen] Loaded RebirthState:', JSON.stringify(currentState));


            if (currentState?.realm_id) {
                const isLower = currentState.realm_id >= 1 && currentState.realm_id <= 13;
                const isHigher = 
                    (currentState.realm_id >= 27 && currentState.realm_id <= 32) || 
                    (currentState.realm_id >= 35 && currentState.realm_id <= 37) || 
                    (currentState.realm_id >= 70 && currentState.realm_id <= 104);

                // Fetch Mandala Grid if eligible (Desire Realms 10-33, excluding Hells)
                const isMandalaEligible = currentState.realm_id >= 10 && currentState.realm_id <= 33;
                if (isMandalaEligible) {
                    try {
                        const { slots, contributions } = await mandalaService.fetchMandalaGrid(currentState.realm_id);
                        setMandalaSlots(slots);
                        setMandalaContributions(contributions);
                    } catch (err) {
                        console.error('Failed to load mandala grid:', err);
                    }
                }

                // Load travelers in same realm
                try {
                    const tr = await rebirthService.getTravelersInRealm(currentState.realm_id);
                    setTravelers(tr);
                } catch (err) {
                    console.error('Load travelers error:', err);
                }

                // Load blessing requests
                try {
                    if (isHigher) {
                        const reqs = await rebirthService.getBlessingRequests();
                        setBlessingRequests(reqs);
                    } else if (isLower) {
                        // Load own requests or cõi-specific active requests
                        const reqs = await rebirthService.getBlessingRequests(currentState.realm_id);
                        setBlessingRequests(reqs);
                    }
                } catch (err) {
                    console.error('Load blessings error:', err);
                }

                // Fetch comments (locked for cõi thấp)
                if (!isLower) {
                    try {
                        const c = await rebirthService.getRealmComments(currentState.realm_id);
                        setComments(c);
                    } catch (err) {
                        console.error('Load comments error:', err);
                    }
                }

                // Fetch treasures
                try {
                    const realmTreasures = await treasureService.getActiveTreasuresInRealm(currentState.realm_id);
                    const available = [];
                    for (const t of realmTreasures) {
                        const hasWon = await treasureService.hasUserWonTreasure(t.id, user.id);
                        if (!hasWon) available.push(t);
                    }
                    setTreasures(available);
                } catch (err) {
                    console.error('Load treasures error:', err);
                }
            }
        } catch (err) {
            console.error('Failed to load rebirth state:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReduceCooldown = async () => {
        if (!state) return;
        const currentExpires = new Date(state.expires_at).getTime();
        const startTurn = state.turn_started_at 
            ? new Date(state.turn_started_at).getTime() 
            : (state.updated_at ? new Date(state.updated_at).getTime() : new Date(state.created_at || new Date()).getTime());
        const minExpires = startTurn + (6 * 60 * 60 * 1000); // 6-hour min wait

        if (currentExpires <= minExpires) {
            Alert.alert("Chưa đủ điều kiện", "Cảnh giới này đã chạm thời hạn tối thiểu 6 giờ. Bạn cần trải nghiệm nốt thời gian còn lại trước khi gieo xúc xắc.");
            return;
        }

        const maxDaysToReduce = Math.ceil((currentExpires - minExpires) / (24 * 60 * 60 * 1000));
        if (maxDaysToReduce <= 0) {
            Alert.alert("Chưa đủ điều kiện", "Thời gian chờ còn lại của bạn đã chạm thời hạn tối thiểu hoặc không thể rút ngắn thêm.");
            return;
        }

        if (reduceDays > maxDaysToReduce) {
            Alert.alert("Lượt giảm vượt giới hạn", `Ở lượt này, bạn chỉ có thể giảm tối đa thêm ${maxDaysToReduce} ngày để đảm bảo thời gian chờ tối thiểu 6 giờ.`);
            return;
        }

        const cost = reduceDays * 10;
        if (mpoints < cost) {
            Alert.alert("Không đủ Mpoints", `Bạn cần ${cost} Mpoints để giảm ${reduceDays} ngày chờ đợi.`);
            return;
        }

        try {
            setLoading(true);
            const result = await rebirthService.reduceCooldownWithMPoints(reduceDays);
            if (result.success) {
                Alert.alert("🎉 Tiêu Nghiệp Thành Công", `Bạn đã rút ngắn thời gian chờ thành công thêm ${reduceDays} ngày!`);
                setShowReduceModal(false);
                loadData();
            } else {
                Alert.alert("Thất bại", result.message);
            }
        } catch (err: any) {
            Alert.alert("Lỗi", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBlessingRequest = async () => {
        if (!myRequestMessage.trim()) return;
        setSubmittingRequest(true);
        try {
            await rebirthService.createBlessingRequest(myRequestMessage.trim());
            Alert.alert("🎉 Phát Nguyện Thành Công", "Lời thỉnh cầu hộ trì của bạn đã được đăng lên bảng tin chung. Cầu chúc các đồng tu cõi trên trợ duyên cho bạn!");
            setMyRequestMessage('');
            setShowRequestModal(false);
            loadData();
        } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Không thể gửi thỉnh cầu.");
        } finally {
            setSubmittingRequest(false);
        }
    };

    const handleSendBlessing = async (requestId: string) => {
        if (mpoints < 50) {
            Alert.alert("Không đủ Mpoints", "Bạn cần ít nhất 50 Mpoints để thực hiện hồi hướng hộ trì.");
            return;
        }

        const confirmMsg = "Xác nhận tiêu hao 50 Mpoints để hồi hướng hộ trì cho đạo hữu này? Bạn sẽ nhận được +15 Công đức đua Top!";
        const execute = async () => {
            try {
                setLoading(true);
                const result = await rebirthService.sendBlessing(requestId);
                if (result.success) {
                    Alert.alert("🙏 Tùy Hỷ Công Đức", result.message);
                    loadData();
                } else {
                    Alert.alert("Thất bại", result.message);
                }
            } catch (err: any) {
                Alert.alert("Lỗi", err.message);
            } finally {
                setLoading(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) execute();
        } else {
            Alert.alert("Hồi Hướng Công Đức", confirmMsg, [
                { text: t('cancel'), style: 'cancel' },
                { text: "Hồi hướng", onPress: execute }
            ]);
        }
    };

    const handleOpenLeaderboard = async (tab: 'month' | 'quarter') => {
        setPeriodTab(tab);
        setLoadingLeaderboard(true);
        setShowLeaderboardModal(true);
        try {
            const data = await rebirthService.getTournamentLeaderboard(tab);
            setLeaderboard(data);
        } catch (err) {
            console.error('Failed to load tournament leaderboard:', err);
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    const handleSelectUserForDetails = async (item: LeaderboardUser) => {
        setSelectedUserForDetails(item);
        setLoadingUserHistory(true);
        setUserHistory([]);
        try {
            const hist = await rebirthService.getUserHistory(item.user_id);
            setUserHistory(hist);
        } catch (err) {
            console.error("Failed to load user history:", err);
        } finally {
            setLoadingUserHistory(false);
        }
    };

    const handleRollDice = async () => {
        if (timeLeftMs > 0) {
            Alert.alert("Chưa hết thọ mạng", "Cảnh giới hiện tại chưa kết thúc thời gian chờ. Đạo hữu có thể tiêu Mpoints hoặc cầu nguyện cõi trên hộ trì để rút ngắn!");
            return;
        }

        if (mpoints < 50) {
            Alert.alert("Không đủ Mpoints", "Bạn cần ít nhất 50 Mpoints để gieo xúc xắc tái sinh.");
            return;
        }

        const msg = "Xác nhận sử dụng 50 Mpoints để gieo xúc xắc Nghiệp Lực và luân hồi tái sinh?";

        const execute = async () => {
            setRolling(true);
            setDiceResult(null);

            // Shaking animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]),
                { iterations: 15 }
            ).start();

            try {
                const result = await rebirthService.rollDice();
                await new Promise(res => setTimeout(res, 2000));
                shakeAnim.setValue(0);

                if (!result.success) {
                    Alert.alert(t('error'), result.message || t('actionFailed'));
                    setRolling(false);
                    return;
                }

                if (result.encounterMara) {
                    setRolling(false);
                    router.push({
                        pathname: '/dashboard/mara-battle',
                        params: {
                            targetRealmId: result.to?.toString(),
                            targetRealmName: result.toName,
                            fromRealmId: result.from?.toString(),
                            dice: result.dice?.toString()
                        }
                    } as any);
                    return;
                }

                if ((result as any).encounterKlesha) {
                    setRolling(false);
                    setKleshaQuestions((result as any).questions);
                    setCurrentQuestionIndex(0);
                    setKleshaTimer(20);
                    setKleshaRollData({
                        from: result.from,
                        to: result.to,
                        toName: result.toName,
                        dice: result.dice
                    });
                    setShowKleshaModal(true);
                    return;
                }

                setDiceResult(result.dice);
                setRollMessage(result.message || null);
                setTargetRealmName(result.toName);
                setShowResultModal(true);

            } catch (err: any) {
                shakeAnim.setValue(0);
                Alert.alert(t('error'), err.message || t('unknownError'));
            } finally {
                setRolling(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(msg)) execute();
        } else {
            Alert.alert("Tái sinh luân hồi", msg, [
                { text: t('cancel'), style: 'cancel' },
                { text: "Gieo Xúc Xắc", onPress: execute }
            ]);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !state?.realm_id || postingComment) return;

        setPostingComment(true);
        try {
            await rebirthService.addRealmComment(state.realm_id, newComment.trim());
            const c = await rebirthService.getRealmComments(state.realm_id);
            setComments(c);
            setNewComment('');
        } catch (err: any) {
            Alert.alert(t('error'), "Không thể đăng bình luận.");
        } finally {
            setPostingComment(false);
        }
    };

    const handleDigTreasure = async (treasure: GameTreasure) => {
        if (mpoints < 5) {
            Alert.alert(t('insufficientMpoints'), "Bạn cần ít nhất 5 MPoints để khám phá Pháp Bảo.");
            return;
        }

        const execute = async () => {
            if (!user) return;
            setDigging(true);
            try {
                const won = await treasureService.claimTreasure(treasure.id, user.id, 5);
                setMpoints(prev => prev - 5);

                if (won) {
                    Alert.alert("🎉 Chúc Mừng Đạo Hữu!", `Bạn đã tìm thấy Pháp Bảo: ${treasure.name}. Admin sẽ liên hệ để gửi tặng phẩm đến bạn!`);
                    setTreasures(prev => prev.filter(t => t.id !== treasure.id));
                } else {
                    Alert.alert("Chưa đủ duyên", "Rất tiếc bạn chưa tìm thấy Pháp Bảo trong vòng này. Hãy tinh tấn thực hành và thử lại sau nha!");
                }
            } catch (err: any) {
                Alert.alert(t('error'), err.message);
            } finally {
                setDigging(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Sử dụng 5 MPoints để tìm ${treasure.name}?`)) execute();
        } else {
            Alert.alert(
                "Khám phá Pháp Bảo",
                `Sử dụng 5 MPoints để tìm kiếm ${treasure.name} với tỷ lệ thành công ${treasure.drop_rate_percent}%?`,
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: "Khám phá", onPress: execute }
                ]
            );
        }
    };

    if (loading && !state) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={GOLD} />
            </View>
        );
    }

    if (!state || !state.realm) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#666' }}>Không tìm thấy dữ liệu cảnh giới.</Text>
            </View>
        );
    }

    const { realm } = state;
    const isLowerRealm = realm.id >= 1 && realm.id <= 13;
    const isHigherRealm = 
        (realm.id >= 27 && realm.id <= 32) || 
        (realm.id >= 35 && realm.id <= 37) || 
        (realm.id >= 70 && realm.id <= 104);

    // Countdown configuration
    const totalLifeMs = (realm.life_days || 1) * 24 * 60 * 60 * 1000;
    const progress = Math.min(1, timeLeftMs / totalLifeMs);

    const formatTimeLeft = (ms: number) => {
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);

        const parts = [];
        if (days > 0) parts.push(`${days} ngày`);
        if (hours > 0) parts.push(`${hours} giờ`);
        parts.push(`${minutes} phút`);
        if (days === 0 && hours === 0) parts.push(`${seconds} giây`);

        return parts.join(' ');
    };

    // Mandala Practice Timer useEffect
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (isPracticing && practiceTimer > 0) {
            interval = setInterval(() => {
                setPracticeTimer(prev => prev - 1);
                setBlessingProgress(prev => prev + 0.1);
            }, 1000);
        } else if (isPracticing && practiceTimer === 0) {
            setIsPracticing(false);
            completePracticeBlessing();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPracticing, practiceTimer]);

    const handlePressSlot = (x: number, y: number, slot: MandalaSlot | null) => {
        setSelectedSlotCoord({ x, y });
        setSelectedMandalaSlot(slot || null);
        setContribAmount('1000');
        setShowMandalaModal(true);
    };

    const getBuildingEmoji = (type: MandalaBuildingType): string => {
        const emojis: Record<MandalaBuildingType, string> = {
            stupa_8: '🛕',
            prayer_wheel: '🎡',
            guru_rinpoche: '🧘',
            avalokiteshvara: '🙏',
            amitabha: '🪷',
            monastery: '🕌'
        };
        return emojis[type] || '🏯';
    };

    const getBuildingName = (type: MandalaBuildingType): string => {
        const names: Record<MandalaBuildingType, string> = {
            stupa_8: 'Bảo Tháp Mật Tông',
            prayer_wheel: 'Kinh Luân Cát Tường',
            guru_rinpoche: 'Tượng Đức Liên Hoa Sanh',
            avalokiteshvara: 'Tượng Đức Quan Âm',
            amitabha: 'Tượng Đức A Di Đà',
            monastery: 'Tu Viện Mật Tông'
        };
        return names[type] || 'Công trình';
    };

    const handleInitializeSlot = async () => {
        if (!selectedSlotCoord || !state?.realm_id || initLoading) return;
        setInitLoading(true);
        try {
            const newSlot = await mandalaService.initializeSlot(
                state.realm_id,
                selectedSlotCoord.x,
                selectedSlotCoord.y,
                selectedBuildingType
            );
            Alert.alert("🎉 Thành công", "Khởi dựng công trình thần điện thành công! Hãy kêu gọi đồng tu cùng hùn phước.");
            setSelectedMandalaSlot(newSlot);
            
            // Reload grid
            const { slots, contributions } = await mandalaService.fetchMandalaGrid(state.realm_id);
            setMandalaSlots(slots);
            setMandalaContributions(contributions);
        } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Không thể khởi tạo công trình.");
        } finally {
            setInitLoading(false);
        }
    };

    const handleContribute = async () => {
        if (!selectedMandalaSlot || !contribAmount.trim() || contribLoading) return;
        const pts = Number(contribAmount);
        if (isNaN(pts) || pts <= 0) {
            Alert.alert("Lỗi", "Số điểm đóng góp phải là một số lớn hơn 0.");
            return;
        }

        setContribLoading(true);
        try {
            const result = await mandalaService.contributeToSlot(selectedMandalaSlot.id, pts);
            
            // Reload grid & user points
            const [gridData, mpointsBalance] = await Promise.all([
                mandalaService.fetchMandalaGrid(state!.realm_id),
                userService.getMPointsBalance()
            ]);
            
            setMandalaSlots(gridData.slots);
            setMandalaContributions(gridData.contributions);
            setMpoints(mpointsBalance);

            // Find updated slot
            const updatedSlot = gridData.slots.find(s => s.id === selectedMandalaSlot.id);
            setSelectedMandalaSlot(updatedSlot || null);

            Alert.alert(
                result.is_completed ? "🎉 Công Đức Viên Mãn" : "🙏 Tùy Hỷ Cúng Dường", 
                result.is_completed 
                    ? "Công trình thần điện đã chính thức hoàn thiện! Chư vị đóng góp đã được ghi danh vào Bộ sưu tập tâm linh và chia thưởng phước báu."
                    : `Hành giả hùn phước thành công thêm ${result.added_points} MPoints.`
            );
        } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Đóng góp thất bại.");
        } finally {
            setContribLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!selectedMandalaSlot || upgradeLoading) return;
        setUpgradeLoading(true);
        try {
            const upgraded = await mandalaService.upgradeBuilding(selectedMandalaSlot.id);
            Alert.alert("🎉 Thành công", `Đã kích hoạt dự án nâng cấp lên Cấp ${upgraded.level}!`);
            setSelectedMandalaSlot(upgraded);

            // Reload grid
            const { slots, contributions } = await mandalaService.fetchMandalaGrid(state!.realm_id);
            setMandalaSlots(slots);
            setMandalaContributions(contributions);
        } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Nâng cấp thất bại.");
        } finally {
            setUpgradeLoading(false);
        }
    };

    const completePracticeBlessing = async () => {
        if (!selectedMandalaSlot) return;
        try {
            setLoading(true);
            const building = selectedMandalaSlot.building_type;
            let blessingName = "Gia trì tinh tấn";
            
            // Calculate multiplier
            const completedCount = mandalaSlots.filter(s => s.status === 'completed').length;
            const multiplier = 1 + 0.2 * (completedCount - 1);

            if (building === 'stupa_8') blessingName = `Gia trì Tăng trưởng Công Đức (+10% Merit, Hệ số: x${multiplier.toFixed(1)})`;
            else if (building === 'guru_rinpoche') blessingName = `Gia trì MPoints (+50 MPoints, Hệ số: x${multiplier.toFixed(1)})`;
            else if (building === 'avalokiteshvara') blessingName = `Gia trì Hộ Mạng Cản Ma Vương (+30% tỉ lệ cản Mara, Hệ số: x${multiplier.toFixed(1)})`;
            else if (building === 'amitabha') blessingName = `Gia trì Tiêu Trừ Cooldown (-4h Cooldown, Hệ số: x${multiplier.toFixed(1)})`;
            else if (building === 'prayer_wheel') blessingName = `Gia trì Tiêu Trừ Cooldown cõi vĩnh viễn (-5% Cooldown, Hệ số: x${multiplier.toFixed(1)})`;
            else if (building === 'monastery') blessingName = `Gia trì Đại Thiền Định (X2 Merit buổi thiền vừa hoàn thành, Hệ số: x${multiplier.toFixed(1)})`;

            // Insert log linked to a practice
            const { data: practices } = await supabase.from('practices').select('id').limit(1);
            const practiceId = practices?.[0]?.id;
            if (!practiceId) throw new Error("Không tìm thấy bài thực hành hợp lệ để liên kết.");

            const { data: log } = await supabase.from('practice_logs').insert({
                user_id: user?.id,
                practice_id: practiceId,
                log_date: new Date().toISOString().split('T')[0],
                completed: true
            }).select().single();

            await mandalaService.logMandalaPractice(selectedMandalaSlot.id, log.id, blessingName, multiplier);
            
            // App-level bonus execution
            if (building === 'guru_rinpoche') {
                await supabase.from('user_bonus_merits').insert({
                    user_id: user?.id,
                    amount: 50,
                    reason: 'Nhận lực gia trì từ Đức Liên Hoa Sanh'
                });
            } else if (building === 'amitabha') {
                await rebirthService.reduceCooldownWithMPoints(0.166); // 4 hours
            }

            Alert.alert("🎉 Nhận Lực Gia Trì Thành Công!", `Hành giả đã hoàn thành nhiệm vụ thiền định tĩnh lặng. \n\nLực gia trì nhận được: ${blessingName}`);
            setShowMandalaModal(false);
            loadData();
        } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Không thể nhận gia trì.");
        } finally {
            setLoading(false);
        }
    };

    // Monthly prizes shelf
    const monthlyPrizes = [
        "1. Torma 3kaya (01)",
        "2. Chuỗi San Hô Đỏ (01)",
        "3. Bình Tẩy Tịnh Bumpa (01)",
        "4. Hương Maratika (02)",
        "5. Mặt phật trường thọ nhựa (02)",
        "6. Áo đồng phục Maratika (03)"
    ];

    // Quarterly prizes shelf
    const quarterlyPrizes = [
        "1. Bình tài bảo Maratika (01)",
        "2. Dakar (Mũi tên trường thọ) (01)",
        "3. Thangkar (01)",
        "4. Cốc sọ bằng nhựa (02)",
        "5. Túi bọc nghi quỹ (02)",
        "6. Bài cúng trên bàn ăn (03)"
    ];

    return (
        <View style={[styles.container, isLowerRealm && styles.darkUAmBg]}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
                <Text style={styles.headerTitle}>GAME TÁI SINH</Text>
                
                <View style={styles.headerIcons}>
                    {/* Event Trophies Button */}
                    <TouchableOpacity onPress={() => handleOpenLeaderboard('month')} style={styles.eventBtn}>
                        <Trophy size={20} color={GOLD} />
                        <Text style={styles.eventBtnText}>Giải Đấu</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => router.push('/dashboard/samsara-map' as any)}>
                        <Map size={22} color={GOLD} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => router.push('/rebird/history' as any)}>
                        <History size={22} color={GOLD} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Glowing Event Announcement & Countdown Bar */}
                <TouchableOpacity 
                    onPress={() => setShowLeaderboardModal(true)} 
                    style={styles.eventCountdownBar}
                    activeOpacity={0.9}
                >
                    <Sparkles size={16} color={GOLD} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.eventBarTitle}>ĐẠI HỘI TÁI SINH - SEASON 1</Text>
                        <Text style={styles.eventBarCountdown}>Khởi chạy sau: {formatEventCountdown(eventTimeLeft)}</Text>
                    </View>
                    <Trophy size={18} color={GOLD} />
                </TouchableOpacity>

                {/* Realm Banner Image */}
                <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder}>
                        {realm.image_url ? (
                            <Image 
                                source={{ uri: realm.image_url.startsWith('http') || realm.image_url.startsWith('/') ? realm.image_url : `/${realm.image_url}` }} 
                                style={styles.realmImage} 
                            />
                        ) : (
                            <Text style={styles.imageText}>CÕI GIỚI SỐ {realm.id}</Text>
                        )}
                    </View>
                    <View style={styles.realmOverlay}>
                        <Text style={styles.realmIdText}>CẢNH GIỚI #{realm.id}</Text>
                        <Text style={styles.realmNameText}>{realm.name}</Text>
                    </View>
                </View>

                {/* Realm Descriptions */}
                <View style={[styles.infoCard, isLowerRealm && styles.darkUAmCard, isHigherRealm && styles.lightGoldenCard]}>
                    <View style={[styles.descInner, !descExpanded && { maxHeight: Math.round(height * 0.28), overflow: 'hidden' }]}>
                        {realm.short_desc && (
                            <RenderHTML
                                contentWidth={width - 80}
                                source={{ html: realm.short_desc }}
                                baseStyle={isLowerRealm ? styles.shortDescHTMLDark : styles.shortDescHTML}
                            />
                        )}
                        <View style={{ height: 10 }} />
                        <RenderHTML
                            contentWidth={width - 80}
                            source={{ html: realm.description }}
                            baseStyle={isLowerRealm ? styles.descHTMLDark : styles.descHTML}
                        />
                    </View>

                    {!descExpanded && (
                        <View style={[styles.descFadeCover, isLowerRealm && { backgroundColor: 'rgba(30,41,59,0.9)' }]} pointerEvents="none" />
                    )}
                    
                    <TouchableOpacity
                        style={styles.expandBtn}
                        onPress={() => setDescExpanded(v => !v)}
                        activeOpacity={0.7}
                    >
                        {descExpanded
                            ? <ChevronUp size={20} color={isLowerRealm ? '#ef4444' : MAROON} />
                            : <ChevronDown size={20} color={isLowerRealm ? '#ef4444' : MAROON} />}
                        <Text style={[styles.expandBtnText, isLowerRealm && { color: '#ef4444' }]}>
                            {descExpanded ? "Thu gọn mô tả" : "Đọc toàn bộ cảnh giới"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Cooldown Time Bar (Thọ Mạng) */}
                <View style={[styles.card, isLowerRealm && styles.darkUAmCard]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                        <Text style={[styles.sectionTitle, isLowerRealm && { color: '#ef4444' }]}>Thọ mạng (Thời gian chờ)</Text>
                        <Text style={styles.lifeText}>{timeLeftMs > 0 ? formatTimeLeft(timeLeftMs) : "Đã hết thọ mạng"}</Text>
                    </View>
                    
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, isLowerRealm && { backgroundColor: '#ef4444' }, { width: `${progress * 100}%` }]} />
                    </View>
                    
                    <Text style={styles.progressHint}>
                        Sau khi hết thời hạn đếm ngược thọ mạng cõi giới, đạo hữu sẽ được gieo xúc xắc luân hồi tái sinh.
                    </Text>

                    {/* Spend Mpoints to reduce cooldown button */}
                    {timeLeftMs > 0 && (
                        <TouchableOpacity 
                            style={[styles.reduceBtn, isLowerRealm && { borderColor: '#ef4444' }]}
                            onPress={() => setShowReduceModal(true)}
                        >
                            <Flame size={16} color={isLowerRealm ? '#ef4444' : MAROON} />
                            <Text style={[styles.reduceBtnText, isLowerRealm && { color: '#ef4444' }]}>Tiêu Nghiệp Tốc Hành (Rút ngắn thời gian)</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {/* Mandala Grid Card (Thần Điện Mật Tông) */}
                {state.realm_id >= 10 && state.realm_id <= 33 && (
                    <View style={[styles.card, styles.mandalaCard]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Sparkles size={20} color={GOLD} />
                            <Text style={[styles.sectionTitle, { color: GOLD, marginBottom: 0, marginLeft: 8 }]}>
                                Mật Tông Thần Điện (Mandala 3x3)
                            </Text>
                        </View>
                        
                        <Text style={[styles.progressHint, { color: '#E2E8F0', marginBottom: 16 }]}>
                            Hợp sức cùng các đồng tu kiến tạo 9 công trình Bồ Đề để nhận kỷ niệm chương và lực gia trì gia tăng cấp số cộng!
                        </Text>

                        {/* 3x3 Grid rendering */}
                        <View style={styles.mandalaGridContainer}>
                            {[1, 2, 3].map((r) => (
                                <View key={r} style={styles.mandalaGridRow}>
                                    {[1, 2, 3].map((c) => {
                                        const slot = mandalaSlots.find(s => s.x === c && s.y === r);
                                        return (
                                            <TouchableOpacity
                                                key={`${r}-${c}`}
                                                style={[
                                                    styles.mandalaSlotBox,
                                                    slot?.status === 'completed' && styles.mandalaSlotCompleted,
                                                    slot?.status === 'constructing' && styles.mandalaSlotConstructing,
                                                    c === 2 && r === 2 && styles.mandalaCenterSlot
                                                ]}
                                                onPress={() => handlePressSlot(c, r, slot || null)}
                                            >
                                                {slot ? (
                                                    <>
                                                        <Text style={styles.mandalaSlotType}>
                                                            {getBuildingEmoji(slot.building_type)}
                                                        </Text>
                                                        <Text style={styles.mandalaSlotLevel} numberOfLines={1}>
                                                            Lv.{slot.level}
                                                        </Text>
                                                        {slot.status === 'constructing' && (
                                                            <View style={styles.mandalaMiniProgressBg}>
                                                                <View 
                                                                    style={[
                                                                        styles.mandalaMiniProgressFill, 
                                                                        { width: `${Math.min(100, (slot.current_merit_points / slot.target_merit_points) * 100)}%` }
                                                                    ]} 
                                                                />
                                                            </View>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Text style={styles.mandalaSlotEmpty}>+</Text>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Low Realm Blessing Board (Thỉnh cầu Hộ trì) */}
                {isLowerRealm && (
                    <View style={[styles.card, styles.darkUAmCard, { borderColor: '#ef4444', borderWidth: 1.5 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <ShieldAlert size={20} color="#ef4444" />
                            <Text style={[styles.sectionTitle, { color: '#ef4444', marginBottom: 0, marginLeft: 8 }]}>Phát nguyện Cầu Hộ trì</Text>
                        </View>
                        
                        <Text style={styles.progressHint}>
                            Cõi ác đạo tăm tối khổ đau. Nếu thiếu Mpoints, đạo hữu có thể gửi lời thỉnh cầu lên cõi Trời để các bậc cõi trên Hồi hướng Công đức trợ duyên (Giảm 24h-48h chờ đợi miễn phí!).
                        </Text>

                        <TouchableOpacity 
                            style={[styles.actionBtn, { borderColor: '#ef4444', marginTop: 12 }]}
                            onPress={() => setShowRequestModal(true)}
                        >
                            <HeartHandshake size={16} color="#ef4444" style={{ marginRight: 6 }} />
                            <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Gửi thỉnh cầu hồi hướng</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* High Realm Blessing Hub (Hộ trì đồng tu cõi thấp) */}
                {isHigherRealm && (
                    <View style={[styles.card, styles.lightGoldenCard, { borderColor: GOLD, borderWidth: 1.5 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Sparkles size={20} color={GOLD} />
                            <Text style={[styles.sectionTitle, { color: '#92400E', marginBottom: 0, marginLeft: 8 }]}>Ban Phước Hồi Hướng (Hộ Trì Cõi Khổ)</Text>
                        </View>
                        
                        <Text style={styles.progressHint}>
                            Với tư cách đồng tu cõi Trời / cõi Thánh, bạn có thể hồi hướng phước đức của mình cho các hương linh cõi thấp (trừ 50 Mpoints) để trợ duyên giảm thọ mạng khổ cực cho họ, bạn nhận ngay +15 Công đức.
                        </Text>

                        <View style={{ marginTop: 12 }}>
                            {blessingRequests.length === 0 ? (
                                <Text style={{ color: '#666', fontStyle: 'italic', fontSize: 13, textAlign: 'center', marginVertical: 12 }}>
                                    Hiện chưa có lời phát nguyện thỉnh cầu nào từ cõi dưới.
                                </Text>
                            ) : (
                                blessingRequests.map((req) => (
                                    <View key={req.id} style={styles.blessingRequestItem}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.blessingUser}>{req.profiles?.display_name || "Đồng tu"} ({req.realm?.name})</Text>
                                            <Text style={styles.blessingMsg}>"{req.message}"</Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.blessBtn}
                                            onPress={() => handleSendBlessing(req.id)}
                                        >
                                            <Text style={styles.blessBtnText}>Hồi Hướng</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}

                {/* Treasures */}
                {treasures.length > 0 && (
                    <View style={[styles.card, { borderColor: GOLD, borderWidth: 2, backgroundColor: '#FFFAED' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Gift size={20} color={GOLD} />
                            <Text style={[styles.sectionTitle, { color: '#B45309', marginBottom: 0, marginLeft: 8 }]}>Kỳ Ngộ: Pháp Bảo Xuất Hiện!</Text>
                        </View>
                        {treasures.map(t => (
                            <View key={t.id} style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#92400E', marginBottom: 4 }}>{t.name}</Text>
                                <Text style={{ fontSize: 13, color: '#B45309', marginBottom: 12 }}>{t.description}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#92400E' }}>Số lượng còn: {t.remaining_quantity}</Text>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { marginTop: 0, backgroundColor: GOLD, borderColor: GOLD }]}
                                        onPress={() => handleDigTreasure(t)}
                                        disabled={digging}
                                    >
                                        {digging ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Khám phá (5 MP)</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Co-travelers */}
                <View style={[styles.card, isLowerRealm && styles.darkUAmCard]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Users size={20} color={GOLD} />
                        <Text style={[styles.sectionTitle, isLowerRealm && { color: '#ef4444' }, { marginBottom: 0, marginLeft: 8 }]}>
                            Bạn tu cõi này ({travelers.length})
                        </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {travelers.map((t: any, idx: number) => (
                            <View key={idx} style={styles.travelerAvatar}>
                                <Text style={styles.travelerInitial}>{t.profiles?.display_name?.charAt(0) || 'U'}</Text>
                            </View>
                        ))}
                        {travelers.length === 0 && (
                            <Text style={{ color: '#999', fontStyle: 'italic', fontSize: 13 }}>Hiện tại bạn đang độc hành tại cõi này...</Text>
                        )}
                    </ScrollView>
                </View>

                {/* Realm Comments (Locked in lower cõi) */}
                <View style={[styles.card, isLowerRealm && styles.darkUAmCard]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <MessageSquare size={20} color={GOLD} />
                        <Text style={[styles.sectionTitle, isLowerRealm && { color: '#ef4444' }, { marginBottom: 0, marginLeft: 8 }]}>Đàm đạo cõi giới</Text>
                    </View>

                    {isLowerRealm ? (
                        <View style={styles.lockedBox}>
                            <Lock size={20} color="#94A3B8" />
                            <Text style={styles.lockedText}>Khóa đàm đạo. Cảnh giới đọa xứ tăm tối không thể tự do giao lưu, hãy sám hối tinh tấn để thoát cõi!</Text>
                        </View>
                    ) : (
                        <>
                            {/* Input Area */}
                            <View style={styles.commentInputContainer}>
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Chia sẻ kinh nghiệm hành thiền..."
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    maxLength={500}
                                />
                                <TouchableOpacity
                                    onPress={handlePostComment}
                                    disabled={postingComment || !newComment.trim()}
                                    style={[styles.sendBtn, (!newComment.trim() || postingComment) && { opacity: 0.5 }]}
                                >
                                    {postingComment ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Send size={18} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Comments List */}
                            <View style={styles.commentsList}>
                                {comments.length === 0 ? (
                                    <Text style={styles.noCommentsText}>Chưa có đàm đạo nào. Hãy khởi xướng!</Text>
                                ) : (
                                    comments.map((c) => (
                                        <View key={c.id} style={styles.commentItem}>
                                            <View style={styles.commentAvatar}>
                                                <Text style={styles.commentAvatarText}>
                                                    {c.profiles?.display_name?.charAt(0) || 'U'}
                                                </Text>
                                            </View>
                                            <View style={styles.commentContent}>
                                                <View style={styles.commentHeader}>
                                                    <Text style={styles.commentAuthor}>{c.profiles?.display_name || "Đồng tu"}</Text>
                                                    <Text style={styles.commentDate}>{format(new Date(c.created_at), 'HH:mm dd/MM')}</Text>
                                                </View>
                                                <Text style={styles.commentText}>{c.content}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </>
                    )}
                </View>

                {/* Rebirth Roll Dice Button Container */}
                <View style={styles.diceContainer}>
                    <TouchableOpacity
                        style={[
                            styles.diceButton,
                            (timeLeftMs > 0 || rolling) && styles.diceButtonDisabled
                        ]}
                        onPress={handleRollDice}
                        disabled={timeLeftMs > 0 || rolling}
                    >
                        {rolling ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Dices size={24} color="#FFF" />
                                <Text style={styles.diceButtonText}>
                                    Tái sinh luân hồi
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {timeLeftMs > 0 && (
                        <Text style={styles.diceHint}>Thọ mạng cõi chưa hết. Hãy tiêu Mpoints hoặc thỉnh cầu cõi trên hộ trì để giảm ngày thọ mạng!</Text>
                    )}
                </View>
            </ScrollView>

            {/* Mandala Building Detail Modal */}
            <Modal visible={showMandalaModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={[styles.kleshaCard, { backgroundColor: '#1E293B', borderColor: GOLD, borderWidth: 1.5, width: '92%' }]}>
                        
                        {/* Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15, alignItems: 'center' }}>
                            <Text style={[styles.kleshaTitle, { color: GOLD, fontSize: 16, marginBottom: 0 }]}>
                                {selectedMandalaSlot 
                                    ? `🕌 ${getBuildingName(selectedMandalaSlot.building_type)} (Cấp ${selectedMandalaSlot.level})` 
                                    : `🪷 KHỞI DỰNG CÔNG TRÌNH (Ô ${selectedSlotCoord?.x}, ${selectedSlotCoord?.y})`}
                            </Text>
                            <TouchableOpacity onPress={() => { setShowMandalaModal(false); setIsPracticing(false); }}>
                                <X size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {isPracticing ? (
                            // Zen practice timer UI
                            <View style={{ width: '100%', alignItems: 'center', paddingVertical: 20 }}>
                                <Text style={{ fontSize: 18, color: '#FFF', fontWeight: 'bold', marginBottom: 12 }}>
                                    🧘 THIỀN ĐỊNH TĨNH LẶNG
                                </Text>
                                <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                                    Đạo hữu hãy thả lỏng thân tâm, nhắm mắt và duy trì tĩnh lặng để đón nhận lực gia trì cát tường.
                                </Text>
                                <View style={styles.kleshaTimerBadge}>
                                    <Text style={styles.kleshaTimerText}>⏳ Còn {practiceTimer} giây</Text>
                                </View>
                                <View style={[styles.progressBarBg, { marginTop: 25, width: '90%' }]}>
                                    <View style={[styles.progressBarFill, { backgroundColor: GOLD, width: `${(10 - practiceTimer) * 10}%` }]} />
                                </View>
                            </View>
                        ) : selectedMandalaSlot ? (
                            // Existing building details
                            <View style={{ width: '100%' }}>
                                <Text style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 18, marginBottom: 15 }}>
                                    Trạng thái: <Text style={{ fontWeight: 'bold', color: selectedMandalaSlot.status === 'completed' ? '#10B981' : '#F59E0B' }}>
                                        {selectedMandalaSlot.status === 'completed' ? 'Đã hoàn tất' : 'Đang kiến tạo'}
                                    </Text>
                                </Text>

                                {selectedMandalaSlot.status === 'constructing' ? (
                                    <>
                                        {/* Progress */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <Text style={{ fontSize: 12, color: '#94A3B8' }}>Tiến độ đóng góp:</Text>
                                            <Text style={{ fontSize: 12, color: GOLD, fontWeight: 'bold' }}>
                                                {selectedMandalaSlot.current_merit_points} / {selectedMandalaSlot.target_merit_points} MP
                                            </Text>
                                        </View>
                                        <View style={[styles.progressBarBg, { marginBottom: 20 }]}>
                                            <View 
                                                style={[
                                                    styles.progressBarFill, 
                                                    { backgroundColor: GOLD, width: `${Math.min(100, (selectedMandalaSlot.current_merit_points / selectedMandalaSlot.target_merit_points) * 100)}%` }
                                                ]} 
                                            />
                                        </View>

                                        {/* Contribute actions */}
                                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFF', marginBottom: 8 }}>Hùn phước xây dựng:</Text>
                                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
                                            <TextInput 
                                                style={[styles.commentInput, { flex: 1, backgroundColor: '#0F172A', color: '#FFF', borderColor: '#334155' }]}
                                                keyboardType="numeric"
                                                value={contribAmount}
                                                onChangeText={setContribAmount}
                                                placeholder="Nhập số MPoints đóng góp"
                                            />
                                            <TouchableOpacity 
                                                style={[styles.sendBtn, { backgroundColor: GOLD }]}
                                                onPress={handleContribute}
                                                disabled={contribLoading}
                                            >
                                                {contribLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={18} color="#FFF" />}
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                ) : (
                                    // Completed state
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 18, marginBottom: 15 }}>
                                            Công trình đã đơm hoa phước báu. Đạo hữu có thể thực hành các nhiệm vụ tâm linh tương ứng để nhận lực gia trì cát tường.
                                        </Text>

                                        <TouchableOpacity 
                                            style={[styles.diceButton, { width: '100%', marginBottom: 10 }]}
                                            onPress={() => {
                                                setIsPracticing(true);
                                                setPracticeTimer(10);
                                                setBlessingProgress(0);
                                            }}
                                        >
                                            <Sparkles size={18} color="#FFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.diceButtonText}>Thực Hành Nhận Gia Trì</Text>
                                        </TouchableOpacity>

                                        {selectedMandalaSlot.level < 3 && (
                                            <TouchableOpacity 
                                                style={[styles.actionBtn, { borderColor: GOLD, borderWidth: 1.5, width: '100%' }]}
                                                onPress={handleUpgrade}
                                                disabled={upgradeLoading}
                                            >
                                                {upgradeLoading ? <ActivityIndicator size="small" color={GOLD} /> : <Text style={[styles.actionBtnText, { color: GOLD }]}>Nâng Cấp Lên Cấp {selectedMandalaSlot.level + 1}</Text>}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* Contributions list */}
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFF', marginBottom: 8 }}>Đóng góp của chư vị đồng tu:</Text>
                                <ScrollView style={{ maxHeight: 150, width: '100%' }} nestedScrollEnabled>
                                    {((mandalaContributions[selectedMandalaSlot.id] || []).length === 0) ? (
                                        <Text style={{ color: '#64748B', fontStyle: 'italic', fontSize: 12, marginVertical: 8 }}>Chưa có đồng tu hùn phước.</Text>
                                    ) : (
                                        (mandalaContributions[selectedMandalaSlot.id] || []).map((c) => (
                                            <View key={c.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
                                                <Text style={{ fontSize: 12, color: '#E2E8F0' }}>{c.profiles?.display_name || 'Đồng tu'}</Text>
                                                <Text style={{ fontSize: 12, color: GOLD, fontWeight: 'bold' }}>+{c.points_contributed} MP</Text>
                                            </View>
                                        ))
                                    )}
                                </ScrollView>
                            </View>
                        ) : (
                            // Initialize new building
                            <View style={{ width: '100%' }}>
                                <Text style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 18, marginBottom: 15 }}>
                                    Lưới Mandala trống. Đạo hữu hãy chọn một công trình Mật tông để khởi xướng dự án xây dựng cho tăng đoàn.
                                </Text>

                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFF', marginBottom: 8 }}>Loại công trình:</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                                    {(['stupa_8', 'prayer_wheel', 'guru_rinpoche', 'avalokiteshvara', 'amitabha', 'monastery'] as MandalaBuildingType[]).map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.selectorItem, 
                                                { width: '31%', backgroundColor: '#334155', borderColor: '#475569' },
                                                selectedBuildingType === type && { borderColor: GOLD, backgroundColor: '#451a1a' }
                                            ]}
                                            onPress={() => setSelectedBuildingType(type)}
                                        >
                                            <Text style={{ fontSize: 20 }}>{getBuildingEmoji(type)}</Text>
                                            <Text style={{ fontSize: 9, color: '#FFF', fontWeight: 'bold', marginTop: 4, textAlign: 'center' }}>
                                                {getBuildingName(type)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity 
                                    style={[styles.diceButton, { width: '100%' }]}
                                    onPress={handleInitializeSlot}
                                    disabled={initLoading}
                                >
                                    {initLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.diceButtonText}>Khởi dựng công trình</Text>}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Cooldown Reduce Modal */}
            <Modal visible={showReduceModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>TIÊU NGHIỆP TỐC HÀNH</Text>
                        
                        <Text style={styles.reduceDesc}>
                            Tỷ lệ quy đổi tiêu nghiệp rút ngắn thời gian:
                            {"\n"}<Text style={{ fontWeight: 'bold', color: GOLD }}>10 MPoints = Giảm 1 ngày chờ</Text>
                            {"\n\n"}Số ngày thọ mạng muốn giảm bớt:
                        </Text>

                        <View style={styles.selectorRow}>
                            {[1, 2, 3, 5].map((d) => (
                                <TouchableOpacity 
                                    key={d} 
                                    style={[styles.selectorItem, reduceDays === d && styles.selectorItemSelected]}
                                    onPress={() => setReduceDays(d)}
                                >
                                    <Text style={[styles.selectorText, reduceDays === d && styles.selectorTextSelected]}>{d} ngày</Text>
                                    <Text style={styles.selectorCost}>{d * 10} MP</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.minWaitHint}>
                            * Lưu ý: Ràng buộc thọ mạng tối thiểu 6 giờ bắt buộc luôn được giữ lại để đảm bảo sự tĩnh lặng chiêm nghiệm cõi giới.
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { width: '48%', backgroundColor: '#CCC', marginTop: 20 }]}
                                onPress={() => setShowReduceModal(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: '#666' }]}>Đóng</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalBtn, { width: '48%', marginTop: 20 }]}
                                onPress={handleReduceCooldown}
                            >
                                <Text style={styles.modalBtnText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Blessing Request Modal */}
            <Modal visible={showRequestModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>PHÁT NGUYỆN THỈNH CẦU CỨU TRỢ</Text>
                        
                        <TextInput 
                            style={styles.requestTextInput}
                            placeholder="Nhập lời cầu khấn (Ví dụ: Con sám hối nghiệp chướng cõi ngạ quỷ, nguyện xin đồng tu cõi Trời ban phước hồi hướng...)"
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={4}
                            value={myRequestMessage}
                            onChangeText={setMyRequestMessage}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { width: '48%', backgroundColor: '#CCC', marginTop: 20 }]}
                                onPress={() => setShowRequestModal(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: '#666' }]}>Đóng</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalBtn, { width: '48%', marginTop: 20 }]}
                                onPress={handleCreateBlessingRequest}
                                disabled={submittingRequest || !myRequestMessage.trim()}
                            >
                                <Text style={styles.modalBtnText}>Phát Nguyện</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Tournament Leaderboard Modal */}
            <Modal visible={showLeaderboardModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={[styles.resultCard, { width: '95%', maxHeight: '85%' }]}>
                        <Text style={styles.resultTitle}>🏆 BẢNG XẾP HẠNG TINH TẤN</Text>

                        {/* Leaderboard Tabs */}
                        <View style={styles.tabRow}>
                            <TouchableOpacity 
                                style={[styles.tabItem, periodTab === 'month' && styles.tabItemSelected]}
                                onPress={() => handleOpenLeaderboard('month')}
                            >
                                <Text style={[styles.tabText, periodTab === 'month' && styles.tabTextSelected]}>Đua Top Tháng</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.tabItem, periodTab === 'quarter' && styles.tabItemSelected]}
                                onPress={() => handleOpenLeaderboard('quarter')}
                            >
                                <Text style={[styles.tabText, periodTab === 'quarter' && styles.tabTextSelected]}>Đua Top Quý</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.formulaText}>
                            * Thể lệ tính điểm: Điểm = Cõi giới + Hồi hướng (+15) + Nhận phước (+10) + Thắng Mara (+10) + Thiền Vipassana (+15) + Điểm danh CN (+100) + Mantra Guru 3Kaya (+10) + Quy y & lễ lậy 108 (+25) + Mandala 108 (+20) + Sám hối KCTĐ 108 (+15)
                        </Text>

                        {/* Leaderboard Users List */}
                        {loadingLeaderboard ? (
                            <ActivityIndicator size="large" color={MAROON} style={{ marginVertical: 40 }} />
                        ) : (
                            <ScrollView style={styles.leaderboardScroll} nestedScrollEnabled>
                                {leaderboard.length === 0 ? (
                                    <Text style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', marginVertical: 30 }}>
                                        Chưa có bảng xếp hạng trong kỳ này.
                                    </Text>
                                ) : (
                                    leaderboard.map((item, idx) => {
                                        const reward = idx < 10 ? (periodTab === 'month' ? getMonthlyRewardName(idx) : getQuarterlyRewardName(idx)) : null;
                                        return (
                                            <TouchableOpacity 
                                                key={item.user_id} 
                                                style={[styles.leaderboardItem, idx === 0 && styles.firstPlace, idx === 1 && styles.secondPlace, idx === 2 && styles.thirdPlace]}
                                                onPress={() => handleSelectUserForDetails(item)}
                                            >
                                                <View style={styles.leaderboardRankBox}>
                                                    {idx < 3 ? (
                                                        <Award size={20} color={idx === 0 ? GOLD : (idx === 1 ? '#C0C0C0' : BRONZE)} />
                                                    ) : (
                                                        <Text style={styles.rankNumText}>{idx + 1}</Text>
                                                    )}
                                                </View>
                                                
                                                <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                                                    <Text style={styles.rankNameText}>
                                                        {item.display_name}
                                                    </Text>
                                                    {reward && (
                                                        <Text style={styles.rankRewardText}>
                                                            🎁 {reward}
                                                        </Text>
                                                    )}
                                                </View>

                                                <Text style={styles.rankScoreText}>{item.total_score} pts</Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </ScrollView>
                        )}

                        <TouchableOpacity 
                            style={[styles.modalBtn, { marginTop: 16 }]}
                            onPress={() => setShowLeaderboardModal(false)}
                        >
                            <Text style={styles.modalBtnText}>ĐÓNG</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* User Leaderboard Details Modal */}
            <Modal visible={!!selectedUserForDetails} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={[styles.resultCard, { width: '90%', padding: 20 }]}>
                        <Text style={[styles.resultTitle, { fontSize: 16, marginBottom: 15 }]}>
                            📊 BẢNG TÍNH ĐIỂM CHI TIẾT
                        </Text>

                        {selectedUserForDetails && (() => {
                            const blessingsReceivedPts = Math.max(0, selectedUserForDetails.total_score - (
                                selectedUserForDetails.practices_count * 15 +
                                selectedUserForDetails.blessings_count * 15 +
                                selectedUserForDetails.mara_wins_count * 10 +
                                (selectedUserForDetails.attendance_count || 0) * 100 +
                                selectedUserForDetails.realm_score +
                                (selectedUserForDetails.guru_3kaya_count || 0) * 10 +
                                (selectedUserForDetails.quy_y_count || 0) * 25 +
                                (selectedUserForDetails.mandala_count || 0) * 20 +
                                (selectedUserForDetails.sam_hoi_count || 0) * 15
                            ));

                            return (
                                <View style={{ width: '100%' }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 10 }}>
                                        Hành Giả: {selectedUserForDetails.display_name}
                                    </Text>

                                    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>🧘‍♂️ Thiền Vipassana sâu ({selectedUserForDetails.practices_count} buổi)</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>+{selectedUserForDetails.practices_count * 15} pts</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>📿 Mantra Guru 3Kaya ({selectedUserForDetails.guru_3kaya_count || 0} lần)</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>+{(selectedUserForDetails.guru_3kaya_count || 0) * 10} pts</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>📿 Quy y & lễ lậy 108 lễ ({selectedUserForDetails.quy_y_count || 0} ngày)</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>+{(selectedUserForDetails.quy_y_count || 0) * 25} pts</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>🏺 Cúng dường Mandala 108 lễ ({selectedUserForDetails.mandala_count || 0} ngày)</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>+{(selectedUserForDetails.mandala_count || 0) * 20} pts</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>⚡ Sám hối KCTĐ 108 biến 100 âm ({selectedUserForDetails.sam_hoi_count || 0} ngày)</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>+{(selectedUserForDetails.sam_hoi_count || 0) * 15} pts</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>🤝 Hồi hướng phước lành ({selectedUserForDetails.blessings_count} lần)</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>+{selectedUserForDetails.blessings_count * 15} pts</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>⚔️ Chiến thắng Ma Vương ({selectedUserForDetails.mara_wins_count} trận)</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>+{selectedUserForDetails.mara_wins_count * 10} pts</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>☸️ Điểm danh Chủ Nhật ({selectedUserForDetails.attendance_count || 0} buổi)</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#10B981' }}>+{(selectedUserForDetails.attendance_count || 0) * 100} pts</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: blessingsReceivedPts > 0 ? 1 : 0, borderBottomColor: '#E2E8F0' }}>
                                            <Text style={{ fontSize: 13, color: '#475569' }}>🌍 Điểm di chuyển cõi giới</Text>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: selectedUserForDetails.realm_score < 0 ? '#EF4444' : '#10B981' }}>
                                                {selectedUserForDetails.realm_score > 0 ? `+${selectedUserForDetails.realm_score}` : selectedUserForDetails.realm_score} pts
                                            </Text>
                                        </View>

                                        {blessingsReceivedPts > 0 && (
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                                                <Text style={{ fontSize: 13, color: '#475569' }}>💖 Phước lành nhận được</Text>
                                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#10B981' }}>+{blessingsReceivedPts} pts</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: GOLD, marginBottom: 15 }}>
                                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: MAROON }}>TỔNG ĐIỂM PHƯỚC ĐỨC</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '900', color: MAROON }}>{selectedUserForDetails.total_score} PTS</Text>
                                    </View>

                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: MAROON, marginBottom: 8, alignSelf: 'flex-start' }}>
                                        📜 LỊCH SỬ CẢNH GIỚI ({selectedUserForDetails.realm_score > 0 ? '+' : ''}{selectedUserForDetails.realm_score} PTS)
                                    </Text>

                                    {loadingUserHistory ? (
                                        <ActivityIndicator size="small" color={MAROON} style={{ marginVertical: 20 }} />
                                    ) : userHistory.length === 0 ? (
                                        <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginVertical: 15 }}>
                                            Chưa ghi nhận lịch sử dịch chuyển cõi giới trong sự kiện.
                                        </Text>
                                    ) : (
                                        <ScrollView style={{ maxHeight: 180, width: '100%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, backgroundColor: '#FFF', padding: 8, marginBottom: 15 }} nestedScrollEnabled>
                                            {userHistory.map((h, idx) => {
                                                // Calculate points for this move using tournament rules v10 (pure target realm points)
                                                let targetPt = 0;
                                                let cõiType = "";

                                                if ([1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,21,22,23].includes(h.to_realm_id)) {
                                                    targetPt = -10;
                                                    if (h.to_realm_id === 22) cõiType = "Ấn Độ Giáo";
                                                    else if (h.to_realm_id === 23) cõiType = "Bôn Giáo";
                                                    else cõiType = "Đọa xứ";
                                                } else if (h.to_realm_id === 15) {
                                                    targetPt = 5;
                                                    cõiType = "Cõi Atula";
                                                } else if (h.to_realm_id === 24) {
                                                    targetPt = 0;
                                                    cõiType = "Bardo";
                                                } else if ([27, 28, 29, 30, 31, 32, 35, 36, 37].includes(h.to_realm_id)) {
                                                    targetPt = 10;
                                                    cõiType = "Cõi Trời";
                                                } else if ([17, 18, 19, 20, 25, 26].includes(h.to_realm_id)) {
                                                    targetPt = 10;
                                                    if (h.to_realm_id === 26) cõiType = "Chuyển Luân Thánh Vương";
                                                    else if (h.to_realm_id === 25) cõiType = "Vào Mật Thừa";
                                                    else cõiType = "Cõi Người";
                                                } else if (h.to_realm_id >= 33) {
                                                    targetPt = 15;
                                                    if (h.to_realm_id >= 97 && h.to_realm_id <= 103) cõiType = "Tịnh độ";
                                                    else cõiType = "Cõi Phật";
                                                }

                                                const totalPt = targetPt;

                                                const detailsParts = [];
                                                if (targetPt !== 0 || h.to_realm_id === 24) {
                                                    detailsParts.push(`${cõiType}: ${targetPt > 0 ? '+' : ''}${targetPt}`);
                                                }
                                                const detailsStr = detailsParts.join(' | ');

                                                return (
                                                    <View 
                                                        key={h.id} 
                                                        style={{ 
                                                            flexDirection: 'row', 
                                                            justifyContent: 'space-between', 
                                                            alignItems: 'center', 
                                                            paddingVertical: 10, 
                                                            paddingHorizontal: 8, 
                                                            borderBottomWidth: idx < userHistory.length - 1 ? 1 : 0, 
                                                            borderBottomColor: '#F1F5F9',
                                                            borderLeftWidth: 4,
                                                            borderLeftColor: totalPt > 0 ? '#10B981' : (totalPt < 0 ? '#EF4444' : '#94A3B8'),
                                                            paddingLeft: 8,
                                                            marginBottom: 4,
                                                            backgroundColor: '#F8FAFC',
                                                            borderRadius: 4
                                                        }}
                                                    >
                                                        <View style={{ flex: 1, marginRight: 8 }}>
                                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E293B' }}>
                                                                Cõi {h.from_realm?.name || h.from_realm_id} ➔ {h.to_realm?.name || h.to_realm_id}
                                                            </Text>
                                                            {detailsStr ? (
                                                                <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                                                                    {detailsStr}
                                                                </Text>
                                                            ) : null}
                                                            <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>
                                                                {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}
                                                            </Text>
                                                        </View>
                                                        <View 
                                                            style={{ 
                                                                backgroundColor: totalPt > 0 ? '#E6F4EA' : (totalPt < 0 ? '#FCE8E6' : '#F1F5F9'), 
                                                                paddingHorizontal: 8, 
                                                                paddingVertical: 4, 
                                                                borderRadius: 12, 
                                                                borderWidth: 1, 
                                                                borderColor: totalPt > 0 ? '#34A853' : (totalPt < 0 ? '#EA4335' : '#CBD5E1') 
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: totalPt > 0 ? '#137333' : (totalPt < 0 ? '#C5221F' : '#5F6368') }}>
                                                                {totalPt > 0 ? `+${totalPt}` : totalPt} pts
                                                            </Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            );
                        })()}

                        <TouchableOpacity 
                            style={[styles.modalBtn, { width: '100%', backgroundColor: MAROON }]}
                            onPress={() => setSelectedUserForDetails(null)}
                        >
                            <Text style={styles.modalBtnText}>ĐÓNG</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Rolling Animation Overlay */}
            {rolling && (
                <View style={styles.animationOverlay}>
                    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                        <Dices size={120} color={GOLD} strokeWidth={1} />
                    </Animated.View>
                    <Text style={styles.rollingText}>ĐANG XOAY XÚC XẮC NGHIỆP LỰC...</Text>
                </View>
            )}

            {/* Klesha-mara Quiz Modal */}
            <Modal visible={showKleshaModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={[styles.kleshaCard, { backgroundColor: '#1E293B', borderColor: GOLD, borderWidth: 1.5 }]}>
                        {/* Title Bar */}
                        <Text style={[styles.kleshaTitle, { color: '#F1F5F9' }]}>😈 PHIỀN NÃO MA THỬ THÁCH</Text>
                        <Text style={styles.kleshaSubtitle}>
                            Kiếp sống này hành giả đã phạm vào ác nghiệp, cuối đời xuất hiện phiền não chướng. Hãy trả lời đúng 3 câu hỏi liên tiếp để giải nghiệp, nếu không sẽ đọa vào cõi dữ!
                        </Text>

                        {/* Progress and Timer */}
                        {kleshaQuestions.length > 0 && (
                            <View style={styles.kleshaProgressRow}>
                                <Text style={styles.kleshaProgressText}>
                                    Tiến trình: <Text style={{ color: GOLD, fontWeight: 'bold' }}>{currentQuestionIndex + 1}/3</Text>
                                </Text>
                                <View style={[styles.kleshaTimerBadge, kleshaTimer <= 5 && { backgroundColor: '#991B1B' }]}>
                                    <Text style={styles.kleshaTimerText}>⏳ {kleshaTimer}s</Text>
                                </View>
                            </View>
                        )}

                        {/* Question Text */}
                        {kleshaQuestions.length > 0 && (
                            <View style={styles.kleshaQuestionContainer}>
                                <Text style={styles.kleshaQuestionText}>
                                    {kleshaQuestions[currentQuestionIndex].question}
                                </Text>
                            </View>
                        )}

                        {/* Options List */}
                        {kleshaQuestions.length > 0 && (
                            <ScrollView style={{ maxHeight: 280, width: '100%' }} showsVerticalScrollIndicator={false}>
                                {kleshaQuestions[currentQuestionIndex].options.map((option: string, idx: number) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.kleshaOptionBtn}
                                        onPress={() => handleKleshaAnswer(idx)}
                                        disabled={processingKlesha}
                                    >
                                        <Text style={styles.kleshaOptionText}>
                                            {String.fromCharCode(65 + idx)}. {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {processingKlesha && (
                            <ActivityIndicator size="small" color={GOLD} style={{ marginTop: 15 }} />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Result Modal */}
            <Modal visible={showResultModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>NGHIỆP LỰC KHỞI SINH</Text>
                        <View style={styles.diceResultCircle}>
                            <Text style={styles.diceResultNum}>{diceResult}</Text>
                        </View>
                        <Text style={styles.resultDesc}>
                            Đạo hữu gieo xúc xắc đạt: {diceResult} nút.
                        </Text>
                        <Text style={styles.destText}>CẢNH GIỚI TÁI SINH TIẾP THEO</Text>
                        <Text style={styles.destName}>{targetRealmName}</Text>

                        {rollMessage && (
                            <View style={styles.rewardBadge}>
                                <Text style={styles.rewardText}>{rollMessage}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => {
                                setShowResultModal(false);
                                loadData();
                            }}
                        >
                            <Text style={styles.modalBtnText}>BƯỚC VÀO CẢNH GIỚI</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Floating Action Button (FAB) for Mara Complaints */}
            <TouchableOpacity
                onPress={() => {
                    loadComplaints();
                    setShowComplaintsModal(true);
                }}
                style={[styles.fab, { bottom: 20 + insets.bottom }]}
                activeOpacity={0.85}
            >
                <MessageSquare size={26} color="#FFF" />
            </TouchableOpacity>

            {/* Mara Complaints Modal */}
            <Modal visible={showComplaintsModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={[styles.kleshaCard, { backgroundColor: '#1E293B', borderColor: GOLD, borderWidth: 1.5, height: '80%' }]}>
                        {/* Title Bar */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 }}>
                            <Text style={[styles.kleshaTitle, { color: '#F1F5F9', marginBottom: 0 }]}>😈 PHÀN NÀN VỚI MARA</Text>
                            <TouchableOpacity onPress={() => setShowComplaintsModal(false)} style={{ padding: 4 }}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.kleshaSubtitle, { marginBottom: 15 }]}>
                            Bảng tin ghi nhận những lời than phiền, oán trách của hành giả gửi tới Ma Vương Mara vì những chướng ngại gặp phải trên đường tu.
                        </Text>

                        {/* Complaints list */}
                        {loadingComplaints && complaints.length === 0 ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={GOLD} />
                            </View>
                        ) : (
                            <ScrollView style={{ flex: 1, width: '100%' }} showsVerticalScrollIndicator={false}>
                                {complaints.length === 0 ? (
                                    <View style={{ padding: 40, alignItems: 'center' }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: 13 }}>Chưa có ai than phiền với Mara...</Text>
                                    </View>
                                ) : (
                                    complaints.map((item) => (
                                        <View key={item.id} style={{
                                            flexDirection: 'row',
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            padding: 12,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: 'rgba(212,175,55,0.08)',
                                            marginBottom: 10,
                                            alignItems: 'flex-start'
                                        }}>
                                            <View style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: 'rgba(255,255,255,0.08)',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 10,
                                                overflow: 'hidden'
                                            }}>
                                                {item.profiles?.avatar_url ? (
                                                    <Image source={{ uri: item.profiles.avatar_url }} style={{ width: '100%', height: '100%' }} />
                                                ) : (
                                                    <Text style={{ fontSize: 16 }}>🧘</Text>
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={{ color: GOLD, fontWeight: '700', fontSize: 13 }}>
                                                        {item.profiles?.display_name || "Hành giả ẩn danh"}
                                                    </Text>
                                                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                                                        {format(new Date(item.created_at), 'dd/MM HH:mm')}
                                                    </Text>
                                                </View>
                                                <Text style={{ color: '#F1F5F9', fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                                                    {item.content}
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        )}

                        {/* Input Area */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(212,175,55,0.1)',
                            paddingTop: 12,
                            marginTop: 10,
                            width: '100%'
                        }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <TextInput
                                    style={{
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        color: '#FFF',
                                        borderRadius: 12,
                                        paddingHorizontal: 14,
                                        height: 44,
                                        fontSize: 13,
                                        borderWidth: 1,
                                        borderColor: 'rgba(212,175,55,0.15)',
                                    }}
                                    placeholder="Gửi lời phàn nàn tới Mara..."
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={newComplaintText}
                                    onChangeText={setNewComplaintText}
                                    maxLength={200}
                                    editable={!sendingComplaint}
                                />
                                <Text style={{
                                    alignSelf: 'flex-end',
                                    color: 'rgba(255,255,255,0.4)',
                                    fontSize: 10,
                                    marginTop: 4,
                                    marginRight: 4
                                }}>
                                    {newComplaintText.length}/200
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleSendComplaint}
                                disabled={sendingComplaint || !newComplaintText.trim()}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    backgroundColor: GOLD,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: (!newComplaintText.trim() || sendingComplaint) ? 0.5 : 1
                                }}
                            >
                                {sendingComplaint ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Send size={18} color={MAROON} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_LIGHT,
    },
    darkUAmBg: {
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 25,
        backgroundColor: MAROON
    },
    headerTitle: {
        color: GOLD,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    eventBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    eventBtnText: {
        color: GOLD,
        fontSize: 11,
        fontWeight: 'bold',
    },
    imageContainer: {
        width: width,
        height: 260,
        backgroundColor: '#222',
        position: 'relative'
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    realmImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    imageText: {
        color: MAROON,
        opacity: 0.5,
        fontWeight: 'bold',
        fontSize: 16
    },
    realmOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 40,
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    realmIdText: {
        color: GOLD,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4
    },
    realmNameText: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '900'
    },
    infoCard: {
        margin: 16,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    darkUAmCard: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.2,
    },
    lightGoldenCard: {
        backgroundColor: '#FFFDF9',
        borderColor: '#FEF3C7',
        borderWidth: 1.5,
        shadowColor: GOLD,
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    descInner: {
        overflow: 'hidden',
    },
    descFadeCover: {
        position: 'absolute',
        bottom: 44,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    expandBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginTop: 8,
        gap: 6,
        borderTopWidth: 1,
        borderTopColor: '#F0E8D0',
    },
    expandBtnText: {
        color: MAROON,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    shortDescHTML: {
        color: MAROON,
        fontSize: 15,
        fontWeight: 'bold',
        fontStyle: 'italic',
        lineHeight: 22
    },
    shortDescHTMLDark: {
        color: '#f87171',
        fontSize: 15,
        fontWeight: 'bold',
        fontStyle: 'italic',
        lineHeight: 22
    },
    descHTML: {
        color: '#444',
        fontSize: 13.5,
        lineHeight: 20
    },
    descHTMLDark: {
        color: '#CBD5E1',
        fontSize: 13.5,
        lineHeight: 20
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    sectionTitle: {
        color: MAROON,
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    lifeText: {
        color: '#ef4444',
        fontWeight: '900',
        fontSize: 15
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 5,
        overflow: 'hidden',
        marginVertical: 10,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: MAROON,
        borderRadius: 5
    },
    progressHint: {
        color: '#64748B',
        fontSize: 11,
        lineHeight: 16,
    },
    reduceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: MAROON + '30',
        borderRadius: 12,
        paddingVertical: 10,
        marginTop: 12,
        gap: 6,
    },
    reduceBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: MAROON,
    },
    actionBtn: {
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: MAROON,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    actionBtnText: {
        color: MAROON,
        fontWeight: 'bold',
        fontSize: 11,
        textTransform: 'uppercase'
    },
    blessingRequestItem: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    blessingUser: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#92400E',
    },
    blessingMsg: {
        fontSize: 12,
        color: '#B45309',
        fontStyle: 'italic',
        marginTop: 2,
    },
    blessBtn: {
        backgroundColor: GOLD,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    blessBtnText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    travelerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: GOLD,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: -8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
    },
    travelerInitial: {
        color: MAROON,
        fontWeight: '900',
        fontSize: 13
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: 16,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        fontSize: 13.5,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 44,
        maxHeight: 80,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: MAROON,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentsList: {
        marginTop: 8,
    },
    commentItem: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    commentAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: GOLD + '15',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: GOLD + '30',
    },
    commentAvatarText: {
        color: GOLD,
        fontSize: 11,
        fontWeight: '900',
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 12,
        borderTopLeftRadius: 0,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    commentAuthor: {
        fontSize: 11,
        fontWeight: 'bold',
        color: MAROON,
    },
    commentDate: {
        fontSize: 9,
        color: '#94A3B8',
    },
    commentText: {
        fontSize: 12.5,
        color: '#334155',
        lineHeight: 17,
    },
    noCommentsText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        fontStyle: 'italic',
        paddingVertical: 16,
    },
    lockedBox: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    lockedText: {
        flex: 1,
        fontSize: 11,
        color: '#94A3B8',
        lineHeight: 16,
    },
    diceContainer: {
        margin: 20,
        marginTop: 10,
        alignItems: 'center'
    },
    diceButton: {
        backgroundColor: MAROON,
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: MAROON,
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    diceButtonDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
        elevation: 0
    },
    diceButtonText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 15,
        marginLeft: 10,
        letterSpacing: 1
    },
    diceHint: {
        color: '#ef4444',
        fontSize: 11,
        marginTop: 10,
        fontStyle: 'italic',
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    animationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    rollingText: {
        color: GOLD,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 24,
        letterSpacing: 2,
        textTransform: 'uppercase'
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
    },
    resultCard: {
        backgroundColor: BG_LIGHT,
        width: '90%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: GOLD
    },
    kleshaCard: {
        width: '90%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10
    },
    kleshaTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 10,
        textAlign: 'center'
    },
    kleshaSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20
    },
    kleshaProgressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#334155'
    },
    kleshaProgressText: {
        fontSize: 14,
        color: '#E2E8F0'
    },
    kleshaTimerBadge: {
        backgroundColor: '#D97706',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4
    },
    kleshaTimerText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold'
    },
    kleshaQuestionContainer: {
        backgroundColor: '#334155',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 20
    },
    kleshaQuestionText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 22,
        textAlign: 'center'
    },
    kleshaOptionBtn: {
        backgroundColor: '#475569',
        borderWidth: 1,
        borderColor: '#64748B',
        borderRadius: 12,
        padding: 14,
        width: '100%',
        marginBottom: 10,
        alignItems: 'flex-start'
    },
    kleshaOptionText: {
        color: '#F1F5F9',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500'
    },
    resultTitle: {
        color: MAROON,
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 3,
        marginBottom: 16
    },
    diceResultCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: MAROON,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 8,
        shadowColor: MAROON,
        shadowOpacity: 0.4,
        shadowRadius: 12
    },
    diceResultNum: {
        color: GOLD,
        fontSize: 40,
        fontWeight: '900'
    },
    resultDesc: {
        color: '#333',
        fontSize: 15,
        marginBottom: 8,
        fontWeight: '600',
    },
    reduceDesc: {
        fontSize: 12.5,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
    },
    selectorRow: {
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        width: '100%',
        marginBottom: 16,
    },
    selectorItem: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        width: 62,
    },
    selectorItemSelected: {
        borderColor: GOLD,
        backgroundColor: '#FFFBEB',
    },
    selectorText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#475569',
    },
    selectorTextSelected: {
        color: '#92400E',
    },
    selectorCost: {
        fontSize: 9,
        color: '#94A3B8',
        marginTop: 2,
    },
    minWaitHint: {
        fontSize: 10,
        color: '#ef4444',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 15,
    },
    requestTextInput: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        width: '100%',
        fontSize: 13,
        color: '#333',
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 10,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    destText: {
        color: '#94A3B8',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 8
    },
    destName: {
        color: MAROON,
        fontSize: 20,
        fontWeight: '900',
        marginTop: 4,
        textAlign: 'center'
    },
    rewardBadge: {
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: GOLD + '30'
    },
    rewardText: {
        color: '#B45309',
        fontWeight: 'bold',
        fontSize: 12
    },
    modalBtn: {
        backgroundColor: MAROON,
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center'
    },
    modalBtnText: {
        color: GOLD,
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 2
    },
    // Tournament Tab styles
    tabRow: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        padding: 4,
        marginBottom: 12,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabItemSelected: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    tabText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
    },
    tabTextSelected: {
        color: MAROON,
    },
    prizeCard: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        padding: 10,
        width: '100%',
        marginBottom: 12,
    },
    prizeHeader: {
        fontSize: 10.5,
        fontWeight: 'bold',
        color: '#92400E',
        marginBottom: 6,
    },
    prizeItemText: {
        fontSize: 10,
        color: '#B45309',
        marginBottom: 2,
    },
    formulaText: {
        fontSize: 11,
        color: '#64748B',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    leaderboardScroll: {
        width: '100%',
        maxHeight: 460,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#FFF',
        padding: 8,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    firstPlace: {
        backgroundColor: '#FFFBEB',
    },
    secondPlace: {
        backgroundColor: '#F8FAFC',
    },
    thirdPlace: {
        backgroundColor: '#FFFDF9',
    },
    leaderboardRankBox: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankNumText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
    },
    rankNameText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    rankRewardText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#10b981',
        marginTop: 3,
    },
    rankDetailsText: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 3,
    },
    rankScoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: MAROON,
    },
    eventCountdownBar: {
        backgroundColor: '#FFFBEB',
        borderColor: GOLD,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 16,
        margin: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: GOLD,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    eventBarTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: MAROON,
        letterSpacing: 1,
    },
    eventBarCountdown: {
        fontSize: 12,
        fontWeight: 'bold',
        color: GOLD,
        marginTop: 2,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: MAROON,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
        borderWidth: 1.5,
        borderColor: GOLD,
    },
    // Mandala Grid Styles
    mandalaCard: {
        backgroundColor: '#1E293B',
        borderColor: GOLD,
        borderWidth: 1.5,
    },
    mandalaGridContainer: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 10,
    },
    mandalaGridRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    mandalaSlotBox: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#334155',
        borderWidth: 1.5,
        borderColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    mandalaCenterSlot: {
        borderColor: GOLD,
        borderWidth: 2,
        backgroundColor: '#451a1a',
    },
    mandalaSlotConstructing: {
        borderColor: '#F59E0B',
    },
    mandalaSlotCompleted: {
        borderColor: '#10B981',
        backgroundColor: '#064e3b',
    },
    mandalaSlotType: {
        fontSize: 26,
    },
    mandalaSlotLevel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#E2E8F0',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    mandalaMiniProgressBg: {
        width: '80%',
        height: 3,
        backgroundColor: '#475569',
        borderRadius: 2,
        marginTop: 4,
        overflow: 'hidden',
    },
    mandalaMiniProgressFill: {
        height: '100%',
        backgroundColor: '#F59E0B',
    },
    mandalaSlotEmpty: {
        fontSize: 28,
        color: '#64748B',
        fontWeight: '300',
    }
});
