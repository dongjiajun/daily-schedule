export interface Holiday {
    id: string;
    name: string;
    englishName: string;
    layer: HolidayLayer;
    category: HolidayCategory;
    priority: number;
    dateRange: [string, string];
    locale?: string[];
    theme?: HolidayTheme;
}
export declare const HolidayLayer: {
    readonly FIXED_SOLAR: "FIXED_SOLAR";
    readonly FLOATING_SOLAR: "FLOATING_SOLAR";
    readonly LUNAR: "LUNAR";
    readonly REGIONAL: "REGIONAL";
};
export type HolidayLayer = (typeof HolidayLayer)[keyof typeof HolidayLayer];
export type HolidayCategory = 'TRADITIONAL' | 'RELIGIOUS' | 'SECULAR' | 'REGIONAL';
export interface HolidayTheme {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    effectType: EffectType;
    intensity: 'subtle' | 'moderate' | 'festive';
    petAccessory?: string;
}
export type EffectType = 'firework' | 'snow' | 'petal' | 'leaf' | 'lantern' | 'heart' | 'none';
//# sourceMappingURL=types.d.ts.map