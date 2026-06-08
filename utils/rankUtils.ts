export type RankInfo = {
    level: number;
    title: string;
    threshold: number;
    color: string;
    secondaryColor: string;
    borderWidth: number;
    isGlowing: boolean;
    labelColor: string;
};

export const MIN_CREATION_SCORE = 5000;

export const RANKS: RankInfo[] = [
    {
        level: 1,
        title: 'Lv1. Nô Bộc',
        threshold: 0,
        color: '#717171', // Stone Gray
        secondaryColor: '#A3A3A3',
        borderWidth: 1,
        isGlowing: false,
        labelColor: '#525252',
    },
    {
        level: 2,
        title: 'Lv2. Cầu Đạo',
        threshold: 500,
        color: '#B45309', // Bronze/Amber
        secondaryColor: '#F59E0B',
        borderWidth: 1,
        isGlowing: false,
        labelColor: '#92400E',
    },
    {
        level: 3,
        title: 'Lv3. Hành Giả',
        threshold: 2500,
        color: '#059669', // Jade/Emerald
        secondaryColor: '#34D399',
        borderWidth: 1.5,
        isGlowing: false,
        labelColor: '#065F46',
    },
    {
        level: 4,
        title: 'Lv4. Tự Chủ Giả',
        threshold: 10000,
        color: '#2563EB', // Sapphire/Blue
        secondaryColor: '#60A5FA',
        borderWidth: 1.5,
        isGlowing: false,
        labelColor: '#1E40AF',
    },
    {
        level: 5,
        title: 'Lv5. Tu Sĩ Nội Tâm',
        threshold: 50000,
        color: '#7C3AED', // Amethyst/Purple
        secondaryColor: '#A78BFA',
        borderWidth: 2,
        isGlowing: false,
        labelColor: '#5B21B6',
    },
    {
        level: 6,
        title: 'Lv6. Hộ Đạo',
        threshold: 200000,
        color: '#DC2626', // Ruby/Red
        secondaryColor: '#F87171',
        borderWidth: 2,
        isGlowing: true,
        labelColor: '#991B1B',
    },
    {
        level: 7,
        title: 'Lv7. Dẫn Đạo',
        threshold: 1000000,
        color: '#0891B2', // Diamond/Cyan
        secondaryColor: '#22D3EE',
        borderWidth: 2.5,
        isGlowing: true,
        labelColor: '#155E75',
    },
    {
        level: 8,
        title: 'Lv8. Phụng Đạo',
        threshold: 5000000,
        color: '#D4AF37', // Pure Gold
        secondaryColor: '#FDE047',
        borderWidth: 3,
        isGlowing: true,
        labelColor: '#854D0E',
    },
    {
        level: 9,
        title: 'Lv9. Thượng Nhân',
        threshold: 20000000,
        color: '#800000', // Monastery Red
        secondaryColor: '#D4AF37', // Gold highlights
        borderWidth: 4,
        isGlowing: true,
        labelColor: '#450A0A',
    },
];

export function getRank(points: number): RankInfo {
    // Reverse find the first rank where threshold is met
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (points >= RANKS[i].threshold) {
            return RANKS[i];
        }
    }
    return RANKS[0];
}
