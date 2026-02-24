import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useT } from '../i18n/useT';

const { width, height } = Dimensions.get('window');

// Gold star SVG path — rendered as corner ornaments + center star via View shapes
const MAROON_DARK = '#4a0404';
const MAROON = '#800000';
const GOLD = '#d4af37';
const GOLD_LIGHT = '#f9e2af';
const GOLD_DIM = '#aa8a2e';

export default function WelcomeScreen() {
    const router = useRouter();
    const t = useT();

    return (
        <View style={s.root}>
            <StatusBar style="light" />

            {/* Corner flourishes */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />

            {/* ── Branding center ── */}
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

            {/* ── Action area ── */}
            <View style={s.actionWrap}>
                <TouchableOpacity
                    style={s.enterBtn}
                    activeOpacity={0.8}
                    onPress={() => router.replace('/auth/login')}
                >
                    <Text style={s.enterBtnText}>{t('enterPractice')}</Text>
                </TouchableOpacity>

                <Text style={s.footerText}>{t('establishedIn')}</Text>
            </View>
        </View>
    );
}

/* ── Simple star SVG via pure RN views ──────────────────────────────────── */
function StarIcon() {
    // 8-pointed star using two rotated rectangles
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

/* ── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: MAROON_DARK,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 32,
        // radial gradient approximated with nested views
    },

    /* Corner flourishes — mimicking the border-t border-l etc from HTML */
    corner: {
        position: 'absolute',
        width: 48, height: 48,
        borderColor: 'rgba(212,175,55,0.35)',
    },
    cornerTL: { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 },
    cornerTR: { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 },
    cornerBL: { bottom: 20, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 },
    cornerBR: { bottom: 20, right: 20, borderBottomWidth: 1, borderRightWidth: 1 },

    /* Branding */
    brandingWrap: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0,
    },
    starWrap: { marginBottom: 24, opacity: 0.85 },

    titleTop: {
        fontSize: 48, fontWeight: '700', letterSpacing: 4,
        color: GOLD_LIGHT,
        textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    },
    titleBot: {
        fontSize: 44, fontWeight: '700', letterSpacing: 6,
        color: GOLD,
        marginTop: -8,
        textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    },

    tagline: {
        marginTop: 20,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15, fontStyle: 'italic', letterSpacing: 0.5,
        textAlign: 'center', maxWidth: 260, lineHeight: 24,
    },

    /* Action */
    actionWrap: {
        width: '100%', maxWidth: 340, alignItems: 'center',
        marginBottom: 16,
    },
    enterBtn: {
        width: '100%', paddingVertical: 18, paddingHorizontal: 32,
        borderWidth: 1, borderColor: GOLD,
        borderRadius: 8,
        alignItems: 'center',
        // inner gold glow via shadow
        shadowColor: GOLD, shadowOpacity: 0.25, shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 }, elevation: 4,
        backgroundColor: 'rgba(212,175,55,0.08)',
    },
    enterBtnText: {
        color: GOLD_LIGHT,
        fontSize: 18, fontWeight: '700', letterSpacing: 4,
    },
    footerText: {
        marginTop: 28,
        color: 'rgba(212,175,55,0.45)',
        fontSize: 10, fontWeight: '700', letterSpacing: 3,
        textTransform: 'uppercase',
    },
});

const star = StyleSheet.create({
    wrap: {
        width: 60, height: 60,
        alignItems: 'center', justifyContent: 'center',
    },
    rect: {
        position: 'absolute',
        width: 16, height: 60,
        backgroundColor: 'transparent',
        borderWidth: 1, borderColor: GOLD,
        borderRadius: 2,
    },
    center: {
        position: 'absolute',
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: GOLD, opacity: 0.7,
    },
});
