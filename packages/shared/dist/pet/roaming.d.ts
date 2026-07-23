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
    /** 兴趣点：位置 + 吸引力权重 (0-1) */
    interestPoints: InterestPoint[];
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
export interface InterestPoint {
    position: Position;
    weight: number;
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
    hasActiveInterestPoint: boolean;
    isNightTime: boolean;
}): RoamingMode;
/**
 * 随机漫步：在视口内生成随机目标点，避开硬避让区。
 * 若目标落入软避让区，60% 概率重新生成。
 */
export declare function computeWanderTarget(current: Position, config: RoamingConfig): Position;
/**
 * 兴趣点吸引：向兴趣点靠近 ATTRACTION_DISTANCE 的位置。
 */
export declare function computeAttractedTarget(current: Position, interestPoint: Position, config: RoamingConfig): Position;
/**
 * 休息点选择：选择最近的休息点。
 */
export declare function computeRestingTarget(current: Position, restingSpots: Position[]): Position;
/**
 * 游走主入口：根据模式计算下一个目标位置。
 */
export declare function computeNextTarget(current: Position, config: RoamingConfig, mode: RoamingMode, options?: {
    /** 特定兴趣点（attracted 模式使用） */
    activeInterestPoint?: Position;
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