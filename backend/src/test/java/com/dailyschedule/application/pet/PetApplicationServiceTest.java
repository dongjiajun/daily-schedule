package com.dailyschedule.application.pet;

import com.dailyschedule.api.exception.BusinessException;
import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.pet.*;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetApplicationServiceTest {

    @Mock
    private PetRepository petRepository;
    @Mock
    private PetAccessoryRepository accessoryRepository;
    @Mock
    private PetInteractionRepository interactionRepository;
    @Mock
    private PetRewardRepository rewardRepository;
    @Mock
    private CurrentUserService currentUserService;

    private PetDomainService domainService;
    private PetApplicationService applicationService;

    @BeforeEach
    void setUp() {
        domainService = new PetDomainService(); // real domain logic
        applicationService = new PetApplicationService(
            petRepository, domainService, accessoryRepository, interactionRepository, rewardRepository, currentUserService);
        lenient().when(currentUserService.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    @DisplayName("create → 无已有宠物 → 创建成功")
    void create_success() {
        when(petRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(petRepository.save(any(Pet.class))).thenAnswer(inv -> {
            Pet p = inv.getArgument(0);
            p.setId(1L);
            p.setCreatedAt(LocalDateTime.now());
            p.setUpdatedAt(LocalDateTime.now());
            return p;
        });

        Pet created = applicationService.create(PetSpecies.ORANGE_CAT, "大橘");
        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getMood()).isEqualTo(100);
        assertThat(created.getHunger()).isEqualTo(100);
        assertThat(created.getCoins()).isEqualTo(100);
    }

    @Test
    @DisplayName("create → 已有宠物 → 抛异常")
    void create_duplicate_throws() {
        Pet existing = new Pet();
        existing.setId(1L);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> applicationService.create(PetSpecies.SHIBA_INU, "柴柴"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("已有宠物");
    }

    @Test
    @DisplayName("getMyPet → 存在 → 返回")
    void getMyPet_found() {
        Pet pet = samplePet();
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));

        Pet result = applicationService.getMyPet();
        assertThat(result.getName()).isEqualTo("大橘");
    }

    @Test
    @DisplayName("getMyPet → 不存在 → 抛异常")
    void getMyPet_notFound_throws() {
        when(petRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.getMyPet())
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("请先创建宠物");
    }

    @Test
    @DisplayName("update → 改名成功")
    void update_success() {
        Pet pet = samplePet();
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(petRepository.save(any(Pet.class))).thenReturn(pet);

        Pet result = applicationService.update("二橘");
        assertThat(result.getName()).isEqualTo("二橘");
    }

    @Test
    @DisplayName("interact → 玩耍 → 返回结果")
    void interact_play() {
        Pet pet = samplePet();
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(petRepository.save(any(Pet.class))).thenReturn(pet);

        InteractionResult result = applicationService.interact(InteractionType.PLAY, null);
        assertThat(result.getMoodChange()).isEqualTo(25);
        assertThat(result.getHungerChange()).isEqualTo(-10);
        verify(interactionRepository).save(any(PetInteraction.class));
    }

    @Test
    @DisplayName("interact → 喂食 → 专注币不足 → 抛异常")
    void interact_feed_insufficientCoins() {
        Pet pet = samplePet();
        pet.setCoins(2);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));

        ShopItem food = sampleFood();
        when(accessoryRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> applicationService.interact(InteractionType.FEED, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("专注币不足");
    }

    @Test
    @DisplayName("interact → 喂食 → 商店无食物 → BusinessException（409 语义）")
    void interact_feed_noFood_throwsBusinessException() {
        Pet pet = samplePet();
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(accessoryRepository.findAllShopItems()).thenReturn(List.of());

        assertThatThrownBy(() -> applicationService.interact(InteractionType.FEED, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("商店中没有可用的食物");
    }

    @Test
    @DisplayName("getShopItems → 返回物品列表")
    void getShopItems() {
        when(accessoryRepository.findAllShopItems()).thenReturn(List.of(sampleFood()));

        List<ShopItem> items = applicationService.getShopItems();
        assertThat(items).hasSize(1);
        assertThat(items.get(0).getName()).isEqualTo("小鱼干");
    }

    @Test
    @DisplayName("purchase → 成功购买")
    void purchase_success() {
        Pet pet = samplePet();
        pet.setCoins(100);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(accessoryRepository.findById(1L)).thenReturn(Optional.of(sampleFood()));

        PurchaseResult result = applicationService.purchase(1L, 2);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getTotalCost()).isEqualTo(20);
        assertThat(result.getNewCoins()).isEqualTo(80);
    }

    @Test
    @DisplayName("purchase → 专注币不足 → 抛异常")
    void purchase_insufficientCoins_throws() {
        Pet pet = samplePet();
        pet.setCoins(5);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(accessoryRepository.findById(1L)).thenReturn(Optional.of(sampleFood()));

        assertThatThrownBy(() -> applicationService.purchase(1L, 1))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("专注币不足");
    }

    // ─── purchase 装备语义 ───

    @Test
    @DisplayName("purchase → 购买配饰 → 装备成功 + 数值不变")
    void purchase_accessory_equips() {
        Pet pet = samplePet();
        pet.setCoins(100);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(accessoryRepository.findById(7L)).thenReturn(Optional.of(sampleAccessory(7L, "巫师帽", 40)));

        PurchaseResult result = applicationService.purchase(7L, 1);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getEquippedAccessoryId()).isEqualTo(7L);
        assertThat(result.getNewCoins()).isEqualTo(60);
        assertThat(pet.getCurrentAccessory()).isEqualTo(7L);
        assertThat(pet.getMood()).isEqualTo(80);   // 数值不变（效果 0）
        assertThat(pet.getHunger()).isEqualTo(80);
    }

    @Test
    @DisplayName("purchase → 已装备再购买新配饰 → 覆盖旧装备")
    void purchase_accessory_overwrites() {
        Pet pet = samplePet();
        pet.setCoins(200);
        pet.setCurrentAccessory(7L);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(accessoryRepository.findById(8L)).thenReturn(Optional.of(sampleAccessory(8L, "麋鹿角", 30)));

        PurchaseResult result = applicationService.purchase(8L, 1);
        assertThat(result.getEquippedAccessoryId()).isEqualTo(8L);
        assertThat(pet.getCurrentAccessory()).isEqualTo(8L);
    }

    @Test
    @DisplayName("purchase → 配饰 quantity>1 → 抛异常")
    void purchase_accessory_quantityRejected() {
        Pet pet = samplePet();
        pet.setCoins(500);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(accessoryRepository.findById(7L)).thenReturn(Optional.of(sampleAccessory(7L, "巫师帽", 40)));

        assertThatThrownBy(() -> applicationService.purchase(7L, 2))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("配饰每次只能购买一件");
        assertThat(pet.getCurrentAccessory()).isNull();
    }

    @Test
    @DisplayName("purchase → 食物购买 → 不装备（equippedAccessoryId 为 null）")
    void purchase_food_noEquip() {
        Pet pet = samplePet();
        pet.setCoins(100);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(accessoryRepository.findById(1L)).thenReturn(Optional.of(sampleFood()));

        PurchaseResult result = applicationService.purchase(1L, 2);
        assertThat(result.getEquippedAccessoryId()).isNull();
        assertThat(pet.getCurrentAccessory()).isNull();
        assertThat(result.getNewCoins()).isEqualTo(80);
        assertThat(result.getNewHunger()).isEqualTo(100); // 80 + 20×2 钳制 100
    }

    @Test
    @DisplayName("unequip → 取下配饰 → 显式 SET NULL 清空")
    void unequip_success() {
        Pet pet = samplePet();
        pet.setCurrentAccessory(7L);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));

        applicationService.unequip();
        assertThat(pet.getCurrentAccessory()).isNull();
        // updateById 默认跳过 null 字段，须走仓储显式清空方法
        verify(petRepository).clearCurrentAccessory(1L);
    }

    @Test
    @DisplayName("unequip → 未装备时取下 → 幂等不报错")
    void unequip_idempotent() {
        Pet pet = samplePet();
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));

        applicationService.unequip();
        assertThat(pet.getCurrentAccessory()).isNull();
        verify(petRepository).clearCurrentAccessory(1L);
    }

    // ─── grantReward ───

    @Test
    @DisplayName("grantReward → 首次发放 → +币+经验并记录")
    void grantReward_firstTime() {
        Pet pet = samplePet();
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(petRepository.save(any(Pet.class))).thenReturn(pet);
        when(rewardRepository.existsBySourceAndRefId(1L, RewardSource.TASK_COMPLETED, "42")).thenReturn(false);

        RewardResult result = applicationService.grantReward(RewardSource.TASK_COMPLETED, "42");
        assertThat(result.isGranted()).isTrue();
        assertThat(result.getCoinChange()).isEqualTo(10);
        assertThat(result.getExperienceGain()).isEqualTo(20);
        assertThat(result.getNewCoins()).isEqualTo(110);
        assertThat(result.getNewExperience()).isEqualTo(20);
        verify(rewardRepository).save(any(PetReward.class));
        verify(petRepository).save(pet);
    }

    @Test
    @DisplayName("grantReward → 重复发放 → granted=false 不重复")
    void grantReward_duplicate_skips() {
        Pet pet = samplePet();
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(rewardRepository.existsBySourceAndRefId(1L, RewardSource.TASK_COMPLETED, "42")).thenReturn(true);

        RewardResult result = applicationService.grantReward(RewardSource.TASK_COMPLETED, "42");
        assertThat(result.isGranted()).isFalse();
        assertThat(result.getCoinChange()).isZero();
        verify(rewardRepository, never()).save(any());
        verify(petRepository, never()).save(any());
    }

    @Test
    @DisplayName("grantReward → 无宠物 → granted=false 静默跳过")
    void grantReward_noPet_skips() {
        when(petRepository.findByUserId(1L)).thenReturn(Optional.empty());

        RewardResult result = applicationService.grantReward(RewardSource.EVENT_COMPLETED, "e1");
        assertThat(result.isGranted()).isFalse();
        verify(rewardRepository, never()).save(any());
    }

    @Test
    @DisplayName("grantReward → 取消来源 → 心情钳制不为负")
    void grantReward_moodClamped() {
        Pet pet = samplePet();
        pet.setMood(5);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));
        when(petRepository.save(any(Pet.class))).thenReturn(pet);
        when(rewardRepository.existsBySourceAndRefId(1L, RewardSource.EVENT_CANCELLED, "e2")).thenReturn(false);

        RewardResult result = applicationService.grantReward(RewardSource.EVENT_CANCELLED, "e2");
        assertThat(result.isGranted()).isTrue();
        assertThat(result.getMoodChange()).isEqualTo(-10);
        assertThat(result.getNewMood()).isZero();
    }

    private ShopItem sampleFood() {
        ShopItem item = new ShopItem();
        item.setId(1L);
        item.setName("小鱼干");
        item.setType("FOOD");
        item.setPrice(10);
        item.setEffectMood(5);
        item.setEffectHunger(20);
        item.setEffectExperience(3);
        return item;
    }

    private ShopItem sampleAccessory(Long id, String name, int price) {
        ShopItem item = new ShopItem();
        item.setId(id);
        item.setName(name);
        item.setType("ACCESSORY");
        item.setPrice(price);
        item.setEffectMood(0);
        item.setEffectHunger(0);
        item.setEffectExperience(0);
        return item;
    }

    private Pet samplePet() {
        Pet pet = new Pet();
        pet.setId(1L);
        pet.setUserId(1L);
        pet.setSpecies(PetSpecies.ORANGE_CAT);
        pet.setName("大橘");
        pet.setMood(80);
        pet.setHunger(80);
        pet.setCoins(100);
        pet.setExperience(0);
        pet.setLevel(1);
        pet.setLastInteractedAt(LocalDateTime.now());
        return pet;
    }
}
