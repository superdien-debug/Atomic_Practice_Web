import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Mountain, MapPin, Link, Heart, Merge, AlertCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '../../../components/ScreenHeader';

export default function EarthPracticeScreen() {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <ScreenHeader title="Kết nối Thiên nhiên" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.headerCard}>
                    <View style={styles.iconContainer}>
                        <Mountain size={48} color="#eab308" />
                    </View>
                    <Text style={styles.title}>Cân bằng Địa Đại</Text>
                    <Text style={styles.introText}>
                        Tìm sự ổn định, cảm nhận sự vững chắc từ mặt đất. Kết nối với sự cân bằng và nhận thức rằng năng lượng của đất luôn hiện diện trong cơ thể và ý thức của bạn. Thực hành này đặc biệt hiệu quả khi bạn cảm thấy mất cân bằng, yếu đuối hoặc phân tán.
                    </Text>
                </View>

                {/* Steps Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Các Bước Thực Hành</Text>

                    <View style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                            <Text style={styles.stepTitle}>Địa điểm</Text>
                        </View>
                        <Text style={styles.stepContent}>
                            Đi đến một nơi có thiên nhiên, nơi có cảm nhận mạnh mẽ về phẩm chất của đất và ngồi xuống đất (muốn phát triển sự nhạy cảm này, hãy đi xung quanh và cố gắng tìm nơi có năng lượng đất mạnh nhất - Đào một cái hố, tốt nhất là có hình vuông).
                        </Text>
                    </View>

                    <View style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                            <Text style={styles.stepTitle}>Kết nối</Text>
                        </View>
                        <Text style={styles.stepContent}>
                            Bạn có thể nằm sấp và kết nối với đất và năng lượng của đất thông qua luân xa rốn của bạn.
                        </Text>
                    </View>

                    <View style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                            <Text style={styles.stepTitle}>Cảm nhận</Text>
                        </View>
                        <Text style={styles.stepContent}>
                            Sự ổn định và nội tâm hóa nó. Mang nó vào qua làn da của bạn. Cảm nhận nó trong da thịt, xương cốt, kênh trung tâm, trái tim, ý thức của bạn.
                        </Text>
                    </View>

                    <View style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                            <Text style={styles.stepTitle}>Hòa nhập</Text>
                        </View>
                        <Text style={styles.stepContent}>
                            Làm cho nó ngày càng tinh tế hơn, cho đến khi nó thấm nhuần trải nghiệm của bạn, cho đến khi bạn hòa nhập với nó.
                        </Text>
                    </View>
                </View>

                {/* Notes Section */}
                <View style={styles.notesCard}>
                    <View style={styles.notesHeader}>
                        <AlertCircle size={20} color="#eab308" />
                        <Text style={styles.notesTitle}>Chú ý</Text>
                    </View>
                    <View style={styles.bulletList}>
                        <BulletPoint text="Bạn có thể thực hành khi ngồi trên ghế." />
                        <BulletPoint text="Cảm nhận sự ổn định của nó, sự vô tận của hành tinh, lực hấp dẫn giữ bạn lại với nó." />
                        <BulletPoint text="Hãy để bản thân bị ảnh hưởng bởi nó. Hãy để trí tưởng tượng của bạn được tự do." />
                        <BulletPoint text="Sự ổn định này luôn hiện hữu và sẵn có và có thể được sử dụng bất cứ khi nào cần." />
                        <BulletPoint text="Nếu bạn mất cân bằng trong các mối quan hệ hoặc tại nơi làm việc hoặc trong các quá trình nội tâm của mình, hãy quyết định ngay lập tức cảm thấy vững chắc, tập trung, vững vàng và cân bằng bằng cách kết nối với mặt đất." />
                        <BulletPoint text="Ghé thăm những nơi mà bạn tự nhiên cảm thấy vững chắc và cảm nhận phẩm chất đó." />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function BulletPoint({ text }: { text: string }) {
    return (
        <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{text}</Text>
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
        paddingBottom: 40,
    },
    headerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fefce8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#fef08a',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#5e0b0b',
        marginBottom: 12,
    },
    introText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        marginLeft: 4,
    },
    stepCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#eab308',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fefce8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#fde047',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ca8a04',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
    },
    stepContent: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
    },
    notesCard: {
        backgroundColor: '#fefce8',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#fef08a',
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    notesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ca8a04',
        marginLeft: 8,
    },
    bulletList: {
        gap: 12,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#eab308',
        marginTop: 8,
        marginRight: 10,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
    }
});
