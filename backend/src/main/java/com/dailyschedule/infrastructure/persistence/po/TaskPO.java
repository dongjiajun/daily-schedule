package com.dailyschedule.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@TableName("tasks")
public class TaskPO {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    private String title;
    private String description;
    private String status;
    private String priority;

    @TableField("sort_order")
    private Integer sortOrder;

    @TableField("due_date")
    private LocalDate dueDate;

    @TableField(exist = false)
    private List<Long> tagIds;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public List<Long> getTagIds() { return tagIds; }
    public void setTagIds(List<Long> tagIds) { this.tagIds = tagIds; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
