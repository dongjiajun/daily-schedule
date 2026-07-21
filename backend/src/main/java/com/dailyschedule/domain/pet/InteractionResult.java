package com.dailyschedule.domain.pet;

public class InteractionResult {
    private int moodChange;
    private int hungerChange;
    private int experienceGain;
    private int coinChange;
    private int newMood;
    private int newHunger;
    private int newExperience;
    private int newCoins;

    public InteractionResult() {}

    public int getMoodChange() { return moodChange; }
    public void setMoodChange(int moodChange) { this.moodChange = moodChange; }
    public int getHungerChange() { return hungerChange; }
    public void setHungerChange(int hungerChange) { this.hungerChange = hungerChange; }
    public int getExperienceGain() { return experienceGain; }
    public void setExperienceGain(int experienceGain) { this.experienceGain = experienceGain; }
    public int getCoinChange() { return coinChange; }
    public void setCoinChange(int coinChange) { this.coinChange = coinChange; }
    public int getNewMood() { return newMood; }
    public void setNewMood(int newMood) { this.newMood = newMood; }
    public int getNewHunger() { return newHunger; }
    public void setNewHunger(int newHunger) { this.newHunger = newHunger; }
    public int getNewExperience() { return newExperience; }
    public void setNewExperience(int newExperience) { this.newExperience = newExperience; }
    public int getNewCoins() { return newCoins; }
    public void setNewCoins(int newCoins) { this.newCoins = newCoins; }
}
