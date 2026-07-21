package com.dailyschedule.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("task_tags")
public class TaskTagPO {
    @TableField("task_id")
    private Long taskId;

    @TableField("tag_id")
    private Long tagId;

    public TaskTagPO() {}

    public TaskTagPO(Long taskId, Long tagId) {
        this.taskId = taskId;
        this.tagId = tagId;
    }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    public Long getTagId() { return tagId; }
    public void setTagId(Long tagId) { this.tagId = tagId; }
}
