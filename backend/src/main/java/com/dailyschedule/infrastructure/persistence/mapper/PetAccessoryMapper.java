package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.PetAccessoryPO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PetAccessoryMapper extends BaseMapper<PetAccessoryPO> {

    @Select("SELECT * FROM pet_accessories ORDER BY id")
    List<PetAccessoryPO> selectAllShopItems();
}
