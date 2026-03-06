import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { JimRohnRituals } from '../../../components/JimRohnRituals';

const BG = '#FDFBF7';
const JR_BRAND = '#6B21A8';

export default function JimRohnRitualsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 15 }}>
                    <ArrowLeft size={24} color={JR_BRAND} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.headerTitle}>Nghi thức Jim Rohn</Text>
                    <Text style={s.headerSub}>Kế hoạch & Tự soi chiếu</Text>
                </View>
            </View>
            <JimRohnRituals />
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
        backgroundColor: '#FFF'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: JR_BRAND, fontFamily: 'Montserrat-Bold' },
    headerSub: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 1, fontFamily: 'Montserrat-SemiBold' },
});
