import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { CheckCircle2, Circle, Lock, Trophy, Layers, Zap } from 'lucide-react-native';
import { useLanguageStore } from '../store/languageStore';
import translations from '../i18n/translations';

const { width } = Dimensions.get('window');

// Maroon/Gold/Cream theme
const C = {
    maroon: '#5e0b0b',
    gold: '#d4af37',
    cream: '#FDFBF7',
    text: '#1e293b',
    mute: '#64748b',
    faint: '#94a3b8',
    bg: '#ffffff'
};

const CHART_DAYS = 15;


type HabitTrackerProps = {
    currentStreak: number;
    logHistory: { date: string; completed: boolean; streak: number }[]; // Last 10 days with streak progression
    habitStacking?: { trigger: string; action: string };
    twoMinVersion?: string;
};

export function HabitTracker({ currentStreak, logHistory, habitStacking, twoMinVersion }: HabitTrackerProps) {
    const lang = useLanguageStore(s => s.lang);
    const t = (key: keyof typeof translations.en) => translations[lang][key] || translations.en[key];

    const milestones = [
        { days: 3, label: t('initial'), key: 'initial' },
        { days: 21, label: t('psychological'), key: 'psychological' },
        { days: 66, label: t('comfortZone'), key: 'comfortZone' },
        { days: 100, label: t('lifestyle'), key: 'lifestyle' },
    ];

    const currentStageIdx = milestones.findIndex(m => currentStreak < m.days);
    const activeStage = currentStageIdx === -1 ? 4 : currentStageIdx; // 1-indexed

    // Calculate max streak in history for relative sizing
    const maxStreakInWindow = Math.max(...logHistory.map(h => h.streak), 1);

    return (
        <View style={s.container}>
            {/* Header: The Journey to Habit */}
            <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{t('journeyToHabit')}</Text>
                <Text style={s.stageTag}>{t('stageNof4').replace('{0}', String(activeStage + 1))}</Text>
            </View>

            {/* Timeline */}
            <View style={s.timeline}>
                {milestones.map((m, i) => {
                    const isAchieved = currentStreak >= m.days;
                    const isNext = !isAchieved && (i === 0 || currentStreak >= milestones[i - 1].days);
                    const isLocked = !isAchieved && !isNext;

                    let statusText = '';
                    if (isAchieved) {
                        statusText = t('daysAchieved').replace('{0}', String(m.days));
                    } else if (isNext) {
                        statusText = t('daysLeft').replace('{0}', String(m.days)).replace('{1}', String(m.days - currentStreak));
                    } else {
                        statusText = t('daysLocked').replace('{0}', String(m.days));
                    }

                    return (
                        <View key={m.key} style={s.milestoneRow}>
                            <View style={s.milestoneIconCol}>
                                <View style={[s.bulletLine, i === milestones.length - 1 && { height: 0 }, isAchieved && { backgroundColor: C.gold }]} />
                                <View style={[s.bullet, isAchieved && s.bulletAchieved, isNext && s.bulletNext]}>
                                    {isAchieved ? <CheckCircle2 size={16} color="#FFF" /> :
                                        isNext ? <Circle size={16} color={C.gold} strokeWidth={3} /> :
                                            <Lock size={14} color={C.faint} />}
                                </View>
                            </View>
                            <View style={s.milestoneContent}>
                                <Text style={[s.milestoneLabel, isLocked && { color: C.faint }]}>{m.label}</Text>
                                <Text style={s.milestoneStatus}>{statusText}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* History Chart */}
            <View style={s.card}>
                <Text style={s.cardTitle}>{t('historyChart')}</Text>

                <View style={s.chartWrapper}>
                    {/* Grid lines */}
                    <View style={s.gridLines}>
                        <View style={s.gridLine} />
                        <View style={s.gridLine} />
                        <View style={s.gridLine} />
                    </View>

                    <View style={s.chartContainer}>
                        {logHistory.slice(-CHART_DAYS).map((log, i) => {
                            const heightPercent = Math.max(5, (log.streak / maxStreakInWindow) * 100);
                            const isToday = i === logHistory.slice(-CHART_DAYS).length - 1;
                            return (
                                <View key={i} style={s.barWrapper}>
                                    <View style={[
                                        s.bar,
                                        { height: `${heightPercent}%` },
                                        log.completed ? s.barCompleted : s.barEmpty,
                                        isToday && { borderWidth: 1, borderColor: C.gold }
                                    ]} />
                                    {isToday && <Text style={s.todayLabel}>{t('today')}</Text>}
                                </View>
                            );
                        })}
                    </View>
                </View>
                <Text style={s.chartSubText}>{t('previous9days').replace('9', String(CHART_DAYS - 1))}</Text>
            </View>

            {/* Habit Stacking */}
            {habitStacking && (
                <View style={[s.block, { borderColor: '#0d9488' + '40', backgroundColor: '#f0fdfa' }]}>
                    <View style={[s.blockIconWrap, { backgroundColor: '#0d9488' }]}>
                        <Layers size={18} color="#FFF" />
                    </View>
                    <View style={s.blockContent}>
                        <Text style={[s.blockTitle, { color: '#0d9488' }]}>{t('habitStacking')}</Text>
                        <Text style={s.blockDesc}>
                            {t('habitStackingDesc')
                                .replace('{0}', habitStacking.trigger)
                                .replace('{1}', habitStacking.action)}
                        </Text>
                    </View>
                </View>
            )}

            {/* 2-Minute Version */}
            {twoMinVersion && (
                <View style={[s.block, { borderColor: '#d97706' + '40', backgroundColor: '#fffbeb' }]}>
                    <View style={[s.blockIconWrap, { backgroundColor: '#d97706' }]}>
                        <Zap size={18} color="#FFF" />
                    </View>
                    <View style={s.blockContent}>
                        <Text style={[s.blockTitle, { color: '#d97706' }]}>{t('twoMinVersion')}</Text>
                        <Text style={s.blockDesc}>{t('twoMinVersionDesc').replace('{0}', twoMinVersion)}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        paddingVertical: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: C.text,
        fontFamily: 'Montserrat-Bold'
    },
    stageTag: {
        fontSize: 11,
        fontWeight: '700',
        color: C.gold,
        backgroundColor: C.gold + '15',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        fontFamily: 'Montserrat-Bold'
    },
    timeline: {
        marginBottom: 24,
        paddingLeft: 4
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 50
    },
    milestoneIconCol: {
        width: 32,
        alignItems: 'center'
    },
    bulletLine: {
        position: 'absolute',
        top: 20,
        bottom: 0,
        width: 2,
        backgroundColor: '#E5E7EB',
        zIndex: 0
    },
    bullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    bulletAchieved: {
        backgroundColor: C.gold,
        borderColor: C.gold
    },
    bulletNext: {
        backgroundColor: '#FFF',
        borderColor: C.gold
    },
    milestoneContent: {
        flex: 1,
        paddingLeft: 12,
        paddingBottom: 20
    },
    milestoneLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: C.text,
        fontFamily: 'Montserrat-Bold'
    },
    milestoneStatus: {
        fontSize: 11,
        color: C.mute,
        marginTop: 2,
        fontFamily: 'Montserrat'
    },
    card: {
        backgroundColor: '#f0fdfa',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#0d9488' + '20',
        shadowColor: '#0d9488',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    cardTitle: {
        color: '#0d9488',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 24,
        fontFamily: 'Montserrat-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    chartWrapper: {
        height: 100,
        marginBottom: 10,
        justifyContent: 'flex-end'
    },
    gridLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between'
    },
    gridLine: {
        height: 1,
        backgroundColor: '#0d9488' + '10',
        width: '100%'
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '100%',
        zIndex: 1
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end'
    },
    bar: {
        width: '75%',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        minHeight: 4,
    },
    barCompleted: {
        backgroundColor: '#0d9488',
        shadowColor: '#0d9488',
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    barEmpty: {
        backgroundColor: '#0d9488' + '15',
        height: '5%'
    },
    todayLabel: {
        color: C.gold,
        fontSize: 7,
        fontWeight: '900',
        marginTop: 6,
        fontFamily: 'Montserrat-Bold',
        position: 'absolute',
        bottom: -15
    },
    chartSubText: {
        color: '#0d9488',
        fontSize: 10,
        textAlign: 'left',
        fontFamily: 'Montserrat',
        marginTop: 12,
        opacity: 0.6
    },
    block: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12
    },
    blockIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    blockContent: {
        flex: 1
    },
    blockTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 4,
        fontFamily: 'Montserrat-Bold'
    },
    blockDesc: {
        fontSize: 13,
        lineHeight: 18,
        color: C.text,
        fontFamily: 'Montserrat'
    }
});
