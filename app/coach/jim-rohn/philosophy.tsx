import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Quote, ChevronRight, File, Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';

const BG = '#FDFBF7';
const JR_BRAND = '#6B21A8';

export default function PhilosophyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleOpenPdf = async () => {
        try {
            // Load the asset
            const assetInfo = await Asset.loadAsync(require('../../../assets/The_First_Hour_Blueprint.pdf'));
            const uri = assetInfo[0].localUri || assetInfo[0].uri;

            if (uri) {
                if (Platform.OS === 'web') {
                    window.open(uri, '_blank');
                    return;
                }

                // @ts-ignore
                const pdfPath = `${FileSystem.documentDirectory}The_First_Hour_Blueprint.pdf`;

                if (uri.startsWith('http')) {
                    await FileSystem.downloadAsync(uri, pdfPath);
                } else {
                    await FileSystem.copyAsync({
                        from: uri,
                        to: pdfPath
                    });
                }

                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                    await Sharing.shareAsync(pdfPath, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Tài liệu 30 phút buổi sáng'
                    });
                } else {
                    alert("Thiết bị của bạn không hỗ trợ mở hoặc chia sẻ file này ngay lúc này.");
                }
            } else {
                if (Platform.OS === 'web') window.alert("Không thể tải file PDF.");
                else alert("Không thể tải file PDF.");
            }
        } catch (e) {
            console.error("Error opening PDF:", e);
            if (Platform.OS === 'web') window.alert("Đã có lỗi xảy ra khi tải tài liệu PDF. " + (e as Error).message);
            else alert("Đã có lỗi xảy ra khi tải tài liệu PDF. " + (e as Error).message);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
                    <ArrowLeft size={24} color={JR_BRAND} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Tại sao cần 30 phút?</Text>
                    <Text style={styles.headerSub}>Nền tảng của sự kỷ luật</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

                <View style={styles.pdfCard}>
                    <View style={styles.pdfIconWrap}>
                        <File size={32} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pdfTitle}>Tài liệu: Bức tranh 30 phút</Text>
                        <Text style={styles.pdfSize}>PDF • The First Hour Blueprint</Text>
                    </View>
                    <TouchableOpacity style={styles.downloadBtn} onPress={handleOpenPdf}>
                        <Download size={18} color={JR_BRAND} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>4 Nguyên Lý Cốt Lõi</Text>

                <View style={styles.principleCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <View style={styles.numberBadge}><Text style={styles.numberText}>1</Text></View>
                        <Text style={styles.cardTitle}>Làm chủ hay Bị làm chủ?</Text>
                    </View>
                    <Text style={styles.cardText}>
                        "Nếu bạn không làm chủ buổi sáng của mình, buổi sáng sẽ làm chủ bạn." Điện thoại, tin nhắn, email—thế giới sẽ lấy đi sự tập trung của bạn ngay khắc bạn tỉnh dậy nếu bạn không chặn nó lại bằng 30 phút kỷ luật.
                    </Text>
                </View>

                <View style={styles.principleCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <View style={styles.numberBadge}><Text style={styles.numberText}>2</Text></View>
                        <Text style={styles.cardTitle}>Quy tắc Cây Bút (Pen Rule)</Text>
                    </View>
                    <Text style={styles.cardText}>
                        Sự lộn xộn trong tâm trí chỉ có thể được dọn dẹp trên mặt giấy. Đừng bắt đầu ngày mới cho đến khi bạn đã viết nó ra. Bạn đang xây một ngôi nhà, bạn không thể xây mà không có bản vẽ.
                    </Text>
                </View>

                <View style={styles.principleCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <View style={styles.numberBadge}><Text style={styles.numberText}>3</Text></View>
                        <Text style={styles.cardTitle}>Năng lượng & Cơ thể</Text>
                    </View>
                    <Text style={styles.cardText}>
                        Sự bận rộn không tạo ra sự tiến bộ, năng lượng mới tạo ra sự tiến bộ. Cơ thể là mảnh đất, tâm trí là hạt giống. Nếu mảnh đất ốm yếu, hạt giống có tốt đến đâu cũng không thể nảy mầm.
                    </Text>
                </View>

                <View style={styles.principleCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <View style={styles.numberBadge}><Text style={styles.numberText}>4</Text></View>
                        <Text style={styles.cardTitle}>Tầm nhìn & Tương lai</Text>
                    </View>
                    <Text style={styles.cardText}>
                        Một ngày không có sự biết ơn và hình dung về tương lai giống như một con tàu không có la bàn. Bạn sẽ đi rất nhanh, nhưng không biết mình đang đi đâu. Hãy sống như con người bạn muốn trở thành, ngay từ bây giờ.
                    </Text>
                </View>

                <View style={styles.quoteCard}>
                    <Quote size={24} color="#CBD5E1" style={{ marginBottom: 8 }} />
                    <Text style={styles.quoteText}>
                        Kỷ luật là cầu nối giữa mục tiêu và thành tựu. Hãy bắt đầu xây cây cầu của bạn vào sáng mai.
                    </Text>
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={() => router.push('/coach/jim-rohn/morning-routine')}>
                    <Text style={styles.nextBtnText}>Chuyển sang Thiết Kế Buổi Sáng</Text>
                    <ChevronRight size={20} color="#FFF" />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: JR_BRAND },
    headerSub: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 1 },

    pdfCard: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: '#FFF', padding: 16, borderRadius: 20,
        borderWidth: 1.5, borderColor: '#F1F5F9',
        marginBottom: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
    },
    pdfIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
    pdfTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    pdfSize: { fontSize: 12, color: '#64748B' },
    downloadBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: JR_BRAND, marginBottom: 16 },

    principleCard: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16,
        borderLeftWidth: 4, borderLeftColor: JR_BRAND,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
    },
    numberBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    numberText: { fontSize: 13, fontWeight: '800', color: JR_BRAND },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    cardText: { fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 4 },

    quoteCard: {
        backgroundColor: '#F8FAFC', padding: 24, borderRadius: 16, marginTop: 16, marginBottom: 32,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    quoteText: { fontSize: 15, fontStyle: 'italic', color: '#334155', lineHeight: 24 },

    nextBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: JR_BRAND, paddingVertical: 18, borderRadius: 16,
    },
    nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
