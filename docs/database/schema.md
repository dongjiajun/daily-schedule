# 数据库设计

## ER 图

```
┌──────────┐
│   user   │
├──────────┤
│ id (PK)  │─────────────────────────────────────────┐
│ username │                                         │
│ password │                                         │
│ created  │                                         │
│ updated  │                                         │
└──────────┘                                         │
                                                     │
┌──────────┐       ┌──────────┐       ┌──────────┐   │
│ category │       │   event  │       │   tag    │   │
├──────────┤       ├──────────┤       ├──────────┤   │
│ id (PK)  │──┐    │ id (PK)  │    ┌──│ id (PK)  │   │
│ name     │  └───>│ category │    │  │ name     │   │
│ color    │       │  _id (FK)│    │  │ color    │   │
│ desc     │       │ title    │    │  └──────────┘   │
│ user_id  │<──┐   │ start    │    │       │          │
│ created  │   │   │ end      │    │       │          │
│ updated  │   │   │ all_day  │    │       │          │
└──────────┘   │   │ location │    │       │          │
               │   │ color    │    │       │          │
               │   │ reminder │    │       │          │
               │   │ user_id  │<───┤       │          │
               │   │ last_    │    │       │          │
               │   │ reminded │    │  ┌────┘          │
               │   │ created  │    │  │  ┌────────────┘
               │   │ updated  │    │  │  │
               │   └──────────┘    │  │  │
               │        │          │  │  │
               │        │  ┌───────┘  │  │
               │        │  │ ┌────────┘  │
               │   ┌────▼──▼─┐           │
               │   │event_tag │           │
               │   ├──────────┤           │
               │   │event_id  │           │
               │   │tag_id    │           │
               │   └──────────┘           │
               │                          │
               └──────────────────────────┘
```

所有业务表通过 `user_id` 外键关联 `user` 表，查询时强制按当前用户过滤。

## 表结构

### user（用户）
| 字段 | 类型 | 约束 | 默认值 |
|------|------|------|--------|
| id | BIGINT | PK, AUTO | |
| username | VARCHAR(50) | NOT NULL, UNIQUE | |
| password_hash | VARCHAR(255) | NOT NULL | |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

### category（分类）
| 字段 | 类型 | 约束 | 默认值 |
|------|------|------|--------|
| id | BIGINT | PK, AUTO | |
| name | VARCHAR(50) | NOT NULL | |
| color | VARCHAR(50) | | #1890ff |
| description | VARCHAR(200) | | |
| user_id | BIGINT | NOT NULL, FK → user | |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

索引：`(user_id)`

### tag（标签）
| 字段 | 类型 | 约束 | 默认值 |
|------|------|------|--------|
| id | BIGINT | PK, AUTO | |
| name | VARCHAR(30) | NOT NULL | |
| color | VARCHAR(50) | | #1890ff |
| user_id | BIGINT | NOT NULL, FK → user | |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

索引：`(user_id)`

### event（日程）
| 字段 | 类型 | 约束 | 默认值 |
|------|------|------|--------|
| id | BIGINT | PK, AUTO | |
| title | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| start_time | DATETIME | NOT NULL | |
| end_time | DATETIME | NOT NULL | |
| all_day | TINYINT(1) | NOT NULL | 0 |
| location | VARCHAR(255) | | |
| color | VARCHAR(50) | | #1890ff |
| reminder_minutes | INT | | NULL |
| status | VARCHAR(20) | NOT NULL | 'PLANNED' |
| category_id | BIGINT | FK → category | NULL |
| user_id | BIGINT | NOT NULL, FK → user | |
| last_reminded_at | DATETIME | | NULL |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

索引：`(start_time, end_time)`、`(category_id)`、`(user_id)`

### event_tag（日程-标签关联）
| 字段 | 类型 | 约束 |
|------|------|------|
| event_id | BIGINT | PK, FK → event ON DELETE CASCADE |
| tag_id | BIGINT | PK, FK → tag ON DELETE CASCADE |

## 迁移历史

| 版本 | 文件 | 说明 |
|------|------|------|
| V1 | `V1__init_schema.sql` | 初始表结构 |
| V2 | `V2__add_user_support.sql` | 新增 user 表 + 所有表加 user_id |
| V3 | `V3__multi_user.sql` | user 表补字段 + 唯一索引 + 复合查询索引 |
| V4 | `V4__event_status.sql` | event 表加 status 列（PLANNED/COMPLETED/CANCELLED） |
