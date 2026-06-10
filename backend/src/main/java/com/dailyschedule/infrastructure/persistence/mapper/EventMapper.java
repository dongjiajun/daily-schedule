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

    String SELECT_WITH_CATEGORY =
        "SELECT e.*, c.name AS category_name, c.color AS category_color FROM event e" +
        " LEFT JOIN category c ON e.category_id = c.id";

    String RANGE_FILTERS =
        " WHERE e.user_id = #{userId} AND e.start_time &lt; #{end} AND e.end_time &gt; #{start}" +
        "<if test='categoryId != null'> AND e.category_id = #{categoryId}</if>" +
        "<if test='tagId != null'> AND EXISTS (SELECT 1 FROM event_tag et WHERE et.event_id = e.id AND et.tag_id = #{tagId})</if>" +
        "<if test='status != null and status != \"\"'> AND e.status = #{status}</if>" +
        "<if test='keyword != null and keyword != \"\"'> AND (e.title LIKE CONCAT('%',#{keyword},'%') OR e.description LIKE CONCAT('%',#{keyword},'%') OR e.location LIKE CONCAT('%',#{keyword},'%'))</if>";

    @Select("<script>" + SELECT_WITH_CATEGORY + RANGE_FILTERS +
        " ORDER BY e.start_time LIMIT #{offset}, #{limit}</script>")
    List<EventPO> selectByRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                                @Param("userId") Long userId,
                                @Param("categoryId") Long categoryId,
                                @Param("tagId") Long tagId,
                                @Param("status") String status,
                                @Param("keyword") String keyword,
                                @Param("offset") int offset, @Param("limit") int limit);

    @Select("<script>SELECT COUNT(*) FROM event e" + RANGE_FILTERS + "</script>")
    long countByRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                      @Param("userId") Long userId,
                      @Param("categoryId") Long categoryId,
                      @Param("tagId") Long tagId,
                      @Param("status") String status,
                      @Param("keyword") String keyword);

    @Select(SELECT_WITH_CATEGORY +
        " WHERE e.start_time BETWEEN #{now} AND #{threshold} AND e.reminder_minutes IS NOT NULL" +
        " AND e.status = 'PLANNED' ORDER BY e.start_time")
    List<EventPO> selectUpcoming(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);

    @Update("UPDATE event SET last_reminded_at = #{remindedAt} WHERE id = #{id}")
    int updateLastRemindedAt(@Param("id") Long id, @Param("remindedAt") LocalDateTime remindedAt);
}
