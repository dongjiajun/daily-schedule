# 数据库设计

> 当前状态: v3.1，对应 Flyway 迁移 V1–V4  
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

**无 V5 迁移**：当前版本 v3.1。
