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
/** 日程相关事件（发出方: modules/calendar） */
export type CalendarEvent = {
    type: 'event:completed';
    payload: {
        eventId: string;
        title: string;
    };
} | {
    type: 'event:created';
    payload: {
        eventId: string;
        title: string;
    };
} | {
    type: 'event:cancelled';
    payload: {
        eventId: string;
        title: string;
    };
};
/** 任务相关事件（发出方: modules/todo） */
export type TaskEvent = {
    type: 'task:completed';
    payload: {
        taskId: string;
        title: string;
    };
} | {
    type: 'task:created';
    payload: {
        taskId: string;
    };
};
/** 习惯相关事件（发出方: modules/habits） */
export type HabitEvent = {
    type: 'habit:checked';
    payload: {
        habitId: string;
    };
} | {
    type: 'habit:streak';
    payload: {
        habitId: string;
        days: number;
    };
};
/** 专注相关事件（发出方: modules/pomodoro） */
export type FocusEvent = {
    type: 'focus:completed';
    payload: {
        duration: number;
    };
};
/** 用户相关事件（发出方: core/auth） */
export type UserEvent = {
    type: 'user:login';
    payload: {
        consecutive: number;
    };
} | {
    type: 'user:dailyCheckin';
    payload: {
        timestamp: number;
    };
};
/** 全局系统事件联合类型 */
export type SystemEvent = CalendarEvent | TaskEvent | HabitEvent | FocusEvent | UserEvent;
type Listener = (event: SystemEvent) => void;
export declare class EventBus {
    private listeners;
    /**
     * 注册事件监听器。
     * @returns 注销函数，调用即取消监听。
     */
    on(eventType: SystemEvent['type'], listener: Listener): () => void;
    /**
     * 同步派发事件到所有匹配的监听器。
     * 同步派发保证状态一致性：宠物对"日程完成"的反应在业务操作完成前执行。
     */
    emit(event: SystemEvent): void;
    /**
     * 移除指定监听器。
     */
    off(eventType: SystemEvent['type'], listener: Listener): void;
    /**
     * 清空所有监听器。仅用于测试清理。
     */
    removeAll(): void;
}
export {};
//# sourceMappingURL=eventBus.d.ts.map