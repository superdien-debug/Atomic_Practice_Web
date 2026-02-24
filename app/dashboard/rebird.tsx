import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Dices, History, Users, Sword, ShieldAlert, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { rebirthService, RebirthState, Realm } from '../../services/rebirthService';
import { practiceService, Practice } from '../../services/practiceService';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function RebirdScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuthStore();

    const [state, setState] = useState<RebirthState | null>(null);
    const [travelers, setTravelers] = useState<any[]>([]);
    const [practices, setPractices] = useState<Practice[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rolling, setRolling] = useState(false);
    const [diceResult, setDiceResult] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const currentState = await rebirthService.getState(user.id);
            setState(currentState);

            if (currentState?.realm_id) {
                const tr = await rebirthService.getTravelersInRealm(currentState.realm_id);
                setTravelers(tr);

                const challs = await rebirthService.getChallenges(currentState.realm_id);
                setChallenges(challs);
            }

            // Load some practices to show
            const dateStr = new Date().toISOString().split('T')[0];
            const p = await practiceService.fetchPracticesForDate(dateStr);
            setPractices(p.filter(x => !x.completed).slice(0, 3)); // show up to 3 pending practices

        } catch (err) {
            console.error("Failed to load rebirth state:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRollDice = async () => {
        if (state && state.life_days_remaining > 0) {
            Alert.alert("Chưa thể gieo xúc xắc", "Bạn phải tiêu trừ hết sinh lực bằng cách thực hành trước khi có thể chuyển cõi.");
            return;
        }

        Alert.alert(
            "Gieo xúc xắc",
            "Mỗi lần gieo xúc xắc sẽ tiêu tốn 50 Mpoints. Bạn có chắc chắn muốn gieo và bước vào cõi tiếp theo dựa trên nghiệp lực?",
            [
                { text: "Hủy", style: 'cancel' },
                { text: "Gieo", onPress: executeRoll }
            ]
        );
    };

    const executeRoll = async () => {
        setRolling(true);
        setDiceResult(null);

        try {
            // Fake animation delay
            await new Promise(res => setTimeout(res, 1500));

            const result = await rebirthService.rollDice();
            if (!result.success) {
                Alert.alert("Lỗi", result.message || "Không thể gieo xúc xắc.");
                return;
            }

            setDiceResult(result.dice);

            // Show result
            Alert.alert(
                "Nghiệp quả",
                `Bạn gieo được ${result.dice}! Hệ thống đang chuyển cảnh giới...` +
                (result.message ? `\n\nPhần thưởng: ${result.message}` : ''),
                [{ text: "Tiếp tục", onPress: loadData }]
            );

        } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Đã xảy ra lỗi khi gieo xúc xắc.");
        } finally {
            setRolling(false);
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
                <Text style={{ color: '#fff' }}>Không tìm thấy thông tin cảnh giới.</Text>
            </View>
        );
    }

    const { realm, life_days_remaining } = state;
    const progress = realm.life_days > 0 ? (life_days_remaining / realm.life_days) : 0;

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tái Sinh</Text>
                <TouchableOpacity onPress={() => router.push('/rebird/history' as any)}>
                    <History size={24} color="#D4AF37" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Realm Image */}
                <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.imageText}>{realm.image_url}</Text>
                    </View>
                    <View style={styles.realmOverlay}>
                        <Text style={styles.realmIdText}>Ô số {realm.id}</Text>
                        <Text style={styles.realmNameText}>{realm.name}</Text>
                    </View>
                </View>

                {/* Realm Description */}
                <View style={styles.infoCard}>
                    <Text style={styles.shortDescText}>{realm.short_desc}</Text>
                    <Text style={styles.descText}>{realm.description}</Text>
                </View>

                {/* Life Bar */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={styles.sectionTitle}>Sinh Lực (Nghiệp Chướng)</Text>
                        <Text style={styles.lifeText}>{life_days_remaining} / {realm.life_days} ngày</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressHint}>
                        Mỗi lần hoàn thành 1 thực hành (Practice), sinh lực sẽ giảm 1 ngày.
                    </Text>
                </View>

                {/* Requirements / Practices */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Nhiệm Vụ Tu Tập</Text>
                    {practices.length > 0 ? practices.map((p, idx) => (
                        <View key={idx} style={styles.practiceItem}>
                            <View style={styles.practiceIcon}>
                                <Check size={16} color="#000" />
                            </View>
                            <Text style={styles.practiceText}>{p.title}</Text>
                        </View>
                    )) : (
                        <Text style={styles.noPracticeText}>Bạn đã hoàn thành đủ nhiệm vụ hoặc chưa có nhiệm vụ nào. Hãy vào mục Practice để thêm.</Text>
                    )}
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push('/dashboard/practice' as any)}
                    >
                        <Text style={styles.actionBtnText}>Vào mục Thực Hành</Text>
                    </TouchableOpacity>
                </View>

                {/* Mara Challenges */}
                {challenges.length > 0 && (
                    <View style={styles.card}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <ShieldAlert size={20} color="#ef4444" />
                            <Text style={[styles.sectionTitle, { color: '#ef4444', marginBottom: 0, marginLeft: 8 }]}>Thử Thách Từ MARA</Text>
                        </View>
                        {challenges.map((c, idx) => (
                            <View key={idx} style={{ backgroundColor: '#2a0a0a', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ef444455' }}>
                                <Text style={{ color: '#fff', fontSize: 14, marginBottom: 4 }}>{c.description}</Text>
                                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>Thất bại: +{c.difficulty_days} ngày sinh lực</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Co-travelers */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Users size={20} color="#D4AF37" />
                        <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>Đồng Đạo ({travelers.length})</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {travelers.map((t, idx) => (
                            <View key={idx} style={styles.travelerAvatar}>
                                <Text style={styles.travelerInitial}>{t.profiles?.display_name?.charAt(0) || 'U'}</Text>
                            </View>
                        ))}
                        {travelers.length === 0 && (
                            <Text style={{ color: '#888', fontStyle: 'italic' }}>Chưa có ai ở cõi này lúc này.</Text>
                        )}
                    </ScrollView>
                </View>

                {/* Dice Button Container */}
                <View style={styles.diceContainer}>
                    <TouchableOpacity
                        style={[
                            styles.diceButton,
                            (life_days_remaining > 0 || rolling) && styles.diceButtonDisabled
                        ]}
                        onPress={handleRollDice}
                        disabled={life_days_remaining > 0 || rolling}
                    >
                        {rolling ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Dices size={24} color={life_days_remaining > 0 ? "#888" : "#fff"} />
                                <Text style={[
                                    styles.diceButtonText,
                                    life_days_remaining > 0 && styles.diceButtonTextDisabled
                                ]}>
                                    GIEO XÚC XẮC (-50 MP)
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {life_days_remaining > 0 && (
                        <Text style={styles.diceHint}>Bạn phải tiêu trừ hết Sinh lực để có thể đi tiếp</Text>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    headerTitle: {
        color: '#D4AF37',
        fontSize: 22,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    imageContainer: {
        width: width,
        height: 250,
        backgroundColor: '#222',
        position: 'relative'
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2A0505',
    },
    imageText: {
        color: '#D4AF37',
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
        color: '#D4AF37',
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
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333'
    },
    shortDescText: {
        color: '#D4AF37',
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'italic',
        marginBottom: 12,
        lineHeight: 24
    },
    descText: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 22
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333'
    },
    sectionTitle: {
        color: '#fff',
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
        backgroundColor: '#333',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 12
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ef4444',
        borderRadius: 6
    },
    progressHint: {
        color: '#888',
        fontSize: 12,
        fontStyle: 'italic'
    },
    practiceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8
    },
    practiceIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#D4AF37',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    practiceText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    },
    noPracticeText: {
        color: '#888',
        fontSize: 13,
        marginBottom: 12
    },
    actionBtn: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#D4AF37',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center'
    },
    actionBtnText: {
        color: '#D4AF37',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase'
    },
    travelerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: -10
    },
    travelerInitial: {
        color: '#D4AF37',
        fontWeight: '900',
        fontSize: 16
    },
    diceContainer: {
        margin: 20,
        marginTop: 10,
        alignItems: 'center'
    },
    diceButton: {
        backgroundColor: '#D4AF37',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#D4AF37',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    diceButtonDisabled: {
        backgroundColor: '#333',
        shadowOpacity: 0,
        elevation: 0
    },
    diceButtonText: {
        color: '#451a03',
        fontWeight: '900',
        fontSize: 16,
        marginLeft: 12,
        letterSpacing: 1
    },
    diceButtonTextDisabled: {
        color: '#888'
    },
    diceHint: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 12,
        fontStyle: 'italic',
        fontWeight: '600'
    }
});
