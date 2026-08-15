package com.dailyschedule.domain.pet;

/**
 * 奖励发放记录端口。existsBySourceAndRefId 支撑幂等发放（唯一键 uk_reward_pet_source_ref）。
 */
public interface PetRewardRepository {
    boolean existsBySourceAndRefId(Long petId, RewardSource source, String refId);
    void save(PetReward reward);
}
