package com.dailyschedule.domain.pet;

import java.time.LocalDateTime;

public class Pet {
    private Long id;
    private Long userId;
    private PetSpecies species;
    private String name;
    private int experience;
    private int level;
    private int mood;
    private int hunger;
    private int coins;
    private Long currentAccessory;
    private LocalDateTime lastInteractedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Pet() {}

    public boolean isValid() {
        return name != null && !name.isBlank()
            && name.length() <= 30
            && species != null;
    }

    public void applyInteraction(InteractionResult result) {
        this.mood = Math.max(0, Math.min(100, this.mood + result.getMoodChange()));
        this.hunger = Math.max(0, Math.min(100, this.hunger + result.getHungerChange()));
        this.experience += result.getExperienceGain();
        this.coins += result.getCoinChange();
        this.lastInteractedAt = LocalDateTime.now();
        // 重新计算等级
        this.level = PetDomainService.calculateLevel(this.experience);
        // 回填结果中的新值
        result.setNewMood(this.mood);
        result.setNewHunger(this.hunger);
        result.setNewExperience(this.experience);
        result.setNewCoins(this.coins);
    }

    public void applyDecay(int moodDelta, int hungerDelta) {
        this.mood = Math.max(0, this.mood + moodDelta);
        this.hunger = Math.max(0, this.hunger + hungerDelta);
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public PetSpecies getSpecies() { return species; }
    public void setSpecies(PetSpecies species) { this.species = species; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getExperience() { return experience; }
    public void setExperience(int experience) { this.experience = experience; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public int getMood() { return mood; }
    public void setMood(int mood) { this.mood = mood; }
    public int getHunger() { return hunger; }
    public void setHunger(int hunger) { this.hunger = hunger; }
    public int getCoins() { return coins; }
    public void setCoins(int coins) { this.coins = coins; }
    public Long getCurrentAccessory() { return currentAccessory; }
    public void setCurrentAccessory(Long currentAccessory) { this.currentAccessory = currentAccessory; }
    public LocalDateTime getLastInteractedAt() { return lastInteractedAt; }
    public void setLastInteractedAt(LocalDateTime lastInteractedAt) { this.lastInteractedAt = lastInteractedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
