/**
 * 格内物理场 — 纯逻辑，无平台依赖。
 * 贴边行走 / 重力下沉 / 吸附落定 / 跳跃（sin 抛物线）的几何与风格计算。
 * Web (RoamingPet rAF 帧循环) 与小程序 (Canvas) 共享。
 */
// ── 常量 ─────────────────────────────────────────────────
const EDGE_MARGIN_RATIO = 0.06; // 吸附点距边的内缩比例（贴近格子可视边界，避免绕行矩形明显小于格子）
const HOP_HEIGHT = 10; // 跳跃高度 px
const CLING_SNAP_DISTANCE = 8; // 吸附判定距离 px
const GRAVITY_LERP = 0.08; // 重力下沉 lerp 系数（每帧）
const SLIDE_DISTANCE = 12; // 吸附滑入距离阈值 px
const SLIDE_SPEED_MULT = 1.6; // 滑入加速倍率
/** 落定弹跳初始高度 px（过阻尼衰减，每帧减半） */
export const BOUNCE_INITIAL = 4;
/** 落地阶段重力 lerp 系数（更快下落） */
export const LANDING_LERP = 0.18;
/** 格内会话兜底上限（绕圈退出为主；须 > 大格子 2 圈预估时长 ~37s，防"没绕完就被踢"） */
export const CELL_MAX_SESSION_MS = 45_000;
// ── 工具 ─────────────────────────────────────────────────
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}
// ── 吸附点采样 ───────────────────────────────────────────
/**
 * 生成格子四边吸附点：底 3 + 右下角 + 右 2 + 右上角 + 顶 3 + 左上角 + 左 2 + 左下角
 * （共 14 点，顺时针绕边，四角转角点衔接——每段移动都在同一边或紧邻角点，不斜穿格内）。
 * 角点 edge 归"进入该角的边"：换边旋转发生在下一段（目标点换边）时，与移动方向一致。
 * bottomOnly 时仅返回底边 3 点 + 左右边下半部 2 点（懒散贴地走）。
 */
export function cellEdges(rect, bottomOnly = false) {
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const marginX = width * EDGE_MARGIN_RATIO;
    const marginY = height * EDGE_MARGIN_RATIO;
    const points = [];
    // 底边（3 点，左→右）
    for (let i = 0; i < 3; i++) {
        const t = (i + 1) / 4;
        points.push({ x: rect.left + width * t, y: rect.bottom - marginY, edge: 'bottom' });
    }
    if (bottomOnly) {
        // 侧边下半部各 1 点（贴地懒散）：右 → 左
        points.push({ x: rect.right - marginX, y: rect.bottom - height * 0.3, edge: 'right' });
        points.push({ x: rect.left + marginX, y: rect.bottom - height * 0.3, edge: 'left' });
        return points;
    }
    // 四角转角点。edge 归"离开该角的边"：偏移与旋转都按"转弯后的边"计算，
    // 转弯段（如底边末端→右下角→右壁）始终贴线，不产生斜线越界（超界正是此前"右壁超出边界"的根因）。
    const cornerRB = { x: rect.right - marginX, y: rect.bottom - marginY, edge: 'right' };
    const cornerRT = { x: rect.right - marginX, y: rect.top + marginY, edge: 'right' };
    const cornerLT = { x: rect.left + marginX, y: rect.top + marginY, edge: 'left' };
    const cornerLB = { x: rect.left + marginX, y: rect.bottom - marginY, edge: 'bottom' };
    // 右下角 → 右边（2 点，下→上）
    points.push(cornerRB);
    points.push({ x: cornerRB.x, y: rect.top + height * 0.65, edge: 'right' });
    points.push({ x: cornerRB.x, y: rect.top + height * 0.35, edge: 'right' });
    // 右上角 → 顶边（3 点，右→左）
    points.push(cornerRT);
    for (let i = 0; i < 3; i++) {
        const t = (i + 1) / 4;
        points.push({ x: rect.right - width * t, y: rect.top + marginY, edge: 'top' });
    }
    // 左上角 → 左边（2 点，上→下）
    points.push(cornerLT);
    points.push({ x: cornerLT.x, y: rect.top + height * 0.35, edge: 'left' });
    points.push({ x: cornerLT.x, y: rect.top + height * 0.65, edge: 'left' });
    // 左下角（下一段回到底边中点，闭合段在同一底边线上）
    points.push(cornerLB);
    return points;
}
/**
 * 绕边不回头（环形扫描）：沿边顺序（底→右→上→左）取当前位置之后的下一个未访问吸附点。
 * 保证贴壁行走按顺时针绕圈（不会因重力贴底而总在底边打转）；全部访问后清空重来。
 */
export function nextClingPoint(current, edges, visited) {
    // 找到当前最近点索引（出发点）
    let nearestIdx = 0;
    let nearestDist = Infinity;
    edges.forEach((point, i) => {
        const dx = point.x - current.x;
        const dy = point.y - current.y;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = i;
        }
    });
    // 从最近点之后环形扫描第一个未访问点（沿边顺序）
    for (let step = 1; step <= edges.length; step++) {
        const idx = (nearestIdx + step) % edges.length;
        const point = edges[idx];
        if (!visited.has(point)) {
            visited.add(point);
            return point;
        }
    }
    // 全部访问过 → 清空重来（新一轮绕边）
    visited.clear();
    return nextClingPoint(current, edges, visited);
}
/**
 * 吸附判定：距最近吸附点在阈值内时吸附到边线（返回吸附后位置），否则原位置。
 */
export function snapToEdge(pos, edges, threshold = CLING_SNAP_DISTANCE) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const point of edges) {
        const dx = point.x - pos.x;
        const dy = point.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = point;
        }
    }
    if (nearest && nearestDist <= threshold) {
        return { pos: { x: nearest.x, y: nearest.y }, snapped: true };
    }
    return { pos, snapped: false };
}
/**
 * 落地吸附：enter 阶段把水平位置对齐到最近底边吸附点（返回 x 对齐的点，y 保持），
 * 使宠物"落向底边吸附点正上方"，落地即与绕边路径衔接。
 */
export function landSnap(pos, edges) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const p of edges) {
        if (p.edge !== 'bottom')
            continue;
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = p;
        }
    }
    return nearest ? { x: nearest.x, y: pos.y } : pos;
}
/**
 * 吸附滑入速度：距目标 < 12px 时加速 ×1.6（"被吸过去"的观感），
 * 配合到位吸附产生滑入→落定的过程感。
 */
export function slideInSpeed(baseSpeed, dist) {
    return dist < SLIDE_DISTANCE ? baseSpeed * SLIDE_SPEED_MULT : baseSpeed;
}
/**
 * 重力下沉：y 向底边 lerp（模拟重力），水平不变。
 * 仅在落地（enter/landing）阶段使用——贴边停留阶段位置必须稳定（见 cling 契约）。
 */
export function applyGravity(pos, rect, margin, lerp = GRAVITY_LERP) {
    const bottomY = rect.bottom - margin;
    const y = pos.y + (bottomY - pos.y) * lerp;
    return { x: pos.x, y: y > bottomY ? bottomY : y };
}
/**
 * sin 抛物线跳跃偏移：t ∈ [0,1] 返回 y 偏移（0 → -height → 0）。
 */
export function hopOffset(t, height = HOP_HEIGHT) {
    const clamped = Math.min(1, Math.max(0, t));
    return -Math.sin(Math.PI * clamped) * height;
}
// ── 风格配置 ─────────────────────────────────────────────
/**
 * 完成度决定格内风格：
 * ≥50 → 快（60px/s、40% 跳跃、短停留、happy）
 * <50 → 慢（25px/s、不跳跃、长停留、idle_variant）
 * 两种风格均绕行完整四边（含顶边/倒立）；差异仅在速度、跳跃概率、停留时长与情绪。
 */
export function createCellStyle(completion) {
    if (completion >= 50) {
        return {
            walkSpeed: 60,
            hopChance: 0.4,
            clingDuration: [600, 1200],
            bottomOnly: false,
            emotion: 'happy',
        };
    }
    return {
        walkSpeed: 25,
        hopChance: 0,
        clingDuration: [1200, 2000],
        bottomOnly: false,
        emotion: 'idle_variant',
    };
}
/**
 * 格内互动圈数退出阈值：rounds × 吸附点数（访问点数计数）。
 * 默认 2 圈（完整两遍四边，用户对"圈数"感知明确）。
 */
export function cellLapTarget(edgesLength, rounds = 2) {
    return Math.ceil(edgesLength * rounds);
}
// 导出随机范围（状态机使用）
export { randomRange };
//# sourceMappingURL=cellPhysics.js.map