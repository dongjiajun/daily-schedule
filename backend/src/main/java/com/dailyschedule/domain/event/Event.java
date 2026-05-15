package com.dailyschedule.domain.event;

import com.dailyschedule.domain.tag.Tag;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Event {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean allDay;
    private String location;
    private String color;
    private Integer reminderMinutes;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
    private Set<Long> tagIds = new HashSet<>();
    /**
     * 已加载的标签详情（读路径投影）。仅由 Repository 在查询时填充，
     * 写路径（create/update）使用 {@link #tagIds}。
     */
    private List<Tag> tags = new ArrayList<>();
    private LocalDateTime lastRemindedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Event() {}

    public Event(String title, LocalDateTime startTime, LocalDateTime endTime) {
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.allDay = false;
    }

    public boolean isValid() {
        return title != null && !title.isBlank()
            && startTime != null && endTime != null
            && !endTime.isBefore(startTime);
    }

    public boolean isOverlapping(Event other) {
        return this.startTime.isBefore(other.endTime) && this.endTime.isAfter(other.startTime);
    }

    public void update(Event data) {
        if (data.title != null) this.title = data.title;
        if (data.description != null) this.description = data.description;
        if (data.startTime != null) this.startTime = data.startTime;
        if (data.endTime != null) this.endTime = data.endTime;
        if (data.allDay != null) this.allDay = data.allDay;
        if (data.location != null) this.location = data.location;
        if (data.color != null) this.color = data.color;
        if (data.reminderMinutes != null) this.reminderMinutes = data.reminderMinutes;
        if (data.categoryId != null) this.categoryId = data.categoryId;
        if (data.tagIds != null) this.tagIds = data.tagIds;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Boolean getAllDay() { return allDay; }
    public void setAllDay(Boolean allDay) { this.allDay = allDay; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public Integer getReminderMinutes() { return reminderMinutes; }
    public void setReminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getCategoryColor() { return categoryColor; }
    public void setCategoryColor(String categoryColor) { this.categoryColor = categoryColor; }
    public Set<Long> getTagIds() { return tagIds; }
    public void setTagIds(Set<Long> tagIds) { this.tagIds = tagIds; }
    public List<Tag> getTags() { return tags; }
    public void setTags(List<Tag> tags) { this.tags = tags; }
    public LocalDateTime getLastRemindedAt() { return lastRemindedAt; }
    public void setLastRemindedAt(LocalDateTime lastRemindedAt) { this.lastRemindedAt = lastRemindedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
