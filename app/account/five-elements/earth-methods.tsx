import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Mountain, Apple, Eye, Activity, Lock, ChevronRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '../../../components/ScreenHeader';

const GOLD = '#D4AF37';
const MAROON = '#5e0b0b';

export default function EarthMethodsScreen() {
    const router = useRouter();

    const methods = [
        {
            id: 'nature',
            name: 'Thiên nhiên',
            desc: 'Kết nối vật lý với đất mẹ qua các giác quan.',
            icon: Mountain,
            color: '#16a34a',
            isLocked: false,
            route: '/account/five-elements/earth-nature'
        },
        {
            id: 'lifestyle',
            name: 'Lối sống',
            desc: 'Điều chỉnh ăn uống và thói quen sinh hoạt.',
            icon: Apple,
            color: '#ca8a04',
            isLocked: false,
            route: '/account/five-elements/earth-lifestyle'
        },
        {
            id: 'visualization',
            name: 'Quán tưởng',
            desc: 'Thực hành tâm linh hướng nội sâu sắc.',
            icon: Eye,
            color: '#2563eb',
            isLocked: true,
            route: null
        },
        {
            id: 'energy',
            name: 'Luyện Khí',
            desc: 'Tập luyện về Tinh, Khí và Mạch.',
            icon: Activity,
            color: '#dc2626',
            isLocked: true,
            route: null
        },
    ];

    const handlePress = (method: any) => {
        if (method.isLocked) {
            Alert.alert("Chưa mở khóa", `Phương pháp ${method.name} hiện tại đang được chuẩn bị.`);
            return;
        }
        if (method.route) {
            router.push(method.route as any);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <ScreenHeader title="Cân bằng Địa Đại" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <Text style={styles.headerTitle}>4 Phương Pháp Chữa Lành</Text>
                    <Text style={styles.headerSubtitle}>
                        Chọn một phương pháp để bắt đầu hành trình cân bằng năng lượng Đất của bạn.
                    </Text>
                </View>

                {methods.map((method) => {
                    const Icon = method.icon;
                    return (
                        <TouchableOpacity
                            key={method.id}
                            style={styles.card}
                            activeOpacity={0.8}
                            onPress={() => handlePress(method)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: method.color + '15' }]}>
                                <Icon size={24} color={method.isLocked ? '#94a3b8' : method.color} />
                            </View>

                            <View style={styles.cardInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={[styles.methodName, method.isLocked && styles.lockedText]}>
                                        {method.name}
                                    </Text>
                                    {method.isLocked && <Lock size={14} color="#94a3b8" style={{ marginLeft: 6 }} />}
                                </View>
                                <Text style={styles.methodDesc}>{method.desc}</Text>
                            </View>

                            <ChevronRight size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    );
                })}

                <View style={styles.footerNote}>
                    <Text style={styles.footerText}>
                        "Để thấu hiểu Đất, hãy trở thành Đất. Sự vững chãi của bạn là nền tảng cho mọi thành tựu tâm linh."
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 20,
    },
    headerSection: {
        marginBottom: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: MAROON,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    methodName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    methodDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    lockedText: {
        color: '#94a3b8',
    },
    footerNote: {
        marginTop: 10,
        padding: 20,
        backgroundColor: '#fefce8',
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#fde047',
    },
    footerText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#854d0e',
        textAlign: 'center',
        lineHeight: 20,
    }
});
