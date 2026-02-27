import React from 'react';
import {
    Modal, View, Text, TouchableOpacity,
    StyleSheet, Pressable, Image, Dimensions
} from 'react-native';
import { Sparkles, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const GOLD = '#D4AF37';
const MAROON = '#800000';
const CREAM = '#FEF9EF';

export interface EventAnnouncementModalProps {
    visible: boolean;
    onDismiss: () => void;
}

export function EventAnnouncementModal({ visible, onDismiss }: EventAnnouncementModalProps) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            <View style={s.overlay}>

                {/* Close area backdrop */}
                <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

                <View style={s.card}>
                    {/* Event Banner */}
                    <View style={s.imageContainer}>
                        <Image
                            source={require('../assets/rebirth_event.png')}
                            style={s.bannerImage}
                            resizeMode="cover"
                        />
                        <View style={s.imageOverlay} />
                        <View style={s.badgeContainer}>
                            <View style={s.badge}>
                                <Sparkles size={12} color="#FFF" />
                                <Text style={s.badgeText}>SEASON 1 SPECIAL</Text>
                            </View>
                        </View>
                    </View>

                    {/* Content */}
                    <View style={s.content}>
                        <Text style={s.title}>ĐẠI HỘI TÁI SINH</Text>
                        <Text style={s.subtitle}>SĂN BÁU VẬT TRƯỜNG THỌ</Text>

                        <View style={s.divider} />

                        <Text style={s.message}>
                            Đón chờ sự kiện với hàng trăm món quà từ trung tâm liên quan tới vật phẩm trường thọ:
                            {"\n\n"}
                            • Bình tài bảo, cờ trường thọ
                            {"\n"}
                            • Tocma trường thọ, thuốc trường thọ
                            {"\n"}
                            • Linh phù trường thọ
                            {"\n\n"}
                            Cho những hành giả nào khám phá ra những cảnh giới cao, thành tựu đầu tiên của Season 1 sẽ nhận được món quà từ trung tâm.
                        </Text>

                        <Text style={s.footerText}>
                            Hãy theo dõi và đón chờ! 🌹 🙏 🌈
                        </Text>

                        <TouchableOpacity
                            style={s.actionBtn}
                            onPress={onDismiss}
                            activeOpacity={0.85}
                        >
                            <Text style={s.actionBtnText}>XEM CHI TIẾT SỚM</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={s.closeBtn} onPress={onDismiss}>
                        <X size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    imageContainer: {
        width: '100%',
        height: 180,
        backgroundColor: MAROON,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    badgeContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(128, 0, 0, 0.8)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.4)',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        color: MAROON,
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 1,
    },
    subtitle: {
        color: GOLD,
        fontSize: 14,
        fontWeight: '800',
        marginTop: 4,
        letterSpacing: 2,
    },
    divider: {
        width: 40,
        height: 3,
        backgroundColor: GOLD,
        marginVertical: 16,
        borderRadius: 2,
    },
    message: {
        color: '#475569',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    footerText: {
        color: MAROON,
        fontSize: 15,
        fontWeight: '700',
        marginTop: 12,
        textAlign: 'center',
    },
    actionBtn: {
        backgroundColor: MAROON,
        marginTop: 24,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: MAROON,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    actionBtnText: {
        color: GOLD,
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 2,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
