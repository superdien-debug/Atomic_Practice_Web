import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff } from 'lucide-react-native';
import { useT } from '../../i18n/useT';

// ── Design tokens (match HTML exactly) ────────────────────────────────────────
const MONASTERY_RED = '#800000';
const DEEP_MAROON = '#4a0404';
const GOLD_ACCENT = '#c5a059';
const GOLD_LIGHT = '#FCF6BA';
const CARD_BG = 'rgba(0,0,0,0.30)';
const INPUT_BG = 'rgba(74,4,4,0.40)';
const BORDER_GOLD = 'rgba(212,175,55,0.30)';
const BORDER_FOCUS = GOLD_ACCENT;

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);
    const [pwFocus, setPwFocus] = useState(false);
    const router = useRouter();
    const setSession = useAuthStore(s => s.setSession);
    const t = useT();
    const insets = useSafeAreaInsets();

    const signIn = async () => {
        if (!email || !password) { Alert.alert(t('error'), t('fillAllFields')); return; }
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { Alert.alert('Error', error.message); }
        else { setSession(data.session); router.replace('/dashboard'); }
        setLoading(false);
    };

    return (
        <View style={s.root}>
            <StatusBar style="light" />
            {/* Subtle mandala radial glow */}
            <View style={s.mandalaBg} pointerEvents="none" />

            {/* Corner flourishes */}
            <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={s.kav}
            >
                <ScrollView
                    contentContainerStyle={[s.scroll, { paddingTop: Math.max(insets.top, 24) + 40 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* ── Logo ── */}
                    <View style={s.logoWrap}>
                        <View style={s.logoCircle}>
                            <Text style={s.logoSymbol}>☸</Text>
                        </View>
                        <Text style={s.logoLabel}>MARATIKA PRACTICE</Text>
                    </View>

                    {/* ── Card ── */}
                    <View style={s.card}>

                        {/* Header */}
                        <View style={s.cardHead}>
                            <Text style={s.cardTitle}>{t('welcomeBack')}</Text>
                            <Text style={s.cardSub}>{t('continueYour')}</Text>
                        </View>

                        {/* Email */}
                        <View style={s.field}>
                            <Text style={s.fieldLabel}>{t('emailAddress').toUpperCase()}</Text>
                            <View style={[s.inputBox, emailFocus && s.inputBoxFocus]}>
                                <TextInput
                                    style={s.input}
                                    placeholder={t('emailAddress').toLowerCase() + '...'}
                                    placeholderTextColor="rgba(100,116,139,0.7)"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onFocus={() => setEmailFocus(true)}
                                    onBlur={() => setEmailFocus(false)}
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={s.field}>
                            <View style={s.pwRow}>
                                <Text style={s.fieldLabel}>{t('password').toUpperCase()}</Text>
                                <Text style={s.forgot}>{t('forgotPassword')}</Text>
                            </View>
                            <View style={[s.inputBox, pwFocus && s.inputBoxFocus]}>
                                <TextInput
                                    style={[s.input, { flex: 1 }]}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(100,116,139,0.7)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPw}
                                    onFocus={() => setPwFocus(true)}
                                    onBlur={() => setPwFocus(false)}
                                />
                                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(!showPw)}>
                                    {showPw
                                        ? <EyeOff size={18} color="rgba(212,175,55,0.45)" />
                                        : <Eye size={18} color="rgba(212,175,55,0.45)" />
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── Sign In button: gradient-border trick ── */}
                        <TouchableOpacity
                            onPress={signIn}
                            disabled={loading}
                            activeOpacity={0.85}
                            style={s.gradientBorder}
                        >
                            <View style={s.signInInner}>
                                {loading
                                    ? <ActivityIndicator color={GOLD_ACCENT} />
                                    : <Text style={s.signInText}>{t('signIn')}</Text>
                                }
                            </View>
                        </TouchableOpacity>

                        {/* Secondary */}
                        <View style={s.secondary}>
                            <Text style={s.secondaryText}>
                                {'New to the path? '}
                            </Text>
                            <Link href="/auth/signup" asChild>
                                <TouchableOpacity>
                                    <Text style={s.joinLink}>Join the Sangha</Text>
                                </TouchableOpacity>
                            </Link>

                            {/* Divider */}
                            <View style={s.divider}>
                                <View style={s.divLine} />
                                <Text style={s.divIcon}>✦</Text>
                                <View style={s.divLine} />
                            </View>

                            {/* Social */}
                            <View style={s.socialRow}>
                                <View style={s.socialBtn}><Text style={{ fontSize: 16 }}>🌐</Text></View>
                                <View style={s.socialBtn}><Text style={{ fontSize: 16 }}>🛡️</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={s.footer}>
                        <Text style={s.footerText}>{t('establishedIn')}</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: DEEP_MAROON,
    },
    mandalaBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: MONASTERY_RED,
        opacity: 0.15,
    },
    kav: { flex: 1 },
    scroll: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    /* Corner accents */
    corner: {
        position: 'absolute', width: 48, height: 48,
        borderColor: 'rgba(212,175,55,0.3)', zIndex: 1,
    },
    cTL: { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 },
    cTR: { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 },
    cBL: { bottom: 20, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 },
    cBR: { bottom: 20, right: 20, borderBottomWidth: 1, borderRightWidth: 1 },

    /* Logo */
    logoWrap: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'rgba(19,91,236,0.10)',
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.30)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 10,
    },
    logoSymbol: { fontSize: 30 },
    logoLabel: {
        color: 'rgba(212,175,55,0.80)',
        fontSize: 10, fontWeight: '600', letterSpacing: 3,
    },

    /* Card */
    card: {
        width: '100%', maxWidth: 420,
        padding: 28,
    },
    cardHead: { alignItems: 'center', marginBottom: 32 },
    cardTitle: {
        fontSize: 32, fontWeight: '900', color: GOLD_ACCENT,
        letterSpacing: 0.5, textAlign: 'center'
    },
    cardSub: {
        color: 'rgba(203,213,225,0.75)',
        fontSize: 14, fontStyle: 'italic', marginTop: 8, textAlign: 'center'
    },

    /* Fields */
    field: { marginBottom: 20 },
    fieldLabel: {
        color: 'rgba(212,175,55,0.70)',
        fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
        marginBottom: 8, paddingHorizontal: 2,
    },
    pwRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    forgot: { color: 'rgba(212,175,55,0.50)', fontSize: 10, letterSpacing: 0.5 },
    inputBox: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, borderWidth: 1, borderColor: BORDER_GOLD,
        backgroundColor: INPUT_BG, overflow: 'hidden',
    },
    inputBoxFocus: { borderColor: BORDER_FOCUS },
    input: {
        flex: 1, paddingHorizontal: 16, paddingVertical: 14,
        color: '#FFF', fontSize: 15,
    },
    eyeBtn: { paddingHorizontal: 14 },

    /* Sign In */
    gradientBorder: {
        marginTop: 18, borderRadius: 12,
        backgroundColor: GOLD_ACCENT,
        shadowColor: GOLD_ACCENT, shadowOpacity: 0.3, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, elevation: 6,
        overflow: 'hidden',
    },
    signInInner: {
        backgroundColor: DEEP_MAROON,
        height: 54, alignItems: 'center', justifyContent: 'center',
    },
    signInText: {
        color: GOLD_ACCENT,
        fontWeight: '800', fontSize: 15, letterSpacing: 4,
    },

    /* Secondary */
    secondary: { alignItems: 'center', marginTop: 28, gap: 14 },
    secondaryText: { color: 'rgba(148,163,184,0.85)', fontSize: 14 },
    joinLink: { color: GOLD_ACCENT, fontWeight: '600', fontSize: 14 },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', opacity: 0.30 },
    divLine: { flex: 1, height: 1, backgroundColor: GOLD_ACCENT },
    divIcon: { color: GOLD_ACCENT, fontSize: 12 },
    socialRow: { flexDirection: 'row', gap: 16 },
    socialBtn: {
        width: 42, height: 42, borderRadius: 21,
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
    },

    /* Footer */
    footer: { marginTop: 32, opacity: 0.40, alignItems: 'center' },
    footerText: { color: '#94a3b8', fontSize: 10, letterSpacing: 4 },
});
