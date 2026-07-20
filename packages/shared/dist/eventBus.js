/**
 * 系统事件总线 — 模块间唯一通信通道。
 *
 * 架构约束（来自 docs/vision-roadmap-draft.md 决策 2）：
 * - 模块间不直接 import 彼此的 store 或组件
 * - 所有跨模块行为通过类型安全的事件总线完成
 * - 每个事件有明确的发出方和可能的消费方
 *
 * 宠物系统只监听事件，不直接依赖任何模块。
 * 模块只发出事件，不"知道"宠物的存在。
 */
// ── EventBus 实现 ─────────────────────────────────────────
export class EventBus {
    listeners = new Map();
    /**
     * 注册事件监听器。
     * @returns 注销函数，调用即取消监听。
     */
    on(eventType, listener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(listener);
        return () => this.off(eventType, listener);
    }
    /**
     * 同步派发事件到所有匹配的监听器。
     * 同步派发保证状态一致性：宠物对"日程完成"的反应在业务操作完成前执行。
     */
    emit(event) {
        const listeners = this.listeners.get(event.type);
        if (!listeners)
            return;
        for (const fn of listeners) {
            fn(event);
        }
    }
    /**
     * 移除指定监听器。
     */
    off(eventType, listener) {
        this.listeners.get(eventType)?.delete(listener);
    }
    /**
     * 清空所有监听器。仅用于测试清理。
     */
    removeAll() {
        this.listeners.clear();
    }
}
//# sourceMappingURL=eventBus.js.map