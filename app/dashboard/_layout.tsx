import { Tabs } from 'expo-router';
import { Home, ListTodo, Trophy, User, Dices } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../../i18n/useT';
import { notificationService } from '../../services/notificationService';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

const TabIconWithBadge = ({ Icon, color, showBadge }: { Icon: any, color: string, showBadge?: boolean }) => (
    <View style={{ width: 24, height: 24 }}>
        <Icon size={24} color={color} />
        {showBadge && (
            <View
                style={{
                    position: 'absolute',
                    right: -2,
                    top: -2,
                    backgroundColor: '#D4AF37',
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    borderWidth: 1.5,
                    borderColor: '#800000'
                }}
            />
        )}
    </View>
);

export default function DashboardLayout() {
    const t = useT();

    // Mock logic for "new" content - In a real app, this would come from a store or API
    const hasNewPractice = true;
    const hasNewChallenge = false;

    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            notificationService.init();
            notificationService.registerForPushNotificationsAsync();
        }
    }, [user]);

    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#D4AF37',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
                tabBarStyle: {
                    backgroundColor: '#800000',
                    borderTopWidth: 0,
                    height: 60 + insets.bottom,
                    paddingBottom: 8 + insets.bottom,
                },
                tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            }}
        >
            <Tabs.Screen name="index" options={{ title: t('tabHome'), tabBarIcon: ({ color }) => <Home size={24} color={color} /> }} />
            <Tabs.Screen
                name="practice"
                options={{
                    title: t('tabPractice'),
                    tabBarIcon: ({ color }) => <TabIconWithBadge Icon={ListTodo} color={color} showBadge={hasNewPractice} />
                }}
            />
            <Tabs.Screen
                name="rebird"
                options={{
                    title: "Tái Sinh",
                    tabBarIcon: ({ color }) => <Dices size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="challenge"
                options={{
                    title: t('tabChallenges'),
                    tabBarIcon: ({ color }) => <TabIconWithBadge Icon={Trophy} color={color} showBadge={hasNewChallenge} />
                }}
            />
            <Tabs.Screen name="account" options={{ title: t('tabAccount'), tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
            {/* Hidden screens from Tab Bar */}
            <Tabs.Screen name="mara-battle" options={{ href: null }} />
            <Tabs.Screen name="samsara-map" options={{ href: null }} />
        </Tabs>
    );
}

