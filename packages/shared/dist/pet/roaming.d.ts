/**
 * 宠物游走引擎 — 纯逻辑，无平台依赖。
 * Web (framer-motion) 和小程序 (Canvas) 共享。
 */
export interface Position {
    x: number;
    y: number;
}
export interface RoamingConfig {
    /** 视口尺寸 */
    viewport: {
        width: number;
        height: number;
    };
    /** 需要避让的矩形区域（如日历网格 .rbc-month-view） */
    avoidZones: AvoidZone[];
    /** 预设休息点 */
    restingSpots: Position[];
    /** 安全边距（距视口边缘的距离） */
    padding: number;
}
export interface AvoidZone {
    /** 矩形边界（相对于视口） */
    rect: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    /** 避让强度: "soft" 降低概率但仍可能进入，"hard" 完全禁止进入 */
    strength: 'soft' | 'hard';
}
/** 区域类型：user-interaction（用户交互）/ pet-spot（宠物专属区域）/ calendar-cell（日历格子） */
export type ZoneType = 'user-interaction' | 'pet-spot' | 'calendar-cell';
/** calendar-cell Zone 的完成度负载：当天日程完成度 */
export interface CalendarCellPayload {
    /** 日期标识（YYYY-MM-DD） */
    date: string;
    /**
     * 当天完成度百分比（0-100 整数，COMPLETED / total）。
     * null = 当天无日程（无压力 → 快风格），0 = 有日程但全部未完成（→ 慢风格）。
     */
    completion: number | null;
}
/**
 * 各 Zone 类型的数据负载结构。
 * 编译期约束：calendar-cell 必须携带完成度；其余类型无负载。
 */
export type ZonePayload = {
    'user-interaction': undefined;
    'pet-spot': undefined;
    'calendar-cell': CalendarCellPayload;
};
/**
 * 类型化区域（Zone）— 替代原 InterestPoint。
 * 矩形 + 类型 + 数据负载，供区域感知机制消费。
 */
export interface Zone<T extends ZoneType = ZoneType> {
    id: string;
    type: T;
    /** 矩形边界（相对于视口） */
    rect: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    /** 数据负载（按类型收紧：calendar-cell 携带完成度，其余无） */
    payload?: ZonePayload[T];
    /** 吸引力权重 (0-1) */
    weight: number;
    /** ms 后吸引力衰减至 0 的时间 */
    decayTime?: number;
    createdAt?: number;
}
export type RoamingMode = 'wandering' | 'attracted' | 'resting' | 'idle';
/**
 * 将坐标 clamp 到视口安全区域内。
 */
export declare function clampToViewport(pos: Position, config: RoamingConfig): Position;
/**
 * 判断点是否在给定矩形内。
 */
export declare function isInsideRect(pos: Position, rect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
}): boolean;
/**
 * 避让区域处理：如果目标点在硬避让区内，移动到最近的合法位置。
 */
export declare function avoidZones(pos: Position, zones: AvoidZone[]): Position;
/**
 * 是否在软避让区域内（降低概率）。
 */
export declare function isInSoftZone(pos: Position, zones: AvoidZone[]): boolean;
/**
 * 确定游走模式。
 */
export declare function determineMode(params: {
    lastInteractionAt: number;
    hasActiveZone: boolean;
    isNightTime: boolean;
}): RoamingMode;
/**
 * 随机漫步：生成随机目标点，避开硬避让区。
 * soft 权重化（Decision 8）：30% 概率全域采样（保证视口覆盖）+ 70% 局部漂移（自然漫游）；
 * 目标落入 soft 避让区时 50% 概率接受——soft 是降频区而非排斥墙，消除方向性边缘排斥。
 */
export declare function computeWanderTarget(current: Position, config: RoamingConfig): Position;
/**
 * 兴趣点吸引：目标 = 兴趣点中心（含细微随机偏移防重叠）。
 * 停在"兴趣点边缘"会导致宠物永远不进入日历格子（格内物理依赖 isInsideRect），
 * 点击/悬停格子后宠物必须真正走进格子区域。
 */
export declare function computeAttractedTarget(_current: Position, interestPoint: Position, config: RoamingConfig): Position;
/**
 * 休息点选择：选择最近的休息点。
 */
export declare function computeRestingTarget(current: Position, restingSpots: Position[]): Position;
/**
 * 计算 Zone 的几何中心。
 */
export declare function zoneCenter(zone: Zone): Position;
/**
 * 游走主入口：根据模式计算下一个目标位置。
 */
export declare function computeNextTarget(current: Position, config: RoamingConfig, mode: RoamingMode, options?: {
    /** 活跃区域（attracted 模式使用） */
    activeZone?: Zone;
}): Position;
/**
 * 生成随机游走间隔 (ms)。
 */
export declare function randomWanderInterval(): number;
/**
 * 生成随机移动时长 (ms)。
 * @param speedMultiplier 情绪影响：happy=1.5 (更快), sad=0.5 (更慢), default=1
 */
export declare function randomMoveDuration(speedMultiplier?: number): number;
/**
 * 计算当前面向方向。
 */
export declare function computeFacing(currentX: number, targetX: number): 'left' | 'right';
/**
 * 创建默认配置。
 */
export declare function createDefaultConfig(viewportWidth: number, viewportHeight: number): RoamingConfig;
//# sourceMappingURL=roaming.d.ts.map