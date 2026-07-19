import { describe, it, expect } from 'vitest'
import { unwrap } from '../unwrap'

describe('unwrap', () => {
  it('返回正常 data', () => {
    const result = { data: { id: 1, name: 'test' }, response: new Response(null, { status: 200 }) }
    expect(unwrap(result)).toEqual({ id: 1, name: 'test' })
  })

  it('error 非空时抛出异常', () => {
    const result = { data: undefined, error: { message: '后端错误' }, response: new Response(null, { status: 400 }) }
    expect(() => unwrap(result)).toThrow('后端错误')
  })

  it('response 非 ok 时抛出异常', () => {
    const result = { data: undefined, response: new Response(null, { status: 500 }) }
    expect(() => unwrap(result)).toThrow('HTTP 500')
  })

  it('无 message 时返回默认错误', () => {
    const result = { data: undefined, error: {}, response: new Response(null, { status: 403 }) }
    expect(() => unwrap(result)).toThrow()
  })
})
