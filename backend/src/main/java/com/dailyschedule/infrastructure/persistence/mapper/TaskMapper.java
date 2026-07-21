package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.TaskPO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TaskMapper extends BaseMapper<TaskPO> {

    String FILTERS =
        " WHERE t.user_id = #{userId}" +
        "<if test='status != null and status != \"\"'> AND t.status = #{status}</if>" +
        "<if test='priority != null and priority != \"\"'> AND t.priority = #{priority}</if>" +
        "<if test='tagId != null'> AND EXISTS (SELECT 1 FROM task_tags tt WHERE tt.task_id = t.id AND tt.tag_id = #{tagId})</if>";

    @Select("<script>SELECT t.* FROM tasks t" + FILTERS +
        " ORDER BY t.sort_order ASC, t.created_at DESC</script>")
    List<TaskPO> selectByFilter(@Param("userId") Long userId,
                                 @Param("status") String status,
                                 @Param("priority") String priority,
                                 @Param("tagId") Long tagId);

    @Select("SELECT COALESCE(MAX(sort_order), 0) FROM tasks WHERE user_id = #{userId} AND status = #{status}")
    int getMaxSortOrder(@Param("userId") Long userId, @Param("status") String status);
}
