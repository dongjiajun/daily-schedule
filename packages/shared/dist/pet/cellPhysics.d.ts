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
/** 落定弹跳初始高度 px（过阻尼衰减，每帧减半） */
export declare const BOUNCE_INITIAL = 4;
/** 落地阶段重力 lerp 系数（更快下落） */
export declare const LANDING_LERP = 0.18;
/** 格内会话兜底上限（绕圈退出为主；须 > 大格子 2 圈预估时长 ~37s，防"没绕完就被踢"） */
export declare const CELL_MAX_SESSION_MS = 45000;
declare function randomRange(min: number, max: number): number;
/**
 * 生成格子四边吸附点：底 3 + 右下角 + 右 2 + 右上角 + 顶 3 + 左上角 + 左 2 + 左下角
 * （共 14 点，顺时针绕边，四角转角点衔接——每段移动都在同一边或紧邻角点，不斜穿格内）。
 * 角点 edge 归"进入该角的边"：换边旋转发生在下一段（目标点换边）时，与移动方向一致。
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
 * 落地吸附：enter 阶段把水平位置对齐到最近底边吸附点（返回 x 对齐的点，y 保持），
 * 使宠物"落向底边吸附点正上方"，落地即与绕边路径衔接。
 */
export declare function landSnap(pos: Position, edges: CellClingPoint[]): Position;
/**
 * 吸附滑入速度：距目标 < 12px 时加速 ×1.6（"被吸过去"的观感），
 * 配合到位吸附产生滑入→落定的过程感。
 */
export declare function slideInSpeed(baseSpeed: number, dist: number): number;
/**
 * 重力下沉：y 向底边 lerp（模拟重力），水平不变。
 * 仅在落地（enter/landing）阶段使用——贴边停留阶段位置必须稳定（见 cling 契约）。
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
 * ≥50 → 快（60px/s、40% 跳跃、短停留、happy）
 * <50 → 慢（25px/s、不跳跃、长停留、idle_variant）
 * 两种风格均绕行完整四边（含顶边/倒立）；差异仅在速度、跳跃概率、停留时长与情绪。
 */
export declare function createCellStyle(completion: number): CellStyle;
/**
 * 格内互动圈数退出阈值：rounds × 吸附点数（访问点数计数）。
 * 默认 2 圈（完整两遍四边，用户对"圈数"感知明确）。
 */
export declare function cellLapTarget(edgesLength: number, rounds?: number): number;
export { randomRange };
//# sourceMappingURL=cellPhysics.d.ts.map