import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen() {
    return (
        <View className="flex-1 bg-vajra-cream items-center justify-between py-20 px-6">
            <StatusBar style="dark" />

            {/* Top Section */}
            <View className="items-center mt-10">
                <View className="w-32 h-32 bg-vajra-gold/20 rounded-full items-center justify-center mb-8">
                    <Text className="text-6xl">☸️</Text>
                </View>
                <Text className="text-4xl font-serif font-bold text-vajra-burgundy text-center mb-4">
                    Atomic Vajra
                </Text>
                <Text className="text-vajra-lightGray text-center text-lg px-4">
                    Small steps to Great Awakening.
                    Track your practice, join challenges, and connect with the Sangha.
                </Text>
            </View>

            {/* Community Stats (Mock) */}
            <View className="bg-white px-6 py-4 rounded-2xl shadow-sm w-full items-center">
                <Text className="text-vajra-gold font-bold text-3xl mb-1">1,204</Text>
                <Text className="text-vajra-gray text-sm uppercase tracking-widest">Practitioners Today</Text>
            </View>

            {/* Bottom CTA */}
            <View className="w-full space-y-4">
                <Link href="/auth/signup" asChild>
                    <TouchableOpacity className="w-full bg-vajra-gold py-4 rounded-xl items-center shadow-lg active:opacity-90">
                        <Text className="text-vajra-burgundy font-bold text-xl uppercase tracking-wider">Start Now</Text>
                    </TouchableOpacity>
                </Link>

                <Link href="/auth/login" asChild>
                    <TouchableOpacity className="w-full py-4 items-center">
                        <Text className="text-vajra-burgundy font-medium">I already have an account</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}
