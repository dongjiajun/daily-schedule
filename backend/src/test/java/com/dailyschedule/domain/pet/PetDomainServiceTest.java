package com.dailyschedule.domain.pet;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PetDomainServiceTest {

    private PetDomainService domainService;

    @BeforeEach
    void setUp() {
        domainService = new PetDomainService();
    }

    @Test
    @DisplayName("喂食 → 专注币足够 → 返回正确效果")
    void interact_feedSuccess() {
        Pet pet = new Pet();
        pet.setMood(70);
        pet.setHunger(60);
        pet.setExperience(0);
        pet.setCoins(100);

        ShopItem fish = new ShopItem();
        fish.setName("小鱼干");
        fish.setPrice(10);
        fish.setEffectMood(5);
        fish.setEffectHunger(20);
        fish.setEffectExperience(3);

        InteractionResult result = domainService.interact(pet, InteractionType.FEED, fish);
        assertThat(result.getMoodChange()).isEqualTo(5);
        assertThat(result.getHungerChange()).isEqualTo(20);
        assertThat(result.getExperienceGain()).isEqualTo(3);
        assertThat(result.getCoinChange()).isEqualTo(-10);
    }

    @Test
    @DisplayName("喂食 → 专注币不足 → 抛出异常")
    void interact_feedInsufficientCoins() {
        Pet pet = new Pet();
        pet.setCoins(5);

        ShopItem fish = new ShopItem();
        fish.setName("小鱼干");
        fish.setPrice(10);

        assertThatThrownBy(() -> domainService.interact(pet, InteractionType.FEED, fish))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("专注币不足");
    }

    @Test
    @DisplayName("玩耍 → 免费 → +心情 -饱腹 +经验")
    void interact_playSuccess() {
        Pet pet = new Pet();
        pet.setMood(50);
        pet.setHunger(80);
        pet.setExperience(100);
        pet.setCoins(0);

        InteractionResult result = domainService.interact(pet, InteractionType.PLAY, null);
        assertThat(result.getMoodChange()).isEqualTo(25);
        assertThat(result.getHungerChange()).isEqualTo(-10);
        assertThat(result.getExperienceGain()).isEqualTo(15);
        assertThat(result.getCoinChange()).isEqualTo(0);
    }

    @Test
    @DisplayName("衰减 → 1 小时 → mood-2 hunger-3")
    void decay_afterOneHour() {
        Pet pet = new Pet();
        pet.setMood(100);
        pet.setHunger(100);
        pet.setLastInteractedAt(LocalDateTime.now().minusHours(1));

        domainService.decay(pet);
        assertThat(pet.getMood()).isEqualTo(98);
        assertThat(pet.getHunger()).isEqualTo(97);
    }

    @Test
    @DisplayName("衰减 → 刚互动（< 1 分钟）→ 不变")
    void decay_recentInteraction_noChange() {
        Pet pet = new Pet();
        pet.setMood(80);
        pet.setHunger(80);
        pet.setLastInteractedAt(LocalDateTime.now().minusSeconds(30));

        domainService.decay(pet);
        assertThat(pet.getMood()).isEqualTo(80);
        assertThat(pet.getHunger()).isEqualTo(80);
    }

    @Test
    @DisplayName("衰减 → lastInteractedAt 为 null → 不变")
    void decay_nullLastInteracted_noChange() {
        Pet pet = new Pet();
        pet.setMood(50);
        pet.setHunger(50);

        domainService.decay(pet);
        assertThat(pet.getMood()).isEqualTo(50);
        assertThat(pet.getHunger()).isEqualTo(50);
    }

    @Test
    @DisplayName("等级公式 → exp=0 → level=1")
    void calculateLevel_zeroExp() {
        assertThat(PetDomainService.calculateLevel(0)).isEqualTo(1);
    }

    @Test
    @DisplayName("等级公式 → exp=10000 → level=11")
    void calculateLevel_10000Exp() {
        assertThat(PetDomainService.calculateLevel(10000)).isEqualTo(11);
    }

    @Test
    @DisplayName("等级公式 → 上限 50")
    void calculateLevel_max50() {
        assertThat(PetDomainService.calculateLevel(1_000_000)).isEqualTo(50);
    }
}
