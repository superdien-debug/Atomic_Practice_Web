import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { rebirthService, RebirthHistory } from '../../services/rebirthService';

// ─── Colors (Consistent with Theme) ─────────────────────────────────────────
const GOLD = '#D4AF37';
const CARD = '#FFF';
const BG = '#FEF9EF';
const MAROON = '#800000';

export default function RebirthHistoryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [history, setHistory] = useState<RebirthHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await rebirthService.getHistory();
            setHistory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: RebirthHistory }) => {
        return (
            <View style={styles.historyCard}>
                <View style={styles.diceBadge}>
                    <Text style={styles.diceText}>{item.dice_result}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.journeyText}>
                        <Text style={styles.realmName}>{item.from_realm?.name}</Text>
                        {" ➔ "}
                        <Text style={styles.realmNameGreen}>{item.to_realm?.name}</Text>
                    </Text>
                    <Text style={styles.timeText}>
                        Lưu trú: {item.days_spent} ngày • Vào lúc {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={GOLD} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch Sử Luân Hồi</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={GOLD} />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.center}>
                    <Text style={{ color: '#999', fontStyle: 'italic' }}>Chưa có lịch sử di chuyển cảnh giới.</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={i => i.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
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
        paddingHorizontal: 16,
        paddingBottom: 25,
        backgroundColor: MAROON
    },
    backBtn: {
        padding: 8
    },
    headerTitle: {
        color: GOLD,
        fontSize: 18,
        fontWeight: '800',
        flex: 1,
        textAlign: 'center'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    list: {
        padding: 20
    },
    historyCard: {
        flexDirection: 'row',
        backgroundColor: CARD,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: MAROON + '05'
    },
    diceBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: GOLD,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    diceText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900'
    },
    content: {
        flex: 1
    },
    journeyText: {
        color: '#333',
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 4
    },
    realmName: {
        color: MAROON,
        fontWeight: '700'
    },
    realmNameGreen: {
        color: '#059669',
        fontWeight: '700'
    },
    timeText: {
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic'
    }
});
