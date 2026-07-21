package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.PetInteractionPO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PetInteractionMapper extends BaseMapper<PetInteractionPO> {
}
