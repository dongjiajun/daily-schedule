package com.dailyschedule.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("pet_accessories")
public class PetAccessoryPO {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String type;
    private Integer price;

    @TableField("effect_mood")
    private Integer effectMood;

    @TableField("effect_hunger")
    private Integer effectHunger;

    @TableField("effect_experience")
    private Integer effectExperience;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }
    public Integer getEffectMood() { return effectMood; }
    public void setEffectMood(Integer effectMood) { this.effectMood = effectMood; }
    public Integer getEffectHunger() { return effectHunger; }
    public void setEffectHunger(Integer effectHunger) { this.effectHunger = effectHunger; }
    public Integer getEffectExperience() { return effectExperience; }
    public void setEffectExperience(Integer effectExperience) { this.effectExperience = effectExperience; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
