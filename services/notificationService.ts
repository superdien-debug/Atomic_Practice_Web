import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { userService } from './userService';
import { practiceService } from './practiceService';

const EDUCATIONAL_MESSAGES = [
    "Thực hành giáo pháp hàng ngày giúp chuyển hóa tâm thức và mang lại bình an đích thực. 🙏",
    "Một giây phút chánh niệm là một giây phút giải thoát. Hãy dành thời gian cho việc thực hành của bạn. ✨",
    "Sự tinh tấn trong thực hành là chìa khóa để đạt được tuệ giác và từ bi. ☸️",
    "Thực hành không chỉ là ngồi thiền, mà là mang giáo pháp vào từng hơi thở và hành động. ❤️",
    "Tâm như một mảnh vườn, thực hành là việc tưới tẩm những hạt giống thiện lành mỗi ngày. 🌱",
    "Tầm quan trọng của thực hành không nằm ở số lượng, mà ở sự đều đặn và tâm chân thành. 🙏",
    "Hãy nhớ rằng mỗi biến chú bạn trì tụng đều góp phần vào lợi lạc của bản thân và chúng sinh. 🌟",
    "Sự tĩnh lặng từ thực hành sẽ giúp bạn đối diện với mọi sóng gió của cuộc đời một cách điềm tĩnh nhất. 🌊"
];
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const notificationService = {
    /**
     * Initial setup for notifications
     */
    async init() {
        // Placeholder for any initial logic
    },

    /**
     * Request permissions and setup channel for Android
     */
    async registerForPushNotificationsAsync() {
        if (Platform.OS === 'web') return;

        if (!Device.isDevice) {
            console.log('[NotificationService] Must use physical device for Push Notifications');
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('[NotificationService] Failed to get push token for push notification!');
            return;
        }

        // Skip for Expo Go on Android SDK 53+ to avoid red screen errors
        if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
            console.log('[NotificationService] Skipping push token fetch on Expo Go Android (not supported in SDK 53+)');
        } else {
            // Get the token from Expo
            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                if (!projectId) {
                    console.warn('[NotificationService] No EAS Project ID found. Push notifications might not work.');
                }

                const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
                console.log('[NotificationService] Push Token obtained:', token);

                // Persist the token to Supabase
                await userService.savePushToken(token);
            } catch (error) {
                console.error('[NotificationService] Error getting push token:', error);
            }
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#800000',
            });

            await Notifications.setNotificationChannelAsync('educational', {
                name: 'Educational Tips',
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 100, 100, 100],
                lightColor: '#D4AF37',
            });
        }
    },

    /**
     * Schedule 4 random educational notifications spread throughout the day
     */
    async scheduleEducationalNotifications() {
        if (Platform.OS === 'web') return;

        const slots = [
            { hour: 8, minute: 30 },
            { hour: 12, minute: 30 },
            { hour: 17, minute: 30 },
            { hour: 21, minute: 30 }
        ];

        for (let i = 0; i < slots.length; i++) {
            const msg = EDUCATIONAL_MESSAGES[Math.floor(Math.random() * EDUCATIONAL_MESSAGES.length)];
            const eduId = `edu_${i}`;
            await Notifications.scheduleNotificationAsync({
                identifier: eduId,
                content: {
                    title: "Lời nhắc Thực hành",
                    body: msg,
                    ...({
                        android: {
                            channelId: 'educational',
                        },
                    } as any),
                } as any,
                trigger: {
                    hour: slots[i].hour,
                    minute: slots[i].minute,
                    repeats: true,
                    channelId: 'educational',
                } as any,
            });
        }
        console.log('[NotificationService] Scheduled 4 educational notifications.');
    },

    async schedulePracticeReminder(practiceId: string, title: string, timeStr: string, isCompletedToday: boolean = false) {
        if (Platform.OS === 'web') return;

        // timeStr: "08:30"
        const [hours, minutes] = timeStr.split(':').map(Number);
        const now = new Date();
        const scheduledTimeToday = new Date();
        scheduledTimeToday.setHours(hours, minutes, 0, 0);

        const reminderId = `practice_${practiceId}`;

        // Cancel existing to avoid duplicates
        await Notifications.cancelScheduledNotificationAsync(reminderId);

        await Notifications.scheduleNotificationAsync({
            identifier: reminderId,
            content: {
                title: 'Thực hành Vajrayana 🙏',
                body: `Đã đến lúc thực hành: ${title}`,
                data: { practiceId },
            },
            trigger: {
                hour: hours,
                minute: minutes,
                repeats: true,
                channelId: 'default',
            } as any,
        });

        // If completed today and it hasn't fired yet, cancel it for today
        if (isCompletedToday && scheduledTimeToday > now) {
            await Notifications.cancelScheduledNotificationAsync(reminderId);
        }

        return reminderId;
    },

    /**
     * Reschedules all active practice reminders
     */
    async rescheduleAllPractices(practices: any[]) {
        try {
            await this.cancelAllScheduledNotifications();

            // 1. Educational notifications
            await this.scheduleEducationalNotifications();

            // 2. Individual practices
            for (const practice of practices) {
                if (!practice.is_active || !practice.reminder_times?.length) continue;

                for (const timeStr of practice.reminder_times) {
                    await this.schedulePracticeReminder(practice.id, practice.title, timeStr, !!practice.completed);
                }
            }
            console.log(`[NotificationService] Rescheduled ${practices.length} practices.`);
        } catch (error) {
            console.error('[NotificationService] Reschedule error:', error);
        }
    },

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllScheduledNotifications() {
        if (Platform.OS === 'web') return;

        await Notifications.cancelAllScheduledNotificationsAsync();
    }
};
