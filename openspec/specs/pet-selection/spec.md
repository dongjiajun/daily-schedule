# Pet Selection（初始选择）

## Purpose
新用户首次使用宠物功能时的引导流程：选择物种（橘猫/柴犬）并命名，创建宠物后进入正常展示状态。

## Requirements

### Requirement: 无宠物时展示选择界面
当用户无宠物（`GET /pets/me` 返回 404），系统 SHALL 自动弹出选择 Dialog，展示两种宠物（橘猫/柴犬）供选择，附带命名输入。

#### Scenario: 首次登录弹出选择
- **WHEN** 用户登录且 `useMyPet` 查询返回 404
- **THEN** PetSelection Dialog 自动打开，展示橘猫和柴犬两张卡片

#### Scenario: 选择物种并命名
- **WHEN** 用户点击橘猫卡片 + 输入名称"大橘" + 点击确认
- **THEN** `useCreatePet` mutation 发送 `{ species: "ORANGE_CAT", name: "大橘" }`，成功后面板展示宠物

#### Scenario: 名称非法
- **WHEN** 用户输入空名称或超过 30 字符
- **THEN** 确认按钮 disabled，显示校验提示

#### Scenario: 已有宠物时不弹出
- **WHEN** `useMyPet` 成功返回宠物数据
- **THEN** PetSelection Dialog 不显示，直接展示 PetPanel
