# Pet Status Panel（状态面板）

## Purpose

宠物状态面板：实时展示宠物核心属性（心情/饥饿/金币/等级经验），颜色编码直观反馈宠物状态，帮助用户快速了解宠物当前状况。

## Requirements

### Requirement: 实时状态展示
系统 SHALL 在宠物形象下方展示状态栏：心情（mood）、饱腹（hunger）、专注币（coins）、等级（level + experience），颜色编码（绿色 ≥ 60，黄色 30-59，红色 < 30）。

#### Scenario: 正常状态绿色
- **WHEN** mood ≥ 60 且 hunger ≥ 60
- **THEN** 心情和饱腹进度条颜色为绿色

#### Scenario: 警告状态黄色
- **WHEN** mood 或 hunger 在 30-59 之间
- **THEN** 对应进度条颜色为黄色

#### Scenario: 危险状态红色
- **WHEN** mood 或 hunger < 30
- **THEN** 对应进度条颜色为红色

#### Scenario: 状态数据来源
- **WHEN** `useMyPet` 成功返回 PetProfile
- **THEN** 状态栏展示 data.mood / data.hunger / data.coins / data.level / data.experience

#### Scenario: 加载中
- **WHEN** `useMyPet` 处于 loading 状态
- **THEN** 状态栏展示 skeleton placeholder（闪烁灰色条）

#### Scenario: 查询失败（404 无宠物）
- **WHEN** `useMyPet` 返回 404 错误
- **THEN** 触发 PetSelection Dialog，状态栏不显示
