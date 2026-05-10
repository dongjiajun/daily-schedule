# 数据库设计

## ER 图

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│ category │       │   event  │       │   tag    │
├──────────┤       ├──────────┤       ├──────────┤
│ id (PK)  │──┐    │ id (PK)  │    ┌──│ id (PK)  │
│ name     │  └───>│ category │    │  │ name     │
│ color    │       │  _id (FK)│    │  │ color    │
│ desc     │       │ title    │    │  └──────────┘
│ created  │       │ start    │    │       │
│ updated  │       │ end      │    │       │
└──────────┘       │ all_day  │    │       │
                   │ location │    │       │
                   │ color    │    │       │
                   │ reminder │    │       │
                   │ created  │    │       │
                   │ updated  │    │       │
                   └──────────┘    │       │
                        │          │       │
                        │  ┌───────┘       │
                        │  │ ┌─────────────┘
                   ┌────▼──▼─┐
                   │event_tag │
                   ├──────────┤
                   │event_id  │
                   │tag_id    │
                   └──────────┘
```

## 表结构

### category（分类）
| 字段 | 类型 | 约束 | 默认值 |
|------|------|------|--------|
| id | BIGINT | PK, AUTO | |
| name | VARCHAR(50) | NOT NULL | |
| color | VARCHAR(50) | | #1890ff |
| description | VARCHAR(200) | | |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

### tag（标签）
| 字段 | 类型 | 约束 | 默认值 |
|------|------|------|--------|
| id | BIGINT | PK, AUTO | |
| name | VARCHAR(30) | NOT NULL | |
| color | VARCHAR(50) | | #1890ff |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

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
| category_id | BIGINT | FK → category | NULL |
| created_at | DATETIME | NOT NULL | NOW() |
| updated_at | DATETIME | NOT NULL | NOW() ON UPDATE |

索引：`(start_time, end_time)`、`(category_id)`

### event_tag（日程-标签关联）
| 字段 | 类型 | 约束 |
|------|------|------|
| event_id | BIGINT | PK, FK → event ON DELETE CASCADE |
| tag_id | BIGINT | PK, FK → tag ON DELETE CASCADE |
