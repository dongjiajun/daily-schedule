# Pet Interaction UI（互动菜单）

## ADDED Requirements

### Requirement: 宠物专页原语收口与分区去重改名
`PetPage` SHALL 具备 `h-full overflow-y-auto` 纵向滚动并使用 `Card`、`Skeleton`、`EmptyState`、`Progress`、`Button` 设计系统原语；主卡提供直接免费「玩耍」按钮，喂食区仅展示 `FOOD`、装扮区合并 `ACCESSORY` 装备与取下操作；档案区汉化展示物种并支持通过 `useUpdatePet` 内联改名。

#### Scenario: 专页分区去重展示喂食装扮与直接玩耍
- **WHEN** 已拥有宠物的用户访问 `/pet` 专页
- **THEN** 主卡直接渲染「🎾 玩耍（免费）」按钮（点击触发 `PLAY` 与粒子/浮动反馈）；「喂食区 🍖」仅过滤出食物条目，「装扮区 🎀」展示当前配饰、取下按钮与可装备配饰列表，不包含多余嵌套 Popover

#### Scenario: 内联改名成功与非法名称拦截
- **WHEN** 用户在宠物信息卡点击「改名」输入合法新名称并保存，或输入纯空白名称
- **THEN** 合法名称（1–30 字）调用 `PUT /api/v1/pets/me` 保存成功并退出编辑态；空白名称时「保存」按钮保持 disabled
