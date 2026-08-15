package com.dailyschedule.domain.pet;

/**
 * 奖励发放结果。granted=false 表示未发放（无宠物或幂等键已命中），数值变化均为 0。
 */
public class RewardResult {
    private boolean granted;
    private RewardSource source;
    private int coinChange;
    private int experienceGain;
    private int moodChange;
    private int newCoins;
    private int newExperience;
    private int newMood;

    public RewardResult() {}

    /** 未发放（无宠物 / 幂等重复）。 */
    public static RewardResult notGranted(RewardSource source) {
        RewardResult result = new RewardResult();
        result.granted = false;
        result.source = source;
        return result;
    }

    /** 已发放：从互动结果回填数值变化，最新值来自 Pet.applyInteraction 的回填。 */
    public static RewardResult granted(RewardSource source, InteractionResult interaction) {
        RewardResult result = new RewardResult();
        result.granted = true;
        result.source = source;
        result.coinChange = interaction.getCoinChange();
        result.experienceGain = interaction.getExperienceGain();
        result.moodChange = interaction.getMoodChange();
        result.newCoins = interaction.getNewCoins();
        result.newExperience = interaction.getNewExperience();
        result.newMood = interaction.getNewMood();
        return result;
    }

    // Getters and setters
    public boolean isGranted() { return granted; }
    public void setGranted(boolean granted) { this.granted = granted; }
    public RewardSource getSource() { return source; }
    public void setSource(RewardSource source) { this.source = source; }
    public int getCoinChange() { return coinChange; }
    public void setCoinChange(int coinChange) { this.coinChange = coinChange; }
    public int getExperienceGain() { return experienceGain; }
    public void setExperienceGain(int experienceGain) { this.experienceGain = experienceGain; }
    public int getMoodChange() { return moodChange; }
    public void setMoodChange(int moodChange) { this.moodChange = moodChange; }
    public int getNewCoins() { return newCoins; }
    public void setNewCoins(int newCoins) { this.newCoins = newCoins; }
    public int getNewExperience() { return newExperience; }
    public void setNewExperience(int newExperience) { this.newExperience = newExperience; }
    public int getNewMood() { return newMood; }
    public void setNewMood(int newMood) { this.newMood = newMood; }
}
