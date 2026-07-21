package com.dailyschedule.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("pets")
public class PetPO {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    private String species;
    private String name;
    private Integer experience;
    private Integer level;
    private Integer mood;
    private Integer hunger;
    private Integer coins;

    @TableField("current_accessory")
    private Long currentAccessory;

    @TableField("last_interacted_at")
    private LocalDateTime lastInteractedAt;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public Integer getMood() { return mood; }
    public void setMood(Integer mood) { this.mood = mood; }
    public Integer getHunger() { return hunger; }
    public void setHunger(Integer hunger) { this.hunger = hunger; }
    public Integer getCoins() { return coins; }
    public void setCoins(Integer coins) { this.coins = coins; }
    public Long getCurrentAccessory() { return currentAccessory; }
    public void setCurrentAccessory(Long currentAccessory) { this.currentAccessory = currentAccessory; }
    public LocalDateTime getLastInteractedAt() { return lastInteractedAt; }
    public void setLastInteractedAt(LocalDateTime lastInteractedAt) { this.lastInteractedAt = lastInteractedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
