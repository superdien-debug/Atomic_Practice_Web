import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
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

    const [realms, setRealms] = useState<Realm[]>([]);
    const [currentState, setCurrentState] = useState<any>(null);
    const [travelersMap, setTravelersMap] = useState<Record<number, Traveler[]>>({});
    const [treasureRealms, setTreasureRealms] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'detail' | 'mini'>('detail');
    const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);

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
        const isMini = viewMode === 'mini';
        
        // Loop from row 10 (top) down to 0 (bottom)
        for (let r = 10; r >= 0; r--) {
            const rowCells = [];
            
            for (let c = 0; c < 10; c++) {
                const realmId = r * 10 + c + 1;
                
                if (realmId <= 104) {
                    const realm = realms.find(x => x.id === realmId);
                    if (realm) {
                        rowCells.push(isMini ? renderMiniCell(realm) : renderCell(realm));
                    }
                } else {
                    // Empty decorative cells
                    rowCells.push(
                        <View key={`empty-${realmId}`} style={[isMini ? styles.miniCell : styles.cell, styles.emptyCell]}>
                            <Text style={isMini ? styles.miniLotusIcon : styles.lotusIcon}>☸️</Text>
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

    const renderMiniCell = (r: Realm) => {
        const travelers = travelersMap[r.id] || [];
        const isMyCurrent = currentState && currentState.realm_id === r.id;
        const hasTreasure = treasureRealms.has(r.id);

        let cellBg = '#f1f5f9'; // cõi thường
        let borderStyle: any = { borderColor: '#cbd5e1', borderWidth: 0.5 };
        
        if (r.id >= 1 && r.id <= 13) {
            cellBg = '#fee2e2'; // cõi khổ
            borderStyle = { borderColor: '#fca5a5', borderWidth: 0.5 };
        } else if (r.id >= 70 && r.id <= 104) {
            cellBg = '#fef3c7'; // cõi cao
            borderStyle = { borderColor: '#fde68a', borderWidth: 0.5 };
        }

        if (isMyCurrent) {
            cellBg = '#fef08a'; // vị trí của mình
            borderStyle = { borderColor: GOLD, borderWidth: 1.5 };
        }

        return (
            <TouchableOpacity 
                key={r.id} 
                style={[
                    styles.miniCell, 
                    { backgroundColor: cellBg },
                    borderStyle,
                    isMyCurrent && styles.miniMyCurrentCell
                ]}
                onPress={() => setSelectedRealm(r)}
                activeOpacity={0.7}
            >
                {/* Tiny content inside mini cell */}
                {isMyCurrent ? (
                    <Animated.View style={{ transform: [{ scale: pulseAnim }], width: 12, height: 12, borderRadius: 6, backgroundColor: MAROON, borderWidth: 1, borderColor: '#fff' }} />
                ) : travelers.length > 0 ? (
                    // Render a tiny blue dot representing travelers
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
                ) : hasTreasure ? (
                    <Gift size={10} color={GOLD} />
                ) : (
                    <Text style={{ fontSize: 8, color: '#64748b', fontWeight: 'bold' }}>{r.id}</Text>
                )}
            </TouchableOpacity>
        );
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
            <TouchableOpacity 
                key={r.id} 
                style={[
                    styles.cell, 
                    cellTypeStyle,
                    hasTreasure && styles.treasureCell,
                    isMyCurrent && styles.myCurrentCell
                ]}
                onPress={() => setSelectedRealm(r)}
                activeOpacity={0.8}
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
                <View style={{ flex: 1 }}>
                    <ScrollView 
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.subtitle}>
                            Toàn cảnh 104 cõi giới luân hồi. Nhấp vào bất kỳ ô nào để xem chi tiết cảnh giới và danh sách các đồng tu đang thực hành tại đó!
                        </Text>

                        {/* Responsive Segmented Toggle Button */}
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity 
                                style={[styles.toggleBtn, viewMode === 'detail' && styles.activeToggleBtn]}
                                onPress={() => setViewMode('detail')}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Eye size={14} color={viewMode === 'detail' ? MAROON : '#64748b'} />
                                    <Text style={[styles.toggleText, viewMode === 'detail' && styles.activeToggleText]}>
                                        Cận Cảnh (Cuộn)
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.toggleBtn, viewMode === 'mini' && styles.activeToggleBtn]}
                                onPress={() => setViewMode('mini')}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Square size={12} color={viewMode === 'mini' ? MAROON : '#64748b'} />
                                    <Text style={[styles.toggleText, viewMode === 'mini' && styles.activeToggleText]}>
                                        Toàn Cảnh (Gọn)
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {viewMode === 'detail' ? (
                            /* Horizontal scroll support for detailed cells */
                            <ScrollView 
                                horizontal
                                showsHorizontalScrollIndicator={true}
                                contentContainerStyle={styles.horizontalScrollContent}
                            >
                                <View style={styles.boardContainer}>
                                    {renderBoard()}
                                </View>
                            </ScrollView>
                        ) : (
                            /* Directly fits on phone screen in mini mode! */
                            <View style={[styles.boardContainer, { padding: 4, borderWidth: 3, borderRadius: 12 }]}>
                                {renderBoard()}
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Gorgeous Realm Details Modal Popup */}
            <Modal
                visible={selectedRealm !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedRealm(null)}
            >
                {selectedRealm && (
                    <TouchableOpacity 
                        style={styles.modalOverlay} 
                        activeOpacity={1} 
                        onPress={() => setSelectedRealm(null)}
                    >
                        <TouchableOpacity 
                            style={styles.modalContent} 
                            activeOpacity={1}
                        >
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    Cảnh giới #{selectedRealm.id}: {selectedRealm.name}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => setSelectedRealm(null)}
                                    style={styles.modalCloseBtn}
                                >
                                    <X size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            {/* Realm Type Badge */}
                            <Text style={[
                                styles.modalSectionTitle, 
                                { 
                                    color: selectedRealm.id <= 13 ? '#ef4444' : (selectedRealm.id >= 70 ? GOLD : MAROON),
                                    marginBottom: 10
                                }
                            ]}>
                                {selectedRealm.id <= 13 ? '🔴 Cõi Khổ (Địa ngục / Ngạ quỷ / Súc sinh)' : (selectedRealm.id >= 70 ? '🟡 Cõi Cao (Trời / Tịnh độ / Bồ tát)' : '🟢 Cõi Thường (Người / A-tu-la)')}
                            </Text>

                            {/* Realm Description */}
                            <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={true}>
                                <Text style={styles.modalDesc}>
                                    {selectedRealm.short_desc || 'Không có mô tả ngắn gọn.'}
                                </Text>
                            </ScrollView>

                            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 }} />

                            {/* Travelers Title */}
                            <Text style={styles.modalSectionTitle}>
                                Đồng tu đang ở cõi này ({travelersMap[selectedRealm.id]?.length || 0})
                            </Text>

                            {/* Travelers list */}
                            <ScrollView 
                                style={styles.modalTravelersList}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled
                            >
                                {!travelersMap[selectedRealm.id] || travelersMap[selectedRealm.id].length === 0 ? (
                                    <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginVertical: 8 }}>
                                        Chưa có đồng tu nào ở cõi này.
                                    </Text>
                                ) : (
                                    travelersMap[selectedRealm.id].map((player) => (
                                        <View key={player.id} style={styles.modalTravelerRow}>
                                            {player.avatar ? (
                                                <Image source={{ uri: player.avatar }} style={styles.modalAvatar} />
                                            ) : (
                                                <View style={styles.modalAvatarPlaceholder}>
                                                    <User size={12} color="#94a3b8" />
                                                </View>
                                            )}
                                            <Text style={styles.modalPlayerName}>{player.name}</Text>
                                            {player.id === currentState?.user_id && (
                                                <View style={styles.modalSelfBadge}>
                                                    <Text style={styles.modalSelfText}>Bạn</Text>
                                                </View>
                                            )}
                                        </View>
                                    ))
                                )}
                            </ScrollView>

                            {/* Action Button */}
                            <TouchableOpacity 
                                style={[
                                    styles.backBtn, 
                                    { 
                                        width: '100%', 
                                        height: 44, 
                                        backgroundColor: selectedRealm.id <= 13 ? '#ef4444' : MAROON, 
                                        borderRadius: 12, 
                                        marginTop: 8 
                                    }
                                ]}
                                onPress={() => setSelectedRealm(null)}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Đóng chi tiết</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
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
    // Mini map view styles
    miniCell: {
        width: 28,
        height: 28,
        margin: 1.5,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    miniMyCurrentCell: {
        borderColor: GOLD,
        borderWidth: 1.5,
        shadowColor: GOLD,
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 3,
    },
    miniLotusIcon: {
        fontSize: 12,
    },
    // View mode segmented toggle styles
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        alignSelf: 'center',
    },
    toggleBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    activeToggleBtn: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    activeToggleText: {
        color: MAROON,
        fontWeight: 'bold',
    },
    // Realm details modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: MAROON,
        flex: 1,
        lineHeight: 22,
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalDesc: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 16,
    },
    modalSectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    modalTravelersList: {
        maxHeight: 120,
        marginBottom: 16,
    },
    modalTravelerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
    },
    modalAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    modalAvatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    modalPlayerName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    modalSelfBadge: {
        backgroundColor: '#fef08a',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    modalSelfText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: MAROON,
    },
});
