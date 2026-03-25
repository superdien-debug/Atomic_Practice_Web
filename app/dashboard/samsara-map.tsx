import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Map, Users, Gift } from 'lucide-react-native';
import { rebirthService, Realm } from '../../services/rebirthService';
import { treasureService, RealmUserDistribution } from '../../services/treasureService';
import { useT } from '../../i18n/useT';

const GOLD = '#D4AF37';
const BG = '#FEF9EF';
const MAROON = '#800000';

export default function SamsaraMapScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const t = useT();

    const [realms, setRealms] = useState<Realm[]>([]);
    const [distribution, setDistribution] = useState<Record<number, number>>({});
    const [treasureRealms, setTreasureRealms] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const scrollViewRef = React.useRef<ScrollView>(null);
    const [humanLayoutY, setHumanLayoutY] = useState(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        loadMapData();
    }, []);

    const loadMapData = async () => {
        setLoading(true);
        try {
            // Fetch Realms robustly
            const allRealms = await rebirthService.getAllRealms().catch(err => {
                console.error('Failed to load realms:', err);
                return [];
            });
            setRealms(allRealms || []);

            // Fetch User Distribution robustly
            const distData = await treasureService.getUserDistribution().catch(err => {
                console.error('Failed to load distribution:', err);
                return [];
            });
            const distMap: Record<number, number> = {};
            (distData || []).forEach((d: any) => {
                distMap[d.realm_id] = d.user_count;
            });
            setDistribution(distMap);

            // Fetch Treasure Locations robustly
            const tRealmsArray = await treasureService.getTreasureLocations().catch(err => {
                console.error('Failed to load treasures:', err);
                return [];
            });
            setTreasureRealms(new Set(tRealmsArray || []));
            
        } catch (error) {
            console.error('Failed to load map data entirely', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived clustered realms
    const higherRealms = realms.filter(r => r.id > 24).sort((a, b) => b.id - a.id);
    const humanRealm = realms.find(r => r.id === 24);
    const lowerRealms = realms.filter(r => r.id < 24).sort((a, b) => b.id - a.id);

    // Scroll to Human Realm once it's laid out
    useEffect(() => {
        if (!loading && humanLayoutY > 0 && scrollViewRef.current) {
            // Delay slightly to ensure UI is completely rendered
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: Math.max(0, humanLayoutY - 150), animated: true });
            }, 500);
        }
    }, [loading, humanLayoutY]);

    const renderRealmCard = (r: Realm, isCenter = false) => {
        const count = distribution[r.id] || 0;
        const hasTreasure = treasureRealms.has(r.id);

        return (
            <View key={r.id} style={styles.timelineNode}>
                <View style={styles.verticalLine} />
                <View style={[styles.realmCard, hasTreasure && styles.treasureCard, isCenter && styles.centerCard]}>
                    <View style={styles.realmHeader}>
                        <View style={[styles.badgeContainer, isCenter && { backgroundColor: GOLD }]}>
                            <Text style={[styles.badgeText, isCenter && { color: '#FFF' }]}>#{r.id}</Text>
                        </View>
                        {hasTreasure && (
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <Gift size={20} color="#D4AF37" />
                            </Animated.View>
                        )}
                    </View>

                    <Text style={styles.realmName}>{r.name}</Text>

                    <View style={styles.statsRow}>
                        <Users size={16} color="#666" />
                        <Text style={styles.statsText}>{count} đạo hữu</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft color="#FFF" size={24} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Map color={GOLD} size={24} style={{ marginRight: 8 }} />
                    <Text style={styles.headerTitle}>Bản Đồ Luân Hồi</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>
                    Cấu trúc 104 cõi giới (Từ Thượng Thới đến Địa Ngục). Cõi số 24 là Khởi Điểm. Những cõi tỏa sáng đang ẩn chứa Pháp Bảo.
                </Text>

                {loading ? (
                    <Text style={{ textAlign: 'center', marginTop: 50, color: '#666' }}>Đang tải bản đồ...</Text>
                ) : realms.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 50, color: '#dc2626' }}>
                        Không thể kết nối đến máy chủ để tải bản đồ luân hồi. Xin vui lòng thử lại sau.
                    </Text>
                ) : (
                    <View style={styles.mapGrid}>
                        {/* Higher Realms (25 -> 104) */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeaderBox}>
                                <Text style={styles.sectionTitle}>Các Cõi Cao (Trời / Tịnh Độ)</Text>
                            </View>
                            {higherRealms.map(r => renderRealmCard(r))}
                        </View>

                        {/* Starting Point (24) */}
                        <View
                            style={styles.sectionContainer}
                            onLayout={(e) => setHumanLayoutY(e.nativeEvent.layout.y)}
                        >
                            <View style={[styles.sectionHeaderBox, { backgroundColor: GOLD }]}>
                                <Text style={[styles.sectionTitle, { color: '#FFF' }]}>KHỞI ĐIỂM CÕI NGƯỜI</Text>
                            </View>
                            {humanRealm && renderRealmCard(humanRealm, true)}
                        </View>

                        {/* Lower Realms (23 -> 1) */}
                        <View style={styles.sectionContainer}>
                            <View style={[styles.sectionHeaderBox, { backgroundColor: '#475569' }]}>
                                <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Các Cõi Thấp (Ác Đạo)</Text>
                            </View>
                            {lowerRealms.map(r => renderRealmCard(r))}

                            {/* End of line padding */}
                            <View style={{ height: 40, width: 4, backgroundColor: '#E2E8F0', alignSelf: 'center' }} />
                        </View>
                    </View>
                )}
            </ScrollView>
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
        paddingBottom: 20,
        backgroundColor: MAROON,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    mapGrid: {
        alignItems: 'center',
        width: '100%',
    },
    sectionContainer: {
        width: '100%',
        alignItems: 'center',
    },
    sectionHeaderBox: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
        marginVertical: 20,
        zIndex: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    timelineNode: {
        width: '100%',
        alignItems: 'center',
        position: 'relative',
    },
    verticalLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#E2E8F0',
        zIndex: 0,
    },
    realmCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        width: '90%',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginVertical: 12,
        zIndex: 1,
    },
    centerCard: {
        borderColor: GOLD,
        borderWidth: 3,
        transform: [{ scale: 1.05 }],
        shadowColor: GOLD,
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    treasureCard: {
        borderColor: GOLD,
        borderWidth: 2,
        backgroundColor: '#FFFAED',
        shadowColor: GOLD,
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    realmHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeContainer: {
        backgroundColor: 'rgba(128,0,0,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: MAROON,
        fontWeight: '900',
        fontSize: 12,
    },
    realmName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statsText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#666',
    }
});
