package com.dailyschedule.domain.pet;

import java.time.LocalDateTime;

/**
 * 奖励发放记录（幂等审计）。领域对象，持久化映射见 PetRewardPO / pet_rewards 表。
 */
public class PetReward {
    private Long id;
    private Long petId;
    private RewardSource source;
    private String refId;
    private int coinChange;
    private int experienceGain;
    private int moodChange;
    private LocalDateTime createdAt;

    public PetReward() {}

    /** 从互动结果构造发放记录。 */
    public static PetReward of(Long petId, RewardSource source, String refId, InteractionResult interaction) {
        PetReward reward = new PetReward();
        reward.petId = petId;
        reward.source = source;
        reward.refId = refId;
        reward.coinChange = interaction.getCoinChange();
        reward.experienceGain = interaction.getExperienceGain();
        reward.moodChange = interaction.getMoodChange();
        return reward;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }
    public RewardSource getSource() { return source; }
    public void setSource(RewardSource source) { this.source = source; }
    public String getRefId() { return refId; }
    public void setRefId(String refId) { this.refId = refId; }
    public int getCoinChange() { return coinChange; }
    public void setCoinChange(int coinChange) { this.coinChange = coinChange; }
    public int getExperienceGain() { return experienceGain; }
    public void setExperienceGain(int experienceGain) { this.experienceGain = experienceGain; }
    public int getMoodChange() { return moodChange; }
    public void setMoodChange(int moodChange) { this.moodChange = moodChange; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
