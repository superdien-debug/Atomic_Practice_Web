import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
    title: string;
    backgroundColor?: string;
    tintColor?: string;
}

export const ScreenHeader = ({
    title,
    backgroundColor = '#5e0b0b',
    tintColor = '#fff'
}: ScreenHeaderProps) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[
            styles.container,
            {
                backgroundColor,
                paddingTop: insets.top,
                height: (Platform.OS === 'ios' ? 44 : 56) + insets.top
            }
        ]}>
            <View style={styles.content}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={24} color={tintColor} />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: tintColor }]} numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                {/* Spacer for centering */}
                <View style={styles.backButton} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
