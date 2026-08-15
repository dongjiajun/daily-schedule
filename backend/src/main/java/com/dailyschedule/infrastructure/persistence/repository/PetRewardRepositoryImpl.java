package com.dailyschedule.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dailyschedule.domain.pet.PetReward;
import com.dailyschedule.domain.pet.PetRewardRepository;
import com.dailyschedule.domain.pet.RewardSource;
import com.dailyschedule.infrastructure.persistence.mapper.PetRewardMapper;
import com.dailyschedule.infrastructure.persistence.po.PetRewardPO;
import org.springframework.stereotype.Repository;

@Repository
public class PetRewardRepositoryImpl implements PetRewardRepository {

    private final PetRewardMapper rewardMapper;

    public PetRewardRepositoryImpl(PetRewardMapper rewardMapper) {
        this.rewardMapper = rewardMapper;
    }

    @Override
    public boolean existsBySourceAndRefId(Long petId, RewardSource source, String refId) {
        LambdaQueryWrapper<PetRewardPO> query = new LambdaQueryWrapper<PetRewardPO>()
            .eq(PetRewardPO::getPetId, petId)
            .eq(PetRewardPO::getSource, source.name())
            .eq(PetRewardPO::getRefId, refId);
        return rewardMapper.selectCount(query) > 0;
    }

    @Override
    public void save(PetReward reward) {
        PetRewardPO po = new PetRewardPO();
        po.setPetId(reward.getPetId());
        po.setSource(reward.getSource() != null ? reward.getSource().name() : null);
        po.setRefId(reward.getRefId());
        po.setCoinChange(reward.getCoinChange());
        po.setExperienceGain(reward.getExperienceGain());
        po.setMoodChange(reward.getMoodChange());
        rewardMapper.insert(po);
        reward.setId(po.getId());
        reward.setCreatedAt(po.getCreatedAt());
    }
}
