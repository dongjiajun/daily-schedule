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

    @Select("<script>SELECT * FROM event WHERE user_id = #{userId} AND start_time &lt; #{end} AND end_time &gt; #{start}" +
        "<if test='keyword != null and keyword != \"\"'> AND (title LIKE CONCAT('%',#{keyword},'%') OR description LIKE CONCAT('%',#{keyword},'%') OR location LIKE CONCAT('%',#{keyword},'%'))</if>" +
        " ORDER BY start_time LIMIT #{offset}, #{limit}</script>")
    List<EventPO> selectByRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                                @Param("userId") Long userId,
                                @Param("keyword") String keyword,
                                @Param("offset") int offset, @Param("limit") int limit);

    @Select("<script>SELECT * FROM event WHERE user_id = #{userId} AND start_time &lt; #{end} AND end_time &gt; #{start} AND category_id = #{categoryId}" +
        "<if test='keyword != null and keyword != \"\"'> AND (title LIKE CONCAT('%',#{keyword},'%') OR description LIKE CONCAT('%',#{keyword},'%') OR location LIKE CONCAT('%',#{keyword},'%'))</if>" +
        " ORDER BY start_time LIMIT #{offset}, #{limit}</script>")
    List<EventPO> selectByRangeAndCategory(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                                           @Param("categoryId") Long categoryId,
                                           @Param("userId") Long userId,
                                           @Param("keyword") String keyword,
                                           @Param("offset") int offset, @Param("limit") int limit);

    @Select("<script>SELECT COUNT(*) FROM event WHERE user_id = #{userId} AND start_time &lt; #{end} AND end_time &gt; #{start}" +
        "<if test='keyword != null and keyword != \"\"'> AND (title LIKE CONCAT('%',#{keyword},'%') OR description LIKE CONCAT('%',#{keyword},'%') OR location LIKE CONCAT('%',#{keyword},'%'))</if></script>")
    long countByRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                      @Param("userId") Long userId,
                      @Param("keyword") String keyword);

    @Select("<script>SELECT COUNT(*) FROM event WHERE user_id = #{userId} AND start_time &lt; #{end} AND end_time &gt; #{start} AND category_id = #{categoryId}" +
        "<if test='keyword != null and keyword != \"\"'> AND (title LIKE CONCAT('%',#{keyword},'%') OR description LIKE CONCAT('%',#{keyword},'%') OR location LIKE CONCAT('%',#{keyword},'%'))</if></script>")
    long countByRangeAndCategory(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                                 @Param("categoryId") Long categoryId,
                                 @Param("userId") Long userId,
                                 @Param("keyword") String keyword);

    @Select("SELECT * FROM event WHERE start_time BETWEEN #{now} AND #{threshold} AND reminder_minutes IS NOT NULL ORDER BY start_time")
    List<EventPO> selectUpcoming(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);

    @Update("UPDATE event SET last_reminded_at = #{remindedAt} WHERE id = #{id}")
    int updateLastRemindedAt(@Param("id") Long id, @Param("remindedAt") LocalDateTime remindedAt);
}
