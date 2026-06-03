package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.UserPO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

@Mapper
public interface UserMapper extends BaseMapper<UserPO> {

    @Select("SELECT * FROM `user` WHERE username = #{username}")
    UserPO selectByUsername(@Param("username") String username);

    @Select("SELECT * FROM `user` WHERE email = #{email}")
    UserPO selectByEmail(@Param("email") String email);

    @Select("SELECT * FROM `user` WHERE username = #{q} OR email = #{q}")
    UserPO selectByUsernameOrEmail(@Param("q") String usernameOrEmail);

    @Update("UPDATE `user` SET last_login_at = #{when} WHERE id = #{id}")
    int updateLastLogin(@Param("id") Long id, @Param("when") LocalDateTime when);
}
