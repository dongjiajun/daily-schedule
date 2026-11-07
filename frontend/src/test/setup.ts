import '@testing-library/jest-dom'

// jsdom 未实现 ResizeObserver；Radix Dialog / Select 等组件依赖它
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}
