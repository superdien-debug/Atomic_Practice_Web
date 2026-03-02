import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, Alert,
    RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Brain, Sparkles, Heart, Activity, CheckCircle, Lock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { aiMemoryService, AIProfile, AIMemory, UserAISkill, AISkill } from '../../services/aiMemoryService';

const BG = '#FDFBF7';
const MAROON = '#800000';
const GOLD = '#D4AF37';

export default function CompanionProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [profile, setProfile] = useState<AIProfile | null>(null);
    const [memories, setMemories] = useState<AIMemory[]>([]);
    const [userSkills, setUserSkills] = useState<UserAISkill[]>([]);
    const [allSkills, setAllSkills] = useState<AISkill[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Chưa đăng nhập");

            const [p, m, sk, allSk] = await Promise.all([
                aiMemoryService.getProfile(user.id),
                aiMemoryService.getCoreMemories(user.id, 10),
                aiMemoryService.getUserUnlockedSkills(user.id),
                aiMemoryService.getAllActiveSkills()
            ]);

            setProfile(p);
            setMemories(m);
            setUserSkills(sk);
            setAllSkills(allSk);
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể tải dữ liệu AI Companion");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={MAROON} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Hồ Sơ Đồng Hành</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={MAROON} />}
            >
                {/* Identity Card */}
                <View style={styles.card}>
                    <View style={styles.avatarPlaceholder}>
                        <Brain size={48} color={MAROON} />
                    </View>
                    <Text style={styles.name}>{profile?.companion_name || 'Người Khai Vấn'}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Heart size={18} color={MAROON} style={{ marginBottom: 4 }} />
                            <Text style={styles.statLabel}>Tâm trạng</Text>
                            <Text style={styles.statValue}>{profile?.emotional_state || 'Chưa rõ'}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Activity size={18} color={MAROON} style={{ marginBottom: 4 }} />
                            <Text style={styles.statLabel}>Giai đoạn</Text>
                            <Text style={styles.statValue}>{profile?.practice_stage || 'Khởi đầu'}</Text>
                        </View>
                    </View>
                </View>

                {/* Core Memories */}
                <Text style={styles.sectionTitle}>Ký Ức Cốt Lõi</Text>
                <View style={styles.card}>
                    {memories.length === 0 ? (
                        <Text style={styles.emptyText}>AI chưa ghi nhận ký ức cốt lõi nào. Hãy trò chuyện thêm nhé.</Text>
                    ) : (
                        memories.map((m, idx) => (
                            <View key={m.id} style={[styles.memoryRow, idx === memories.length - 1 && { borderBottomWidth: 0 }]}>
                                <Sparkles size={16} color={GOLD} style={{ marginRight: 12, marginTop: 2 }} />
                                <Text style={styles.memoryText}>{m.content}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Skills */}
                <Text style={styles.sectionTitle}>Kỹ Năng AI</Text>
                <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                    {allSkills.map((skill, index) => {
                        const isUnlocked = userSkills.some(us => us.skill_id === skill.id);
                        return (
                            <View key={skill.id} style={[styles.skillRow, index > 0 && { borderTopWidth: 1, borderTopColor: '#EEE' }]}>
                                <View style={[styles.skillIconBox, isUnlocked ? { backgroundColor: '#F8F1E9' } : { backgroundColor: '#F0F0F0' }]}>
                                    {isUnlocked ? <CheckCircle size={20} color={MAROON} /> : <Lock size={20} color="#999" />}
                                </View>
                                <View style={styles.skillInfo}>
                                    <Text style={[styles.skillName, !isUnlocked && { color: '#666' }]}>{skill.name}</Text>
                                    <Text style={styles.skillDesc} numberOfLines={2}>{skill.description}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: {
        backgroundColor: MAROON,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 16,
    },
    headerBack: { padding: 4, marginRight: 8 },
    headerTitleContainer: { flex: 1, alignItems: 'center', marginRight: 32 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

    scrollContent: { padding: 16, paddingBottom: 40 },

    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarPlaceholder: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#F8F1E9',
        alignItems: 'center', justifyContent: 'center',
        alignSelf: 'center', marginBottom: 16,
    },
    name: {
        fontSize: 22, fontWeight: '800', color: MAROON,
        textAlign: 'center', marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1, borderTopColor: '#EEE',
        paddingTop: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12, color: '#666', marginBottom: 4,
    },
    statValue: {
        fontSize: 15, fontWeight: '700', color: '#333', textAlign: 'center'
    },

    sectionTitle: {
        fontSize: 16, fontWeight: '700', color: MAROON,
        marginBottom: 12, marginLeft: 4,
    },

    emptyText: {
        color: '#666', fontStyle: 'italic', textAlign: 'center',
    },

    memoryRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    },
    memoryText: {
        flex: 1, fontSize: 14, color: '#333', lineHeight: 20,
    },

    skillRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    skillIconBox: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 16,
    },
    skillInfo: {
        flex: 1,
    },
    skillName: {
        fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4,
    },
    skillDesc: {
        fontSize: 13, color: '#666', lineHeight: 18,
    }
});
