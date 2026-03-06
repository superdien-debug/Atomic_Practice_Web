import 'dotenv/config';

export default {
    "expo": {
        "name": "Atomic Practice",
        "slug": "VajrayanaApp",
        "version": "1.0.0",
        "scheme": "atomicpractice",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "userInterfaceStyle": "light",
        "newArchEnabled": true,
        "splash": {
            "image": "./assets/splash-icon.png",
            "resizeMode": "contain",
            "backgroundColor": "#0A0A0F"
        },
        "ios": {
            "supportsTablet": true,
            "bundleIdentifier": "com.atomicpractice.app",
            "infoPlist": {
                "UIBackgroundModes": [
                    "remote-notification"
                ],
                "ITSAppUsesNonExemptEncryption": false
            }
        },
        "android": {
            "package": "com.atomicpractice.app",
            "versionCode": 1,
            "adaptiveIcon": {
                "foregroundImage": "./assets/adaptive-icon.png",
                "backgroundColor": "#0A0A0F"
            },
            "edgeToEdgeEnabled": true,
            "predictiveBackGestureEnabled": false
        },
        "web": {
            "favicon": "./assets/favicon.png"
        },
        "plugins": [
            "expo-router",
            "expo-asset",
            [
                "expo-notifications",
                {
                    "icon": "./assets/notification-icon.png",
                    "color": "#800000",
                    "sounds": [],
                    "mode": "production",
                    "androidMode": "default",
                    "androidCollapsedTitle": "Atomic Practice"
                }
            ]
        ],
        "extra": {
            "router": {},
            "eas": {
                "projectId": "e9bdb298-63cc-4dd1-b9ea-29920a4da2b1"
            },
            "supabaseUrl": process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
            "supabaseAnonKey": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
    }
};
