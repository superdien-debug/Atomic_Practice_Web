declare module 'lunar-javascript' {
    export class Lunar {
        static fromDate(date: Date): Lunar;
        getDay(): number;
        getMonth(): number;
        getYear(): number;
        getDayGan(): string;
        getDayZhi(): string;
        getMonthGan(): string;
        getMonthZhi(): string;
        getYearGan(): string;
        getYearZhi(): string;
        getDayPosition(): string;
        getDayTianShen(): string;
        getDayTianShenType(): string;
        getTimeZhi(): string;
        getPositionXiDesc(): string;
        getPositionCaiDesc(): string;
    }

    export class Solar {
        static fromDate(date: Date): Solar;
        getDay(): number;
        getMonth(): number;
        getYear(): number;
    }
}
