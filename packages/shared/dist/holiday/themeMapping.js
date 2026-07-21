const THEME_MAP = {
    'spring-festival': { primaryColor: '#E63946', secondaryColor: '#FFD700', accentColor: '#8B0000', effectType: 'firework', intensity: 'festive', petAccessory: '年兽皮肤' },
    'christmas': { primaryColor: '#C41E3A', secondaryColor: '#2E8B57', accentColor: '#FFFFFF', effectType: 'snow', intensity: 'festive', petAccessory: '麋鹿角' },
    'halloween': { primaryColor: '#FF6B00', secondaryColor: '#4B0082', accentColor: '#000000', effectType: 'lantern', intensity: 'moderate', petAccessory: '巫师帽' },
    'mid-autumn': { primaryColor: '#D4A017', secondaryColor: '#1B1B5E', accentColor: '#F5E6C8', effectType: 'lantern', intensity: 'moderate', petAccessory: '玉兔皮肤' },
    'dragon-boat': { primaryColor: '#2E7D32', secondaryColor: '#0288D1', accentColor: '#FFD54F', effectType: 'none', intensity: 'subtle', petAccessory: '粽子背包' },
    'valentines': { primaryColor: '#E91E63', secondaryColor: '#FFC0CB', accentColor: '#F8BBD0', effectType: 'heart', intensity: 'moderate' },
    'new-year': { primaryColor: '#C0C0C0', secondaryColor: '#FFD700', accentColor: '#FFFFFF', effectType: 'firework', intensity: 'festive', petAccessory: '新年帽' },
    'thanksgiving': { primaryColor: '#D35400', secondaryColor: '#8B4513', accentColor: '#FFE0B2', effectType: 'leaf', intensity: 'moderate', petAccessory: '火鸡帽' },
    'st-patricks': { primaryColor: '#2E7D32', secondaryColor: '#FFFFFF', accentColor: '#81C784', effectType: 'leaf', intensity: 'subtle', petAccessory: '绿帽子' },
    'sakura': { primaryColor: '#F8BBD0', secondaryColor: '#FFFFFF', accentColor: '#E91E63', effectType: 'petal', intensity: 'moderate', petAccessory: '樱花发饰' },
    'diwali': { primaryColor: '#FFD700', secondaryColor: '#FF6F00', accentColor: '#FF3D00', effectType: 'lantern', intensity: 'festive', petAccessory: '印度象皮肤' },
    'easter': { primaryColor: '#FCE4EC', secondaryColor: '#FFF176', accentColor: '#CE93D8', effectType: 'petal', intensity: 'moderate', petAccessory: '兔耳朵' },
    'christmas-eve': { primaryColor: '#C41E3A', secondaryColor: '#228B22', accentColor: '#FFFFFF', effectType: 'snow', intensity: 'moderate' },
    'lantern-festival': { primaryColor: '#E63946', secondaryColor: '#FFD700', accentColor: '#FF9800', effectType: 'lantern', intensity: 'moderate' },
    'qingming': { primaryColor: '#90A4AE', secondaryColor: '#81C784', accentColor: '#E0E0E0', effectType: 'leaf', intensity: 'subtle' },
    'new-years-eve': { primaryColor: '#C0C0C0', secondaryColor: '#FFD700', accentColor: '#FFFFFF', effectType: 'firework', intensity: 'festive' },
    'world-book-day': { primaryColor: '#5B8C5A', secondaryColor: '#F5DEB3', accentColor: '#8B4513', effectType: 'none', intensity: 'subtle' },
    'world-environment-day': { primaryColor: '#228B22', secondaryColor: '#87CEEB', accentColor: '#FFD700', effectType: 'leaf', intensity: 'subtle' },
};
const FALLBACK_THEME = {
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    accentColor: '#93c5fd',
    effectType: 'none',
    intensity: 'subtle',
};
export function getThemeForHoliday(holidayId) {
    return THEME_MAP[holidayId] ?? FALLBACK_THEME;
}
export { THEME_MAP, FALLBACK_THEME };
//# sourceMappingURL=themeMapping.js.map