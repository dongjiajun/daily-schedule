# 数据库设计

> 当前状态: v3.3，对应 Flyway 迁移 V1–V6  
> 迁移脚本: `backend/src/main/resources/db/migration/`

## ER 图

```
┌──────────────┐
│     user     │
├──────────────┤
│ id (PK)      │────────────────────────────────────────────┐
│ username     │                                            │
│ email        │                                            │
│ display_name │                                            │
│ avatar_url   │                                            │
│ password_    │                                            │
│   hash       │                                            │
│ status       │                                            │
│ last_login   │                                            │
│   _at        │                                            │
│ created_at   │                                            │
│ updated_at   │                                            │
└──────────────┘                                            │
                                                            │
┌──────────┐       ┌──────────────┐       ┌──────────┐      │
│ category │       │    event     │       │   tag    │      │
├──────────┤       ├──────────────┤       ├──────────┤      │
│ id (PK)  │──┐    │ id (PK)      │    ┌──│ id (PK)  │      │
│ name     │  └───>│ category_id  │    │  │ name     │      │
│ color    │       │   (FK)       │    │  │ color    │      │
│ desc     │       │ title        │    │  │ user_id  │<──┐  │
│ user_id  │<──┐   │ description  │    │  │ created  │   │  │
│ created  │   │   │ start_time   │    │  │ updated  │   │  │
│ updated  │   │   │ end_time     │    │  └──────────┘   │  │
└──────────┘   │   │ all_day      │    │       │          │  │
               │   │ location     │    │       │          │  │
               │   │ color        │    │       │          │  │
               │   │ reminder_    │    │       │          │  │
               │   │   minutes    │    │       │          │  │
               │   │ status       │    │       │          │  │
               │   │ last_        │    │       │          │  │
               │   │   reminded   │    │       │          │  │
               │   │ user_id      │<───┤       │          │  │
               │   │ created_at   │    │  ┌────┘          │  │
               │   │ updated_at   │    │  │  ┌────────────┘  │
               │   └──────────────┘    │  │  │               │
               │        │              │  │  │               │
               │        │  ┌───────────┘  │  │               │
               │        │  │ ┌────────────┘  │               │
               │   ┌────▼──▼─┐               │               │
               │   │event_tag │               │               │
               │   ├──────────┤               │               │
               │   │event_id  │               │               │
               │   │tag_id    │               │               │
               │   └──────────┘               │               │
               │                              │               │
               └──────────────────────────────┘               │
                                                              │
  所有业务表通过 user_id 外键关联 user，查询时强制按当前用户过滤。 │
  每个用户内，category.name 和 tag.name 唯一。                  │
```

## 表结构

### user（用户）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | PK, AUTO | | |
| username | VARCHAR(50) | NOT NULL, UNIQUE | | 字母/数字/下划线 |
| email | VARCHAR(120) | NOT NULL, UNIQUE | | v3.0 新增 |
| password_hash | VARCHAR(255) | NOT NULL | | BCrypt 加密 |
| display_name | VARCHAR(50) | | NULL | v3.0 新增 |
| avatar_url | VARCHAR(255) | | NULL | v3.0 新增 |
| status | VARCHAR(20) | NOT NULL | 'ACTIVE' | v3.0 新增；ACTIVE / INACTIVE |
| last_login_at | DATETIME | | NULL | v3.0 新增 |
| created_at | DATETIME | NOT NULL | NOW() | |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE | |

索引: `uk_user_email` (email UNIQUE)

### category（分类）

| 字段 | 类型 | 约束 | 默认值 |
|------|------|------|--------|
| id | BIGINT | PK, AUTO | |
| name | VARCHAR(50) | NOT NULL | |
| color | VARCHAR(50) | | '#1890ff' |
| description | VARCHAR(200) | | |
| user_id | BIGINT | NOT NULL, FK → user | v2.0 新增 |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

索引: `(user_id)`, `uk_category_user_name (user_id, name)` (v3.0 唯一约束)

### tag（标签）

| 字段 | 类型 | 约束 | 默认值 |
|------|------|------|--------|
| id | BIGINT | PK, AUTO | |
| name | VARCHAR(30) | NOT NULL | |
| color | VARCHAR(50) | | '#1890ff' |
| user_id | BIGINT | NOT NULL, FK → user | v2.0 新增 |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

索引: `(user_id)`, `uk_tag_user_name (user_id, name)` (v3.0 唯一约束)

### event（日程）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | PK, AUTO | | |
| title | VARCHAR(200) | NOT NULL | | |
| description | TEXT | | | |
| start_time | DATETIME | NOT NULL | | |
| end_time | DATETIME | NOT NULL | | |
| all_day | TINYINT(1) | NOT NULL | 0 | |
| location | VARCHAR(255) | | | |
| color | VARCHAR(50) | | '#1890ff' | |
| reminder_minutes | INT | | NULL | 提醒提前分钟数 |
| status | VARCHAR(20) | NOT NULL | 'PLANNED' | v3.1 新增；PLANNED/COMPLETED/CANCELLED |
| category_id | BIGINT | FK → category ON DELETE SET NULL | NULL | |
| user_id | BIGINT | NOT NULL, FK → user | v2.0 新增 | |
| last_reminded_at | DATETIME | | NULL | v2.0 新增；提醒幂等标记 |
| created_at | DATETIME | NOT NULL | NOW() | |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE | |

索引: `(start_time, end_time)`, `(category_id)`, `(user_id)`, `idx_event_user_time (user_id, start_time, end_time)` (v3.0 复合索引)

### event_tag（日程-标签关联）

| 字段 | 类型 | 约束 |
|------|------|------|
| event_id | BIGINT | PK, FK → event ON DELETE CASCADE |
| tag_id | BIGINT | PK, FK → tag ON DELETE CASCADE |

## 迁移历史

| 版本 | 文件 | 说明 |
|------|------|------|
| V1 | `V1__init_schema.sql` | 初始表结构：event / category / tag / event_tag |
| V2 | `V2__add_user_support.sql` | 新增 user 表 + 所有业务表加 user_id + `last_reminded_at` |
| V3 | `V3__multi_user.sql` | user 表补 email/displayName/avatarUrl/status/lastLoginAt；category/tag 加 `UNIQUE(user_id, name)`；event 加复合索引 |
| V4 | `V4__event_status.sql` | event 表加 status 列（PLANNED/COMPLETED/CANCELLED） |
| V5 | `V5__create_pet_tables.sql` | 新增宠物系统三张表：pets / pet_accessories / pet_interactions + 种子数据 |
| V6 | `V6__create_task_tables.sql` | 新增任务看板两张表：tasks / task_tags |



### pets（宠物 — v3.2 新增）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | PK, AUTO | | |
| user_id | BIGINT | NOT NULL, UNIQUE | | 每用户仅限一只 |
| species | VARCHAR(20) | NOT NULL | | ORANGE_CAT / SHIBA_INU |
| name | VARCHAR(30) | NOT NULL | | 宠物昵称 |
| experience | INT | NOT NULL | 0 | 经验值 |
| level | INT | NOT NULL | 1 | 等级 (1-50) |
| mood | INT | NOT NULL | 100 | 心情 (0-100) |
| hunger | INT | NOT NULL | 100 | 饱腹 (0-100) |
| coins | INT | NOT NULL | 100 | 专注币 |
| current_accessory | BIGINT | NULL, FK → pet_accessories | NULL | 当前佩戴 |
| last_interacted_at | DATETIME | NOT NULL | NOW() | 最近互动时间 |
| created_at | DATETIME | NOT NULL | NOW() | |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE | |

索引: `idx_pet_user (user_id)` UNIQUE

### pet_accessories（物品目录 — v3.2 新增）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | PK, AUTO | | |
| name | VARCHAR(50) | NOT NULL | | 物品名称 |
| type | VARCHAR(20) | NOT NULL | | FOOD / ACCESSORY |
| price | INT | NOT NULL | | 价格（专注币） |
| effect_mood | INT | NOT NULL | 0 | 心情效果 |
| effect_hunger | INT | NOT NULL | 0 | 饱腹效果 |
| effect_experience | INT | NOT NULL | 0 | 经验效果 |
| created_at | DATETIME | NOT NULL | NOW() | |

### pet_interactions（互动记录 — v3.2 新增）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | PK, AUTO | | |
| pet_id | BIGINT | NOT NULL, FK → pets ON DELETE CASCADE | | |
| type | VARCHAR(20) | NOT NULL | | FEED / PLAY |
| quantity | INT | NOT NULL | 1 | |
| mood_change | INT | NOT NULL | 0 | 心情变化 |
| hunger_change | INT | NOT NULL | 0 | 饱腹变化 |
| experience_gain | INT | NOT NULL | 0 | 经验获得 |
| created_at | DATETIME | NOT NULL | NOW() | |

索引: `idx_interaction_pet (pet_id)`, `idx_interaction_time (pet_id, created_at)`

### tasks（任务 — v3.3 新增）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | PK, AUTO | | |
| user_id | BIGINT | NOT NULL | | 数据隔离 |
| title | VARCHAR(200) | NOT NULL | | 任务标题 |
| description | TEXT | | NULL | 任务描述 |
| status | VARCHAR(20) | NOT NULL | 'TODO' | TODO / IN_PROGRESS / DONE |
| priority | VARCHAR(10) | NOT NULL | 'MEDIUM' | LOW / MEDIUM / HIGH / URGENT |
| sort_order | INT | NOT NULL | 0 | 同列内排序 |
| due_date | DATE | | NULL | 截止日期 |
| created_at | DATETIME | NOT NULL | NOW() | |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE | |

索引: `idx_tasks_user_status (user_id, status)`, `idx_tasks_user_priority (user_id, priority)`
CHECK: `status IN ('TODO', 'IN_PROGRESS', 'DONE')`, `priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')`

### task_tags（任务-标签关联 — v3.3 新增）

| 字段 | 类型 | 约束 |
|------|------|------|
| task_id | BIGINT | PK, FK → tasks ON DELETE CASCADE |
| tag_id | BIGINT | PK, FK → tag ON DELETE CASCADE |

索引: `idx_task_tags_tag (tag_id)`
