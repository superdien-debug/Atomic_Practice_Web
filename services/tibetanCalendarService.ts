import { Lunar, Solar } from 'lunar-javascript';
// @ts-ignore
import { getZangli } from '../lib/zangli';

export type HaircutEffect = {
    isGood: boolean;
    description: string;
};

export type CalendarDayInfo = {
    date: Date;
    dayOfWeek: string;
    solarDay: number;
    solarMonth: number;
    solarYear: number;
    lunarDay: number;
    lunarMonth: number;
    lunarYear: string;
    lunarDayName: string; // e.g. Canh Ngọ
    lunarMonthName: string; // e.g. Canh Dần
    zodiacDay: string; // e.g. Bạch Hổ Hắc Đạo
    auspiciousSymbol: string;
    auspiciousSymbolImage?: any;
    goodHours: string[];
    haircut: HaircutEffect;
    actionAdvice: {
        good: string[];
        bad: string[];
    };
    travelDirection: string;
    holyDayMarker: string | null;
    holyDayImage?: any;
    quote: string;
    elementCombo: string;
    elementComboDesc: string;
};

// Simplified translation mapping for Lịch Tạng
const HAIRCUT_EFFECTS: Record<number, HaircutEffect> = {
    1: { isGood: false, description: 'Đoản thọ (Rút ngắn tuổi thọ)' },
    2: { isGood: false, description: 'Thị phi, điều tiếng' },
    3: { isGood: true, description: 'Phú quý, tài lộc' },
    4: { isGood: true, description: 'Tăng cường oai quang, sắc vóc' },
    5: { isGood: true, description: 'Tăng trưởng của cải' },
    6: { isGood: false, description: 'Suy giảm sinh khí, ráng sắc' },
    7: { isGood: false, description: 'Kiện tụng, rắc rối pháp lý' },
    8: { isGood: true, description: 'Trường thọ, sống lâu' },
    9: { isGood: true, description: 'Tốt lành, gặp gỡ duyên tốt' },
    10: { isGood: true, description: 'Tăng trưởng niềm vui, an lạc' },
    11: { isGood: true, description: 'Tăng trưởng trí tuệ rực rỡ' },
    12: { isGood: false, description: 'Đe dọa mạng sống, nghèo đói' },
    13: { isGood: true, description: 'Trường thọ, thêm điềm lành' },
    14: { isGood: true, description: 'Tăng trưởng tài vận, phước báo' },
    15: { isGood: true, description: 'Đại Cát Tường' },
    16: { isGood: false, description: 'Bất lợi, trở ngại' },
    17: { isGood: false, description: 'Giảm sút thị lực' },
    18: { isGood: false, description: 'Thất tài, mất của' },
    19: { isGood: true, description: 'Trường thọ, thêm công đức' },
    20: { isGood: false, description: 'Dễ bị đói khát, túng thiếu' },
    21: { isGood: false, description: 'Dễ mắc bệnh lây nhiễm' },
    22: { isGood: false, description: 'Mắc bệnh tật' },
    23: { isGood: true, description: 'Tài lộc dư dật' },
    24: { isGood: false, description: 'Bệnh về mắt' },
    25: { isGood: false, description: 'Bại hoại sắc diện' },
    26: { isGood: true, description: 'An lạc, hạnh phúc' },
    27: { isGood: true, description: 'Niềm vui, điềm lành' },
    28: { isGood: false, description: 'Dễ dẫn đến cãi vã' },
    29: { isGood: false, description: 'Mất năng lượng, tránh cắt tóc' },
    30: { isGood: true, description: 'Thanh tịnh ác nghiệp, che chở bảo vệ' }
};

const HOLY_DAYS: Record<number, { name: string; image: any }> = {
    8: { name: 'Ngày vía Đức Phật Dược Sư / Tara', image: require('../calendar_images/Duc_Phat_Duoc_Su.jpg') },
    10: { name: 'Ngày vía Đức Liên Hoa Sanh (Guru Rinpoche)', image: require('../calendar_images/Duc_Guru_Rinpoche.jpg') },
    15: { name: 'Ngày rằm (Phật A Di Đà)', image: require('../calendar_images/Duc_Phat_A_Di_Da.jpg') },
    18: { name: 'Ngày vía Đức Phật Quan Âm', image: require('../calendar_images/Duc_Quan_Am.jpg') },
    21: { name: 'Ngày vía Đức Phật Bất Động', image: require('../calendar_images/Duc_Phat_Bat_Dong.jpg') },
    23: { name: 'Ngày vía Đại Nhật Như Lai', image: require('../calendar_images/Dai_Nhat_Nhu_Lai.jpg') },
    24: { name: 'Ngày vía Đức Phật Phổ Hiền Vương', image: require('../calendar_images/Duc_Phat_Pho_Hien.jpg') },
    25: { name: 'Ngày vía Dakini', image: require('../calendar_images/Dakini.jpg') },
    28: { name: 'Ngày vía Ngũ Trí Như Lai', image: require('../calendar_images/Ngu_Tri_Phat_Nhu_Lai.jpg') },
    29: { name: 'Ngày vía Hộ Pháp', image: require('../calendar_images/Ho_Phap.jpg') },
    30: { name: 'Ngày vía Đức Phật Thích Ca (Cuối tháng)', image: require('../calendar_images/Duc_Phat_Thich_Ca_Mau_Ni.jpg') }
};

const AUSPICIOUS_SYMBOLS = [
    { name: 'Bánh xe Pháp', image: require('../calendar_images/Banh_Xe_Phap_Luan.jpg') },
    { name: 'Hoa Sen', image: require('../calendar_images/Hoa_Sen_Xanh.jpg') },
    { name: 'Cờ Chiến Thắng', image: require('../calendar_images/Co_Chien_Thang.jpg') },
    { name: 'Nút Thắt Vô Tận', image: require('../calendar_images/Nut_Cat_Tuong.jpg') },
    { name: 'Lọng Bảo Cái', image: require('../calendar_images/Long_bau.jpg') },
    { name: 'Cặp Cá Vàng', image: require('../calendar_images/Ca_vang.jpg') },
    { name: 'Bình Phong Thủy', image: require('../calendar_images/Bao_Binh.jpg') },
    { name: 'Ốc Biển', image: require('../calendar_images/Oc_bau.jpg') }
];

const QUOTES = [
    'Người ngu nghĩ là ngọt, Khi ác chưa chín muồi; Ác nghiệp chín muồi rồi, Người ngu chịu khổ đau. ~ Kinh Pháp Cú ~',
    'Không làm mọi điều ác, Thành tựu các hạnh lành, Giữ tâm ý trong sạch, Chính lời chư Phật dạy. ~ Kinh Pháp Cú ~',
    'Lấy không giận thắng giận, Lấy thiện thắng không thiện, Lấy thí thắng xan tham, Lấy chân thắng vọng ngữ. ~ Kinh Pháp Cú ~',
    'Một lời nói chân thật, Làm cho người bình an, Hơn ngàn lời sáo rỗng, Chỉ mang lại dối gian. ~ Kinh Pháp Cú ~'
];

// Helper to translate position to Vietnamese
const TRANSLATE_POS: Record<string, string> = {
    '东': 'Đông', '南': 'Nam', '西': 'Tây', '北': 'Bắc',
    '东南': 'Đông Nam', '东北': 'Đông Bắc', '西南': 'Tây Nam', '西北': 'Tây Bắc',
    '中': 'Trung Tâm'
};

// Helper for Vietnamese Ganzhi mappings
const GAN_VI: Record<string, string> = { '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu', '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý' };
const ZHI_VI: Record<string, string> = { '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ', '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi' };
const TS_VI: Record<string, string> = { '黄道': 'Hoàng Đạo', '黑道': 'Hắc Đạo' };

const TIBETAN_MONTH_NAMES_VI: Record<string, string> = {
    '神变': 'Thần Biến',
    '苦行': 'Khổ Hạnh',
    '具香': 'Câu Hương',
    '萨嘎': 'Saga Dawa',
    '作净': 'Tác Tịnh',
    '明净': 'Minh Tịnh',
    '具醉': 'Câu Túy',
    '具贤': 'Câu Hiền',
    '天降': 'Thiên Giáng',
    '持众': 'Trì Chúng',
    '庄严': 'Trang Nghiêm',
    '满意': 'Mãn Ý'
};

function translateGanZhi(cnGanZhi: string): string {
    if (!cnGanZhi || cnGanZhi.length < 2) return cnGanZhi;
    return `${GAN_VI[cnGanZhi[0]] || cnGanZhi[0]} ${ZHI_VI[cnGanZhi[1]] || cnGanZhi[1]}`;
}

export const tibetanCalendarService = {
    getCalendarData(date: Date = new Date()): CalendarDayInfo {
        const solar = Solar.fromDate(date);
        const lunar = Lunar.fromDate(date);

        // Zangli logic for Tibetan Date
        let tDay = lunar.getDay();
        let tMonthNameCn = `${lunar.getMonthGan()} ${lunar.getMonthZhi()}`;

        try {
            const zangliData: any = getZangli(date);
            if (zangliData && zangliData !== "error" && zangliData.value !== "error") {
                tDay = Math.max(1, zangliData.numericDay); // fallback in case of floating/leap

                let rawMonthName = zangliData.tMonth;
                if (zangliData.monthLeap) rawMonthName = rawMonthName.replace("闰", "");

                if (TIBETAN_MONTH_NAMES_VI[rawMonthName]) {
                    tMonthNameCn = (zangliData.monthLeap ? "Nhuận " : "") + TIBETAN_MONTH_NAMES_VI[rawMonthName];
                } else {
                    tMonthNameCn = rawMonthName;
                }
            }
        } catch (e) {
            console.error('Zangli error', e);
        }

        // 1. Holy Day check (using Tibetan day)
        const holyDayObj = HOLY_DAYS[tDay] || null;

        // 2. Haircut check (using Tibetan day)
        const haircut = HAIRCUT_EFFECTS[tDay] || { isGood: false, description: 'Không có thông tin' };

        // 3. Elements Combination (Đại của ngày)
        let elementCombo = '';
        let elementComboDesc = '';
        try {
            const cosmicDb = require('../cosmic_calendar_db.json');

            // A. Day of week element
            const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon ...
            const dayElementMap: Record<number, string> = {
                0: 'Hỏa',  // Sun
                1: 'Thủy', // Mon
                2: 'Hỏa',  // Tue
                3: 'Thủy', // Wed
                4: 'Không',// Thu (Phong/Không)
                5: 'Địa',  // Fri
                6: 'Địa'   // Sat
            };
            const planetElement = dayElementMap[dayOfWeek];

            // B. Lunar Mansion (Xiu) Element
            // Mapping 28 Chinese constellations to Tibetan Elements (approximated)
            const xiu = (lunar as any).getXiu();
            // Chinese Xiu directly correlated to Nakshatra elements:
            const win = ['心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁']; // Wind / Space (Không)
            const ear = ['奎', '娄', '胃', '昴', '毕']; // Earth (Địa)
            const wat = ['觜', '参', '井', '鬼', '柳', '星', '张']; // Water (Thủy)
            const fir = ['翼', '轸', '角', '亢', '氐', '房']; // Fire (Hỏa)

            let xiuElement = 'Địa'; // Default
            if (win.includes(xiu)) xiuElement = 'Không';
            else if (ear.includes(xiu)) xiuElement = 'Địa';
            else if (wat.includes(xiu)) xiuElement = 'Thủy';
            else if (fir.includes(xiu)) xiuElement = 'Hỏa';

            const combo1 = `${planetElement} - ${xiuElement}`;
            const combo2 = `${xiuElement} - ${planetElement}`; // Reverse check

            const elementsDb = cosmicDb.elements;

            // Try to find the matching combination in DB
            elementCombo = `${planetElement} - ${xiuElement}`; // e.g. Địa - Hỏa
            elementComboDesc = elementsDb[combo1] || elementsDb[combo2] || 'Chưa rõ thông tin kết hợp đại.';
        } catch (e) {
            console.error('Error calculating element combo', e);
        }

        // 4. Dos / Don'ts
        let tsInfo = 'Hoàng Đạo';
        try {
            const tianShenType = lunar.getDayTianShenType(); // "黄道" or "黑道"
            tsInfo = `${TS_VI[tianShenType] || tianShenType}`;
        } catch (e) { }

        // 4. Good Hours / Giờ Hoàng Đạo
        let goodHoursList: string[] = [];
        try {
            const zhiHourMap: Record<string, string> = {
                '子': 'Tý (23h-1h)', '丑': 'Sửu (1h-3h)', '寅': 'Dần (3h-5h)',
                '卯': 'Mão (5h-7h)', '辰': 'Thìn (7h-9h)', '巳': 'Tỵ (9h-11h)',
                '午': 'Ngọ (11h-13h)', '未': 'Mùi (13h-15h)', '申': 'Thân (15h-17h)',
                '酉': 'Dậu (17h-19h)', '戌': 'Tuất (19h-21h)', '亥': 'Hợi (21h-23h)'
            };
            const times = (lunar as any).getTimes();
            goodHoursList = times
                .filter((t: any) => t.getTianShenType() === '黄道')
                .map((t: any) => zhiHourMap[t.getZhi()] || t.getZhi());
            // Filter duplicates out (e.g. initial and late Zi branch issue)
            goodHoursList = Array.from(new Set(goodHoursList));
        } catch (e) {
            goodHoursList = ['Tý (23h-1h)', 'Sửu (1h-3h)', 'Mão (5h-7h)', 'Ngọ (11h-13h)', 'Thân (15h-17h)', 'Dậu (17h-19h)']; // Fallback
        }

        const lG = lunar.getDayGan(); const lZ = lunar.getDayZhi();
        const lG_m = lunar.getMonthGan(); const lZ_m = lunar.getMonthZhi();
        const lG_y = lunar.getYearGan(); const lZ_y = lunar.getYearZhi();

        const dayName = `${GAN_VI[lG] || lG} ${ZHI_VI[lZ] || lZ}`;
        const monthName = `${GAN_VI[lG_m] || lG_m} ${ZHI_VI[lZ_m] || lZ_m}`;
        const yearName = `${GAN_VI[lG_y] || lG_y} ${ZHI_VI[lZ_y] || lZ_y}`;

        // Symbol cyclical based on day
        const symbolObj = AUSPICIOUS_SYMBOLS[(tDay + lunar.getMonth()) % AUSPICIOUS_SYMBOLS.length];

        // Quote
        const quoteIndex = (lunar.getDay()) % QUOTES.length;

        // Actions
        const goodActions = ['Cầu nguyện', 'Trì chú', 'Làm việc thiện', 'Ăn chay', 'Phóng sinh'];
        const badActions = ['Sát sinh', 'Cãi vã', 'Uống rượu', 'Tức giận'];

        // Travel direction
        let direction = 'Hướng tốt: Đông Nam';
        try {
            const xiPos = lunar.getPositionXiDesc();
            const caiPos = lunar.getPositionCaiDesc();
            direction = `${TRANSLATE_POS[xiPos] || xiPos} (Hỷ thần), ${TRANSLATE_POS[caiPos] || caiPos} (Tài thần)`;
        } catch (e) { }

        return {
            date,
            dayOfWeek: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][date.getDay()],
            solarDay: solar.getDay(),
            solarMonth: solar.getMonth(),
            solarYear: solar.getYear(),
            lunarDay: tDay,
            lunarMonth: lunar.getMonth(),
            lunarYear: yearName,
            lunarDayName: dayName,
            lunarMonthName: tMonthNameCn,
            zodiacDay: tsInfo,
            auspiciousSymbol: holyDayObj ? holyDayObj.name : ('Biểu tượng: ' + symbolObj.name),
            auspiciousSymbolImage: holyDayObj ? holyDayObj.image : symbolObj.image,
            goodHours: goodHoursList,
            haircut,
            actionAdvice: {
                good: goodActions,
                bad: badActions
            },
            travelDirection: direction,
            holyDayMarker: holyDayObj ? holyDayObj.name : null,
            holyDayImage: holyDayObj ? holyDayObj.image : undefined,
            quote: QUOTES[quoteIndex],
            elementCombo,
            elementComboDesc
        };
    },

    getMonthlyData(year: number, month: number): CalendarDayInfo[] {
        const daysInMonth = new Date(year, month, 0).getDate();
        const days: CalendarDayInfo[] = [];

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(this.getCalendarData(new Date(year, month - 1, i)));
        }

        return days;
    }
};
