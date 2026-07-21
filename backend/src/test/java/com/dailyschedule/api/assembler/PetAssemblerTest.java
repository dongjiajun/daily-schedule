package com.dailyschedule.api.assembler;

import com.dailyschedule.api.generated.dto.PetProfile;
import com.dailyschedule.api.generated.dto.ShopItem;
import com.dailyschedule.domain.pet.InteractionResult;
import com.dailyschedule.domain.pet.Pet;
import com.dailyschedule.domain.pet.PetSpecies;
import com.dailyschedule.domain.pet.PurchaseResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PetAssemblerTest {

    @Test
    @DisplayName("toPetProfile → 正确转换所有字段")
    void toPetProfile_convertsAllFields() {
        Pet pet = new Pet();
        pet.setId(1L);
        pet.setSpecies(PetSpecies.ORANGE_CAT);
        pet.setName("大橘");
        pet.setExperience(500);
        pet.setLevel(3);
        pet.setMood(75);
        pet.setHunger(60);
        pet.setCoins(150);
        pet.setLastInteractedAt(LocalDateTime.of(2026, 7, 21, 10, 0));
        pet.setCreatedAt(LocalDateTime.of(2026, 7, 1, 12, 0));

        PetProfile profile = PetAssembler.toPetProfile(pet);

        assertThat(profile.getId()).isEqualTo(1L);
        assertThat(profile.getSpecies()).isEqualTo("ORANGE_CAT");
        assertThat(profile.getName()).isEqualTo("大橘");
        assertThat(profile.getExperience()).isEqualTo(500);
        assertThat(profile.getLevel()).isEqualTo(3);
        assertThat(profile.getMood()).isEqualTo(75);
        assertThat(profile.getHunger()).isEqualTo(60);
        assertThat(profile.getCoins()).isEqualTo(150);
    }

    @Test
    @DisplayName("toPetProfile → null → null")
    void toPetProfile_null_returnsNull() {
        assertThat(PetAssembler.toPetProfile(null)).isNull();
    }

    @Test
    @DisplayName("toInteractionResultDto → 正确转换")
    void toInteractionResultDto_convertsCorrectly() {
        InteractionResult domain = new InteractionResult();
        domain.setMoodChange(10);
        domain.setHungerChange(20);
        domain.setExperienceGain(5);
        domain.setCoinChange(-10);
        domain.setNewMood(90);
        domain.setNewHunger(80);
        domain.setNewExperience(105);
        domain.setNewCoins(90);

        com.dailyschedule.api.generated.dto.InteractionResult dto =
            PetAssembler.toInteractionResultDto(domain);

        assertThat(dto.getMoodChange()).isEqualTo(10);
        assertThat(dto.getHungerChange()).isEqualTo(20);
        assertThat(dto.getCoinChange()).isEqualTo(-10);
        assertThat(dto.getNewMood()).isEqualTo(90);
    }

    @Test
    @DisplayName("toShopItemDto → 正确转换")
    void toShopItemDto_convertsCorrectly() {
        com.dailyschedule.domain.pet.ShopItem domain = new com.dailyschedule.domain.pet.ShopItem();
        domain.setId(1L);
        domain.setName("小鱼干");
        domain.setType("FOOD");
        domain.setPrice(10);
        domain.setEffectMood(5);
        domain.setEffectHunger(20);
        domain.setEffectExperience(3);

        ShopItem dto = PetAssembler.toShopItemDto(domain);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getName()).isEqualTo("小鱼干");
        assertThat(dto.getPrice()).isEqualTo(10);
    }

    @Test
    @DisplayName("toPurchaseResultDto → 正确转换")
    void toPurchaseResultDto_convertsCorrectly() {
        PurchaseResult domain = new PurchaseResult();
        domain.setSuccess(true);
        domain.setItemName("小鱼干");
        domain.setQuantity(2);
        domain.setTotalCost(20);
        domain.setNewCoins(80);

        com.dailyschedule.api.generated.dto.PurchaseResult dto =
            PetAssembler.toPurchaseResultDto(domain);

        assertThat(dto.getSuccess()).isTrue();
        assertThat(dto.getItemName()).isEqualTo("小鱼干");
        assertThat(dto.getTotalCost()).isEqualTo(20);
    }
}
