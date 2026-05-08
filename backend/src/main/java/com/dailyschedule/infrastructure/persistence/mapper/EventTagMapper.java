package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.EventTagPO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface EventTagMapper extends BaseMapper<EventTagPO> {

    @Select("SELECT tag_id FROM event_tag WHERE event_id = #{eventId}")
    List<Long> selectTagIdsByEventId(@Param("eventId") Long eventId);

    @Delete("DELETE FROM event_tag WHERE event_id = #{eventId}")
    void deleteByEventId(@Param("eventId") Long eventId);
}
