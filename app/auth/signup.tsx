import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff } from 'lucide-react-native';
import { useT } from '../../i18n/useT';

// ── Same tokens as login ───────────────────────────────────────────────────────
const MONASTERY_RED = '#800000';
const DEEP_MAROON = '#4a0404';
const GOLD_ACCENT = '#c5a059';
const GOLD_LIGHT = '#FCF6BA';
const CARD_BG = 'rgba(0,0,0,0.30)';
const INPUT_BG = 'rgba(74,4,4,0.40)';
const BORDER_GOLD = 'rgba(212,175,55,0.30)';
const BORDER_FOCUS = GOLD_ACCENT;

export default function SignupScreen() {
    const t = useT();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);
    const [pwFocus, setPwFocus] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const signUp = async () => {
        if (!email || !password) {
            Alert.alert(t('error'), t('fillAllFields'));
            return;
        }
        if (password.length < 6) {
            Alert.alert(t('error'), t('pwMinLength'));
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email, password,
                options: { data: { display_name: email.split('@')[0] } },
            });
            if (error) {
                Alert.alert(t('error'), error.message);
            } else if (data.session) {
                router.replace('/dashboard');
            } else {
                Alert.alert(t('checkEmail'), t('emailVerify'));
                router.replace('/auth/login');
            }
        } catch (err: any) {
            console.error(err);
            Alert.alert(t('error'), err.message || "Đăng ký thất bại. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.root}>
            <StatusBar style="light" />

            {/* Corner flourishes */}
            <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[s.scroll, { paddingTop: Math.max(insets.top, 24) + 40 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={s.logoWrap}>
                        <View style={s.logoCircle}>
                            <Text style={s.logoSymbol}>☸</Text>
                        </View>
                        <Text style={s.logoLabel}>MARATIKA PRACTICE</Text>
                    </View>

                    {/* Card */}
                    <View style={s.card}>
                        <View className="mb-10 items-center">
                            <Text className="text-white text-3xl font-black tracking-tight mb-2">{t('joinSanghaTitle')}</Text>
                            <Text className="text-vajra-gold/80 text-sm font-medium">{t('beginPractice')}</Text>
                        </View>

                        {/* Email */}
                        <View className="mb-5">
                            <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2 ml-1">{t('emailAddress')}</Text>
                            <View className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 flex-row items-center">
                                {/* Mail icon would go here if imported */}
                                <TextInput
                                    className="flex-1 ml-3 text-white font-medium"
                                    placeholder="name@example.com"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* The original password input structure was different, this is a partial replacement.
                            Keeping the original structure for the eye button and focus states.
                            The provided diff for the password input was incomplete and mixed with className.
                            Reverting to original structure for password input to maintain functionality,
                            but applying the t() calls for labels.
                        */}
                        <View style={s.field}>
                            <Text style={s.fieldLabel}>{t('password').toUpperCase()}</Text>
                            <View style={[s.inputBox, pwFocus && s.inputBoxFocus]}>
                                <TextInput
                                    style={[s.input, { flex: 1 }]}
                                    placeholder="Create a strong password"
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

                        {/* Create Account button — solid gold fill (differs from Sign In) */}
                        <TouchableOpacity
                            onPress={signUp}
                            disabled={loading}
                            activeOpacity={0.85}
                            className="bg-vajra-gold py-5 rounded-2xl items-center shadow-lg shadow-vajra-gold/20"
                        >
                            {loading
                                ? <ActivityIndicator color={MONASTERY_RED} />
                                : <Text className="text-white font-black tracking-[2px]">{t('createAccount')}</Text>
                            }
                        </TouchableOpacity>

                        {/* Secondary */}
                        <View style={s.secondary}>
                            <Text style={s.secondaryText}>
                                {t('alreadyOnPath') + ' '}
                            </Text>
                            <Link href="/auth/login" asChild>
                                <TouchableOpacity>
                                    <Text style={s.signInLink}>{t('signIn')}</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={s.footer}>
                        <Text style={s.footerText}>OM MANI PADME HUM</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: DEEP_MAROON },
    scroll: {
        flexGrow: 1, alignItems: 'center',
        paddingHorizontal: 24, paddingBottom: 40,
    },
    corner: { position: 'absolute', width: 48, height: 48, borderColor: 'rgba(212,175,55,0.3)', zIndex: 1 },
    cTL: { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 },
    cTR: { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 },
    cBL: { bottom: 20, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 },
    cBR: { bottom: 20, right: 20, borderBottomWidth: 1, borderRightWidth: 1 },

    logoWrap: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'rgba(19,91,236,0.10)',
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.30)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    logoSymbol: { fontSize: 30 },
    logoLabel: { color: 'rgba(212,175,55,0.80)', fontSize: 10, fontWeight: '600', letterSpacing: 3 },

    card: {
        width: '100%', maxWidth: 420,
        padding: 28,
    },
    cardHead: { alignItems: 'center', marginBottom: 32 },
    cardTitle: { fontSize: 30, fontWeight: '900', color: GOLD_ACCENT, letterSpacing: 0.5, textAlign: 'center' },
    cardSub: { color: 'rgba(203,213,225,0.75)', fontSize: 14, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },

    field: { marginBottom: 20 },
    fieldLabel: {
        color: 'rgba(212,175,55,0.70)',
        fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, paddingHorizontal: 2,
    },
    inputBox: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, borderWidth: 1, borderColor: BORDER_GOLD,
        backgroundColor: INPUT_BG, overflow: 'hidden',
    },
    inputBoxFocus: { borderColor: BORDER_FOCUS },
    input: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, color: '#FFF', fontSize: 15 },
    eyeBtn: { paddingHorizontal: 14 },

    /* Solid gold — visually different from Sign In */
    createBtn: {
        marginTop: 18, height: 54, borderRadius: 12,
        backgroundColor: GOLD_ACCENT,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: GOLD_ACCENT, shadowOpacity: 0.3, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    createBtnText: {
        color: DEEP_MAROON,
        fontWeight: '800', fontSize: 15, letterSpacing: 4,
    },

    secondary: { alignItems: 'center', marginTop: 24, gap: 6 },
    secondaryText: { color: 'rgba(148,163,184,0.85)', fontSize: 14 },
    signInLink: { color: GOLD_ACCENT, fontWeight: '600', fontSize: 14 },

    footer: { marginTop: 32, opacity: 0.40, alignItems: 'center' },
    footerText: { color: '#94a3b8', fontSize: 10, letterSpacing: 4 },
});
