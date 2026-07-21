package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.InteractionResult;
import com.dailyschedule.api.generated.dto.PetProfile;
import com.dailyschedule.api.generated.dto.PurchaseResult;
import com.dailyschedule.api.generated.dto.ShopItem;
import com.dailyschedule.domain.pet.Pet;

public class PetAssembler {

    private PetAssembler() {}

    public static PetProfile toPetProfile(Pet pet) {
        if (pet == null) return null;
        return new PetProfile()
            .id(pet.getId())
            .species(pet.getSpecies() != null ? pet.getSpecies().name() : null)
            .name(pet.getName())
            .experience(pet.getExperience())
            .level(pet.getLevel())
            .mood(pet.getMood())
            .hunger(pet.getHunger())
            .coins(pet.getCoins())
            .currentAccessory(pet.getCurrentAccessory())
            .lastInteractedAt(pet.getLastInteractedAt())
            .createdAt(pet.getCreatedAt());
    }

    public static InteractionResult toInteractionResultDto(
        com.dailyschedule.domain.pet.InteractionResult domain) {
        if (domain == null) return null;
        return new InteractionResult()
            .moodChange(domain.getMoodChange())
            .hungerChange(domain.getHungerChange())
            .experienceGain(domain.getExperienceGain())
            .coinChange(domain.getCoinChange())
            .newMood(domain.getNewMood())
            .newHunger(domain.getNewHunger())
            .newExperience(domain.getNewExperience())
            .newCoins(domain.getNewCoins());
    }

    public static ShopItem toShopItemDto(com.dailyschedule.domain.pet.ShopItem domain) {
        if (domain == null) return null;
        return new ShopItem()
            .id(domain.getId())
            .name(domain.getName())
            .type(domain.getType())
            .price(domain.getPrice())
            .effectMood(domain.getEffectMood())
            .effectHunger(domain.getEffectHunger())
            .effectExperience(domain.getEffectExperience());
    }

    public static PurchaseResult toPurchaseResultDto(
        com.dailyschedule.domain.pet.PurchaseResult domain) {
        if (domain == null) return null;
        return new PurchaseResult()
            .success(domain.isSuccess())
            .itemName(domain.getItemName())
            .quantity(domain.getQuantity())
            .totalCost(domain.getTotalCost())
            .newCoins(domain.getNewCoins())
            .newMood(domain.getNewMood())
            .newHunger(domain.getNewHunger())
            .newExperience(domain.getNewExperience());
    }
}
