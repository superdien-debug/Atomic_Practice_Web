import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions, Platform, Animated, Modal, useWindowDimensions, TextInput } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Dices, History, Users, ShieldAlert, Check, ChevronDown, ChevronUp, MessageSquare, Send, Gift, Map, Flame, HeartHandshake, Trophy, Award, Lock, Sparkles } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { rebirthService, RebirthState, Realm, RebirthComment } from '../../services/rebirthService';
import { useT } from '../../i18n/useT';
import { format } from 'date-fns';
import { practiceService, Practice } from '../../services/practiceService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { treasureService, GameTreasure } from '../../services/treasureService';

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

            if (currentState?.realm_id) {
                const isLower = currentState.realm_id >= 1 && currentState.realm_id <= 13;
                const isHigher = currentState.realm_id >= 70 && currentState.realm_id <= 104;

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
        const startTurn = state.updated_at ? new Date(state.updated_at).getTime() : new Date(state.created_at || new Date()).getTime();
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
    const isHigherRealm = realm.id >= 70 && realm.id <= 104;

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
                            Với tư cách đồng tu cõi Trời, bạn có thể hồi hướng phước đức của mình cho các hương linh cõi thấp (trừ 50 Mpoints) để trợ duyên giảm thọ mạng khổ cực cho họ, bạn nhận ngay +15 Công đức.
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
                            * Công thức: Điểm = Cõi giới + Hồi hướng (+15) + Nhận phước (+10) + Thắng Mara (+10) + Thiền Vipassana (+15) + Điểm danh Chủ Nhật (+100)
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
                                                            🎁 Phần thưởng: {reward}
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
                                selectedUserForDetails.realm_score
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
                                                // Calculate points for this move using tournament rules
                                                let movePt = 0;
                                                if (h.to_realm_id > h.from_realm_id) movePt = 15;
                                                else if (h.to_realm_id < h.from_realm_id) movePt = -15;

                                                let penaltyPt = 0;
                                                if (h.to_realm_id >= 1 && h.to_realm_id <= 13) penaltyPt = -10;

                                                let pureLandPt = 0;
                                                if (h.to_realm_id >= 97 && h.to_realm_id <= 103) pureLandPt = 15;

                                                let firstTimePt = 0;
                                                const mahayanaGroups = [22, 23, 38, 39, 40, 47, 48, 25, 33, 42, 52, 54, 59, 60, 71, 77, 93, 104];
                                                if (mahayanaGroups.includes(h.to_realm_id)) {
                                                    const isFirstTime = !userHistory.slice(idx + 1).some(prev => prev.to_realm_id === h.to_realm_id);
                                                    if (isFirstTime) firstTimePt = 5;
                                                }

                                                const totalPt = movePt + penaltyPt + pureLandPt + firstTimePt;

                                                const detailsParts = [];
                                                if (movePt !== 0) detailsParts.push(movePt > 0 ? `Lên cõi: +${movePt}` : `Xuống cõi: ${movePt}`);
                                                if (penaltyPt !== 0) detailsParts.push(`Đọa xứ: ${penaltyPt}`);
                                                if (pureLandPt !== 0) detailsParts.push(`Tịnh độ: +${pureLandPt}`);
                                                if (firstTimePt !== 0) detailsParts.push(`Cõi mới: +${firstTimePt}`);
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
    }
});
