package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.TaskTagPO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Mapper
public interface TaskTagMapper extends BaseMapper<TaskTagPO> {

    @Delete("DELETE FROM task_tags WHERE task_id = #{taskId}")
    int deleteByTaskId(@Param("taskId") Long taskId);

    /**
     * 批量根据任务 ID 列表 JOIN 查询标签详情。
     * 结果中 {@code taskIdRef} 字段标记该标签所属的任务 ID，用于上层按任务分组。
     */
    @Select({
        "<script>",
        "SELECT tt.task_id AS task_id_ref,",
        "       t.id AS id, t.name AS name, t.color AS color,",
        "       t.created_at AS created_at, t.updated_at AS updated_at",
        "FROM task_tags tt JOIN tag t ON tt.tag_id = t.id",
        "WHERE tt.task_id IN",
        "<foreach collection='taskIds' item='id' open='(' separator=',' close=')'>#{id}</foreach>",
        "</script>"
    })
    List<TaskTagJoinRow> selectTagsByTaskIds(@Param("taskIds") Collection<Long> taskIds);

    /** 标签 JOIN 行投影：携带 task_id_ref 以便按任务分组。 */
    class TaskTagJoinRow {
        private Long taskIdRef;
        private Long id;
        private String name;
        private String color;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Long getTaskIdRef() { return taskIdRef; }
        public void setTaskIdRef(Long taskIdRef) { this.taskIdRef = taskIdRef; }
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
