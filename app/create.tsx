import React, { useState } from 'react';
import {
    View, Text, TextInput, ScrollView, Switch, Pressable, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Bell, Globe, Plus } from 'lucide-react-native';
import { practiceService } from '../services/practiceService';

// ─── Colors (mirrors HTML design) ────────────────────────────────────────────
const C = {
    bg: '#FEF9EF',
    burgundy: '#800000',
    gold: '#D4AF37',
    text: '#1A1A1A',
    textMute: '#717171',
    border: '#E5E5E5',
    cardBg: '#FFFFFF',
};

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CreatePracticeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Identity
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Guru Yoga');

    const CATEGORIES = ['Guru Yoga', 'Quy y', 'Mantra', 'Sadhana', 'Atomic Practice', 'Study'];

    // Goal
    const [goalType, setGoalType] = useState<'at_least' | 'exactly'>('at_least');
    const [targetValue, setTargetValue] = useState('20');
    const [unit, setUnit] = useState<'Minutes' | 'Reps'>('Minutes');

    // Frequency
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

    // Settings
    const [remindersEnabled, setRemindersEnabled] = useState(false);
    const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00']);
    const [isPublic, setIsPublic] = useState(true);

    const isValid = name.trim().length > 0;

    const toggleDay = (i: number) => {
        setSelectedDays(prev =>
            prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
        );
    };

    const handleCreate = async () => {
        if (!isValid) return;
        try {
            const practice = await practiceService.createPractice({
                title: name,
                category,
                description,
                target_type: unit === 'Minutes' ? 'duration' : 'count',
                daily_target: parseInt(targetValue) || 1,
                target_operator: goalType,
                target_unit: unit === 'Minutes' ? 'minutes' : 'times',
                frequency,
                days_of_week: selectedDays.join(','),
                reminder_times: remindersEnabled ? reminderTimes : [],
                is_public: isPublic,
                is_active: true,
            });

            // ── Schedule Notifications ───────────
            if (remindersEnabled && reminderTimes.length > 0) {
                const { notificationService } = require('../services/notificationService');
                for (const time of reminderTimes) {
                    await notificationService.scheduleDailyReminder(
                        `${practice.id}_${time}`,
                        `Practice Reminder: ${name}`,
                        `It's time for your ${category} practice! 🙏`,
                        time
                    );
                }
            }

            router.back();
        } catch (e: any) {
            console.error('[Create Practice]', e);
            Alert.alert(
                'Could not save practice',
                e?.message || 'Unknown error. Check your connection and try again.',
            );
        }
    };

    return (
        <View style={s.root}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={[s.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>New Practice</Text>
                <TouchableOpacity onPress={handleCreate} disabled={!isValid} style={s.headerBtn}>
                    <Text style={[s.saveBtn, !isValid && { opacity: 0.5 }]}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Identity */}
                <Section icon="🛕" label="Identity">
                    <FieldLabel>Practice Name</FieldLabel>
                    <TextInput
                        style={s.input}
                        placeholder="e.g., Meditation, Chanting"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <FieldLabel style={{ marginTop: 20 }}>Category</FieldLabel>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 5 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    style={[
                                        s.categoryChip,
                                        category === cat && s.categoryChipActive
                                    ]}
                                >
                                    <Text style={[
                                        s.categoryChipText,
                                        category === cat && s.categoryChipTextActive
                                    ]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <FieldLabel style={{ marginTop: 20 }}>Description</FieldLabel>
                    <TextInput
                        style={[s.input, s.textarea]}
                        placeholder="Why are you doing this practice?"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </Section>

                {/* Goal & Target */}
                <Section icon="🎯" label="Goal & Target">
                    <View style={s.segmentBar}>
                        {(['at_least', 'exactly'] as const).map((g) => (
                            <TouchableOpacity
                                key={g}
                                onPress={() => setGoalType(g)}
                                style={[s.segmentItem, goalType === g && s.segmentActive]}
                            >
                                <Text style={[s.segmentText, goalType === g && s.segmentTextActive]}>
                                    {g === 'at_least' ? 'At least' : 'Exactly'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                        <View style={{ flex: 1 }}>
                            <FieldLabel>Amount</FieldLabel>
                            <TextInput
                                style={s.input}
                                keyboardType="numeric"
                                value={targetValue}
                                onChangeText={setTargetValue}
                            />
                        </View>
                        <View style={{ width: 120 }}>
                            <FieldLabel>Unit</FieldLabel>
                            <View style={s.unitRow}>
                                {(['Minutes', 'Reps'] as const).map((u) => (
                                    <TouchableOpacity
                                        key={u}
                                        onPress={() => setUnit(u)}
                                        style={[s.unitItem, unit === u && s.unitActive]}
                                    >
                                        <Text style={[s.unitText, unit === u && s.unitTextActive]}>{u}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </Section>

                {/* Frequency */}
                <Section icon="📅" label="Frequency">
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                        {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setFrequency(f)}
                                style={[s.freqPill, frequency === f && s.freqPillActive]}
                            >
                                <Text style={[s.freqText, frequency === f && s.freqTextActive]}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {frequency === 'daily' && (
                        <View style={s.daysRow}>
                            {DAYS.map((d, i) => {
                                const active = selectedDays.includes(i);
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => toggleDay(i)}
                                        style={[s.dayBubble, active && s.dayBubbleActive]}
                                    >
                                        <Text style={[s.dayText, active && s.dayTextActive]}>{d}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </Section>

                {/* Settings */}
                <View style={s.card}>
                    <SectionHeading icon="⚙️" label="Settings" />
                    <View style={s.settingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.settingTitle}>Reminders</Text>
                            <Text style={s.settingDesc}>Get notified to maintain consistency</Text>
                        </View>
                        <Switch
                            value={remindersEnabled}
                            onValueChange={setRemindersEnabled}
                            trackColor={{ false: '#DDD', true: '#800000' }}
                        />
                    </View>

                    {remindersEnabled && (
                        <View style={{ marginTop: 16 }}>
                            <FieldLabel>Reminder Times</FieldLabel>
                            {reminderTimes.map((time, idx) => (
                                <View key={idx} style={s.reminderTimeRow}>
                                    <TextInput
                                        style={[s.input, { flex: 1, height: 44, paddingVertical: 0 }]}
                                        value={time}
                                        onChangeText={(newTime) => {
                                            const newTimes = [...reminderTimes];
                                            newTimes[idx] = newTime;
                                            setReminderTimes(newTimes);
                                        }}
                                        placeholder="08:00"
                                    />
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (reminderTimes.length > 1) {
                                                setReminderTimes(reminderTimes.filter((_, i) => i !== idx));
                                            } else {
                                                setRemindersEnabled(false);
                                            }
                                        }}
                                        style={s.removeTimeBtn}
                                    >
                                        <Text style={{ color: C.burgundy, fontWeight: '700' }}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                onPress={() => setReminderTimes([...reminderTimes, '08:00'])}
                                style={s.addTimeBtn}
                            >
                                <Plus size={16} color={C.burgundy} />
                                <Text style={s.addTimeText}>Add Time</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={s.divider} />
                    <View style={s.settingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.settingTitle}>Public Sharing</Text>
                            <Text style={s.settingDesc}>Let others see your merit</Text>
                        </View>
                        <Switch
                            value={isPublic}
                            onValueChange={setIsPublic}
                            trackColor={{ false: '#DDD', true: '#800000' }}
                        />
                    </View>
                </View>

                <View style={{ height: 60 + insets.bottom }} />
            </ScrollView>
        </View>
    );
}

function Section({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
    return (
        <View style={s.card}>
            <SectionHeading icon={icon} label={label} />
            {children}
        </View>
    );
}

function SectionHeading({ icon, label }: { icon: string; label: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
            <Text style={s.sectionLabel}>{label}</Text>
        </View>
    );
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: any }) {
    return <Text style={[s.fieldLabel, style]}>{children}</Text>;
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FEF9EF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: '#800000',
    },
    headerBtn: { width: 44 },
    headerTitle: { color: '#FFF', fontWeight: '800', fontSize: 18 },
    saveBtn: { color: '#FFF', fontWeight: '700', fontSize: 16, textAlign: 'right' },
    card: {
        backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 20,
        padding: 20, borderRadius: 20, shadowColor: '#000',
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    sectionLabel: { color: '#800000', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
    fieldLabel: { color: '#717171', fontSize: 12, fontWeight: '700', marginBottom: 8 },
    input: {
        backgroundColor: '#F5F5F5', borderRadius: 12, padding: 15,
        fontSize: 16, color: '#1A1A1A',
    },
    categoryChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EEE'
    },
    categoryChipActive: {
        backgroundColor: '#800000', borderColor: '#800000'
    },
    categoryChipText: { color: '#717171', fontWeight: '700', fontSize: 13 },
    categoryChipTextActive: { color: '#FFF' },
    textarea: { minHeight: 100, textAlignVertical: 'top' },
    segmentBar: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4 },
    segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    segmentActive: { backgroundColor: '#800000' },
    segmentText: { color: '#717171', fontWeight: '700' },
    segmentTextActive: { color: '#FFF' },
    unitRow: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4 },
    unitItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    unitActive: { backgroundColor: '#D4AF37' },
    unitText: { color: '#717171', fontSize: 12, fontWeight: '700' },
    unitTextActive: { color: '#FFF' },
    freqPill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },
    freqPillActive: { backgroundColor: '#800000', borderColor: '#800000' },
    freqText: { color: '#717171', fontWeight: '700' },
    freqTextActive: { color: '#FFF' },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
    dayBubbleActive: { backgroundColor: '#D4AF37' },
    dayText: { color: '#717171', fontWeight: '700' },
    dayTextActive: { color: '#FFF' },
    settingRow: { flexDirection: 'row', alignItems: 'center' },
    settingTitle: { color: '#1A1A1A', fontSize: 16, fontWeight: '700' },
    settingDesc: { color: '#717171', fontSize: 12, marginTop: 2 },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 16 },
    reminderTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    removeTimeBtn: { padding: 8 },
    addTimeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
        borderWidth: 1, borderColor: '#80000020', alignSelf: 'flex-start',
        marginTop: 4,
    },
    addTimeText: { color: '#800000', fontSize: 13, fontWeight: '700' },
});
