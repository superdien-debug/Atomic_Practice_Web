import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Calendar as CalendarIcon, Scissors, Info, Sparkles, Navigation, Moon, Map, Activity } from 'lucide-react-native';
import { tibetanCalendarService, CalendarDayInfo } from '../../services/tibetanCalendarService';
import { VajraModal } from '../../components/VajraModal';

const { width } = Dimensions.get('window');

const C = {
    green: '#1a9a44',
    darkGreen: '#0f682c',
    gold: '#D4AF37',
    goldDark: '#996515',
    red: '#800000',
    blue: '#0056b3',
    bg: '#f0f4f8',
    card: '#ffffff',
    text: '#333333',
    textMute: '#666666'
};

export default function TibetanCalendarScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dayInfo, setDayInfo] = useState<CalendarDayInfo | null>(null);
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
    const [infoVisible, setInfoVisible] = useState(false);

    // Monthly State
    const [monthData, setMonthData] = useState<CalendarDayInfo[]>([]);

    useEffect(() => {
        setDayInfo(tibetanCalendarService.getCalendarData(currentDate));
        if (viewMode === 'monthly') {
            setMonthData(tibetanCalendarService.getMonthlyData(currentDate.getFullYear(), currentDate.getMonth() + 1));
        }
    }, [currentDate, viewMode]);

    const changeDay = (days: number) => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + days);
        setCurrentDate(next);
    };

    const changeMonth = (months: number) => {
        const next = new Date(currentDate);
        next.setMonth(next.getMonth() + months);
        next.setDate(1); // prevent overflow
        setCurrentDate(next);
    };

    if (!dayInfo) return null;

    const renderDailyView = () => (
        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
            {/* Top Green Banner resembling reference */}
            <View style={s.topBanner}>
                <View style={s.bannerRow}>
                    {/* Placeholder for Auspicious Symbol */}
                    <View style={s.symbolBox}>
                        <View style={s.symbolPlaceholder}>
                            <Image
                                source={dayInfo.holyDayImage || dayInfo.auspiciousSymbolImage || require('../../calendar_images/Mandala.jpg')}
                                style={{ width: '100%', height: '100%', borderRadius: 8 }}
                                resizeMode="cover"
                            />
                        </View>
                    </View>

                    <View style={s.solarDateBox}>
                        <Text style={s.dayOfWeek}>{dayInfo.dayOfWeek}</Text>
                        <Text style={s.bigDate}>{dayInfo.solarDay}</Text>
                        <Text style={s.monthYear}>Tháng {dayInfo.solarMonth}, {dayInfo.solarYear}</Text>
                    </View>
                </View>

                <View style={s.auspiciousBar}>
                    <Text style={s.auspiciousBarText}>
                        {dayInfo.holyDayMarker ? `Ngày Vía: ${dayInfo.holyDayMarker}` : dayInfo.auspiciousSymbol}
                    </Text>
                </View>
            </View>

            {/* Info Cards */}
            <View style={s.mainGrid}>
                {/* Lịch Âm */}
                <View style={s.halfCard}>
                    <View style={s.cardHeader}>
                        <Moon size={18} color={C.blue} />
                        <Text style={[s.cardTitle, { color: C.blue }]}>ÂM LỊCH</Text>
                    </View>
                    <Text style={s.lunarTop}>{dayInfo.lunarDay}/{dayInfo.lunarMonth}/{dayInfo.solarYear} ngày {dayInfo.lunarDayName}</Text>
                    <Text style={s.lunarSub}>Tháng: {dayInfo.lunarMonthName}</Text>
                    <Text style={s.lunarSub}>Là ngày: {dayInfo.zodiacDay}</Text>
                </View>

                {/* Lịch Tạng */}
                <View style={s.halfCard}>
                    <View style={s.cardHeader}>
                        <Sparkles size={18} color={C.red} />
                        <Text style={[s.cardTitle, { color: C.red }]}>LỊCH TẠNG</Text>
                    </View>
                    <Text style={s.lunarTop}>Ngày {dayInfo.lunarDay} Tạng lịch</Text>
                    {dayInfo.holyDayMarker ? (
                        <Text style={[s.lunarSub, { color: C.gold, fontWeight: 'bold' }]}>{dayInfo.holyDayMarker}</Text>
                    ) : (
                        <Text style={s.lunarSub}>Ngày thường</Text>
                    )}
                </View>
            </View>

            {/* Elements Combination */}
            {dayInfo.elementCombo && (
                <View style={[s.cardActive, { marginHorizontal: 16, marginTop: 16 }]}>
                    <View style={s.cardHeader}>
                        <Activity size={18} color={C.goldDark} />
                        <Text style={[s.cardTitle, { color: C.goldDark }]}>TỔ HỢP ĐẠI ("{dayInfo.elementCombo}")</Text>
                    </View>
                    <Text style={s.elDesc}>{dayInfo.elementComboDesc}</Text>
                </View>
            )}

            {/* Quote Box */}
            <View style={s.quoteBox}>
                <Text style={s.quoteText}>{dayInfo.quote}</Text>
            </View>

            {/* Details Section */}
            <View style={s.detailsSection}>
                <View style={s.detailRow}>
                    <Scissors size={20} color={C.textMute} />
                    <View style={s.detailContent}>
                        <Text style={s.detailLabel}>Cắt tóc / Cạo râu (Ngày {dayInfo.lunarDay})</Text>
                        <Text style={[s.detailValue, { color: dayInfo.haircut.isGood ? C.green : C.red }]}>
                            {dayInfo.haircut.description}
                        </Text>
                    </View>
                </View>

                <View style={s.separator} />

                <View style={s.detailRow}>
                    <Map size={20} color={C.textMute} />
                    <View style={s.detailContent}>
                        <Text style={s.detailLabel}>Hướng xuất hành</Text>
                        <Text style={s.detailValue}>{dayInfo.travelDirection}</Text>
                    </View>
                </View>

                <View style={s.separator} />

                <View style={s.detailRow}>
                    <CalendarIcon size={20} color={C.textMute} />
                    <View style={s.detailContent}>
                        <Text style={s.detailLabel}>Giờ tốt (Hoàng đạo)</Text>
                        <Text style={s.detailValue}>{dayInfo.goodHours.join(', ')}</Text>
                    </View>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderMonthlyView = () => {
        // Simple 7-column grid for the month
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
        const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Make Monday index 0

        const blanks = Array(adjustedFirstDay).fill(null);

        return (
            <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
                <View style={s.monthController}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={s.navBtn}>
                        <ArrowLeft size={20} color="#FFF" />
                    </TouchableOpacity>

                    <View style={{ alignItems: 'center' }}>
                        <Text style={s.monthTitle}>THÁNG {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setCurrentDate(new Date());
                                setViewMode('daily');
                            }}
                            style={{
                                marginTop: 4,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 12
                            }}
                        >
                            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>Hôm nay</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => changeMonth(1)} style={[s.navBtn, { transform: [{ rotate: '180deg' }] }]}>
                        <ArrowLeft size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={s.calendarGrid}>
                    {/* Header */}
                    <View style={s.weekRow}>
                        {['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'].map((d, i) => (
                            <View key={d} style={[s.dayHeader, i >= 5 && { backgroundColor: i === 5 ? C.blue : C.red }]}>
                                <Text style={s.dayHeaderText}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Grid */}
                    <View style={s.daysWrap}>
                        {blanks.map((_, i) => <View key={'blank_' + i} style={s.dayCellEmpty} />)}
                        {monthData.map((d, i) => {
                            const isToday = d.date.toDateString() === new Date().toDateString();
                            const isSelected = d.date.toDateString() === currentDate.toDateString();
                            const isVajraHoly = [10, 25, 29].includes(d.lunarDay); // Guru Rinpoche, Dakini, Hộ Pháp in Red
                            const isNormalHoly = !!d.holyDayMarker && !isVajraHoly; // Other holy days in Blue

                            return (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => {
                                        setCurrentDate(d.date);
                                        setViewMode('daily');
                                    }}
                                    style={[
                                        s.dayCell,
                                        isSelected && s.dayCellSelected,
                                        isToday && s.dayCellToday
                                    ]}
                                >
                                    <Text style={[s.solarNum, isSelected && s.solarNumSelected]}>{d.solarDay}</Text>
                                    <View style={[
                                        s.lunarBadge,
                                        isVajraHoly && { backgroundColor: C.red },
                                        isNormalHoly && { backgroundColor: C.blue }
                                    ]}>
                                        <Text style={s.lunarNum}>{d.lunarDay}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={s.legendBox}>
                    <View style={s.legendItem}>
                        <View style={[s.legendDot, { backgroundColor: C.red }]} />
                        <Text style={s.legendText}>Ngày vía Guru, Dakini, Hộ Pháp</Text>
                    </View>
                    <View style={s.legendItem}>
                        <View style={[s.legendDot, { backgroundColor: C.blue }]} />
                        <Text style={s.legendText}>Ngày vía chung</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        );
    };

    return (
        <View style={s.root}>
            <StatusBar style="light" />

            {/* Custom Header */}
            <View style={[s.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Lịch Vũ Trụ</Text>

                <View style={s.headerRight}>
                    <TouchableOpacity onPress={() => setInfoVisible(true)} style={s.infoBtn}>
                        <Info size={20} color="#FFF" />
                    </TouchableOpacity>
                    {/* AI Astrologer Button */}
                    <TouchableOpacity onPress={() => router.push('/calendar/astrologer')} style={s.aiBtn}>
                        <Sparkles size={18} color={C.gold} />
                        <Text style={s.aiBtnText}>Hỏi AI</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Nav (Daily View) */}
            {viewMode === 'daily' && (
                <View style={s.dateNav}>
                    <TouchableOpacity onPress={() => changeDay(-1)} style={s.navBtn}>
                        <ArrowLeft size={20} color="#FFF" />
                    </TouchableOpacity>
                    <View style={s.navCenterGroup}>
                        <TouchableOpacity onPress={() => setCurrentDate(new Date())} style={[s.navCenterBtn, { marginRight: 8, backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={s.navCenterText}>Hôm nay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setViewMode('monthly')} style={s.navCenterBtn}>
                            <Text style={s.navCenterText}>Xem lịch tháng</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => changeDay(1)} style={[s.navBtn, { transform: [{ rotate: '180deg' }] }]}>
                        <ArrowLeft size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}

            {viewMode === 'daily' ? renderDailyView() : renderMonthlyView()}

            {/* Info Modal */}
            <VajraModal
                visible={infoVisible}
                onDismiss={() => setInfoVisible(false)}
                title="Lịch Thời Luân Kim Cương"
            >
                <ScrollView showsVerticalScrollIndicator={false} style={s.infoScroll}>
                    <Text style={s.infoText}>
                        Lịch Thời luân Kim Cương ra đời từ khi đức Phật truyền bá Thời Luân Kim Cương theo Phật lịch là 2565 năm. Lịch Vũ trụ giới thiệu về kho tàng Vũ trụ học phong phú đầy lôi cuốn của Phật giáo Kim Cương Thừa, đồng thời cũng chỉ ra mối quan hệ mật thiết giữa đời sống con người và cơ chế vận hành của vũ trụ, chỉ ra mối quan hệ duyên khởi của vạn pháp.{'\n\n'}
                        Để hiểu được quan điểm tinh tế của Vũ trụ học Phật giáo Kim Cương Thừa, chúng ta cần từ bỏ quan niệm mê tín thông thường là con người chịu sự định đoạt của các vì sao vô cảm. Sự thật phong phú hơn nhiều; tác động qua lại giữa con người và vũ trụ bên ngoài tinh tế và sâu sắc hơn nhiều.{'\n\n'}
                        Chúng ta cần tìm hiểu bản thể vũ trụ, nhìn vào tấm gương kỳ diệu đang phản chiếu đầy đủ và không sai lệch tất cả mọi thứ. Chúng ta chính là vũ trụ này, trong đó mọi thứ chuyển động, mở rộng và được chuyển hóa thành một thứ khác, một vũ trụ “khiêu vũ” theo nhịp điệu của các yếu tố căn bản, một vũ điệu thể hiện của không gian/thời gian vô tận.{'\n\n'}
                        Không hề có vũ trụ bên ngoài xa lạ, mà đó là một mối quan hệ tương tác liên tục, một kết nối hoàn hảo giữa con người và vũ trụ. Năm đại (Địa, Thủy, Hỏa, Phong, Không) đều là những dạng thức của cả thực tại vật chất cũng như thực tại ở cấp độ vi tế. Các đại này xác định tính chất năng lượng của cả vũ trụ vật chất bên ngoài và vũ trụ bên trong chúng ta: thực ra thì tất cả những biểu hiện hữu hình và các dòng chảy tâm thức đều không là gì khác ngoài màu sắc, âm thanh, ánh sáng.{'\n\n'}
                        Lịch Vũ trụ sử dụng cả kiến thức về hệ thống vũ trụ bao gồm các hành tinh và các chòm sao và hệ thống vũ trụ gắn với các đại; hai hệ thống này bổ trợ cho nhau. Không nên hiểu theo cách tuyệt đối về các chòm sao tốt, xấu, và trung tính, về ngày tốt và ngày xấu. Sự kết hợp các dòng chảy năng lượng quyết định tính chất năng lượng hàng ngày trên trái đất, vì thế đời sống của chúng ta cũng đi theo các hướng khác nhau tùy theo tính chất của môi trường xung quanh.{'\n\n'}
                        Về cơ bản thì việc đó không tốt hay xấu, đó chỉ là sự khác biệt; sự kết hợp các dòng chảy năng lượng hàng ngày có tần số rung động hợp với các yếu tố, phẩm chất hay những hành động nhất định, trong khi lại không hợp với những yếu tố, phẩm chất hay hành động khác. Lịch Vũ trụ giúp chúng ta tìm được sự hòa hợp giữa vũ trụ bên trong con người và vũ trụ vật chất bên ngoài.{'\n\n'}
                        Sử dụng tri thức và sự đúc kết của cả hàng ngàn năm văn hóa, Lịch Vũ trụ là một công cụ cho phép chúng ta khám phá cách sống phù hợp với nguồn năng lượng vũ trụ và phù hợp với vũ trụ mà chúng ta là một hình ảnh sinh động và là một phần rõ nét và mật thiết hơn so với những gì chúng ta nghĩ.{'\n\n'}
                        Lịch Vũ trụ chia sẻ chính xác về kiến thức Mật thừa, đồng thời cũng cho thấy chúng ta cần thay đổi những quan niệm sai lệch trong đời sống thường nhật. Tham khảo Lịch Vũ trụ mang lại cho bạn đời sống bình an, cát tường, cũng là phúc đức bạn đã tạo từ các thiện nghiệp trong quá khứ, nhưng điều chính yếu vẫn là do từ thiên tâm của bạn luôn tràn đầy từ bi, trí tuệ và tình yêu thương.
                    </Text>
                </ScrollView>
            </VajraModal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        backgroundColor: C.red,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoBtn: { padding: 4 },
    aiBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(212,175,55,0.2)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        borderWidth: 1, borderColor: C.gold
    },
    aiBtnText: { color: C.gold, fontSize: 13, fontWeight: 'bold' },

    dateNav: {
        flexDirection: 'row', backgroundColor: '#0b5a22', // Slightly darker green
        alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10
    },
    navBtn: { padding: 8 },
    navCenterGroup: { flexDirection: 'row', alignItems: 'center' },
    navCenterBtn: { paddingVertical: 6, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    navCenterText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

    content: { flex: 1 },

    topBanner: {
        backgroundColor: C.green,
        paddingBottom: 0,
    },
    bannerRow: {
        flexDirection: 'row', padding: 20, gap: 20, alignItems: 'center'
    },
    symbolBox: {
        width: 140, height: 140, backgroundColor: '#FFF',
        borderRadius: 12, padding: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
    },
    symbolPlaceholder: {
        flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
    },
    solarDateBox: { flex: 1, alignItems: 'center' },
    dayOfWeek: { color: '#FFF', fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },
    bigDate: { color: '#FFF', fontSize: 64, fontWeight: '900', lineHeight: 70 },
    monthYear: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    auspiciousBar: {
        backgroundColor: C.darkGreen, paddingVertical: 8, alignItems: 'center'
    },
    auspiciousBarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

    mainGrid: { flexDirection: 'row', padding: 16, justifyContent: 'space-between' },
    halfCard: {
        width: '48%', backgroundColor: C.card, borderRadius: 12,
        padding: 16, alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: '900' },
    lunarTop: { fontSize: 14, fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: 4 },
    lunarSub: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 2 },

    quoteBox: {
        marginHorizontal: 16, marginBottom: 16,
        backgroundColor: '#fcefc7', // Pale yellow like provided image
        padding: 16, borderRadius: 12
    },
    quoteText: { color: '#5e4e20', fontSize: 13, lineHeight: 20, textAlign: 'center', fontStyle: 'italic', fontWeight: '600' },

    detailsSection: {
        marginHorizontal: 16, backgroundColor: C.card, borderRadius: 12, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
    },
    detailRow: { flexDirection: 'row', gap: 16, alignItems: 'center', paddingVertical: 8 },
    detailContent: { flex: 1 },
    detailLabel: { fontSize: 12, color: C.textMute, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
    detailValue: { fontSize: 14, color: C.text, fontWeight: '500', lineHeight: 20 },
    separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },

    // Monthly styles
    monthController: {
        backgroundColor: C.blue, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    monthTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    calendarGrid: {
        margin: 16, backgroundColor: C.card, borderRadius: 12, overflow: 'hidden',
        borderWidth: 1, borderColor: '#EEE'
    },
    weekRow: { flexDirection: 'row', backgroundColor: '#e28743' },
    dayHeader: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    dayHeaderText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    daysWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCellEmpty: { width: `${100 / 7}%`, height: 60, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#EEE' },
    dayCell: {
        width: `${100 / 7}%`, height: 60, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#EEE',
        alignItems: 'center', paddingTop: 8
    },
    dayCellSelected: { backgroundColor: '#e8f0fe', borderColor: C.blue, borderWidth: 2 },
    dayCellToday: { backgroundColor: '#fff9e6' },
    solarNum: { fontSize: 16, fontWeight: 'bold', color: C.text },
    solarNumSelected: { color: C.blue },
    lunarBadge: {
        marginTop: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#DDD',
        alignItems: 'center', justifyContent: 'center'
    },
    lunarNum: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },

    legendBox: { marginHorizontal: 16, flexDirection: 'row', justifyContent: 'center', gap: 20, padding: 16, backgroundColor: '#FFF', borderRadius: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: C.textMute, fontWeight: '600' },

    infoScroll: { maxHeight: width * 1.2 },
    infoText: { fontSize: 14, color: C.text, lineHeight: 22, textAlign: 'justify' },

    cardActive: {
        backgroundColor: '#FFF', borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    elDesc: {
        fontSize: 14, color: C.text, lineHeight: 22, marginTop: 6, fontStyle: 'italic'
    }
});
