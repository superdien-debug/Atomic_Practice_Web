import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Apple, Utensils, Heart, Activity, Info, AlertTriangle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '../../../components/ScreenHeader';

export default function EarthLifestyleScreen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <ScreenHeader title="Lối sống & Ăn uống" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <View style={styles.iconContainer}>
                        <Apple size={40} color="#ca8a04" />
                    </View>
                    <Text style={styles.title}>Cân bằng qua Lối sống</Text>
                    <Text style={styles.introText}>
                        Ứng dụng thực tế trong việc điều chỉnh ăn uống và thói quen để lập lại sự cân bằng năng lượng nguyên tố.
                    </Text>
                </View>

                {/* 1. Principle */}
                <Section title="1. Nguyên lý cơ bản: Loại bỏ & Nuôi dưỡng" icon={<Info size={20} color="#ca8a04" />}>
                    <Text style={styles.contentParagraph}>
                        Quá trình chữa lành các yếu tố thông qua lối sống dựa trên một nguyên tắc đơn giản: một cái gì đó được <Text style={styles.bold}>nuôi dưỡng</Text> và một cái gì đó phải bị <Text style={styles.bold}>loại bỏ</Text>.
                    </Text>
                    <Text style={styles.contentParagraph}>
                        Nếu một yếu tố đang dư thừa gây hại, ta ngừng các thói quen nuôi dưỡng nó; nếu một yếu tố đang thiếu hụt, ta bổ sung nó thông qua thực phẩm và hành động.
                    </Text>
                </Section>

                {/* 2. Diet */}
                <Section title="2. Điều chỉnh Chế độ Ăn uống" icon={<Utensils size={20} color="#ca8a04" />}>
                    <View style={styles.subCard}>
                        <Text style={styles.subTitle}>Khi thiếu Đất (Bất an, Lo lắng)</Text>
                        <Text style={styles.contentParagraph}>
                            Bạn cần nền tảng và sự ổn định. Hãy ăn những thực phẩm <Text style={styles.bold}>nặng hơn</Text> và tuyệt đối <Text style={styles.bold}>tránh các chất kích thích</Text> (như caffeine) vì chúng sẽ làm tăng thêm yếu tố Không khí và Lửa khiến tâm trí thêm kích động.
                        </Text>
                    </View>
                    <View style={[styles.subCard, { marginTop: 12 }]}>
                        <Text style={styles.subTitle}>Khi dư thừa Đất (Lười biếng, Nặng nề)</Text>
                        <Text style={styles.contentParagraph}>
                            Bạn đang bị sự trì trệ thống trị. Lúc này, giải pháp là ăn thức ăn <Text style={styles.bold}>nhẹ nhàng hơn</Text> và cố gắng tránh để bản thân rơi vào trạng thái kiệt sức.
                        </Text>
                    </View>
                </Section>

                {/* 3. Habits */}
                <Section title="3. Điều chỉnh Thói quen Sinh hoạt" icon={<Activity size={20} color="#ca8a04" />}>
                    <View style={styles.bulletBox}>
                        <HabitItem
                            title="Thay đổi vận động"
                            text="Nếu thiếu sức sống, hãy từ bỏ các thói quen ít vận động. Tập thể dục thường xuyên giúp kích thích năng lượng Lửa bẩm sinh và làm dịu sự lo lắng."
                        />
                        <HabitItem
                            title="Chăm sóc cơ thể"
                            text="Khi căng thẳng và lo âu (Không khí quá mạnh), các thói quen như tắm nước nóng, đi mát-xa, hoặc nuôi dưỡng tình yêu thương sẽ giúp xoa dịu tâm trí."
                        />
                        <HabitItem
                            title="Tiếp nhận thông tin"
                            text="Hãy từ bỏ thói quen xem phim tiêu cực hoặc tham gia vào truyện phiếm. Thay vào đó, hãy rèn luyện thói quen suy nghĩ tích cực và đồng cảm."
                        />
                        <HabitItem
                            title="Môi trường & Quan hệ"
                            text="Dành thời gian với những người bạn thực tế, gần gũi. Duy trì một ngôi nhà an toàn và các mối quan hệ lành mạnh tạo ra cảm giác vững vàng."
                        />
                    </View>
                </Section>

                {/* Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryText}>
                        <Text style={styles.bold}>Tổng kết:</Text> Việc cân bằng các nguyên tố thông qua chế độ ăn uống và lối sống là nền tảng giúp làm thông suốt các kênh năng lượng, hỗ trợ người thực hành dễ dàng an trú trong trạng thái tự nhiên và đạt được sự sâu sắc trong thiền định.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

function Section({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                {icon}
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.sectionBody}>
                {children}
            </View>
        </View>
    );
}

function HabitItem({ title, text }: { title: string, text: string }) {
    return (
        <View style={styles.habitItem}>
            <View style={styles.habitDot} />
            <View style={{ flex: 1 }}>
                <Text style={styles.habitTitle}>{title}</Text>
                <Text style={styles.habitText}>{text}</Text>
            </View>
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
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fefce8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#5e0b0b',
        marginBottom: 8,
    },
    introText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingLeft: 4,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 10,
    },
    sectionBody: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    contentParagraph: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
        marginBottom: 8,
    },
    subCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        borderLeftWidth: 3,
        borderLeftColor: '#ca8a04',
    },
    subTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ca8a04',
        marginBottom: 6,
    },
    bold: {
        fontWeight: 'bold',
        color: '#1e293b',
    },
    bulletBox: {
        gap: 16,
    },
    habitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    habitDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ca8a04',
        marginTop: 8,
        marginRight: 12,
    },
    habitTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 2,
    },
    habitText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#64748b',
    },
    summaryCard: {
        backgroundColor: '#fefce8',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#fde047',
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#854d0e',
        fontStyle: 'italic',
    }
});
