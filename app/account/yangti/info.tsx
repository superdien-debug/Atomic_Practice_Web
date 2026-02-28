import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Clock, Target } from 'lucide-react-native';

const VAJRA_BURGUNDY = '#5e0b0b';
const VAJRA_GOLD = '#D4AF37';

export default function YangtiInfoScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-[#Fdfbf7]">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-4 bg-[#5e0b0b] border-b border-[#D4AF37]/20" style={{ paddingTop: Math.max(insets.top, 20) + 10 }}>
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#D4AF37" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-black tracking-wide">Giới thiệu Yangti Nakpo</Text>
                <View className="w-10" />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
                    <Text className="text-2xl font-black text-[#5e0b0b] mb-4">Yangti Nakpo Golden Drop</Text>
                    <Text className="text-sm text-gray-700 leading-6 mb-6">
                        Yangti Nakpo (Giọt Vàng Đen) là một trong những giáo lý Dzogchen (Đại Viên Mãn) thiết yếu và thâm sâu nhất. Đây là một lộ trình thực hành mạnh mẽ mang tính chất đốn ngộ, hướng dẫn hành giả trực tiếp nhận ra bản tâm thanh tịnh của chính mình.
                    </Text>

                    <View className="space-y-4">
                        <View className="flex-row gap-4">
                            <View className="w-10 h-10 rounded-full bg-[#5e0b0b]/10 flex items-center justify-center">
                                <BookOpen size={20} color="#5e0b0b" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-gray-900">Nền Tảng Ngondro</Text>
                                <Text className="text-xs text-gray-500 mt-1">Dọn sạch chướng ngại, chuẩn bị tâm thức thông qua lễ lạy, cúng dường, sám hối.</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-4">
                            <View className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                                <Target size={20} color="#5e0b0b" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-gray-900">Tích Lũy Công Đức</Text>
                                <Text className="text-xs text-gray-500 mt-1">Gắn kết với đạo sư qua Guru Yoga và tích lũy túc số 3Kaya.</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-4">
                            <View className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                                <Clock size={20} color="#10B981" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-gray-900">Mật Điển Bí Mật</Text>
                                <Text className="text-xs text-gray-500 mt-1">Các kỳ nhập thất dài hạn (3 năm 3 tháng) và Thiền bóng tối - tinh tủy cốt tủy.</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="bg-[#5e0b0b] p-6 rounded-3xl mb-8">
                    <Text className="text-[#D4AF37] font-black uppercase tracking-widest text-xs mb-2">Lời Khuyên Cho Hành Giả</Text>
                    <Text className="text-white/90 text-sm leading-6">
                        Hãy đảm bảo bạn đã nhận được khẩu truyền và sự hướng dẫn trực tiếp từ một bậc Đạo Sư đủ phẩm hạnh trước khi bước vào các pháp tu chuyên sâu. Tiến trình Yangti Nakpo được thiết kế theo đúng thứ tự, sự tu tập kiên nhẫn và bền bỉ sẽ mang lại sự chuyển hóa nội tâm sâu sắc.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
