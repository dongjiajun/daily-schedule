/**
 * 小程序全局配置（单一来源）。
 */

/**
 * 事件无 color 时的默认标记色（与 Web 端主题主色一致）。
 * 月网格色点与选中日事件列表共用，避免两处硬编码。
 */
export const DEFAULT_EVENT_COLOR = '#4f7cff'

/**
 * API 基础地址（开发者工具调试用 localhost）。
 * 单一来源：登录（lib/auth.ts）与业务请求封装（lib/api.ts）统一引用此处，
 * 不各自硬编码。
 * TODO(domain): 真机发布时需改为 https 合法域名（微信后台 request 合法域名白名单），
 * 届时通过构建期配置注入（如 Taro defineConstants），本变更不处理。
 */
export const API_BASE_URL = 'http://localhost:8080/api/v1'
