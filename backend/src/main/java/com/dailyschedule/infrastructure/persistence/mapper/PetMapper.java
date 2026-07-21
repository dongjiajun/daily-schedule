package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.PetPO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PetMapper extends BaseMapper<PetPO> {

    @Select("SELECT * FROM pets WHERE user_id = #{userId}")
    PetPO selectByUserId(Long userId);
}
