import { describe, it, expect } from 'vitest'
import { ModuleRegistry, type ModuleDefinition } from '../moduleRegistry'

function makeModule(overrides: Partial<ModuleDefinition> = {}): ModuleDefinition {
  return {
    id: 'test-module',
    name: 'Test Module',
    description: 'A test module',
    icon: () => null,
    order: 1,
    routes: [],
    ...overrides,
  }
}

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry

  beforeEach(() => {
    registry = new ModuleRegistry()
  })

  it('should register a module and return an unregister function', () => {
    const mod = makeModule()
    const unregister = registry.register(mod)

    expect(registry.get('test-module')).toBe(mod)
    expect(typeof unregister).toBe('function')
  })

  it('should unregister a module', () => {
    const mod = makeModule()
    const unregister = registry.register(mod)
    unregister()

    expect(registry.get('test-module')).toBeUndefined()
  })

  it('should unregister a module by id', () => {
    registry.register(makeModule())
    registry.unregister('test-module')

    expect(registry.get('test-module')).toBeUndefined()
  })

  it('should throw on duplicate registration', () => {
    registry.register(makeModule())

    expect(() => {
      registry.register(makeModule())
    }).toThrow('Module "test-module" is already registered.')
  })

  it('should return all modules sorted by order', () => {
    registry.register(makeModule({ id: 'c', order: 3 }))
    registry.register(makeModule({ id: 'a', order: 1 }))
    registry.register(makeModule({ id: 'b', order: 2 }))

    const all = registry.getAll()
    expect(all.map((m) => m.id)).toEqual(['a', 'b', 'c'])
  })

  it('should collect all routes from modules', () => {
    const routeA = { path: '/a' }
    const routeB = { path: '/b' }
    const routeC = { path: '/c' }

    registry.register(makeModule({ id: 'a', routes: [routeA] }))
    registry.register(makeModule({ id: 'b', routes: [routeB, routeC] }))

    const routes = registry.getRoutes()
    expect(routes).toHaveLength(3)
    expect(routes).toContain(routeA)
    expect(routes).toContain(routeB)
    expect(routes).toContain(routeC)
  })

  it('should return empty routes when no modules registered', () => {
    expect(registry.getRoutes()).toEqual([])
  })

  it('should collect pet actions from modules', () => {
    const actionA = { eventType: 'event:completed' as const, description: 'A' }
    const actionB = { eventType: 'task:completed' as const, description: 'B' }

    registry.register(makeModule({ id: 'a', petActions: [actionA] }))
    registry.register(makeModule({ id: 'b', petActions: [actionB] }))

    const actions = registry.getPetActions()
    expect(actions).toHaveLength(2)
    expect(actions).toContain(actionA)
    expect(actions).toContain(actionB)
  })

  it('should return empty pet actions when no module has them', () => {
    registry.register(makeModule())
    expect(registry.getPetActions()).toEqual([])
  })

  it('should return undefined for non-existent module', () => {
    expect(registry.get('nonexistent')).toBeUndefined()
  })
})
