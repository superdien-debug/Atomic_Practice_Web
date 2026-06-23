import { View, Text, StyleSheet, Dimensions, ImageBackground, Platform, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useT } from '../i18n/useT';
import { Audio } from 'expo-av';
import { Volume2, VolumeX } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ── Colors for Golden Welcome Screen ──
const MAROON_DARK = '#4a0404';
const MAROON = '#800000';
const GOLD = '#d4af37';
const GOLD_LIGHT = '#f9e2af';
const GOLD_DIM = '#aa8a2e';

// ── Colors for Void Welcome Screen ──
const OBSIDIAN = '#020202';
const DEEP_CYAN = '#082f44';
const NEON_CYAN = '#00f0ff';
const CYAN_GLOW = 'rgba(0, 240, 255, 0.4)';

const isMainServer = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.includes('0iBz6ylF75yOxwqqM9R0DNO7FJIPY_HlFiS2wxu9nL8') || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc5OTQwODM4LCJleHAiOjE5Mzc2MjA4Mzh9.0iBz6ylF75yOxwqqM9R0DNO7FJIPY_HlFiS2wxu9nL8';

// Hardcoded system expiration timestamp: 2026-06-23T13:28:31+07:00
const TARGET_TIME = new Date('2026-06-23T13:28:31+07:00').getTime();
const FORMATION_TARGET_TIME = TARGET_TIME + 2 * 24 * 60 * 60 * 1000;

const getRemainingTime = (target: number = TARGET_TIME) => {
    const diff = target - Date.now();
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
};

// ── Main Welcome Screen Component ──
export default function WelcomeScreen() {
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const isVoidActive = currentTime < TARGET_TIME;
    const isFormationActive = currentTime >= TARGET_TIME && currentTime < FORMATION_TARGET_TIME;

    if (isVoidActive) {
        return <VoidEonWelcome />;
    } else if (isFormationActive) {
        return <FormationEonWelcome />;
    } else {
        return <MaratikaPracticeWelcome />;
    }
}

// ── Original Golden/Maroon Maratika Practice Welcome Screen ──
function MaratikaPracticeWelcome() {
    const router = useRouter();
    const t = useT();

    return (
        <View style={s.goldRoot}>
            <StatusBar style="light" />

            {/* Corner flourishes */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />

            {/* Branding center */}
            <View style={s.brandingWrap}>
                {/* Decorative star icon */}
                <View style={s.starWrap}>
                    <StarIcon />
                </View>

                {/* Title */}
                <Text style={s.titleTop}>Maratika</Text>
                <Text style={s.titleBot}>Practice</Text>

                {/* Tagline */}
                <Text style={s.tagline}>{t('tagline')}</Text>
            </View>

            {/* Action area */}
            <View style={s.actionWrap}>
                <TouchableOpacity
                    style={s.goldEnterBtn}
                    activeOpacity={0.8}
                    onPress={() => router.replace('/auth/login')}
                >
                    <Text style={s.goldEnterBtnText}>{t('enterPractice')}</Text>
                </TouchableOpacity>

                <Text style={s.goldFooterText}>{t('establishedIn')}</Text>
            </View>
        </View>
    );
}

// ── Star SVG for Golden Theme ──
function StarIcon() {
    return (
        <View style={star.wrap}>
            <View style={[star.rect]} />
            <View style={[star.rect, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[star.rect, { transform: [{ rotate: '22.5deg' }] }]} />
            <View style={[star.rect, { transform: [{ rotate: '67.5deg' }] }]} />
            <View style={star.center} />
        </View>
    );
}

// ── Void Eon Countdown Welcome Screen ──
function VoidEonWelcome() {
    const [timeState, setTimeState] = useState(() => getRemainingTime());

    useEffect(() => {
        const timer = setInterval(() => {
            const rem = getRemainingTime();
            setTimeState(rem);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const pad = (num: number) => String(num).padStart(2, '0');

    return (
        <ImageBackground
            source={require('../assets/void_eon_bg.png')}
            style={s.voidRoot}
            resizeMode="cover"
        >
            <StatusBar style="light" />

            {/* Obsidian overlay for high-contrast text readability */}
            <View style={s.voidOverlay} />

            {/* Asymmetric content layout aligned to the left */}
            <View style={s.voidContentContainer}>
                
                {/* Header Section */}
                <View style={s.voidHeader}>
                    <Text style={s.voidHeaderEon}>THỜI KỲ KHÔNG KIẾP</Text>
                    <View style={s.voidTealLine} />
                    <Text style={s.voidHeaderStatus}>Đại kiếp bị hủy hoại bởi Thủy đại</Text>
                </View>

                {/* Scriptural description */}
                <View style={s.voidDescWrap}>
                    <Text style={s.voidDescText}>
                        Đại kiếp đã bị hủy hoại hoàn toàn bởi Thủy đại. Vũ trụ chìm vào Không kiếp, vạn vật chìm trong bóng tối của biển nước vô biên...
                    </Text>
                    <Text style={s.voidWarningText}>
                        Thời kỳ hoại không đang trải qua, đếm ngược giải trừ:
                    </Text>
                </View>

                {/* Digital Countdown Timer with sharp geometry */}
                <View style={s.countdownContainer}>
                    <View style={s.countdownBox}>
                        <Text style={s.countdownVal}>{pad(timeState.days)}</Text>
                        <Text style={s.countdownLabel}>ngày</Text>
                    </View>
                    <Text style={s.countdownColon}>:</Text>
                    <View style={s.countdownBox}>
                        <Text style={s.countdownVal}>{pad(timeState.hours)}</Text>
                        <Text style={s.countdownLabel}>giờ</Text>
                    </View>
                    <Text style={s.countdownColon}>:</Text>
                    <View style={s.countdownBox}>
                        <Text style={s.countdownVal}>{pad(timeState.minutes)}</Text>
                        <Text style={s.countdownLabel}>phút</Text>
                    </View>
                    <Text style={s.countdownColon}>:</Text>
                    <View style={s.countdownBox}>
                        <Text style={s.countdownVal}>{pad(timeState.seconds)}</Text>
                        <Text style={s.countdownLabel}>giây</Text>
                    </View>
                </View>
            </View>

            {/* Asymmetric layout: Footer message in bottom right corner */}
            <View style={s.voidActionWrap}>
                <Text style={s.voidFooterText}>Mọi thứ chìm trong bóng tối</Text>
            </View>
        </ImageBackground>
    );
}

// ── Celestial Glow Aurora Stream ──
function CelestialGlowStream({ color, size, duration, startX, startY }: { color: string; size: number; duration: number; startX: string; startY: string }) {
    const scale = useRef(new Animated.Value(0.9)).current;
    const opacity = useRef(new Animated.Value(0.15)).current;

    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale, { toValue: 1.25, duration, useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 0.9, duration, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity, { toValue: 0.4, duration, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.15, duration, useNativeDriver: true }),
                ])
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                s.celestialGlow,
                {
                    left: startX as any,
                    top: startY as any,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    opacity: opacity,
                    transform: [{ scale }],
                }
            ]}
        />
    );
}

// ── Formation Eon Countdown Welcome Screen ──
function FormationEonWelcome() {
    const [timeState, setTimeState] = useState(() => getRemainingTime(FORMATION_TARGET_TIME));
    const glowAnim = useRef(new Animated.Value(0.4)).current;
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlayingSound, setIsPlayingSound] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let soundObj: Audio.Sound | null = null;

        async function initAudio() {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
                });

                const { sound: newSound } = await Audio.Sound.createAsync(
                    require('../assets/omture.mp3'),
                    { shouldPlay: true, isLooping: true, volume: 0.8 }
                );
                
                soundObj = newSound;
                if (isMounted) {
                    setSound(newSound);
                } else {
                    newSound.unloadAsync();
                }
            } catch (err) {
                console.error("Failed to load audio:", err);
            }
        }
        
        initAudio();

        return () => {
            isMounted = false;
            if (soundObj) {
                soundObj.unloadAsync();
            }
        };
    }, []);

    const togglePlay = async () => {
        if (!sound) return;
        try {
            if (isPlayingSound) {
                await sound.pauseAsync();
                setIsPlayingSound(false);
            } else {
                await sound.playAsync();
                setIsPlayingSound(true);
            }
        } catch (err) {
            console.error("Error toggling play:", err);
        }
    };

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1.0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.4,
                    duration: 2500,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const rem = getRemainingTime(FORMATION_TARGET_TIME);
            setTimeState(rem);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const pad = (num: number) => String(num).padStart(2, '0');

    // 16 sparkling particles representing radiant Quang Am beings
    const particles = [
        { delay: 0, x: '10%', y: '80%', size: 6, color: '#fffdf0' },
        { delay: 1000, x: '25%', y: '85%', size: 10, color: '#fdeb93' },
        { delay: 2000, x: '40%', y: '75%', size: 8, color: '#fffdf0' },
        { delay: 500, x: '55%', y: '90%', size: 14, color: '#ffd2e8' },
        { delay: 1500, x: '70%', y: '80%', size: 8, color: '#99f6e4' },
        { delay: 2500, x: '85%', y: '70%', size: 12, color: '#fffdf0' },
        
        { delay: 3000, x: '18%', y: '60%', size: 10, color: '#ffd2e8' },
        { delay: 4000, x: '35%', y: '65%', size: 6, color: '#99f6e4' },
        { delay: 3500, x: '60%', y: '50%', size: 12, color: '#fdeb93' },
        { delay: 4500, x: '80%', y: '55%', size: 8, color: '#fffdf0' },
        
        { delay: 1200, x: '15%', y: '40%', size: 8, color: '#99f6e4' },
        { delay: 2200, x: '30%', y: '30%', size: 14, color: '#fffdf0' },
        { delay: 3200, x: '50%', y: '35%', size: 6, color: '#ffd2e8' },
        { delay: 4200, x: '75%', y: '25%', size: 10, color: '#fdeb93' },
        
        { delay: 800,  x: '5%',  y: '50%', size: 12, color: '#fffdf0' },
        { delay: 1800, x: '95%', y: '60%', size: 10, color: '#99f6e4' },
    ];

    return (
        <ImageBackground
            source={require('../assets/formation_eon_bg.png')}
            style={s.formationRoot}
            resizeMode="cover"
        >
            <StatusBar style="light" />

            {/* Audio Toggle Button */}
            <TouchableOpacity style={s.audioButton} onPress={togglePlay} activeOpacity={0.8}>
                {isPlayingSound ? <Volume2 size={18} color="#aa8a2e" /> : <VolumeX size={18} color="#aa8a2e" />}
                <Text style={s.audioButtonText}>
                    {isPlayingSound ? "TẮT NHẠC THIỀN" : "BẬT NHẠC THIỀN"}
                </Text>
            </TouchableOpacity>

            {/* Glowing background auroras */}
            <CelestialGlowStream color="rgba(253, 224, 71, 0.2)" size={350} duration={6000} startX="10%" startY="10%" />
            <CelestialGlowStream color="rgba(244, 63, 94, 0.15)" size={400} duration={8000} startX="50%" startY="40%" />
            <CelestialGlowStream color="rgba(45, 212, 191, 0.15)" size={300} duration={5000} startX="80%" startY="20%" />

            <View style={s.formationOverlay} />

            {particles.map((p, i) => (
                <LightParticle key={i} delay={p.delay} x={p.x} y={p.y} size={p.size} color={p.color} />
            ))}

            <View style={s.formationMainContainer}>
                <View style={s.formationLeftPanel}>
                    <View style={s.formationHeader}>
                        <View style={s.titleContainer}>
                            {/* Animated halo glow layer */}
                            <Animated.Text style={[s.formationHeaderEonGlow, { opacity: glowAnim.interpolate({ inputRange: [0.4, 1.0], outputRange: [0.2, 0.8] }) }]}>
                                THỜI KỲ THÀNH KIẾP
                            </Animated.Text>
                            {/* Static foreground layer */}
                            <Text style={s.formationHeaderEon}>
                                THỜI KỲ THÀNH KIẾP
                            </Text>
                        </View>
                        <View style={s.formationTealLine} />
                        <Animated.Text style={[s.formationHeaderStatus, { textShadowRadius: glowAnim.interpolate({ inputRange: [0.4, 1.0], outputRange: [2, 10] }) }]}>
                            ÁNH SÁNG ĐẦU TIÊN CỦA THẾ GIỚI MỚI
                        </Animated.Text>
                    </View>

                    <View style={s.formationDescWrap}>
                        <Text style={s.formationDescText}>
                            Đại hồng thủy đã rút lui. Một thế giới mới đang được hình thành.
                        </Text>
                        <Text style={s.formationDescText}>
                            Những hữu tình từ cõi Quang Âm tái sinh xuống đại địa mới. Họ tự phát hào quang, sống bằng hỷ lạc và phi hành trong hư không.
                        </Text>
                        <Text style={s.formationDescText}>
                            Mặt trời và mặt trăng vẫn chưa xuất hiện. Thời kỳ Thành Kiếp đang dần hoàn tất...
                        </Text>
                        <Text style={s.formationWarningText}>
                            Đếm ngược kết thúc Thành Kiếp, bước vào Trụ Kiếp:
                        </Text>
                    </View>

                    <View style={s.countdownContainer}>
                        <Animated.View style={[s.formationCountdownBox, { shadowOpacity: glowAnim.interpolate({ inputRange: [0.4, 1.0], outputRange: [0.1, 0.4] }) }]}>
                            <Text style={s.formationCountdownVal}>{pad(timeState.days)}</Text>
                            <Text style={s.formationCountdownLabel}>ngày</Text>
                        </Animated.View>
                        <Text style={s.formationCountdownColon}>:</Text>
                        <Animated.View style={[s.formationCountdownBox, { shadowOpacity: glowAnim.interpolate({ inputRange: [0.4, 1.0], outputRange: [0.1, 0.4] }) }]}>
                            <Text style={s.formationCountdownVal}>{pad(timeState.hours)}</Text>
                            <Text style={s.formationCountdownLabel}>giờ</Text>
                        </Animated.View>
                        <Text style={s.formationCountdownColon}>:</Text>
                        <Animated.View style={[s.formationCountdownBox, { shadowOpacity: glowAnim.interpolate({ inputRange: [0.4, 1.0], outputRange: [0.1, 0.4] }) }]}>
                            <Text style={s.formationCountdownVal}>{pad(timeState.minutes)}</Text>
                            <Text style={s.formationCountdownLabel}>phút</Text>
                        </Animated.View>
                        <Text style={s.formationCountdownColon}>:</Text>
                        <Animated.View style={[s.formationCountdownBox, { shadowOpacity: glowAnim.interpolate({ inputRange: [0.4, 1.0], outputRange: [0.1, 0.4] }) }]}>
                            <Text style={s.formationCountdownVal}>{pad(timeState.seconds)}</Text>
                            <Text style={s.formationCountdownLabel}>giây</Text>
                        </Animated.View>
                    </View>
                </View>

                <Animated.View style={[s.quoteCard, { shadowOpacity: glowAnim.interpolate({ inputRange: [0.4, 1.0], outputRange: [0.15, 0.55] }) }]}>
                    <Text style={s.quoteText}>
                        "Từ ánh sáng của tâm, thế giới lại được hình thành."
                    </Text>
                </Animated.View>
            </View>
        </ImageBackground>
    );
}

function LightParticle({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) {
    const anim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        const runAnimation = () => {
            anim.setValue(0);
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 6000,
                        useNativeDriver: true,
                    }),
                ])
            ]).start(() => runAnimation());
        };
        runAnimation();
    }, []);

    const opacity = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.85, 0],
    });

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -120],
    });

    return (
        <Animated.View
            style={[
                s.particle,
                {
                    left: x as any,
                    top: y as any,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    opacity: opacity,
                    transform: [{ translateY }],
                },
            ]}
        />
    );
}

const s = StyleSheet.create({
    // ── Gold Welcome Styles ──
    goldRoot: {
        flex: 1,
        backgroundColor: MAROON_DARK,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 32,
    },
    corner: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderColor: 'rgba(212,175,55,0.35)',
    },
    cornerTL: { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 },
    cornerTR: { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 },
    cornerBL: { bottom: 20, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 },
    cornerBR: { bottom: 20, right: 20, borderBottomWidth: 1, borderRightWidth: 1 },
    brandingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
    },
    starWrap: { marginBottom: 24, opacity: 0.85 },
    titleTop: {
        fontSize: 48,
        fontWeight: '700',
        letterSpacing: 4,
        color: GOLD_LIGHT,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    titleBot: {
        fontSize: 44,
        fontWeight: '700',
        letterSpacing: 6,
        color: GOLD,
        marginTop: -8,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        marginTop: 20,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        fontStyle: 'italic',
        letterSpacing: 0.5,
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 24,
    },
    actionWrap: {
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        marginBottom: 16,
    },
    goldEnterBtn: {
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderWidth: 1,
        borderColor: GOLD,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: GOLD,
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
        backgroundColor: 'rgba(212,175,55,0.08)',
    },
    goldEnterBtnText: {
        color: GOLD_LIGHT,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 4,
    },
    goldFooterText: {
        marginTop: 28,
        color: 'rgba(212,175,55,0.45)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },

    // ── Void Eon Styles ──
    voidRoot: {
        flex: 1,
        backgroundColor: OBSIDIAN,
        padding: 32,
        justifyContent: 'space-between',
    },
    voidOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(2, 2, 2, 0.78)',
    },
    voidContentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        maxWidth: 600,
        marginTop: 40,
    },
    voidHeader: {
        marginBottom: 28,
    },
    voidHeaderEon: {
        fontSize: Platform.OS === 'web' ? 38 : 30,
        fontWeight: '900',
        letterSpacing: 6,
        color: NEON_CYAN,
        textShadowColor: CYAN_GLOW,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
        textTransform: 'uppercase',
    },
    voidTealLine: {
        width: 120,
        height: 2,
        backgroundColor: NEON_CYAN,
        marginTop: 10,
        marginBottom: 10,
        shadowColor: NEON_CYAN,
        shadowOpacity: 0.8,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
    },
    voidHeaderStatus: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 3,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
    },
    voidDescWrap: {
        marginBottom: 36,
        gap: 16,
    },
    voidDescText: {
        color: 'rgba(255, 255, 255, 0.82)',
        fontSize: 15,
        lineHeight: 26,
        letterSpacing: 0.5,
    },
    voidWarningText: {
        color: NEON_CYAN,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
        opacity: 0.85,
    },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
    },
    countdownBox: {
        borderWidth: 1,
        borderColor: DEEP_CYAN,
        backgroundColor: 'rgba(8, 47, 68, 0.25)',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 2,
        alignItems: 'center',
        minWidth: 74,
    },
    countdownVal: {
        fontSize: 28,
        fontWeight: '700',
        color: NEON_CYAN,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textShadowColor: CYAN_GLOW,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    countdownLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '700',
    },
    countdownColon: {
        fontSize: 24,
        fontWeight: '700',
        color: DEEP_CYAN,
    },
    voidActionWrap: {
        alignItems: 'flex-end',
        width: '100%',
        marginBottom: 20,
        zIndex: 10,
    },
    voidFooterText: {
        marginTop: 14,
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    // ── Formation Eon Styles ──
    formationRoot: {
        flex: 1,
        backgroundColor: '#FFFDF0',
        padding: Platform.OS === 'web' ? 48 : 24,
        justifyContent: 'space-between',
    },
    formationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 253, 240, 0.12)',
    },
    formationMainContainer: {
        flex: 1,
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
        gap: 24,
        width: '100%',
        marginTop: Platform.OS === 'web' ? 0 : 20,
        zIndex: 2,
    },
    formationLeftPanel: {
        flex: Platform.OS === 'web' ? undefined : 1,
        width: Platform.OS === 'web' ? '45%' : '100%',
        maxWidth: 600,
        backgroundColor: 'rgba(255, 255, 255, 0.82)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.35)',
        borderRadius: 12,
        padding: Platform.OS === 'web' ? 36 : 24,
        shadowColor: '#d4af37',
        shadowOpacity: 0.15,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: 10 },
    },
    formationHeader: {
        marginBottom: 24,
    },
    titleContainer: {
        height: Platform.OS === 'web' ? 50 : 40,
        justifyContent: 'center',
        marginBottom: 8,
    },
    formationHeaderEon: {
        fontSize: Platform.OS === 'web' ? 36 : 28,
        fontWeight: '900',
        letterSpacing: 4,
        color: '#b8860b',
    },
    formationHeaderEonGlow: {
        position: 'absolute',
        fontSize: Platform.OS === 'web' ? 36 : 28,
        fontWeight: '900',
        letterSpacing: 4,
        color: '#fdeb93',
        textShadowColor: 'rgba(253, 224, 71, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    formationTealLine: {
        width: 100,
        height: 2,
        backgroundColor: '#d4af37',
        marginTop: 4,
        marginBottom: 10,
        shadowColor: '#d4af37',
        shadowOpacity: 0.6,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 0 },
    },
    formationHeaderStatus: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#aa8a2e',
        textShadowColor: 'rgba(212, 175, 55, 0.25)',
        textShadowOffset: { width: 0, height: 0 },
        opacity: 0.9,
    },
    formationDescWrap: {
        marginBottom: 28,
        gap: 12,
    },
    formationDescText: {
        color: '#4a3f2d',
        fontSize: 14,
        lineHeight: 22,
        letterSpacing: 0.3,
    },
    formationWarningText: {
        color: '#b8860b',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 8,
    },
    formationCountdownBox: {
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.45)',
        backgroundColor: 'rgba(255, 253, 240, 0.95)',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignItems: 'center',
        minWidth: 70,
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    formationCountdownVal: {
        fontSize: 26,
        fontWeight: '700',
        color: '#aa8a2e',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textShadowColor: 'rgba(212, 175, 55, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },
    formationCountdownLabel: {
        fontSize: 9,
        color: '#aa8a2e',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '700',
        opacity: 0.8,
    },
    formationCountdownColon: {
        fontSize: 22,
        fontWeight: '700',
        color: 'rgba(212, 175, 55, 0.6)',
    },
    quoteCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignSelf: Platform.OS === 'web' ? 'flex-end' : 'center',
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 15,
        maxWidth: 400,
        marginBottom: Platform.OS === 'web' ? 40 : 20,
    },
    quoteText: {
        color: '#aa8a2e',
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    particle: {
        position: 'absolute',
        backgroundColor: '#fffdf0',
        shadowColor: '#d4af37',
        shadowOpacity: 0.8,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
    },
    celestialGlow: {
        position: 'absolute',
        filter: Platform.OS === 'web' ? 'blur(80px)' : undefined,
        zIndex: 0,
    },
    audioButton: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 24 : 16,
        right: Platform.OS === 'web' ? 24 : 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.4)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        shadowColor: '#d4af37',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        zIndex: 100,
    },
    audioButtonText: {
        color: '#aa8a2e',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

const star = StyleSheet.create({
    wrap: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rect: {
        position: 'absolute',
        width: 16,
        height: 60,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: GOLD,
        borderRadius: 2,
    },
    center: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: GOLD,
        opacity: 0.7,
    },
});
