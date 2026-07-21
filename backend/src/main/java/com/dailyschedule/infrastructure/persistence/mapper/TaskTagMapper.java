package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.TaskTagPO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TaskTagMapper extends BaseMapper<TaskTagPO> {

    @Delete("DELETE FROM task_tags WHERE task_id = #{taskId}")
    int deleteByTaskId(@Param("taskId") Long taskId);
}
