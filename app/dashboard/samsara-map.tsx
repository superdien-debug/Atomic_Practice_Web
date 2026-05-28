import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Image, ActivityIndicator, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Map, Gift, User, X, Eye, Square } from 'lucide-react-native';
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
    const { width: screenWidth } = useWindowDimensions();
    
    // Responsive chess grid cell sizing
    const minCellSize = 54;
    const padding = 4;
    const borderWidth = 3;
    const cellMargin = 1.5;
    const containerSpacing = (padding + borderWidth) * 2; // 14px
    const totalCellSpacing = cellMargin * 2 * 10; // 30px
    
    const idealBoardWidth = Math.min(screenWidth - 32, 580);
    const idealCellSize = Math.floor((idealBoardWidth - containerSpacing - totalCellSpacing) / 10);
    const cellSize = Math.max(minCellSize, idealCellSize);
    const boardWidth = cellSize * 10 + totalCellSpacing + containerSpacing;

    const [realms, setRealms] = useState<Realm[]>([]);
    const [currentState, setCurrentState] = useState<any>(null);
    const [travelersMap, setTravelersMap] = useState<Record<number, Traveler[]>>({});
    const [treasureRealms, setTreasureRealms] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);

    const horizontalScrollRef = React.useRef<ScrollView>(null);

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

    // Focus scroll on load to user's current realm position
    useEffect(() => {
        if (!loading && currentState?.realm_id && realms.length > 0) {
            const colIndex = (currentState.realm_id - 1) % 10;
            const cellX = colIndex * (cellSize + cellMargin * 2) + padding + borderWidth;
            // Center the cell inside the viewport
            const scrollX = Math.max(0, cellX - screenWidth / 2 + cellSize / 2);
            
            const timer = setTimeout(() => {
                horizontalScrollRef.current?.scrollTo({ x: scrollX, animated: true });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [loading, currentState, realms, screenWidth]);

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
            if (myState && allRealms) {
                const myRealm = allRealms.find((x: any) => x.id === myState.realm_id);
                if (myRealm) {
                    setSelectedRealm(myRealm);
                }
            }

            // 3. Fetch all active travelers and their profiles
            const { data: travelerData, error: travelerError } = await supabase
                .from('user_rebirth_state')
                .select('user_id, realm_id');

            if (travelerError) {
                console.error('Failed to fetch travelers:', travelerError);
            } else if (travelerData && travelerData.length > 0) {
                const userIds = travelerData.map((t: any) => t.user_id);
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url')
                    .in('id', userIds);

                if (profilesError) {
                    console.error('Failed to fetch traveler profiles:', profilesError);
                }

                const profilesMap: Record<string, any> = {};
                if (profilesData) {
                    profilesData.forEach((p: any) => {
                        profilesMap[p.id] = p;
                    });
                }

                const posMap: Record<number, Traveler[]> = {};
                travelerData.forEach((row: any) => {
                    if (!posMap[row.realm_id]) {
                        posMap[row.realm_id] = [];
                    }
                    const profile = profilesMap[row.user_id];
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
                        <View 
                            key={`empty-${realmId}`} 
                            style={[
                                styles.cell, 
                                { 
                                    width: cellSize, 
                                    height: cellSize, 
                                    margin: cellMargin, 
                                    borderRadius: 6,
                                    justifyContent: 'center', 
                                    alignItems: 'center' 
                                }, 
                                styles.emptyCell
                            ]}
                        >
                            <Text style={[styles.lotusIcon, { fontSize: Math.floor(cellSize * 0.45) }]}>☸️</Text>
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
        const isSelected = selectedRealm && selectedRealm.id === r.id;

        // Determine background and borders based on cõi giới clusters
        let cellBg = '#ffffff'; // cõi người
        let borderStyle: any = { borderColor: '#e2e8f0', borderWidth: 1 };
        let textColor = '#475569';
        
        if (r.id >= 1 && r.id <= 13) {
            cellBg = '#1e293b'; // cõi khổ
            borderStyle = { borderColor: '#334155', borderWidth: 1 };
            textColor = '#94a3b8';
        } else if (r.id >= 70 && r.id <= 104) {
            cellBg = '#fffdf5'; // cõi cao
            borderStyle = { borderColor: '#fde68a', borderWidth: 1 };
            textColor = '#b45309';
        }

        // Highlight selected cell
        if (isSelected) {
            borderStyle = { borderColor: MAROON, borderWidth: 2 };
        }

        // Highlight self position
        if (isMyCurrent) {
            borderStyle = { borderColor: GOLD, borderWidth: 2 };
        }

        return (
            <TouchableOpacity 
                key={r.id} 
                style={[
                    styles.cell, 
                    { 
                        width: cellSize, 
                        height: cellSize, 
                        backgroundColor: cellBg,
                        margin: cellMargin,
                        borderRadius: 6,
                        padding: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative'
                    },
                    borderStyle,
                ]}
                onPress={() => setSelectedRealm(r)}
                activeOpacity={0.7}
            >
                {/* Visual indicator for self position */}
                {isMyCurrent && (
                    <Animated.View style={[styles.selfPulseRing, { transform: [{ scale: pulseAnim }], borderRadius: 6, top: -1.5, left: -1.5, right: -1.5, bottom: -1.5 }]} />
                )}

                {/* If there is a traveler, display the first traveler's avatar */}
                {travelers.length > 0 ? (
                    <View style={styles.cellAvatarContainer}>
                        {travelers[0].avatar ? (
                            <Image source={{ uri: travelers[0].avatar }} style={styles.cellAvatarImg} />
                        ) : (
                            <View style={styles.cellAvatarPlaceholder}>
                                <User size={Math.floor(cellSize * 0.45)} color="#64748b" />
                            </View>
                        )}
                        {/* If there are more than 1 traveler, show a count badge */}
                        {travelers.length > 1 && (
                            <View style={styles.cellCountBadge}>
                                <Text style={styles.cellCountText}>+{travelers.length}</Text>
                            </View>
                        )}
                        {/* Self marker indicator on the avatar */}
                        {travelers.some(p => p.id === currentState?.user_id) && (
                            <View style={styles.myIndicator} />
                        )}
                    </View>
                ) : hasTreasure ? (
                    <Gift size={Math.floor(cellSize * 0.45)} color={GOLD} />
                ) : (
                    <Text style={{ fontSize: Math.max(8, Math.min(11, Math.floor(cellSize * 0.35))), color: textColor, fontWeight: 'bold' }}>
                        {r.id}
                    </Text>
                )}
            </TouchableOpacity>
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
                        Nhấp vào bất kỳ ô nào trên bàn cờ để xem chi tiết cảnh giới và danh sách các đồng tu đang thực hành tại đó thời gian thực!
                    </Text>

                    {/* Responsive scrollable Chessboard - automatically fits 100% screen width! */}
                    <ScrollView 
                        horizontal
                        ref={horizontalScrollRef}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            alignItems: 'center',
                        }}
                        style={{ width: '100%', marginBottom: 16 }}
                    >
                        <View style={[
                            styles.boardContainer, 
                            { 
                                width: boardWidth,
                                padding: padding, 
                                borderWidth: borderWidth, 
                                borderRadius: 12,
                                alignSelf: 'center',
                            }
                        ]}>
                            {renderBoard()}
                        </View>
                    </ScrollView>

                    {/* Gorgeous Inline Realm Details Card (Tự động hiển thị cõi của mình khi mới vào) */}
                    {selectedRealm && (
                        <View style={[
                            styles.detailCard, 
                            selectedRealm.id <= 13 && styles.darkDetailCard,
                            selectedRealm.id >= 70 && styles.goldenDetailCard
                        ]}>
                            {/* Card Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={[
                                    styles.detailCardTitle,
                                    selectedRealm.id <= 13 && { color: '#ef4444' },
                                    selectedRealm.id >= 70 && { color: GOLD }
                                ]}>
                                    Cảnh giới #{selectedRealm.id}: {selectedRealm.name}
                                </Text>
                                <Text style={[
                                    styles.detailClusterText,
                                    selectedRealm.id <= 13 && { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                                    selectedRealm.id >= 70 && { color: GOLD, backgroundColor: 'rgba(212, 175, 55, 0.1)' }
                                ]}>
                                    {selectedRealm.id <= 13 ? '🔴 CÕI KHỔ' : (selectedRealm.id >= 70 ? '🟡 CÕI CAO' : '🟢 CÕI THƯỜNG')}
                                </Text>
                            </View>

                            {/* Realm Description */}
                            <Text style={[
                                styles.detailDescText,
                                selectedRealm.id <= 13 && { color: '#94a3b8' }
                            ]}>
                                {selectedRealm.short_desc || 'Không có mô tả cảnh giới.'}
                            </Text>

                            <View style={{ height: 1, backgroundColor: selectedRealm.id <= 13 ? '#334155' : '#f1f5f9', marginVertical: 12 }} />

                            {/* Travelers list at this cell */}
                            <View>
                                <Text style={[
                                    styles.detailSectionTitle,
                                    selectedRealm.id <= 13 && { color: '#94a3b8' }
                                ]}>
                                    Đồng tu ở đây ({travelersMap[selectedRealm.id]?.length || 0})
                                </Text>
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false} 
                                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                                >
                                    {!travelersMap[selectedRealm.id] || travelersMap[selectedRealm.id].length === 0 ? (
                                        <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', paddingVertical: 4 }}>
                                            Chưa có đồng tu nào ở cõi này.
                                        </Text>
                                    ) : (
                                        travelersMap[selectedRealm.id].map((player) => (
                                            <View 
                                                key={player.id} 
                                                style={[
                                                    styles.travelerTag,
                                                    selectedRealm.id <= 13 && styles.darkTravelerTag
                                                ]}
                                            >
                                                {player.avatar ? (
                                                    <Image source={{ uri: player.avatar }} style={styles.travelerTagAvatar} />
                                                ) : (
                                                    <View style={styles.travelerTagPlaceholder}>
                                                        <User size={10} color="#94a3b8" />
                                                    </View>
                                                )}
                                                <Text style={[
                                                    styles.travelerTagName,
                                                    selectedRealm.id <= 13 && { color: '#cbd5e1' }
                                                ]}>
                                                    {player.name}
                                                </Text>
                                                {player.id === currentState?.user_id && (
                                                    <View style={styles.travelerSelfBadge}>
                                                        <Text style={styles.travelerSelfText}>Bạn</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    )}
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
    },
    // Responsive Cell Avatar styles
    cellAvatarContainer: {
        width: '90%',
        height: '90%',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
    },
    cellAvatarImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cellAvatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e2e8f0',
    },
    cellCountBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 2,
        paddingVertical: 0.5,
        borderRadius: 4,
    },
    cellCountText: {
        color: '#fff',
        fontSize: 7,
        fontWeight: 'bold',
    },
    // Inline detail card styles
    detailCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 40,
    },
    darkDetailCard: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    goldenDetailCard: {
        backgroundColor: '#FFFDF9',
        borderColor: '#FEF3C7',
        borderWidth: 1.5,
    },
    detailCardTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: MAROON,
        flex: 1,
        lineHeight: 22,
    },
    detailClusterText: {
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        color: MAROON,
        backgroundColor: 'rgba(128, 0, 0, 0.05)',
        overflow: 'hidden',
    },
    detailDescText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 19,
        marginBottom: 8,
    },
    detailSectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    // Horizontal Traveler tags in detail card
    travelerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    darkTravelerTag: {
        backgroundColor: '#334155',
        borderColor: '#475569',
    },
    travelerTagAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 6,
    },
    travelerTagPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    travelerTagName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b',
    },
    travelerSelfBadge: {
        marginLeft: 4,
        backgroundColor: '#fef08a',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    travelerSelfText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: MAROON,
    },
});
