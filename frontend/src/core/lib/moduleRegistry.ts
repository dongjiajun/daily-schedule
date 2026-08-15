/**
 * 模块注册中心 — 管理插件式架构中所有模块的生命周期。
 *
 * 架构约束：
 * - 模块通过 register() 声明式注册，返回注销函数
 * - 模块间隔离：不直接 import 彼此的 store/组件
 * - 通信唯一通道：事件总线 (eventBus.ts)
 */
import type { RouteObject } from 'react-router-dom'
import type { SystemEvent } from '@daily-schedule/shared'

// ── 宠物行为声明 ─────────────────────────────────────────

/** 模块声明的、可触发宠物反应的行为定义 */
export interface PetActionDefinition {
  /** 监听的系统事件类型 */
  eventType: SystemEvent['type']
  /** 行为描述，如"完成了日程 → +专注币 +经验" */
  description: string
}

// ── 模块定义 ─────────────────────────────────────────────

/**
 * 模块声明接口。
 * 每个模块在自己的 index.ts 中导出一个 ModuleDefinition 对象，
 * 启动时由 main.tsx 注册到 moduleRegistry。
 */
export interface ModuleDefinition {
  /** 唯一标识（kebab-case，如 'calendar', 'pet', 'todo'） */
  id: string
  /** 显示名称 */
  name: string
  /** 模块描述 */
  description: string
  /** 侧边栏图标（React 组件类型，延迟引用避免循环依赖） */
  icon: React.ComponentType<{ className?: string }>
  /** 侧边栏排序权重（数字越小越靠前） */
  order: number
  /** 路由定义（静态收集） */
  routes: RouteObject[]
  /** 模块级 Zustand stores（key → StateCreator） */
  stores?: Record<string, unknown>
  /** 模块初始化回调 */
  onInit?: () => void | Promise<void>
  /** 模块销毁回调 */
  onDestroy?: () => void
  /** 本模块可触发的宠物行为 */
  petActions?: PetActionDefinition[]
  /** 侧边栏内容组件（可选）。接收 onNavigate 回调用于移动端关闭抽屉 */
  sidebarComponent?: React.ComponentType<{ onNavigate?: () => void }>
}

// ── 模块注册中心 ─────────────────────────────────────────

export class ModuleRegistry {
  private modules = new Map<string, ModuleDefinition>()

  /**
   * 注册模块。
   * @throws 重复 id 时抛出 Error
   * @returns 注销函数
   */
  register(def: ModuleDefinition): () => void {
    if (this.modules.has(def.id)) {
      throw new Error(`Module "${def.id}" is already registered.`)
    }
    this.modules.set(def.id, def)
    // 调用模块的初始化回调（如注册事件监听器）
    def.onInit?.()
    return () => this.unregister(def.id)
  }

  /** 注销模块 */
  unregister(id: string): void {
    const mod = this.modules.get(id)
    mod?.onDestroy?.()
    this.modules.delete(id)
  }

  /** 获取指定模块 */
  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id)
  }

  /** 获取所有已注册模块（按 order 升序） */
  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values()).sort((a, b) => a.order - b.order)
  }

  /** 收集所有模块的路由（扁平化） */
  getRoutes(): RouteObject[] {
    return this.getAll().flatMap((m) => m.routes)
  }

  /** 收集所有模块的宠物行为声明 */
  getPetActions(): PetActionDefinition[] {
    return this.getAll().flatMap((m) => m.petActions ?? [])
  }
}

// ── 全局单例 ─────────────────────────────────────────────

export const moduleRegistry = new ModuleRegistry()
