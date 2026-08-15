package com.dailyschedule.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dailyschedule.infrastructure.persistence.po.PetRewardPO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PetRewardMapper extends BaseMapper<PetRewardPO> {
}
