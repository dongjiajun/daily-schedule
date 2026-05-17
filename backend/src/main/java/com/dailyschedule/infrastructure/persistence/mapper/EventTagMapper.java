package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.EventTagPO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Mapper
public interface EventTagMapper extends BaseMapper<EventTagPO> {

    @Select("SELECT tag_id FROM event_tag WHERE event_id = #{eventId}")
    List<Long> selectTagIdsByEventId(@Param("eventId") Long eventId);

    @Select("<script>SELECT event_id, tag_id FROM event_tag WHERE event_id IN <foreach collection='eventIds' item='id' open='(' separator=',' close=')'>#{id}</foreach></script>")
    List<EventTagPO> selectByEventIds(@Param("eventIds") List<Long> eventIds);

    @Insert("<script>INSERT INTO event_tag (event_id, tag_id) VALUES <foreach collection='list' item='item' separator=','>(#{item.eventId}, #{item.tagId})</foreach></script>")
    void batchInsert(@Param("list") List<EventTagPO> list);

    @Delete("DELETE FROM event_tag WHERE event_id = #{eventId}")
    void deleteByEventId(@Param("eventId") Long eventId);

    /**
     * 批量根据事件 ID 列表 JOIN 查询标签详情。
     * 结果中 {@code eventIdRef} 字段标记该标签所属的事件 ID，用于上层按事件分组。
     */
    @Select({
        "<script>",
        "SELECT et.event_id AS event_id_ref,",
        "       t.id AS id, t.name AS name, t.color AS color,",
        "       t.created_at AS created_at, t.updated_at AS updated_at",
        "FROM event_tag et JOIN tag t ON et.tag_id = t.id",
        "WHERE et.event_id IN",
        "<foreach collection='eventIds' item='id' open='(' separator=',' close=')'>#{id}</foreach>",
        "</script>"
    })
    List<EventTagJoinRow> selectTagsByEventIds(@Param("eventIds") Collection<Long> eventIds);

    /** 标签 JOIN 行投影：携带 event_id_ref 以便按事件分组。 */
    class EventTagJoinRow {
        private Long eventIdRef;
        private Long id;
        private String name;
        private String color;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Long getEventIdRef() { return eventIdRef; }
        public void setEventIdRef(Long eventIdRef) { this.eventIdRef = eventIdRef; }
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
}
