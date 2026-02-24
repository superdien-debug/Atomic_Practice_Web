import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tibetanCalendarService } from '../services/tibetanCalendarService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const HOLY_DAY_LAST_SHOWN_KEY = '@holy_day_last_shown';

export function HolyDayPopup() {
    const [visible, setVisible] = useState(false);
    const [holyDayName, setHolyDayName] = useState('');
    const [holyDayImg, setHolyDayImg] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        checkHolyDay();
    }, []);

    const checkHolyDay = async () => {
        try {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const lastShown = await AsyncStorage.getItem(HOLY_DAY_LAST_SHOWN_KEY);

            // Already showed today
            if (lastShown === dateStr) return;

            const dayInfo = tibetanCalendarService.getCalendarData(today);
            if (dayInfo.holyDayMarker) {
                setHolyDayName(dayInfo.holyDayMarker);
                setHolyDayImg(dayInfo.holyDayImage);
                setVisible(true);
                await AsyncStorage.setItem(HOLY_DAY_LAST_SHOWN_KEY, dateStr);
            }
        } catch (error) {
            console.error('Error checking holy day:', error);
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={s.overlay}>
                <View style={s.modalBox}>
                    <TouchableOpacity style={s.closeBtn} onPress={() => setVisible(false)}>
                        <X size={24} color="#FFF" />
                    </TouchableOpacity>

                    {/* Placeholder image for Lotus / Buddha */}
                    <View style={s.imageBox}>
                        <Image
                            source={holyDayImg || require('../calendar_images/Duc_Phat_Thich_Ca_Mau_Ni.jpg')}
                            style={s.image}
                            resizeMode="cover"
                        />
                        <View style={s.sparkles}>
                            <Sparkles size={24} color="#D4AF37" />
                        </View>
                    </View>

                    <Text style={s.title}>Ngày Cát Tường</Text>
                    <Text style={s.dateName}>{holyDayName}</Text>

                    <Text style={s.desc}>
                        Hôm nay là một ngày vô cùng đặc biệt trong Lịch Kim Cương Thừa. Mọi công đức thực hành, thọ trì chân ngôn, hay thiền định đều tăng trưởng gấp hàng trăm ngàn lần.
                    </Text>

                    <TouchableOpacity
                        style={s.btn}
                        onPress={() => {
                            setVisible(false);
                            router.push('/dashboard' as any); // Or directly to practice
                        }}
                    >
                        <Text style={s.btnText}>Thực Hành Ngay</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalBox: {
        backgroundColor: '#800000', // Maroon
        borderRadius: 32,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1, borderColor: '#D4AF37'
    },
    closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
    imageBox: {
        width: 120, height: 120, borderRadius: 60, overflow: 'hidden',
        borderWidth: 3, borderColor: '#D4AF37', marginBottom: 20
    },
    image: { width: '100%', height: '100%' },
    sparkles: { position: 'absolute', bottom: 10, right: 10 },
    title: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    dateName: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 16 },
    desc: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    btn: { backgroundColor: '#D4AF37', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 },
    btnText: { color: '#800000', fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }
});
