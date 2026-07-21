package com.dailyschedule.domain.pet;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PetTest {

    @Test
    @DisplayName("isValid → name 非空 + species 非空 → true")
    void isValid_whenValid_returnsTrue() {
        Pet pet = new Pet();
        pet.setName("大橘");
        pet.setSpecies(PetSpecies.ORANGE_CAT);
        assertThat(pet.isValid()).isTrue();
    }

    @Test
    @DisplayName("isValid → name 为空 → false")
    void isValid_whenNameEmpty_returnsFalse() {
        Pet pet = new Pet();
        pet.setName("");
        pet.setSpecies(PetSpecies.ORANGE_CAT);
        assertThat(pet.isValid()).isFalse();
    }

    @Test
    @DisplayName("isValid → species 为 null → false")
    void isValid_whenSpeciesNull_returnsFalse() {
        Pet pet = new Pet();
        pet.setName("大橘");
        assertThat(pet.isValid()).isFalse();
    }

    @Test
    @DisplayName("isValid → name 超 30 字符 → false")
    void isValid_whenNameTooLong_returnsFalse() {
        Pet pet = new Pet();
        pet.setName("a".repeat(31));
        pet.setSpecies(PetSpecies.SHIBA_INU);
        assertThat(pet.isValid()).isFalse();
    }

    @Test
    @DisplayName("applyInteraction → mood 不超过 100 上限")
    void applyInteraction_capsMoodAt100() {
        Pet pet = new Pet();
        pet.setMood(95);
        pet.setHunger(80);
        pet.setExperience(0);
        pet.setCoins(100);

        InteractionResult result = new InteractionResult();
        result.setMoodChange(25);
        result.setHungerChange(0);
        result.setExperienceGain(10);
        result.setCoinChange(0);

        pet.applyInteraction(result);
        assertThat(pet.getMood()).isEqualTo(100);
        assertThat(pet.getHunger()).isEqualTo(80);
    }

    @Test
    @DisplayName("applyInteraction → mood 不低于 0 下限")
    void applyInteraction_floorMoodAt0() {
        Pet pet = new Pet();
        pet.setMood(5);
        pet.setHunger(50);
        pet.setExperience(0);
        pet.setCoins(100);

        InteractionResult result = new InteractionResult();
        result.setMoodChange(-25);
        result.setHungerChange(-10);
        result.setExperienceGain(0);
        result.setCoinChange(0);

        pet.applyInteraction(result);
        assertThat(pet.getMood()).isEqualTo(0);
        assertThat(pet.getHunger()).isEqualTo(40);
    }

    @Test
    @DisplayName("applyDecay → 衰减正确减少 mood 和 hunger")
    void applyDecay_reducesMoodAndHunger() {
        Pet pet = new Pet();
        pet.setMood(80);
        pet.setHunger(90);

        pet.applyDecay(-4, -6);
        assertThat(pet.getMood()).isEqualTo(76);
        assertThat(pet.getHunger()).isEqualTo(84);
    }

    @Test
    @DisplayName("applyDecay → 不低于 0")
    void applyDecay_floorAt0() {
        Pet pet = new Pet();
        pet.setMood(2);
        pet.setHunger(3);

        pet.applyDecay(-10, -10);
        assertThat(pet.getMood()).isEqualTo(0);
        assertThat(pet.getHunger()).isEqualTo(0);
    }
}
