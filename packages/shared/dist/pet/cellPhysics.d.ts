/**
 * 格内物理场 — 纯逻辑，无平台依赖。
 * 贴边行走 / 重力下沉 / 吸附落定 / 跳跃（sin 抛物线）的几何与风格计算。
 * Web (RoamingPet rAF 帧循环) 与小程序 (Canvas) 共享。
 */
export interface Position {
    x: number;
    y: number;
}
/** 四边吸附点（edge 标记所在边） */
export interface CellClingPoint {
    x: number;
    y: number;
    edge: 'top' | 'bottom' | 'left' | 'right';
}
/** 格内风格配置（由完成度决定） */
export interface CellStyle {
    /** 贴边行走速度 px/s */
    walkSpeed: number;
    /** 贴边跳跃概率 0-1 */
    hopChance: number;
    /** 吸附停留时长范围 [min, max] ms */
    clingDuration: [number, number];
    /** 低完成度仅走底边与侧边下半 */
    bottomOnly: boolean;
    /** 情绪：fast=happy / slow=idle_variant */
    emotion: 'happy' | 'idle_variant';
}
declare function randomRange(min: number, max: number): number;
/**
 * 生成格子四边吸附点：上 3 / 下 3 / 左 2 / 右 2（共 10 点，均匀分布、内缩 margin）。
 * bottomOnly 时仅返回底边 3 点 + 左右边下半部 2 点（懒散贴地走）。
 */
export declare function cellEdges(rect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
}, bottomOnly?: boolean): CellClingPoint[];
/**
 * 绕边不回头（环形扫描）：沿边顺序（底→右→上→左）取当前位置之后的下一个未访问吸附点。
 * 保证贴壁行走按顺时针绕圈（不会因重力贴底而总在底边打转）；全部访问后清空重来。
 */
export declare function nextClingPoint(current: Position, edges: CellClingPoint[], visited: Set<CellClingPoint>): CellClingPoint;
/**
 * 吸附判定：距最近吸附点在阈值内时吸附到边线（返回吸附后位置），否则原位置。
 */
export declare function snapToEdge(pos: Position, edges: CellClingPoint[], threshold?: number): {
    pos: Position;
    snapped: boolean;
};
/**
 * 重力下沉：非 walk 状态下 y 向底边 lerp（模拟重力），水平不变。
 */
export declare function applyGravity(pos: Position, rect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
}, margin: number, lerp?: number): Position;
/**
 * sin 抛物线跳跃偏移：t ∈ [0,1] 返回 y 偏移（0 → -height → 0）。
 */
export declare function hopOffset(t: number, height?: number): number;
/**
 * 完成度决定格内风格：
 * ≥50 → 快（60px/s、40% 跳跃、短停留、绕圈、happy）
 * <50 → 慢（25px/s、不跳跃、长停留、贴底边、idle_variant）
 */
export declare function createCellStyle(completion: number): CellStyle;
/**
 * 格内互动总时长上限（状态机强制退出）。
 */
export declare function cellSessionDuration(completion: number): number;
export { randomRange };
//# sourceMappingURL=cellPhysics.d.ts.map