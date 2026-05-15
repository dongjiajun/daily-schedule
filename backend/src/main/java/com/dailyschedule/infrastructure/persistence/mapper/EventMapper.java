package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.EventPO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface EventMapper extends BaseMapper<EventPO> {

    @Select("SELECT * FROM event WHERE start_time < #{end} AND end_time > #{start} ORDER BY start_time")
    List<EventPO> selectByRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Select("SELECT * FROM event WHERE start_time < #{end} AND end_time > #{start} AND category_id = #{categoryId} ORDER BY start_time")
    List<EventPO> selectByRangeAndCategory(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("categoryId") Long categoryId);

    @Select("SELECT * FROM event WHERE start_time BETWEEN #{now} AND #{threshold} AND reminder_minutes IS NOT NULL ORDER BY start_time")
    List<EventPO> selectUpcoming(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);

    @Update("UPDATE event SET last_reminded_at = #{remindedAt} WHERE id = #{id}")
    int updateLastRemindedAt(@Param("id") Long id, @Param("remindedAt") LocalDateTime remindedAt);
}
