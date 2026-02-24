import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Navigation, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { rebirthService, RebirthHistory } from '../../services/rebirthService';

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
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch Sử Luân Hồi</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#D4AF37" />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.center}>
                    <Text style={{ color: '#888' }}>Chưa có lịch sử di chuyển cảnh giới.</Text>
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
        backgroundColor: '#111',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    backBtn: {
        padding: 8
    },
    headerTitle: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
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
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center'
    },
    diceBadge: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#D4AF37',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    diceText: {
        color: '#451a03',
        fontSize: 20,
        fontWeight: '900'
    },
    content: {
        flex: 1
    },
    journeyText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 6
    },
    realmName: {
        color: '#fff',
        fontWeight: 'bold'
    },
    realmNameGreen: {
        color: '#10b981',
        fontWeight: 'bold'
    },
    timeText: {
        color: '#666',
        fontSize: 12
    }
});
