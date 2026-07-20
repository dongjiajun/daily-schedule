/**
 * 全局事件总线单例。
 *
 * 所有模块通过此单例发出/监听系统事件。
 * 模块间不直接 import，只通过事件通信。
 */
import { EventBus } from '@daily-schedule/shared'

export const eventBus = new EventBus()
