package com.dailyschedule.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("pet_interactions")
public class PetInteractionPO {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("pet_id")
    private Long petId;

    private String type;
    private Integer quantity;

    @TableField("mood_change")
    private Integer moodChange;

    @TableField("hunger_change")
    private Integer hungerChange;

    @TableField("experience_gain")
    private Integer experienceGain;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getMoodChange() { return moodChange; }
    public void setMoodChange(Integer moodChange) { this.moodChange = moodChange; }
    public Integer getHungerChange() { return hungerChange; }
    public void setHungerChange(Integer hungerChange) { this.hungerChange = hungerChange; }
    public Integer getExperienceGain() { return experienceGain; }
    public void setExperienceGain(Integer experienceGain) { this.experienceGain = experienceGain; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
