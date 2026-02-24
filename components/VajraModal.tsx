/**
 * VajraModal — Reusable app-wide modal popup component
 * Matches the Maratika dark maroon + gold design language.
 *
 * Usage:
 *   <VajraModal
 *     visible={showModal}
 *     icon="🚀"
 *     title="Challenge Launched!"
 *     message="Your challenge has been broadcast to the Sangha!"
 *     onDismiss={() => setShowModal(false)}
 *   />
 *   // Optional: two buttons
 *   <VajraModal
 *     visible={showModal}
 *     icon="⚠️"
 *     title="Are you sure?"
 *     message="This action cannot be undone."
 *     confirmLabel="Delete"
 *     cancelLabel="Cancel"
 *     onConfirm={handleDelete}
 *     onDismiss={() => setShowModal(false)}
 *   />
 */

import React from 'react';
import {
    Modal, View, Text, TouchableOpacity,
    StyleSheet, Pressable, Animated, Platform
} from 'react-native';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
    monastery: '#4A0404',
    monasteryDk: '#2D0202',
    monasteryLt: '#6B0F0F',
    gold: '#D4AF37',
    goldLight: '#F3E5AB',
    goldDark: '#996515',
    overlay: 'rgba(0,0,0,0.82)',
    border: 'rgba(212,175,55,0.4)',
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface VajraModalProps {
    visible: boolean;
    icon?: string;     // emoji icon, e.g. "🚀" "✅" "⚠️" "❌"
    title: string;
    message?: string;
    children?: React.ReactNode;
    confirmLabel?: string;     // defaults to "OK"
    cancelLabel?: string;     // show only when provided
    onConfirm?: () => void;
    onDismiss: () => void;
    /** "success" = gold border (default), "warning" = amber, "danger" = deep red */
    variant?: 'success' | 'warning' | 'danger';
}

const VARIANT_BORDER: Record<string, string> = {
    success: 'rgba(212,175,55,0.4)',
    warning: 'rgba(245,158,11,0.5)',
    danger: 'rgba(239,68,68,0.45)',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function VajraModal({
    visible,
    icon = '✨',
    title,
    message,
    children,
    confirmLabel = 'OK',
    cancelLabel,
    onConfirm,
    onDismiss,
    variant = 'success',
}: VajraModalProps) {

    const handleConfirm = () => {
        onConfirm?.();
        onDismiss();
    };

    const borderColor = VARIANT_BORDER[variant];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            {/* Blurred dark overlay — tap outside to dismiss */}
            <Pressable style={s.overlay} onPress={onDismiss}>
                {/* Card — stop event propagation so tapping card doesn't close */}
                <Pressable style={[s.card, { borderColor }]} onPress={e => e.stopPropagation()}>

                    {/* Corner flourishes */}
                    <View style={[s.corner, s.cTL, { borderColor }]} />
                    <View style={[s.corner, s.cTR, { borderColor }]} />
                    <View style={[s.corner, s.cBL, { borderColor }]} />
                    <View style={[s.corner, s.cBR, { borderColor }]} />

                    {/* Faint star BG */}
                    <View style={s.starBg} pointerEvents="none">
                        <Text style={s.starGlyph}>✦</Text>
                    </View>

                    {/* Icon */}
                    {icon ? <Text style={s.icon}>{icon}</Text> : null}

                    {/* Title */}
                    <Text style={s.title}>{title}</Text>

                    {/* Message */}
                    {message ? <Text style={s.message}>{message}</Text> : null}

                    {/* Custom Content */}
                    {children}

                    {/* Buttons */}
                    <View style={cancelLabel ? s.btnRow : s.btnSingle}>
                        {cancelLabel && (
                            <TouchableOpacity
                                style={s.cancelBtn}
                                onPress={onDismiss}
                                activeOpacity={0.8}
                            >
                                <Text style={s.cancelBtnText}>{cancelLabel.toUpperCase()}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[s.confirmBtn, cancelLabel && { flex: 1 }]}
                            onPress={handleConfirm}
                            activeOpacity={0.88}
                        >
                            <Text style={s.confirmBtnText}>{confirmLabel.toUpperCase()}</Text>
                        </TouchableOpacity>
                    </View>

                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: C.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },

    card: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: C.monastery,
        borderRadius: 20,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
        overflow: 'hidden',
        // shadow
        shadowColor: '#000',
        shadowOpacity: 0.55,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 16,
    },

    /* Corner accents */
    corner: {
        position: 'absolute', width: 20, height: 20,
    },
    cTL: { top: 12, left: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
    cTR: { top: 12, right: 12, borderTopWidth: 1.5, borderRightWidth: 1.5 },
    cBL: { bottom: 12, left: 12, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
    cBR: { bottom: 12, right: 12, borderBottomWidth: 1.5, borderRightWidth: 1.5 },

    /* Faint BG star */
    starBg: {
        position: 'absolute',
        alignItems: 'center', justifyContent: 'center',
        opacity: 0.06,
        top: 0, left: 0, right: 0, bottom: 0,
    },
    starGlyph: {
        fontSize: 180, color: C.gold, lineHeight: 200,
    },

    /* Content */
    icon: { fontSize: 48, marginBottom: 16 },
    title: {
        color: C.gold,
        fontSize: 22, fontWeight: '700',
        letterSpacing: 0.5, textAlign: 'center',
        marginBottom: 10,
    },
    message: {
        color: 'rgba(243,229,171,0.88)',
        fontSize: 14, textAlign: 'center', lineHeight: 22,
        marginBottom: 28,
    },

    /* Buttons */
    btnSingle: { width: '100%' },
    btnRow: { flexDirection: 'row', gap: 10, width: '100%' },

    confirmBtn: {
        width: '100%',
        paddingVertical: 13, borderRadius: 999,
        alignItems: 'center',
        // gold gradient approximated with solid + border
        backgroundColor: C.goldLight,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    confirmBtnText: {
        color: C.monasteryDk,
        fontWeight: '800', fontSize: 13, letterSpacing: 2,
    },

    cancelBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 999,
        alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
        backgroundColor: 'rgba(212,175,55,0.08)',
    },
    cancelBtnText: {
        color: 'rgba(212,175,55,0.7)',
        fontWeight: '700', fontSize: 13, letterSpacing: 2,
    },
});
