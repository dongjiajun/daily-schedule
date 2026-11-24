# 小程序宠物互动（miniprogram-pet）

## ADDED Requirements

### Requirement: 宠物页导航栏配置与交互定时器清理
微信小程序宠物页 SHALL 提供 `apps/miniprogram/src/pages/pet/index.config.ts` 将导航栏标题配置为「宠物」；页面隐藏或卸载时 SHALL 清理游走定时器及弹跳/反馈全部交互定时器，防止页面离开后触发无效状态更新。

#### Scenario: 宠物页配置独立导航栏标题
- **WHEN** 查看或构建 `apps/miniprogram/src/pages/pet/index.config.ts`
- **THEN** `definePageConfig` 声明 `navigationBarTitleText: '宠物'`，不回退到全局默认标题

#### Scenario: 页面隐藏或卸载清理全部定时器
- **WHEN** 宠物页触发 `useDidHide`、`useUnload` 或组件卸载且存在进行中的游走、弹跳或反馈提示定时器
- **THEN** `wanderTimerRef`、`bounceTimerRef` 与 `feedbackTimerRef` 均被 `clearTimeout` 清理并置 `null`
