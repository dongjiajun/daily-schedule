/**
 * 宠物游走引擎 — 纯逻辑，无平台依赖。
 * Web (framer-motion) 和小程序 (Canvas) 共享。
 */
// ── 常量 ─────────────────────────────────────────────────
const DEFAULT_PADDING = 20;
const RESTING_INTERVAL = 2 * 60 * 1000; // 2min 无交互后进入休息
const WANDER_INTERVAL_MIN = 10_000;
const WANDER_INTERVAL_MAX = 30_000;
const MOVE_DURATION_MIN = 3_000;
const MOVE_DURATION_MAX = 8_000;
// ── 工具函数 ─────────────────────────────────────────────
/** clamp 值到范围 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/** 生成范围内的随机数 */
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}
// ── 核心算法 ─────────────────────────────────────────────
/**
 * 将坐标 clamp 到视口安全区域内。
 */
export function clampToViewport(pos, config) {
    const { viewport, padding } = config;
    return {
        x: clamp(pos.x, padding, viewport.width - padding),
        y: clamp(pos.y, padding, viewport.height - padding),
    };
}
/**
 * 判断点是否在给定矩形内。
 */
export function isInsideRect(pos, rect) {
    return pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom;
}
/**
 * 避让区域处理：如果目标点在硬避让区内，移动到最近的合法位置。
 */
export function avoidZones(pos, zones) {
    let result = { ...pos };
    let iterations = 0;
    let changed = true;
    while (changed && iterations < 10) {
        changed = false;
        iterations++;
        let adjusted = false;
        for (const zone of zones) {
            if (zone.strength !== 'hard')
                continue;
            if (isInsideRect(result, zone.rect)) {
                // 推向最近的边界外侧
                const distToLeft = result.x - zone.rect.left;
                const distToRight = zone.rect.right - result.x;
                const distToTop = result.y - zone.rect.top;
                const distToBottom = zone.rect.bottom - result.y;
                const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
                if (minDist === distToLeft) {
                    result = { ...result, x: zone.rect.left - 10 };
                }
                else if (minDist === distToRight) {
                    result = { ...result, x: zone.rect.right + 10 };
                }
                else if (minDist === distToTop) {
                    result = { ...result, y: zone.rect.top - 10 };
                }
                else {
                    result = { ...result, y: zone.rect.bottom + 10 };
                }
                adjusted = true;
                changed = true;
                break;
            }
        }
        if (!adjusted)
            break;
    }
    return result;
}
/**
 * 是否在软避让区域内（降低概率）。
 */
export function isInSoftZone(pos, zones) {
    return zones.some(z => z.strength === 'soft' && isInsideRect(pos, z.rect));
}
// ── 游走模式计算 ─────────────────────────────────────────
/**
 * 确定游走模式。
 */
export function determineMode(params) {
    const { lastInteractionAt, hasActiveZone, isNightTime } = params;
    const now = Date.now();
    const idleDuration = now - lastInteractionAt;
    if (isNightTime && idleDuration > RESTING_INTERVAL)
        return 'resting';
    if (hasActiveZone)
        return 'attracted';
    if (idleDuration > RESTING_INTERVAL)
        return 'resting';
    return 'wandering';
}
/**
 * 随机漫步：生成随机目标点，避开硬避让区。
 * soft 权重化（Decision 8）：30% 概率全域采样（保证视口覆盖）+ 70% 局部漂移（自然漫游）；
 * 目标落入 soft 避让区时 50% 概率接受——soft 是降频区而非排斥墙，消除方向性边缘排斥。
 */
export function computeWanderTarget(current, config) {
    const { viewport, padding } = config;
    const softZones = config.avoidZones.filter(z => z.strength === 'soft');
    const sampleTarget = () => {
        // 30% 全域采样（覆盖视口任意位置）/ 70% 以当前位置为中心的局部漂移
        if (Math.random() < 0.3) {
            return {
                x: randomRange(padding, viewport.width - padding),
                y: randomRange(padding, viewport.height - padding),
            };
        }
        return {
            x: clamp(current.x + (Math.random() - 0.5) * 400, padding, viewport.width - padding),
            y: clamp(current.y + (Math.random() - 0.5) * 300, padding, viewport.height - padding),
        };
    };
    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = sampleTarget();
        // 硬避让区完全拒绝
        const clamped = avoidZones(candidate, config.avoidZones);
        if (clamped.x !== candidate.x || clamped.y !== candidate.y)
            continue;
        // soft 区：50% 概率接受（降频而非排斥）
        if (isInSoftZone(clamped, softZones) && Math.random() < 0.5)
            continue;
        return clamped;
    }
    // fallback: 全域采样（hard 推出）
    return avoidZones({
        x: randomRange(padding, viewport.width - padding),
        y: randomRange(padding, viewport.height - padding),
    }, config.avoidZones);
}
/**
 * 兴趣点吸引：目标 = 兴趣点中心（含细微随机偏移防重叠）。
 * 停在"兴趣点边缘"会导致宠物永远不进入日历格子（格内物理依赖 isInsideRect），
 * 点击/悬停格子后宠物必须真正走进格子区域。
 */
export function computeAttractedTarget(_current, interestPoint, config) {
    return clampToViewport({
        x: interestPoint.x + randomRange(-10, 10),
        y: interestPoint.y + randomRange(-10, 10),
    }, config);
}
/**
 * 休息点选择：选择最近的休息点。
 */
export function computeRestingTarget(current, restingSpots) {
    if (restingSpots.length === 0)
        return current;
    let nearest = restingSpots[0];
    let minDist = Infinity;
    for (const spot of restingSpots) {
        const dx = spot.x - current.x;
        const dy = spot.y - current.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
            minDist = dist;
            nearest = spot;
        }
    }
    return nearest;
}
/**
 * 计算 Zone 的几何中心。
 */
export function zoneCenter(zone) {
    return {
        x: (zone.rect.left + zone.rect.right) / 2,
        y: (zone.rect.top + zone.rect.bottom) / 2,
    };
}
/**
 * 游走主入口：根据模式计算下一个目标位置。
 */
export function computeNextTarget(current, config, mode, options) {
    switch (mode) {
        case 'wandering':
            return computeWanderTarget(current, config);
        case 'attracted': {
            const zone = options?.activeZone;
            if (!zone)
                return computeWanderTarget(current, config);
            const center = zoneCenter(zone);
            // Zone 位于 hard 避让区内 → 放弃吸引，退回 wandering
            const inHardZone = config.avoidZones.some(z => z.strength === 'hard' && isInsideRect(center, z.rect));
            if (inHardZone)
                return computeWanderTarget(current, config);
            return computeAttractedTarget(current, center, config);
        }
        case 'resting':
            return computeRestingTarget(current, config.restingSpots);
        case 'idle':
        default:
            return current;
    }
}
/**
 * 生成随机游走间隔 (ms)。
 */
export function randomWanderInterval() {
    return randomRange(WANDER_INTERVAL_MIN, WANDER_INTERVAL_MAX);
}
/**
 * 生成随机移动时长 (ms)。
 * @param speedMultiplier 情绪影响：happy=1.5 (更快), sad=0.5 (更慢), default=1
 */
export function randomMoveDuration(speedMultiplier = 1) {
    const raw = randomRange(MOVE_DURATION_MIN, MOVE_DURATION_MAX);
    return raw / Math.max(0.3, speedMultiplier);
}
/**
 * 计算当前面向方向。
 */
export function computeFacing(currentX, targetX) {
    return targetX >= currentX ? 'right' : 'left';
}
// ── 工厂函数 ─────────────────────────────────────────────
/**
 * 创建默认配置。
 */
export function createDefaultConfig(viewportWidth, viewportHeight) {
    return {
        viewport: { width: viewportWidth, height: viewportHeight },
        avoidZones: [],
        restingSpots: [
            { x: viewportWidth - 80, y: viewportHeight - 80 }, // 右下角
            { x: 80, y: viewportHeight - 80 }, // 左下角
            { x: viewportWidth - 80, y: 100 }, // 右上角
        ],
        padding: DEFAULT_PADDING,
    };
}
//# sourceMappingURL=roaming.js.map