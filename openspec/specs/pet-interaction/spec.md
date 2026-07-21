# Pet Interaction（宠物互动）

## Purpose
用户可通过喂食（消耗专注币）和玩耍（免费）与宠物互动，影响宠物的心情、饱腹、经验和专注币。每次互动记录持久化到 `pet_interactions` 表。

## Requirements

### Requirement: 喂食宠物
用户 SHALL 能使用专注币购买食物并喂给宠物。喂食增加饱腹度和心情，获得少量经验。

#### Scenario: 成功喂食
- **WHEN** 拥有宠物且专注币 ≥ 10，发送 `POST /api/v1/pets/me/interact`，body: `{ type: "FEED", quantity: 1 }`
- **THEN** 服务器返回 200，响应体为 InteractionResult：`hungerChange = +20`, `moodChange = +5`, `experienceGain = +3`, `coinChange = -10`，`newHunger`, `newMood`, `newExp`, `newCoins` 为操作后的当前值

#### Scenario: 专注币不足
- **WHEN** 专注币 < 最便宜食物价格（5 coins），发送 `POST /api/v1/pets/me/interact`，type: FEED
- **THEN** 服务器返回 400 Bad Request，错误信息包含"专注币不足"

#### Scenario: 喂食达饱腹上限
- **WHEN** 饱腹度已为 100，喂食
- **THEN** `hungerChange = 0`（不溢出），`moodChange` 和 `experienceGain` 仍正常生效

#### Scenario: 无宠物时互动
- **WHEN** 当前用户无宠物，发送互动请求
- **THEN** 服务器返回 404 Not Found

### Requirement: 与宠物玩耍
用户 SHALL 能与宠物免费玩耍（不消耗专注币）。玩要消耗少量饱腹度，换取心情和经验。

#### Scenario: 成功玩耍
- **WHEN** 拥有宠物，发送 `POST /api/v1/pets/me/interact`，body: `{ type: "PLAY", quantity: 1 }`
- **THEN** 服务器返回 200：`hungerChange = -10`, `moodChange = +25`, `experienceGain = +15`, `coinChange = 0`

#### Scenario: 玩耍饱腹耗尽不阻断
- **WHEN** 饱腹度 = 5，玩耍
- **THEN** `hungerChange = -5`（下限 0），`moodChange` 和 `experienceGain` 仍正常生效

### Requirement: 互动记录持久化
每次互动操作 MUST 写入 `pet_interactions` 表，记录类型、数量、属性变化，支持后续历史回溯。

#### Scenario: 互动后产生记录
- **WHEN** 用户喂食或玩耍后
- **THEN** `pet_interactions` 表中新增一行：pet_id、type、quantity、moodChange、hungerChange、experienceGain、createdAt

### Requirement: 互动权限
仅宠物所有者 SHALL 能与宠物互动。

#### Scenario: 跨用户互动被拒绝
- **WHEN** 用户 A 尝试使用用户 B 的 petId 发送互动请求
- **THEN** 服务器返回 404 Not Found（因为查询按当前用户隔离）
