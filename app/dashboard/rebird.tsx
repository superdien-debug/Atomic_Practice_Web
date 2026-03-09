import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions, Platform, Animated, Modal, useWindowDimensions, TextInput } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Dices, History, Users, ShieldAlert, Check, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { rebirthService, RebirthState, Realm, RebirthComment } from '../../services/rebirthService';
import { useT } from '../../i18n/useT';
import { format } from 'date-fns';
import { practiceService, Practice } from '../../services/practiceService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';

// ─── Colors (Consistent with Theme) ─────────────────────────────────────────
const GOLD = '#D4AF37';
const CARD = '#FFF';
const BG = '#FEF9EF';
const MAROON = '#800000';
const { width } = Dimensions.get('window');

export default function RebirdScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const t = useT();
    const { user } = useAuthStore();
    const { width, height } = useWindowDimensions();

    const [state, setState] = useState<RebirthState | null>(null);
    const [travelers, setTravelers] = useState<any[]>([]);
    const [practices, setPractices] = useState<Practice[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rolling, setRolling] = useState(false);
    const [diceResult, setDiceResult] = useState<number | null>(null);
    const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
    const [mpoints, setMpoints] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);
    const [rollMessage, setRollMessage] = useState<string | null>(null);
    const [targetRealmName, setTargetRealmName] = useState<string>('');
    const [requiredPractices, setRequiredPractices] = useState<{ id: string, title: string, completed: boolean }[]>([]);
    const [checkingPractices, setCheckingPractices] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);

    // Comments state
    const [comments, setComments] = useState<RebirthComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    const shakeAnim = React.useRef(new Animated.Value(0)).current;

    // Reload data every time this screen comes into focus
    // This ensures practice completion status refreshes after returning from practice screen
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

            // Fallback for legacy numeric data
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
                // Each fetch is independent — one failure won't block others
                try {
                    const tr = await rebirthService.getTravelersInRealm(currentState.realm_id);
                    setTravelers(tr);
                } catch (err) {
                    console.error('Load travelers error:', err);
                    setTravelers([]);
                }

                try {
                    const challs = await rebirthService.getChallenges(currentState.realm_id);
                    setChallenges(challs);
                } catch (err) {
                    console.error('Load challenges error:', err);
                    setChallenges([]);
                }

                // Fetch mandatory practices for this realm
                setCheckingPractices(true);
                try {
                    const reqs = await rebirthService.getRequiredPracticesForRealm(currentState.realm_id, (currentState as any).updated_at);
                    console.log('[Rebird] Required practices loaded:', JSON.stringify(reqs));
                    setRequiredPractices(reqs);
                } catch (err) {
                    console.error('Load mandatory practices error:', err);
                } finally {
                    setCheckingPractices(false);
                }

                // Fetch comments
                try {
                    const c = await rebirthService.getRealmComments(currentState.realm_id);
                    setComments(c);
                } catch (err) {
                    console.error('Load comments error:', err);
                }
            }

            // Load generic practices removed here to avoid confusion with realm-mandatory tasks

        } catch (err) {
            console.error('Failed to load rebirth state:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRollDice = async () => {
        console.log("[Rebird] handleRollDice called. timeLeftMs:", timeLeftMs, "rolling:", rolling);

        if (timeLeftMs > 0) {
            console.log("[Rebird] Still has life remaining, showing info alert.");
            Alert.alert(t('cannotRollDice'), t('rollDiceCondition'));
            return;
        }

        if (mpoints < 50) {
            Alert.alert(t('insufficientMpoints'), t('insufficientPoints').replace('{0}', '50'));
            return;
        }

        const msg = t('rollDiceCostMsg');

        if (Platform.OS === 'web') {
            if (window.confirm(msg)) {
                executeRoll();
            }
        } else {
            Alert.alert(
                t('rollAction'),
                msg,
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('rollAction'), onPress: executeRoll }
                ]
            );
        }
    };

    const executeRoll = async () => {
        console.log("[Rebird] executeRoll started.");
        setRolling(true);
        setDiceResult(null);

        // Start shaking animation
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
            console.log("[Rebird] rollDice result:", result);

            if (!result.success) {
                shakeAnim.setValue(0);
                console.log("[Rebird] rollDice failed:", result.message);
                Alert.alert(t('error'), result.message || t('actionFailed'));
                setRolling(false);
                return;
            }

            // Keep rolling for at least 2 seconds to show animation
            await new Promise(res => setTimeout(res, 2000));
            shakeAnim.setValue(0);

            setDiceResult(result.dice);
            setRollMessage(result.message || null);
            setTargetRealmName(result.toName);
            setShowResultModal(true);

        } catch (err: any) {
            shakeAnim.setValue(0);
            console.error("[Rebird] executeRoll error:", err);
            Alert.alert(t('error'), err.message || t('unknownError'));
        } finally {
            console.log("[Rebird] executeRoll finished, setting rolling to false.");
            setRolling(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !state?.realm_id || postingComment) return;

        setPostingComment(true);
        try {
            const tempComment = await rebirthService.addRealmComment(state.realm_id, newComment.trim());

            // For a better UX, fetch the list again or manually append
            // Fetching again ensures we get profile info
            const c = await rebirthService.getRealmComments(state.realm_id);
            setComments(c);
            setNewComment('');
        } catch (err: any) {
            Alert.alert(t('error'), t('postCommentError'));
        } finally {
            setPostingComment(false);
        }
    };

    if (loading && !state) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    if (!state || !state.realm) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff' }}>{t('noRealmInfo')}</Text>
            </View>
        );
    }

    const { realm, expires_at } = state;

    // Calculate progress based on real-time countdown
    const totalLifeMs = (realm.life_days || 1) * 24 * 60 * 60 * 1000;
    const progress = Math.min(1, timeLeftMs / totalLifeMs);

    const formatTimeLeft = (ms: number) => {
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);

        const parts = [];
        if (days > 0) parts.push(`${days} ${t('dayTime')}`);
        if (hours > 0) parts.push(`${hours} ${t('hourTime')}`);
        parts.push(`${minutes} ${t('minuteTime')}`);
        if (days === 0 && hours === 0) parts.push(`${seconds} ${t('secondTime')}`);

        return parts.join(' ');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
                <Text style={styles.headerTitle}>{t('rebirthTitle')}</Text>
                <TouchableOpacity onPress={() => router.push('/rebird/history' as any)}>
                    <History size={24} color={GOLD} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Realm Image */}
                <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder}>
                        {realm.image_url ? (
                            <Image source={{ uri: realm.image_url }} style={styles.realmImage} />
                        ) : (
                            <Text style={styles.imageText}>{t('realmNumber').replace('{0}', realm.id.toString())}</Text>
                        )}
                    </View>
                    <View style={styles.realmOverlay}>
                        <Text style={styles.realmIdText}>{t('slotNumber').replace('{0}', realm.id.toString())}</Text>
                        <Text style={styles.realmNameText}>{realm.name}</Text>
                    </View>
                </View>

                {/* Realm Description - Collapsible */}
                <View style={styles.infoCard}>
                    <View style={[styles.descInner, !descExpanded && { maxHeight: Math.round(height * 0.28), overflow: 'hidden' }]}>
                        {realm.short_desc && (
                            <RenderHTML
                                contentWidth={width - 80}
                                source={{ html: realm.short_desc }}
                                baseStyle={styles.shortDescHTML}
                            />
                        )}
                        <View style={{ height: 10 }} />
                        <RenderHTML
                            contentWidth={width - 80}
                            source={{ html: realm.description }}
                            baseStyle={styles.descHTML}
                        />
                    </View>

                    {/* Gradient fade + expand button */}
                    {!descExpanded && (
                        <View style={styles.descFadeCover} pointerEvents="none" />
                    )}
                    <TouchableOpacity
                        style={styles.expandBtn}
                        onPress={() => setDescExpanded(v => !v)}
                        activeOpacity={0.7}
                    >
                        {descExpanded
                            ? <ChevronUp size={20} color={MAROON} />
                            : <ChevronDown size={20} color={MAROON} />}
                        <Text style={styles.expandBtnText}>
                            {descExpanded ? t('collapse') : t('viewFull')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Life Bar */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={styles.sectionTitle}>{t('lifeForceKarma')}</Text>
                        <Text style={styles.lifeText}>{timeLeftMs > 0 ? formatTimeLeft(timeLeftMs) : t('ready')}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressHint}>
                        {t('lifeForceHint')}
                    </Text>
                </View>

                {/* Requirements / Practices */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <Check size={18} color={MAROON} />
                        <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>{t('practiceTasks')}</Text>
                    </View>
                    {checkingPractices ? (
                        <ActivityIndicator color={MAROON} />
                    ) : requiredPractices.length === 0 ? (
                        <Text style={{ color: '#999', fontStyle: 'italic', fontSize: 13 }}>{t('noMandatoryTasks')}</Text>
                    ) : (
                        <View style={{ marginBottom: 12 }}>
                            {requiredPractices.map((p, idx) => (
                                <View key={p.id} style={styles.practiceItem}>
                                    <View style={[styles.practiceIcon, { backgroundColor: p.completed ? '#059669' : '#94a3b8' }]}>
                                        <Check size={14} color="#FFF" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.practiceText, p.completed && { color: '#059669', textDecorationLine: 'line-through' }]}>
                                            {p.title}
                                        </Text>
                                        {!p.completed && (
                                            <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{t('completeThisTurn')}</Text>
                                        )}
                                    </View>
                                    {!p.completed && (
                                        <TouchableOpacity
                                            onPress={() => router.push(`/practice/${p.id}` as any)}
                                            style={[styles.actionBtn, { marginTop: 0, paddingHorizontal: 12, paddingVertical: 4, borderColor: MAROON + '40' }]}
                                        >
                                            <Text style={[styles.actionBtnText, { fontSize: 10 }]}>{t('doNow')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            {requiredPractices.some(p => !p.completed) && (
                                <View style={{ backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, marginTop: 4, marginBottom: 12 }}>
                                    <Text style={{ fontSize: 11, color: '#ef4444', textAlign: 'center' }}>
                                        {t('rebirthLockedWarning')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderStyle: 'dotted' }]}
                        onPress={() => router.push('/dashboard/practice' as any)}
                    >
                        <Text style={styles.actionBtnText}>{t('addOtherPractice')}</Text>
                    </TouchableOpacity>
                </View>

                {challenges.length > 0 && (
                    <View style={styles.card}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <ShieldAlert size={20} color="#ef4444" />
                            <Text style={[styles.sectionTitle, { color: '#ef4444', marginBottom: 0, marginLeft: 8 }]}>{t('maraChallenges')}</Text>
                        </View>
                        {challenges.map((c: any, idx: number) => (
                            <View key={idx} style={{ backgroundColor: '#FFF5F5', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ef444422' }}>
                                <Text style={{ color: '#333', fontSize: 14, marginBottom: 4 }}>{c.description}</Text>
                                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>{t('failurePenalty').replace('{0}', c.difficulty_days.toString())}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Co-travelers */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Users size={20} color={GOLD} />
                        <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>{t('coTravelers').replace('{0}', travelers.length.toString())}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {travelers.map((t: any, idx: number) => (
                            <View key={idx} style={styles.travelerAvatar}>
                                <Text style={styles.travelerInitial}>{t.profiles?.display_name?.charAt(0) || 'U'}</Text>
                            </View>
                        ))}
                        {travelers.length === 0 && (
                            <Text style={{ color: '#999', fontStyle: 'italic' }}>{t('noTravelers')}</Text>
                        )}
                    </ScrollView>
                </View>

                {/* Realm Comments (Exchanges) */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <MessageSquare size={20} color={GOLD} />
                        <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>{t('exchanges')}</Text>
                    </View>

                    {/* Input Area */}
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder={t('saySomething')}
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
                            <Text style={styles.noCommentsText}>{t('noExchanges')}</Text>
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
                                            <Text style={styles.commentAuthor}>{c.profiles?.display_name || t('maratikaUser')}</Text>
                                            <Text style={styles.commentDate}>{format(new Date(c.created_at), 'HH:mm dd/MM')}</Text>
                                        </View>
                                        <Text style={styles.commentText}>{c.content}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* Dice Button Container */}
                <View style={styles.diceContainer}>
                    <TouchableOpacity
                        style={[
                            styles.diceButton,
                            (timeLeftMs > 0 || rolling || requiredPractices.some(p => !p.completed)) && styles.diceButtonDisabled
                        ]}
                        onPress={handleRollDice}
                        disabled={timeLeftMs > 0 || rolling || requiredPractices.some(p => !p.completed)}
                    >
                        {rolling ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Dices size={24} color="#FFF" />
                                <Text style={styles.diceButtonText}>
                                    {t('rollDiceBtn')}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {timeLeftMs > 0 && (
                        <Text style={styles.diceHint}>{t('waitZeroLife')}</Text>
                    )}
                </View>

            </ScrollView>

            {/* Rolling Animation Overlay */}
            {rolling && (
                <View style={styles.animationOverlay}>
                    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                        <Dices size={120} color={GOLD} strokeWidth={1} />
                    </Animated.View>
                    <Text style={styles.rollingText}>{t('rollingDice')}</Text>
                </View>
            )}

            {/* Result Modal */}
            <Modal visible={showResultModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>{t('karmaArising')}</Text>
                        <View style={styles.diceResultCircle}>
                            <Text style={styles.diceResultNum}>{diceResult}</Text>
                        </View>
                        <Text style={styles.resultDesc}>
                            {t('rolledNumber').replace('{0}', diceResult?.toString() || '')}
                        </Text>
                        <Text style={styles.destText}>{t('nextRealm')}</Text>
                        <Text style={styles.destName}>{targetRealmName}</Text>
                        {diceResult && (
                            <Text style={{ color: GOLD, fontSize: 12, marginTop: 4, fontWeight: 'bold' }}>
                                {t('slotNumber').replace('{0}', diceResult?.toString() || '')}
                            </Text>
                        )}

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
                            <Text style={styles.modalBtnText}>{t('enterAction')}</Text>
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
        backgroundColor: BG,
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
        fontWeight: '800'
    },
    imageContainer: {
        width: width,
        height: 300,
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
        backgroundColor: 'rgba(0,0,0,0.5)'
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
        fontSize: 28,
        fontWeight: '900'
    },
    infoCard: {
        margin: 20,
        padding: 20,
        backgroundColor: CARD,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    shortDescHTML: {
        color: MAROON,
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'italic',
        lineHeight: 24
    },
    descHTML: {
        color: '#444',
        fontSize: 14,
        lineHeight: 22
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        backgroundColor: CARD,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        color: MAROON,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16
    },
    lifeText: {
        color: '#ef4444',
        fontWeight: '900',
        fontSize: 16
    },
    progressBarBg: {
        height: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 12
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: MAROON,
        borderRadius: 6
    },
    progressHint: {
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic'
    },
    practiceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDFCF0',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: MAROON + '10'
    },
    practiceIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: GOLD,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    practiceText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '600'
    },
    noPracticeText: {
        color: '#999',
        fontSize: 13,
        marginBottom: 12
    },
    actionBtn: {
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: MAROON,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center'
    },
    actionBtnText: {
        color: MAROON,
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase'
    },
    travelerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: GOLD,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: -10
    },
    travelerInitial: {
        color: MAROON,
        fontWeight: '900',
        fontSize: 16
    },
    diceContainer: {
        margin: 20,
        marginTop: 10,
        alignItems: 'center'
    },
    diceButton: {
        backgroundColor: MAROON,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: MAROON,
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    diceButtonDisabled: {
        backgroundColor: '#CCC',
        shadowOpacity: 0,
        elevation: 0
    },
    diceButtonText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 16,
        marginLeft: 12,
        letterSpacing: 1
    },
    diceHint: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 12,
        fontStyle: 'italic',
        fontWeight: '600'
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
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 30,
        letterSpacing: 2,
        textTransform: 'uppercase'
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    resultCard: {
        backgroundColor: BG,
        width: '90%',
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: GOLD
    },
    resultTitle: {
        color: MAROON,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 4,
        marginBottom: 20
    },
    diceResultCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: MAROON,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 10,
        shadowColor: MAROON,
        shadowOpacity: 0.5,
        shadowRadius: 15
    },
    diceResultNum: {
        color: GOLD,
        fontSize: 48,
        fontWeight: '900'
    },
    resultDesc: {
        color: '#666',
        fontSize: 16,
        marginBottom: 10
    },
    destText: {
        color: '#999',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 10
    },
    destName: {
        color: MAROON,
        fontSize: 24,
        fontWeight: '900',
        marginTop: 5,
        textAlign: 'center'
    },
    rewardBadge: {
        backgroundColor: '#FFF5E6',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: GOLD + '40'
    },
    rewardText: {
        color: '#B8860B',
        fontWeight: 'bold',
        fontSize: 14
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
        // Using semi-transparent background as simple fade effect
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
    modalBtn: {
        backgroundColor: MAROON,
        width: '100%',
        paddingVertical: 16,
        borderRadius: 15,
        marginTop: 30,
        alignItems: 'center'
    },
    modalBtnText: {
        color: GOLD,
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 2
    },
    // Comments Styles
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: 20,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        paddingTop: 12,
        fontSize: 14,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 48,
        maxHeight: 100,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: MAROON,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentsList: {
        marginTop: 10,
    },
    commentItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: GOLD + '20',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: GOLD + '40',
    },
    commentAvatarText: {
        color: GOLD,
        fontSize: 12,
        fontWeight: '900',
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        borderTopLeftRadius: 0,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentAuthor: {
        fontSize: 12,
        fontWeight: 'bold',
        color: MAROON,
    },
    commentDate: {
        fontSize: 10,
        color: '#94A3B8',
    },
    commentText: {
        fontSize: 13,
        color: '#334155',
        lineHeight: 18,
    },
    noCommentsText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 13,
        fontStyle: 'italic',
        paddingVertical: 20,
    }
});
