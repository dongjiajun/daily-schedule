# Pet Profile（宠物档案）

## Purpose
用户可创建、查看、更新自己唯一的宠物（橘猫/柴犬二选一，命名），每个用户仅限一只。所有操作按当前登录用户隔离。

## Requirements

### Requirement: 创建宠物
用户 SHALL 能选择物种（橘猫/柴犬）并命名，创建属于自己的唯一宠物。每个用户仅限一只。
创建成功时返回完整 PetProfile，包括初始状态（mood=100, hunger=100, coins=100, level=1, experience=0）。

#### Scenario: 首次创建宠物成功
- **WHEN** 当前用户无宠物，发送 `POST /api/v1/pets/me`，body: `{ species: "ORANGE_CAT", name: "大橘" }`
- **THEN** 服务器返回 201，响应体为 PetProfile，`species = ORANGE_CAT`, `name = 大橘`, `mood = 100`, `hunger = 100`, `coins = 100`, `level = 1`, `experience = 0`

#### Scenario: 重复创建被拒绝
- **WHEN** 当前用户已有宠物，再次发送 `POST /api/v1/pets/me`
- **THEN** 服务器返回 409 Conflict，错误信息包含"已有宠物"

#### Scenario: 非法参数
- **WHEN** `name` 为空或超过 30 字符，或 `species` 不在枚举值中
- **THEN** 服务器返回 400 Bad Request

### Requirement: 查看我的宠物
用户 SHALL 能随时查询自己宠物的完整状态，包括物种、名称、等级、经验、心情、饱腹、专注币、最近互动时间。

#### Scenario: 查询已有宠物
- **WHEN** 当前用户有宠物，发送 `GET /api/v1/pets/me`
- **THEN** 服务器返回 200，响应体为 PetProfile，包含全部字段

#### Scenario: 无宠物时查询
- **WHEN** 当前用户无宠物，发送 `GET /api/v1/pets/me`
- **THEN** 服务器返回 404 Not Found，错误信息包含"请先创建宠物"

### Requirement: 更新宠物信息
用户 SHALL 能修改宠物名称。v1 仅支持改名，物种不可变。

#### Scenario: 修改名称成功
- **WHEN** 发送 `PUT /api/v1/pets/me`，body: `{ name: "二橘" }`
- **THEN** 服务器返回 200，响应体 PetProfile.name = "二橘"

#### Scenario: 名称非法
- **WHEN** `name` 为空或超过 30 字符
- **THEN** 服务器返回 400 Bad Request

#### Scenario: 无宠物时修改
- **WHEN** 当前用户无宠物，发送 `PUT /api/v1/pets/me`
- **THEN** 服务器返回 404 Not Found

### Requirement: 数据隔离
所有宠物查询和操作 MUST 按当前登录用户隔离。用户 A 无法访问用户 B 的宠物。

#### Scenario: 跨用户数据不可见
- **WHEN** 用户 A 访问自己宠物的 `GET /api/v1/pets/me`
- **THEN** 仅返回用户 A 的宠物数据，用户 B 的宠物完全不可见
