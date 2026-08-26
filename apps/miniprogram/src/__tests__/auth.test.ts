import { describe, expect, it } from 'vitest'
import { parseLoginResponse } from '../lib/auth'

/**
 * wechat-auth 登录分流纯逻辑回归（不依赖 Taro 运行时）：
 * parseLoginResponse 的响应校验与规范化是登录链路的唯一纯函数，
 * Taro.login/request/storage 行为由 9.4 smoke test 在开发者工具中手工验证。
 */
describe('parseLoginResponse', () => {
  it('完整响应 → 规范化 AuthSession', () => {
    const session = parseLoginResponse({
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      expiresIn: 900,
      user: { id: 7, username: 'wx_oX1xK4abcdef', displayName: '微信用户_abcd' },
    })

    expect(session.accessToken).toBe('at-1')
    expect(session.refreshToken).toBe('rt-1')
    expect(session.user.id).toBe(7)
    expect(session.user.username).toBe('wx_oX1xK4abcdef')
    expect(session.user.displayName).toBe('微信用户_abcd')
  })

  it('缺 accessToken → 抛「登录响应格式异常」', () => {
    expect(() => parseLoginResponse({ refreshToken: 'rt-1', user: { id: 7, username: 'wx_a' } }))
      .toThrow('登录响应格式异常')
  })

  it('accessToken 为空串 → 抛异常', () => {
    expect(() => parseLoginResponse({ accessToken: '', refreshToken: 'rt-1', user: { id: 7, username: 'wx_a' } }))
      .toThrow('登录响应格式异常')
  })

  it('缺 refreshToken → 抛异常', () => {
    expect(() => parseLoginResponse({ accessToken: 'at-1', user: { id: 7, username: 'wx_a' } }))
      .toThrow('登录响应格式异常')
  })

  it('user 缺 username → 抛异常', () => {
    expect(() => parseLoginResponse({ accessToken: 'at-1', refreshToken: 'rt-1', user: { id: 7 } }))
      .toThrow('登录响应格式异常')
  })

  it('displayName 缺失 → 归一为 undefined', () => {
    const session = parseLoginResponse({
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      user: { id: 7, username: 'wx_a' },
    })
    expect(session.user.displayName).toBeUndefined()
  })
})
