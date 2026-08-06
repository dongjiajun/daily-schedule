/**
 * 格内物理场 — 纯逻辑，无平台依赖。
 * 贴边行走 / 重力下沉 / 吸附落定 / 跳跃（sin 抛物线）的几何与风格计算。
 * Web (RoamingPet rAF 帧循环) 与小程序 (Canvas) 共享。
 */
// ── 常量 ─────────────────────────────────────────────────
const EDGE_MARGIN_RATIO = 0.15; // 吸附点距边的内缩比例
const HOP_HEIGHT = 10; // 跳跃高度 px
const CLING_SNAP_DISTANCE = 8; // 吸附判定距离 px
const GRAVITY_LERP = 0.08; // 重力下沉 lerp 系数（每帧）
// ── 工具 ─────────────────────────────────────────────────
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}
// ── 吸附点采样 ───────────────────────────────────────────
/**
 * 生成格子四边吸附点：上 3 / 下 3 / 左 2 / 右 2（共 10 点，均匀分布、内缩 margin）。
 * bottomOnly 时仅返回底边 3 点 + 左右边下半部 2 点（懒散贴地走）。
 */
export function cellEdges(rect, bottomOnly = false) {
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const marginX = width * EDGE_MARGIN_RATIO;
    const marginY = height * EDGE_MARGIN_RATIO;
    const points = [];
    // 底边（始终）
    for (let i = 0; i < 3; i++) {
        const t = (i + 1) / 4;
        points.push({ x: rect.left + width * t, y: rect.bottom - marginY, edge: 'bottom' });
    }
    if (bottomOnly) {
        // 侧边下半部各 1 点（贴地懒散）
        points.push({ x: rect.left + marginX, y: rect.bottom - height * 0.3, edge: 'left' });
        points.push({ x: rect.right - marginX, y: rect.bottom - height * 0.3, edge: 'right' });
        return points;
    }
    // 上边 3 点
    for (let i = 0; i < 3; i++) {
        const t = (i + 1) / 4;
        points.push({ x: rect.left + width * t, y: rect.top + marginY, edge: 'top' });
    }
    // 左右边各 2 点（中部）
    points.push({ x: rect.left + marginX, y: rect.top + height * 0.35, edge: 'left' });
    points.push({ x: rect.left + marginX, y: rect.top + height * 0.65, edge: 'left' });
    points.push({ x: rect.right - marginX, y: rect.top + height * 0.35, edge: 'right' });
    points.push({ x: rect.right - marginX, y: rect.top + height * 0.65, edge: 'right' });
    return points;
}
/**
 * 绕边不回头：选择最近的未访问吸附点（visited 为空时取最近点；全部访问后清空重来）。
 */
export function nextClingPoint(current, edges, visited) {
    let best = null;
    let bestDist = Infinity;
    for (const point of edges) {
        if (visited.has(point))
            continue;
        const dx = point.x - current.x;
        const dy = point.y - current.y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
            bestDist = dist;
            best = point;
        }
    }
    if (!best) {
        // 全部访问过 → 清空重来（新一轮绕边）
        visited.clear();
        return nextClingPoint(current, edges, visited);
    }
    visited.add(best);
    return best;
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
 * 重力下沉：非 walk 状态下 y 向底边 lerp（模拟重力），水平不变。
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
 * ≥50 → 快（60px/s、40% 跳跃、短停留、绕圈、happy）
 * <50 → 慢（25px/s、不跳跃、长停留、贴底边、idle_variant）
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
        bottomOnly: true,
        emotion: 'idle_variant',
    };
}
/**
 * 格内互动总时长上限（状态机强制退出）。
 */
export function cellSessionDuration(completion) {
    return completion >= 50 ? 10_000 : 15_000;
}
// 导出随机范围（状态机使用）
export { randomRange };
//# sourceMappingURL=cellPhysics.js.map