import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, Alert,
    Image, Modal, StyleSheet, Pressable, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
    Settings, LogOut, ChevronRight, Bell, Shield, Globe,
    Check, Camera, Award, Flame, Zap, Trophy, BookOpen, Moon, Sparkles, Newspaper, Calculator, Calendar
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { userService, Profile } from '../../services/userService';
import { practiceService } from '../../services/practiceService';
import { getRank } from '../../utils/rankUtils';
import { useT } from '../../i18n/useT';
import type { Lang } from '../../i18n/translations';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const GOLD = '#D4AF37';
const MAROON = '#5e0b0b';

export default function AccountScreen() {
    const router = useRouter();
    const { user, signOut, role } = useAuthStore();
    const { lang, setLang } = useLanguageStore();
    const t = useT();
    const insets = useSafeAreaInsets();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [dharmaName, setDharmaName] = useState('');
    const [stats, setStats] = useState({ totalPractices: 0, streak: 0 });
    const [scoreBreakdown, setScoreBreakdown] = useState({ base: 0, milestones: 0, streaks: 0, challenges: 0, total: 0 });
    const [mpoints, setMpoints] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [langModal, setLangModal] = useState(false);
    const [scoreModal, setScoreModal] = useState(false);
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [sundayAttendanceCount, setSundayAttendanceCount] = useState(0);

    React.useEffect(() => { if (user) loadProfile(); }, [user]);

    const loadProfile = async () => {
        try {
            const [userProfile, userStats, breakdown, streak, mpointsBalance] = await Promise.all([
                userService.getProfile(),
                userService.getUserStats(),
                practiceService.calculateScoreBreakdown(),
                practiceService.calculateStreak(),
                userService.getMPointsBalance()
            ]);
            setProfile(userProfile);
            setMpoints(mpointsBalance);
            setDisplayName(userProfile.display_name || '');
            setDharmaName(userProfile.dharma_name || '');
            setStats({ ...userStats, streak });
            setScoreBreakdown(breakdown);

            // Check Sunday check-in status
            if (user) {
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const { data: attendanceToday } = await supabase
                    .from('practice_center_attendance')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('attended_date', todayStr)
                    .maybeSingle();

                const { count: attendanceCount } = await supabase
                    .from('practice_center_attendance')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                setHasCheckedInToday(!!attendanceToday);
                setSundayAttendanceCount(attendanceCount || 0);
            }
        } catch (error) {
            console.error('Account load error:', error);
            Alert.alert(t('error'), t('failedLoadProfile'));
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        const doSignOut = async () => {
            await signOut();
            router.replace('/auth/login');
        };

        if (Platform.OS === 'web') {
            if (window.confirm(t('signOutConfirm'))) {
                doSignOut();
            }
        } else {
            Alert.alert(t('signOut'), t('signOutConfirm'), [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('signOut'), style: 'destructive',
                    onPress: doSignOut
                },
            ]);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.5,
        });
        if (!result.canceled) {
            try {
                setLoading(true);
                const url = await userService.uploadAvatar(result.assets[0].uri);
                setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
            } catch { Alert.alert(t('error'), t('failedUploadAvatar')); }
            finally { setLoading(false); }
        }
    };

    const saveProfile = async () => {
        try {
            await userService.updateProfile({ display_name: displayName, dharma_name: dharmaName });
            setIsEditing(false);
            loadProfile();
        } catch { Alert.alert(t('error'), t('failedUpdateProfile')); }
    };

    const handleSelfCheckIn = async () => {
        if (!user) return;
        
        const today = new Date();
        const isSunday = today.getDay() === 0;
        
        if (!isSunday) {
            Alert.alert("Chưa đến ngày", "Tính năng tự điểm danh tại trung tâm chỉ hoạt động vào ngày Chủ Nhật hàng tuần.");
            return;
        }

        setCheckInLoading(true);
        try {
            const dateStr = format(today, 'yyyy-MM-dd');
            const { error } = await supabase
                .from('practice_center_attendance')
                .insert({
                    user_id: user.id,
                    attended_date: dateStr
                });

            if (error) throw error;

            Alert.alert("🎉 Điểm Danh Thành Công", "Bạn đã tự điểm danh thành công hôm nay tại trung tâm. Chúc đạo hữu tinh tấn tu tập và nhận thêm +100 điểm công đức!");
            await loadProfile();
        } catch (error: any) {
            console.error('Self check-in error:', error);
            Alert.alert("Thao tác thất bại", error.message || "Không thể thực hiện tự điểm danh.");
        } finally {
            setCheckInLoading(false);
        }
    };

    const handleSetLang = (l: Lang) => {
        setLang(l);
        setLangModal(false);
    };

    return (
        <View className="flex-1 bg-vajra-cream">
            <StatusBar style="light" />

            <View
                className="px-5 pb-6 bg-vajra-burgundy border-b border-vajra-gold/20 flex-row justify-between items-center"
                style={{
                    paddingTop: Math.max(insets.top, 20) + 8,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 5
                }}
            >
                <View>
                    <Text className="text-white/60 text-[10px] uppercase tracking-[3px] font-bold mb-1">{t('profile')}</Text>
                    <Text className="text-white text-2xl font-black">{t('accountTitle')}</Text>
                </View>
                <TouchableOpacity onPress={() => isEditing ? saveProfile() : setIsEditing(true)}>
                    {isEditing ? (
                        <View className="bg-vajra-gold px-5 py-2.5 rounded-full">
                            <Text className="text-white font-black text-xs uppercase tracking-wider">{t('save')}</Text>
                        </View>
                    ) : (
                        <View className="w-10 h-10 rounded-full items-center justify-center bg-white/10">
                            <Settings size={22} color="#FFF" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="bg-vajra-burgundy mx-5 mt-6 p-8 rounded-[32px] border border-vajra-gold/20 items-center"
                    style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 }}
                >
                    {(() => {
                        const userRank = getRank(scoreBreakdown.total);
                        return (
                            <View className="relative mb-6">
                                <View
                                    className="w-28 h-28 rounded-full items-center justify-center overflow-hidden bg-black/20"
                                    style={[
                                        { borderWidth: userRank.borderWidth + 1, borderColor: userRank.color },
                                        userRank.isGlowing && { shadowColor: userRank.color, shadowOpacity: 0.8, shadowRadius: 15, elevation: 15 }
                                    ]}
                                >
                                    {profile?.avatar_url
                                        ? <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
                                        : <Text style={{ fontSize: 44 }}>🧘</Text>
                                    }
                                </View>
                                {isEditing && (
                                    <TouchableOpacity
                                        onPress={pickImage}
                                        className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center bg-vajra-gold border-2 border-vajra-burgundy"
                                    >
                                        <Camera size={16} color="#FFF" strokeWidth={3} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })()}

                    {isEditing ? (
                        <View className="w-full space-y-4">
                            <View>
                                <Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2 ml-1">{t('displayName')}</Text>
                                <TextInput
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    className="bg-white/5 rounded-2xl p-4 font-bold text-center text-white border border-white/10"
                                />
                            </View>
                            <View>
                                <Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2 ml-1">{t('dharmaName')}</Text>
                                <TextInput
                                    value={dharmaName}
                                    onChangeText={setDharmaName}
                                    placeholderTextColor="rgba(212,175,55,0.3)"
                                    className="bg-white/5 rounded-2xl p-4 font-bold text-center text-vajra-gold border border-vajra-gold/10"
                                />
                            </View>
                        </View>
                    ) : (
                        <View className="items-center">
                            <Text className="text-2xl font-black text-white mb-2">{displayName || t('practitionerFallback')}</Text>
                            <View className="flex-row items-center gap-3">
                                {dharmaName ? (
                                    <View className="bg-vajra-gold/10 px-4 py-1.5 rounded-full border border-vajra-gold/30">
                                        <Text className="text-vajra-gold font-bold text-sm tracking-wide">{dharmaName}</Text>
                                    </View>
                                ) : null}
                                <View
                                    className="px-4 py-1.5 rounded-full border"
                                    style={{
                                        backgroundColor: getRank(scoreBreakdown.total).color + '20',
                                        borderColor: getRank(scoreBreakdown.total).color + '40'
                                    }}
                                >
                                    <Text
                                        className="font-black text-xs uppercase tracking-widest"
                                        style={{ color: getRank(scoreBreakdown.total).color }}
                                    >
                                        {getRank(scoreBreakdown.total).title}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => router.push(`/practitioner/${user?.id}` as any)}
                                className="mt-6 bg-white/10 px-6 py-2.5 rounded-full border border-white/20 flex-row items-center gap-2 active:bg-white/20"
                            >
                                <Globe size={14} color="#FFF" />
                                <Text className="text-white text-[10px] font-black uppercase tracking-widest">{t('viewPublicProfile')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View className="px-5 mt-4 flex-row gap-4">
                    <View className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 items-center">
                        <Text className="text-3xl font-black text-vajra-burgundy">{stats.streak}</Text>
                        <Text className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1">{t('dayStreak')}</Text>
                    </View>
                    <View className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 items-center">
                        <Text className="text-3xl font-black text-vajra-burgundy">{stats.totalPractices}</Text>
                        <Text className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1">{t('totalPractices')}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => setScoreModal(true)}
                    activeOpacity={0.9}
                    className="mx-5 mt-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                >
                    <View className="flex-row justify-between items-end mb-4">
                        <View>
                            <Text className="text-gray-400 text-[10px] uppercase tracking-widest font-black mb-1">{t('totalMerits') || 'Total Merits'}</Text>
                            <Text className="text-4xl font-black text-vajra-gold">{scoreBreakdown.total.toLocaleString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                            <View className="bg-vajra-cream px-3 py-1.5 rounded-xl border border-vajra-gold/20 flex-row items-center">
                                <Shield size={12} color={MAROON} />
                                <Text className="ml-1.5 text-[10px] font-black text-vajra-burgundy uppercase">{t('karmaPoints')}</Text>
                            </View>
                            <View className="bg-vajra-gold/10 px-3 py-1.5 rounded-xl border border-vajra-gold/30 flex-row items-center">
                                <Sparkles size={12} color={GOLD} />
                                <Text className="ml-1.5 text-[10px] font-black text-vajra-gold uppercase">{mpoints.toLocaleString()} {t('mpoint')}</Text>
                            </View>
                        </View>
                    </View>

                    <View className="h-2 bg-gray-50 rounded-full overflow-hidden flex-row">
                        <View style={{ flex: scoreBreakdown.base || 1, backgroundColor: '#800000' }} />
                        <View style={{ flex: scoreBreakdown.milestones || 0, backgroundColor: '#D4AF37' }} />
                        <View style={{ flex: scoreBreakdown.streaks || 0, backgroundColor: '#DB2777' }} />
                        <View style={{ flex: scoreBreakdown.challenges || 0, backgroundColor: '#0891B2' }} />
                    </View>
                    <View className="flex-row justify-between mt-3">
                        <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t('viewDetailedBreakdown')}</Text>
                        <ChevronRight size={14} color="#D1D5DB" />
                    </View>
                </TouchableOpacity>

                {/* Sunday Center Self-Attendance Card */}
                {(() => {
                    const today = new Date();
                    const isSunday = today.getDay() === 0;

                    if (isSunday) {
                        return (
                            <View className="mx-5 mt-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <View className="flex-row items-center gap-3 mb-3">
                                    <View className="w-10 h-10 rounded-full items-center justify-center bg-vajra-burgundy/10">
                                        <Calendar size={20} color="#800000" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-black text-vajra-burgundy">Tự Điểm Danh Chủ Nhật</Text>
                                        <Text className="text-xs text-gray-400 font-bold mt-0.5">Thực hành tập trung tại Trung tâm</Text>
                                    </View>
                                    <View className="bg-vajra-gold/10 px-2.5 py-1 rounded-lg border border-vajra-gold/30">
                                        <Text className="text-[10px] font-black text-vajra-gold uppercase">{sundayAttendanceCount} buổi</Text>
                                    </View>
                                </View>

                                <Text className="text-xs text-gray-600 mb-4 leading-5">
                                    {hasCheckedInToday
                                        ? "Bạn đã tự giác điểm danh thực hành tại trung tâm hôm nay. Cảm ơn sự hiện diện và công đức đồng tu!"
                                        : "Hôm nay là Chủ Nhật! Hãy tự giác điểm danh nếu bạn đang tham gia thực hành cùng đại chúng tại trung tâm để nhận +100 công đức lành."}
                                </Text>

                                {hasCheckedInToday ? (
                                    <View className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex-row items-center justify-center gap-2">
                                        <Check size={16} color="#059669" strokeWidth={3} />
                                        <Text className="text-emerald-700 font-bold text-xs uppercase tracking-wider">Đã Điểm Danh Hôm Nay</Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={handleSelfCheckIn}
                                        disabled={checkInLoading}
                                        className="bg-vajra-gold p-4 rounded-2xl items-center flex-row justify-center gap-2 active:bg-vajra-gold/90"
                                    >
                                        <Sparkles size={16} color="#FFF" />
                                        <Text className="text-white font-black uppercase tracking-widest text-xs">
                                            {checkInLoading ? "Đang xử lý..." : "Tự Điểm Danh (+100 Điểm)"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    } else {
                        // Weekdays Card (displays status and progress)
                        return (
                            <View className="mx-5 mt-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 opacity-80">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-100">
                                        <Calendar size={20} color="#717171" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-black text-gray-700">Điểm Danh Tại Trung Tâm</Text>
                                        <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Chỉ mở vào ngày Chủ Nhật</Text>
                                    </View>
                                    <View className="bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                                        <Text className="text-[10px] font-black text-gray-500 uppercase">Đã có {sundayAttendanceCount} buổi</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }
                })()}

                <View className="bg-white mx-5 rounded-[28px] shadow-sm overflow-hidden mb-8 border border-gray-50 mt-6">
                    <MenuItem
                        icon={<Trophy size={20} color={GOLD} />}
                        label={t('spiritualCollection')}
                        onPress={() => router.push('/account/collection' as any)}
                    />
                    <MenuItem
                        icon={<Flame size={20} color={GOLD} />}
                        label={t('fiveElementsPractice')}
                        onPress={() => {
                            router.push('/account/five-elements' as any);
                        }}
                    />
                    <MenuItem
                        icon={<Calculator size={20} color={GOLD} />}
                        label={t('tabCounter')}
                        onPress={() => router.push('/counter' as any)}
                    />

                    <MenuItem
                        icon={<Bell size={20} color="#717171" />}
                        label={t('notifications')}
                        onPress={() => router.push('/account/notifications' as any)}
                    />

                    <MenuItem
                        icon={<Newspaper size={20} color="#717171" />}
                        label={t('tabNews')}
                        onPress={() => router.push('/news' as any)}
                    />

                    <MenuItem
                        icon={<BookOpen size={20} color="#717171" />}
                        label={t('tabMicroLearning')}
                        onPress={() => router.push('/account/micro-learning' as any)}
                    />

                    <MenuItem
                        icon={<Moon size={20} color={GOLD} />}
                        label={t('vajrayanaCalendar')}
                        onPress={() => router.push('/calendar' as any)}
                    />

                    <TouchableOpacity
                        onPress={() => setLangModal(true)}
                        className="flex-row items-center px-5 py-4 border-b border-gray-50 active:bg-gray-50"
                    >
                        <View className="w-9">
                            <Globe size={20} color="#717171" />
                        </View>
                        <Text className="flex-1 font-semibold text-base text-gray-800">{t('language')}</Text>
                        <View className="bg-vajra-cream px-2 py-0.5 rounded-md mr-2 border border-vajra-gold/20">
                            <Text style={{ color: '#800000', fontSize: 10, fontWeight: '700' }}>{lang === 'en' ? 'EN' : 'VI'}</Text>
                        </View>
                        <ChevronRight size={18} color="#CCC" />
                    </TouchableOpacity>

                    <MenuItem icon={<Shield size={20} color="#717171" />} label={t('privacyData')} />

                    {role === 'admin' && (
                        <MenuItem
                            icon={<Settings size={20} color={GOLD} />}
                            label={t('adminSystem')}
                            onPress={() => router.push('/admin')}
                        />
                    )}

                    <MenuItem
                        icon={<LogOut size={20} color="#ff4444" />}
                        label={t('signOut')}
                        textColor="text-red-500"
                        onPress={handleSignOut}
                        showChevron={false}
                    />
                </View>

                <Text className="text-center text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-10">{t('appVersion')} v1.0.4</Text>
            </ScrollView>

            <Modal visible={scoreModal} transparent animationType="fade">
                <Pressable className="flex-1 bg-black/80 justify-center p-6" onPress={() => setScoreModal(false)}>
                    <View className="bg-white rounded-[40px] p-8 border border-vajra-gold/20 overflow-hidden">
                        <View className="items-center mb-8">
                            <View className="w-16 h-1 bg-gray-100 rounded-full mb-6" />
                            <Shield size={32} color={GOLD} />
                            <Text className="text-2xl font-black text-vajra-burgundy mt-4">{t('karmaBreakdown')}</Text>
                            <Text className="text-gray-400 text-[10px] uppercase tracking-[3px] font-bold mt-1">{t('detailedMerits')}</Text>
                        </View>

                        <View className="space-y-5">
                            <ScoreRow label={t('dailyPracticesLabel')} pts={scoreBreakdown.base} color="#800000" desc={t('ptsPerCompletion')} />
                            <ScoreRow label={t('milestoneBonusesLabel')} pts={scoreBreakdown.milestones} color="#D4AF37" desc={t('rewardsForVolume')} />
                            <ScoreRow label={t('practiceStreaksLabel')} pts={scoreBreakdown.streaks} color="#DB2777" desc={t('loyaltyToPath')} />
                            <ScoreRow label={t('challengeConquestsLabel')} pts={scoreBreakdown.challenges} color="#0891B2" desc={t('communalSpiritualFeats')} />
                        </View>

                        <View className="mt-10 pt-6 border-t border-gray-100 flex-row justify-between items-center">
                            <Text className="text-lg font-black text-gray-800 uppercase tracking-widest">{t('totalMerits') || 'Total Merits'}</Text>
                            <Text className="text-3xl font-black text-vajra-gold">{scoreBreakdown.total.toLocaleString()}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setScoreModal(false)}
                            className="bg-vajra-burgundy mt-8 p-4 rounded-2xl items-center"
                        >
                            <Text className="text-white font-black uppercase tracking-widest text-xs">{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <Modal visible={langModal} transparent animationType="slide">
                <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setLangModal(false)}>
                    <View className="bg-white rounded-t-[32px] p-8 pb-12">
                        <Text className="text-xl font-bold text-gray-800 mb-6 text-center">{t('selectLanguage')}</Text>

                        <TouchableOpacity
                            onPress={() => handleSetLang('en')}
                            className={`flex-row items-center p-5 rounded-2xl mb-3 border-2 ${lang === 'en' ? 'bg-vajra-cream border-vajra-gold' : 'bg-gray-50 border-transparent'}`}
                        >
                            <Text className="text-2xl mr-4">🇬🇧</Text>
                            <Text className={`flex-1 font-bold text-lg ${lang === 'en' ? 'text-vajra-burgundy' : 'text-gray-600'}`}>{t('english')}</Text>
                            {lang === 'en' && <Check size={20} color="#800000" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleSetLang('vi')}
                            className={`flex-row items-center p-5 rounded-2xl mb-8 border-2 ${lang === 'vi' ? 'bg-vajra-cream border-vajra-gold' : 'bg-gray-50 border-transparent'}`}
                        >
                            <Text className="text-2xl mr-4">🇻🇳</Text>
                            <Text className={`flex-1 font-bold text-lg ${lang === 'vi' ? 'text-vajra-burgundy' : 'text-gray-600'}`}>{t('vietnamese')}</Text>
                            {lang === 'vi' && <Check size={20} color="#800000" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setLangModal(false)}
                            className="bg-gray-100 p-4 rounded-xl items-center"
                        >
                            <Text className="text-gray-500 font-bold">{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

function ScoreRow({ label, pts, color, desc }: { label: string, pts: number, color: string, desc: string }) {
    return (
        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 12 }} />
                <View>
                    <Text className="font-bold text-gray-800 text-sm">{label}</Text>
                    <Text className="text-[10px] text-gray-400">{desc}</Text>
                </View>
            </View>
            <Text className="font-black text-gray-900">+{pts.toLocaleString()}</Text>
        </View>
    );
}

function MenuItem({ icon, label, onPress, textColor = 'text-gray-800', showChevron = true }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center px-5 py-4 border-b border-gray-50 active:bg-gray-50"
        >
            <View className="w-9">{icon}</View>
            <Text className={`flex-1 font-semibold text-base ${textColor}`}>{label}</Text>
            {showChevron && <ChevronRight size={18} color="#CCC" />}
        </TouchableOpacity>
    );
}
