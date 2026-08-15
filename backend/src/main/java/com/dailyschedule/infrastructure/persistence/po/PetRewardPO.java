package com.dailyschedule.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("pet_rewards")
public class PetRewardPO {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("pet_id")
    private Long petId;

    private String source;

    @TableField("ref_id")
    private String refId;

    @TableField("coin_change")
    private Integer coinChange;

    @TableField("experience_gain")
    private Integer experienceGain;

    @TableField("mood_change")
    private Integer moodChange;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getRefId() { return refId; }
    public void setRefId(String refId) { this.refId = refId; }
    public Integer getCoinChange() { return coinChange; }
    public void setCoinChange(Integer coinChange) { this.coinChange = coinChange; }
    public Integer getExperienceGain() { return experienceGain; }
    public void setExperienceGain(Integer experienceGain) { this.experienceGain = experienceGain; }
    public Integer getMoodChange() { return moodChange; }
    public void setMoodChange(Integer moodChange) { this.moodChange = moodChange; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
