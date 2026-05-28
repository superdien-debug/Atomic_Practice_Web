import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Map, Gift, User } from 'lucide-react-native';
import { rebirthService, Realm } from '../../services/rebirthService';
import { treasureService } from '../../services/treasureService';
import { supabase } from '../../lib/supabase';
import { useT } from '../../i18n/useT';

const GOLD = '#D4AF37';
const BG = '#FEF9EF';
const MAROON = '#800000';
const BRONZE = '#CD7F32';

interface Traveler {
    id: string;
    name: string;
    avatar: string | null;
}

export default function SamsaraMapScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const t = useT();

    const [realms, setRealms] = useState<Realm[]>([]);
    const [currentState, setCurrentState] = useState<any>(null);
    const [travelersMap, setTravelersMap] = useState<Record<number, Traveler[]>>({});
    const [treasureRealms, setTreasureRealms] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        loadMapData();
    }, []);

    const loadMapData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all realms
            const allRealms = await rebirthService.getAllRealms().catch(err => {
                console.error('Failed to load realms:', err);
                return [];
            });
            setRealms(allRealms || []);

            // 2. Fetch current user state (to highlight self)
            const myState = await rebirthService.getState().catch(err => {
                console.error('Failed to load user state:', err);
                return null;
            });
            setCurrentState(myState);

            // 3. Fetch all active travelers and their profiles
            const { data: travelerData, error: travelerError } = await supabase
                .from('user_rebirth_state')
                .select(`
                    user_id,
                    realm_id,
                    profiles:user_id (display_name, avatar_url)
                `);

            if (travelerError) {
                console.error('Failed to fetch travelers:', travelerError);
            } else if (travelerData) {
                const posMap: Record<number, Traveler[]> = {};
                travelerData.forEach((row: any) => {
                    if (!posMap[row.realm_id]) {
                        posMap[row.realm_id] = [];
                    }
                    const profile = row.profiles;
                    posMap[row.realm_id].push({
                        id: row.user_id,
                        name: profile?.display_name || 'Đồng tu',
                        avatar: profile?.avatar_url || null
                    });
                });
                setTravelersMap(posMap);
            }

            // 4. Fetch Treasure Locations
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

    // Render Chessboard grid cells
    const renderBoard = () => {
        const boardRows = [];
        
        // Loop from row 10 (top) down to 0 (bottom)
        for (let r = 10; r >= 0; r--) {
            const rowCells = [];
            
            for (let c = 0; c < 10; c++) {
                const realmId = r * 10 + c + 1;
                
                if (realmId <= 104) {
                    const realm = realms.find(x => x.id === realmId);
                    if (realm) {
                        rowCells.push(renderCell(realm));
                    }
                } else {
                    // Empty decorative cells
                    rowCells.push(
                        <View key={`empty-${realmId}`} style={[styles.cell, styles.emptyCell]}>
                            <Text style={styles.lotusIcon}>☸️</Text>
                        </View>
                    );
                }
            }
            
            boardRows.push(
                <View key={`row-${r}`} style={styles.boardRow}>
                    {rowCells}
                </View>
            );
        }
        
        return boardRows;
    };

    const renderCell = (r: Realm) => {
        const travelers = travelersMap[r.id] || [];
        const isMyCurrent = currentState && currentState.realm_id === r.id;
        const hasTreasure = treasureRealms.has(r.id);

        // Determine background and borders based on cõi giới clusters
        let cellTypeStyle = styles.humanCell;
        let idBadgeColor = MAROON;
        
        if (r.id >= 1 && r.id <= 13) {
            // Cõi khổ (Hell/Pretas/Animal)
            cellTypeStyle = styles.lowerCell;
            idBadgeColor = '#ef4444';
        } else if (r.id >= 70 && r.id <= 104) {
            // Cõi Trời/Tịnh độ (Deva/Pure Land)
            cellTypeStyle = styles.higherCell;
            idBadgeColor = GOLD;
        }

        return (
            <View 
                key={r.id} 
                style={[
                    styles.cell, 
                    cellTypeStyle,
                    hasTreasure && styles.treasureCell,
                    isMyCurrent && styles.myCurrentCell
                ]}
            >
                {/* ID and Treasure Header */}
                <View style={styles.cellHeader}>
                    <Text style={[styles.cellId, { color: idBadgeColor }]}>#{r.id}</Text>
                    {hasTreasure && (
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <Gift size={11} color={GOLD} />
                        </Animated.View>
                    )}
                </View>

                {/* Realm Name */}
                <Text numberOfLines={2} style={styles.cellName}>
                    {r.name}
                </Text>

                {/* Avatars of active players */}
                <View style={styles.avatarsRow}>
                    {travelers.slice(0, 3).map((player, idx) => (
                        <View key={player.id} style={[styles.avatarWrapper, { marginLeft: idx > 0 ? -6 : 0 }]}>
                            {player.avatar ? (
                                <Image source={{ uri: player.avatar }} style={styles.avatarImg} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <User size={8} color="#999" />
                                </View>
                            )}
                            {player.id === currentState?.user_id && (
                                <View style={styles.myIndicator} />
                            )}
                        </View>
                    ))}
                    {travelers.length > 3 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>+{travelers.length - 3}</Text>
                        </View>
                    )}
                </View>

                {/* Self visual indicator ring */}
                {isMyCurrent && (
                    <View style={styles.selfPulseRing} />
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft color="#FFF" size={24} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Map color={GOLD} size={24} style={{ marginRight: 8 }} />
                    <Text style={styles.headerTitle}>Bản Đồ Bàn Cờ Luân Hồi</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={MAROON} />
                    <Text style={styles.loaderText}>Đang lập bản đồ lục đạo...</Text>
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.subtitle}>
                        Toàn cảnh 104 cõi giới luân hồi. Ô viền vàng nhấp nháy là vị trí hiện tại của bạn. Nhìn thấy các đồng tu khác đang ở đâu trên bàn cờ thời gian thực!
                    </Text>

                    {/* Horizontal scroll support for smaller mobile screens */}
                    <ScrollView 
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScrollContent}
                    >
                        <View style={styles.boardContainer}>
                            {renderBoard()}
                        </View>
                    </ScrollView>
                </ScrollView>
            )}
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
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 80,
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    horizontalScrollContent: {
        paddingVertical: 10,
    },
    boardContainer: {
        backgroundColor: '#FCF8F2',
        borderWidth: 6,
        borderColor: MAROON,
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
    },
    boardRow: {
        flexDirection: 'row',
    },
    cell: {
        width: 88,
        height: 88,
        margin: 2,
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 6,
        justifyContent: 'space-between',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
        elevation: 1,
    },
    // Cell styling based on clusters
    humanCell: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    lowerCell: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    higherCell: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    emptyCell: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.5,
    },
    lotusIcon: {
        fontSize: 24,
        color: '#CBD5E1',
    },
    treasureCell: {
        borderColor: GOLD,
        borderWidth: 1.8,
        backgroundColor: '#FFFbeb',
    },
    myCurrentCell: {
        borderColor: GOLD,
        borderWidth: 3,
        shadowColor: GOLD,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        backgroundColor: '#FFFbeb',
    },
    cellHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cellId: {
        fontSize: 10,
        fontWeight: '900',
    },
    cellName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginVertical: 4,
    },
    avatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 18,
    },
    avatarWrapper: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: '#FFF',
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
        position: 'relative',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    myIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#22c55e',
        borderWidth: 0.5,
        borderColor: '#FFF',
    },
    countBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#64748B',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -4,
        borderWidth: 1,
        borderColor: '#FFF',
    },
    countText: {
        color: '#FFF',
        fontSize: 7,
        fontWeight: 'bold',
    },
    selfPulseRing: {
        position: 'absolute',
        top: -3,
        left: -3,
        right: -3,
        bottom: -3,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: GOLD,
        opacity: 0.4,
    }
});
