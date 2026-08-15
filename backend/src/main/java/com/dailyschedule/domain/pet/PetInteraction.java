package com.dailyschedule.domain.pet;

import java.time.LocalDateTime;

/**
 * 宠物互动记录（领域对象）。持久化映射见 PetInteractionPO / pet_interactions 表。
 */
public class PetInteraction {
    private Long id;
    private Long petId;
    private InteractionType type;
    private int quantity;
    private int moodChange;
    private int hungerChange;
    private int experienceGain;
    private LocalDateTime createdAt;

    public PetInteraction() {}

    /** 从互动结果构造记录（互动为单次，quantity 固定 1）。 */
    public static PetInteraction of(Long petId, InteractionType type, InteractionResult result) {
        PetInteraction interaction = new PetInteraction();
        interaction.petId = petId;
        interaction.type = type;
        interaction.quantity = 1;
        interaction.moodChange = result.getMoodChange();
        interaction.hungerChange = result.getHungerChange();
        interaction.experienceGain = result.getExperienceGain();
        return interaction;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }
    public InteractionType getType() { return type; }
    public void setType(InteractionType type) { this.type = type; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getMoodChange() { return moodChange; }
    public void setMoodChange(int moodChange) { this.moodChange = moodChange; }
    public int getHungerChange() { return hungerChange; }
    public void setHungerChange(int hungerChange) { this.hungerChange = hungerChange; }
    public int getExperienceGain() { return experienceGain; }
    public void setExperienceGain(int experienceGain) { this.experienceGain = experienceGain; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
