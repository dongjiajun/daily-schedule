package com.dailyschedule.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("event_tag")
public class EventTagPO {
    @TableField("event_id")
    private Long eventId;

    @TableField("tag_id")
    private Long tagId;

    public EventTagPO() {}

    public EventTagPO(Long eventId, Long tagId) {
        this.eventId = eventId;
        this.tagId = tagId;
    }

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public Long getTagId() { return tagId; }
    public void setTagId(Long tagId) { this.tagId = tagId; }
}
