import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TextInput, ActivityIndicator, Alert, Dimensions, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Play, Pause, Square, Music, ChevronDown, Check, Calculator, X } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { tucsoService, TucSoType } from '../services/tucsoService';

const GOLD = '#D4AF37';
const CARD = '#FFF';
const BG = '#FEF9EF';
const MAROON = '#800000';
const { width } = Dimensions.get('window');

function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CounterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [types, setTypes] = useState<TucSoType[]>([]);
    const [selectedType, setSelectedType] = useState<TucSoType | null>(null);
    const [loading, setLoading] = useState(true);

    const [timerRunning, setTimerRunning] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    // Audio Player
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    // End Session Modal
    const [showEndModal, setShowEndModal] = useState(false);
    const [finalCount, setFinalCount] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Stats for auto-calc
    const [historicalStats, setHistoricalStats] = useState({ total_count: 0, total_duration: 0 });

    // Type Selector Modal
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [isCreatingType, setIsCreatingType] = useState(false);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerRunning) {
            interval = setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]);

    // Audio Cleanup
    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    // Fetch types
    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            setLoading(true);
            const data = await tucsoService.fetchTypes();
            setTypes(data);
            if (data.length > 0 && !selectedType) {
                setSelectedType(data[0]);
                fetchHistoricalStats(data[0].id);
            }
        } catch (err) {
            console.error('Failed to load tuc so types', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoricalStats = async (typeId: string) => {
        try {
            const stats = await tucsoService.getStatsForType(typeId);
            setHistoricalStats(stats);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        }
    };

    const handleSelectType = (tp: TucSoType) => {
        setSelectedType(tp);
        fetchHistoricalStats(tp.id);
        setShowTypeModal(false);
    };

    const handleCreateType = async () => {
        if (!newTypeName.trim()) return;
        try {
            setIsCreatingType(true);
            const newType = await tucsoService.createType(newTypeName.trim());
            setTypes([...types, newType]);
            handleSelectType(newType);
            setNewTypeName('');
            setShowTypeModal(false);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Không thể tạo loại túc số mới.');
        } finally {
            setIsCreatingType(false);
        }
    };

    // Audio Playback
    async function playSound() {
        try {
            if (sound) {
                if (isPlayingAudio) {
                    await sound.pauseAsync();
                    setIsPlayingAudio(false);
                } else {
                    await sound.playAsync();
                    setIsPlayingAudio(true);
                }
                return;
            }

            // Load and play
            const { sound: newSound } = await Audio.Sound.createAsync(
                require('../assets/music/Nhacthien01.mp3'),
                { isLooping: true }
            );
            setSound(newSound);
            await newSound.playAsync();
            setIsPlayingAudio(true);
        } catch (err) {
            console.error('Audio playback error', err);
            Alert.alert('Lỗi Audio', 'Không tìm thấy file nhạc meditation hoặc lỗi phát nhạc. Vui lòng đảm bảo file assets/music/Nhacthien01.mp3 tồn tại.');
        }
    }

    const toggleTimer = () => setTimerRunning(!timerRunning);

    const stopSession = () => {
        setTimerRunning(false);
        if (secondsElapsed < 10 && false) { // disable for now, let's allow 0
            Alert.alert('Thông báo', 'Thời gian quá ngắn.');
            return;
        }
        setShowEndModal(true);
    };

    const autoCalculate = () => {
        if (!historicalStats || historicalStats.total_duration === 0) return;

        // Count/sec = total_count / total_duration
        const rate = historicalStats.total_count / historicalStats.total_duration;
        const estimated = Math.round(rate * secondsElapsed);
        setFinalCount(estimated.toString());
    };

    const handleSaveSession = async () => {
        if (!selectedType) return;
        const countNum = parseInt(finalCount, 10);
        if (isNaN(countNum) || countNum < 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập số đếm hợp lệ.');
            return;
        }

        try {
            setIsSaving(true);
            await tucsoService.saveLog(selectedType.id, secondsElapsed, countNum);
            Alert.alert('Thành công', 'Đã lưu túc số thành công.', [
                {
                    text: 'OK',
                    onPress: () => {
                        setShowEndModal(false);
                        setSecondsElapsed(0);
                        setFinalCount('');
                        // If audio is playing, maybe pause it?
                    }
                }
            ]);
            // update history
            fetchHistoricalStats(selectedType.id);
        } catch (err) {
            console.error(err);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={MAROON} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            {/* ─ Header ─ */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <X size={24} color={GOLD} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đếm Túc Số</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>

                {/* ─ Type Selector ─ */}
                <TouchableOpacity
                    style={styles.typeSelector}
                    onPress={() => setShowTypeModal(true)}
                    activeOpacity={0.8}
                >
                    <View>
                        <Text style={styles.typeSelectorLabel}>Loại Tu Tập</Text>
                        <Text style={styles.typeSelectorValue}>
                            {selectedType ? selectedType.name : 'Chọn thể loại...'}
                        </Text>
                    </View>
                    <ChevronDown size={20} color="#666" />
                </TouchableOpacity>

                {/* ─ Audio Control ─ */}
                <TouchableOpacity
                    style={[styles.audioBtn, isPlayingAudio && styles.audioBtnActive]}
                    onPress={playSound}
                >
                    <Music size={20} color={isPlayingAudio ? '#FFF' : MAROON} />
                    <Text style={[styles.audioBtnText, isPlayingAudio && { color: '#FFF' }]}>
                        {isPlayingAudio ? 'Đang phát nhạc thiền' : 'Phát nhạc thiền'}
                    </Text>
                </TouchableOpacity>

                {/* ─ Timer Display ─ */}
                <View style={styles.timerCircle}>
                    <Text style={styles.timerText}>{formatTime(secondsElapsed)}</Text>
                    <Text style={styles.timerSubText}>Thời gian thực hành</Text>
                </View>

                {/* ─ Controls ─ */}
                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        style={[styles.controlBtn, { backgroundColor: timerRunning ? '#F59E0B' : '#10B981' }]}
                        onPress={toggleTimer}
                    >
                        {timerRunning ? <Pause size={32} color="#FFF" /> : <Play size={32} color="#FFF" style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlBtn, { backgroundColor: '#EF4444' }]}
                        onPress={stopSession}
                        disabled={secondsElapsed === 0 && !timerRunning}
                    >
                        <Square size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* ─ Stats Display ─ */}
                {selectedType && (
                    <View style={styles.statsBox}>
                        <Text style={styles.statsTitle}>Tổng Tích Luỹ: {selectedType.name}</Text>
                        <Text style={styles.statsValue}>
                            {historicalStats.total_count.toLocaleString()} <Text style={{ fontSize: 14, color: '#666' }}>lần</Text>
                        </Text>
                        <Text style={styles.statsSub}>
                            Trong {formatTime(historicalStats.total_duration)} thời gian
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* ─ END SESSION MODAL ─ */}
            <Modal visible={showEndModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Kết Thúc Thực Hành</Text>
                        <Text style={styles.modalSubTitle}>
                            Bạn đã thực hành {formatTime(secondsElapsed)}. Hãy nhập số lượng túc số hoặc tính tự động.
                        </Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={finalCount}
                                onChangeText={setFinalCount}
                                keyboardType="number-pad"
                                placeholder="Nhập số lần (VD: 108)"
                            />

                            <TouchableOpacity
                                style={[styles.autoCalcBtn, (!historicalStats || historicalStats.total_duration === 0) && { opacity: 0.5 }]}
                                onPress={autoCalculate}
                                disabled={!historicalStats || historicalStats.total_duration === 0}
                            >
                                <Calculator size={18} color="#FFF" />
                                <Text style={styles.autoCalcText}>Tự tạo tính</Text>
                            </TouchableOpacity>
                        </View>
                        {(!historicalStats || historicalStats.total_duration === 0) && (
                            <Text style={styles.hintText}>* Cần có dữ liệu các lần trước để có thể tự động tính</Text>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => {
                                setShowEndModal(false);
                                setSecondsElapsed(0);
                                setFinalCount('');
                            }}>
                                <Text style={styles.modalBtnCancelText}>Làm lại / Đóng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveSession} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnSaveText}>Lưu Lại</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ─ TYPE SELECTOR MODAL ─ */}
            <Modal visible={showTypeModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <Text style={styles.modalTitle}>Chọn Thể Loại Tu Tập</Text>

                        <ScrollView style={{ width: '100%', marginVertical: 15 }} showsVerticalScrollIndicator={false}>
                            {types.map(t => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.typeListItem, selectedType?.id === t.id && styles.typeListItemActive]}
                                    onPress={() => handleSelectType(t)}
                                >
                                    <Text style={[styles.typeListText, selectedType?.id === t.id && { color: MAROON, fontWeight: 'bold' }]}>
                                        {t.name}
                                    </Text>
                                    {selectedType?.id === t.id && <Check size={20} color={MAROON} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Create new type inline */}
                        <View style={styles.newTypeContainer}>
                            <TextInput
                                style={styles.inputNewType}
                                value={newTypeName}
                                onChangeText={setNewTypeName}
                                placeholder="Hoặc tạo loại mới..."
                            />
                            <TouchableOpacity
                                style={[styles.btnAddType, !newTypeName.trim() && { opacity: 0.5 }]}
                                onPress={handleCreateType}
                                disabled={!newTypeName.trim() || isCreatingType}
                            >
                                {isCreatingType ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Tạo</Text>}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setShowTypeModal(false)}>
                            <Text style={{ color: '#666', fontWeight: 'bold', fontSize: 16 }}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 20, paddingHorizontal: 15,
        backgroundColor: MAROON,
    },
    headerTitle: { color: GOLD, fontSize: 18, fontWeight: '800' },

    typeSelector: {
        width: '100%', backgroundColor: CARD,
        paddingHorizontal: 20, paddingVertical: 15,
        borderRadius: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
        marginBottom: 20
    },
    typeSelectorLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
    typeSelectorValue: { fontSize: 16, color: '#333', fontWeight: '700' },

    audioBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(128, 0, 0, 0.1)',
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
        marginBottom: 40
    },
    audioBtnActive: { backgroundColor: MAROON },
    audioBtnText: { color: MAROON, fontWeight: '700', fontSize: 14 },

    timerCircle: {
        width: 280, height: 280, borderRadius: 140,
        borderWidth: 8, borderColor: GOLD,
        backgroundColor: '#FFF',
        alignItems: 'center', justifyContent: 'center',
        elevation: 10, shadowColor: GOLD, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20,
        marginBottom: 40
    },
    timerText: { fontSize: 64, fontWeight: '300', color: MAROON, fontVariant: ['tabular-nums'] },
    timerSubText: { fontSize: 14, color: '#999', fontWeight: '600', marginTop: 10 },

    controlsRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20,
        marginBottom: 40
    },
    controlBtn: {
        width: 72, height: 72, borderRadius: 36,
        alignItems: 'center', justifyContent: 'center',
        elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    },

    statsBox: {
        width: '100%', backgroundColor: '#FFF',
        padding: 20, borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1, borderColor: '#EEE'
    },
    statsTitle: { fontSize: 14, color: '#666', fontWeight: '700', marginBottom: 10 },
    statsValue: { fontSize: 32, color: MAROON, fontWeight: '800' },
    statsSub: { fontSize: 12, color: '#999', marginTop: 5 },

    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: {
        width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 25, alignItems: 'center',
        elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: MAROON, marginBottom: 10 },
    modalSubTitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },

    inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 10 },
    input: {
        flex: 1, height: 50, backgroundColor: '#F5F5F5',
        borderRadius: 12, paddingHorizontal: 15,
        fontSize: 16, fontWeight: '600', color: '#333'
    },
    autoCalcBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: GOLD, height: 50, paddingHorizontal: 15, borderRadius: 12,
        justifyContent: 'center'
    },
    autoCalcText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    hintText: { fontSize: 11, color: '#999', alignSelf: 'flex-start', marginBottom: 20, fontStyle: 'italic' },

    modalActions: { flexDirection: 'row', alignItems: 'center', gap: 15, width: '100%', marginTop: 10 },
    modalBtnCancel: {
        flex: 1, height: 50, borderRadius: 12, backgroundColor: '#F5F5F5',
        alignItems: 'center', justifyContent: 'center'
    },
    modalBtnCancelText: { color: '#666', fontWeight: '700', fontSize: 16 },
    modalBtnSave: {
        flex: 1, height: 50, borderRadius: 12, backgroundColor: MAROON,
        alignItems: 'center', justifyContent: 'center'
    },
    modalBtnSaveText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

    // Type list
    typeListItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 15, paddingHorizontal: 10,
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
    },
    typeListItemActive: { backgroundColor: 'rgba(128, 0, 0, 0.05)', borderRadius: 8, borderBottomWidth: 0 },
    typeListText: { fontSize: 16, color: '#333', fontWeight: '500' },

    newTypeContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginTop: 10 },
    inputNewType: {
        flex: 1, height: 46, backgroundColor: '#F5F5F5',
        borderRadius: 8, paddingHorizontal: 15, fontSize: 14
    },
    btnAddType: {
        backgroundColor: MAROON, height: 46, paddingHorizontal: 20,
        borderRadius: 8, alignItems: 'center', justifyContent: 'center'
    }
});
