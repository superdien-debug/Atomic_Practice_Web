import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Lock, Wind, Flame, Droplets, Mountain, Circle, RefreshCw } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '../../../components/ScreenHeader';

const GOLD_ACCENT = '#c5a059';
const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;
const ITEM_SIZE = 80;

const COLORS = {
    bg: '#ffffff',
    space: '#f8fafc', // Không - Center
    water: '#3b82f6', // Thủy - Bottom (formerly East)
    fire: '#ef4444',  // Hỏa - Top (formerly West)
    earth: '#eab308', // Đất - Left (formerly South)
    wind: '#22c55e',  // Phong - Right (formerly North)
    locked: 'rgba(0,0,0,0.5)',
};

const ELEMENTS = [
    { id: 'space', name: 'Không Đại', color: COLORS.space, icon: Circle, top: CIRCLE_SIZE / 2, left: CIRCLE_SIZE / 2, isLocked: true },
    { id: 'fire', name: 'Hỏa Đại', color: COLORS.fire, icon: Flame, top: ITEM_SIZE / 2, left: CIRCLE_SIZE / 2, isLocked: true },
    { id: 'wind', name: 'Phong Đại', color: COLORS.wind, icon: Wind, top: CIRCLE_SIZE / 2, left: CIRCLE_SIZE - ITEM_SIZE / 2, isLocked: true },
    { id: 'water', name: 'Thủy Đại', color: COLORS.water, icon: Droplets, top: CIRCLE_SIZE - ITEM_SIZE / 2, left: CIRCLE_SIZE / 2, isLocked: true },
    { id: 'earth', name: 'Địa Đại', color: COLORS.earth, icon: Mountain, top: CIRCLE_SIZE / 2, left: ITEM_SIZE / 2, isLocked: false },
];

export default function FiveElementsScreen() {
    const router = useRouter();

    const handlePress = (element: any) => {
        if (element.isLocked) {
            Alert.alert("Chưa mở khóa", `Phần thực hành cân bằng ${element.name} hiện tại đang được chuẩn bị.`);
            return;
        }

        if (element.id === 'earth') {
            router.push('/account/five-elements/earth-methods' as any);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <ScreenHeader title="Mandala Ngũ Đại" />

            <View style={styles.mandalaContainer}>
                <View style={styles.mandalaCircle}>
                    {/* Connection lines */}
                    <View style={styles.innerCircle} />

                    {ELEMENTS.map((el) => {
                        const Icon = el.icon;
                        return (
                            <View
                                key={el.id}
                                style={[
                                    styles.itemWrapper,
                                    {
                                        top: el.top - ITEM_SIZE / 2,
                                        left: el.left - ITEM_SIZE / 2,
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => handlePress(el)}
                                    style={[
                                        styles.elementItem,
                                        { backgroundColor: el.color }
                                    ]}
                                >
                                    <Icon size={32} color={el.id === 'space' ? '#1e293b' : '#fff'} />
                                    {el.isLocked && (
                                        <View style={styles.lockOverlay}>
                                            <Lock size={16} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.elementName}>{el.name}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.instructionContainer}>
                <Text style={styles.instructionTitle}>Thực hành Cân bằng Ngũ Đại</Text>
                <Text style={styles.instructionText}>
                    Chọn một Đại để bắt đầu thực hành. Sự hài hòa và thanh lọc của 5 yếu tố cốt lõi mang lại sự ổn định cho tâm trí và năng lượng của người hành giả.
                </Text>

                <TouchableOpacity
                    style={styles.surveyBtn}
                    onPress={() => router.push('/auth/survey' as any)}
                >
                    <RefreshCw size={16} color={GOLD_ACCENT} />
                    <Text style={styles.surveyBtnText}>LÀM LẠI KHẢO SÁT CÂN BẰNG</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fefce8',
    },
    // ... existing styles
    surveyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(94, 11, 11, 0.2)',
        gap: 8,
    },
    surveyBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#5e0b0b',
        letterSpacing: 1,
    },
    mandalaContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mandalaCircle: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        borderWidth: 2,
        borderColor: 'rgba(94, 11, 11, 0.1)',
        position: 'relative',
    },
    innerCircle: {
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '50%',
        height: '50%',
        borderRadius: CIRCLE_SIZE / 4,
        borderWidth: 1,
        borderColor: 'rgba(94, 11, 11, 0.1)',
        borderStyle: 'dashed',
    },
    itemWrapper: {
        position: 'absolute',
        width: ITEM_SIZE,
        height: ITEM_SIZE + 24, // extra space for text
        alignItems: 'center',
    },
    elementItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: ITEM_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 3,
        borderColor: '#fff',
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.locked,
        borderRadius: ITEM_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    elementName: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#5e0b0b',
        textTransform: 'uppercase',
    },
    instructionContainer: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: 'rgba(94, 11, 11, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        elevation: 10,
    },
    instructionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#5e0b0b',
        marginBottom: 8,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
        textAlign: 'center',
    },
});
