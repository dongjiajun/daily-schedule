package com.dailyschedule.application.pet;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.pet.*;
import com.dailyschedule.infrastructure.persistence.mapper.PetAccessoryMapper;
import com.dailyschedule.infrastructure.persistence.mapper.PetInteractionMapper;
import com.dailyschedule.infrastructure.persistence.po.PetAccessoryPO;
import com.dailyschedule.infrastructure.persistence.po.PetInteractionPO;
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
    private PetAccessoryMapper accessoryMapper;
    @Mock
    private PetInteractionMapper interactionMapper;
    @Mock
    private CurrentUserService currentUserService;

    private PetDomainService domainService;
    private PetApplicationService applicationService;

    @BeforeEach
    void setUp() {
        domainService = new PetDomainService(); // real domain logic
        applicationService = new PetApplicationService(
            petRepository, domainService, accessoryMapper, interactionMapper, currentUserService);
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
            .isInstanceOf(IllegalStateException.class)
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
        verify(interactionMapper).insert(any(PetInteractionPO.class));
    }

    @Test
    @DisplayName("interact → 喂食 → 专注币不足 → 抛异常")
    void interact_feed_insufficientCoins() {
        Pet pet = samplePet();
        pet.setCoins(2);
        when(petRepository.findByUserId(1L)).thenReturn(Optional.of(pet));

        PetAccessoryPO food = new PetAccessoryPO();
        food.setId(1L);
        food.setName("小鱼干");
        food.setPrice(10);
        food.setType("FOOD");
        food.setEffectMood(5);
        food.setEffectHunger(20);
        food.setEffectExperience(3);
        when(accessoryMapper.selectById(1L)).thenReturn(food);

        assertThatThrownBy(() -> applicationService.interact(InteractionType.FEED, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("专注币不足");
    }

    @Test
    @DisplayName("getShopItems → 返回物品列表")
    void getShopItems() {
        PetAccessoryPO po = new PetAccessoryPO();
        po.setId(1L);
        po.setName("小鱼干");
        po.setType("FOOD");
        po.setPrice(10);
        po.setEffectMood(5);
        po.setEffectHunger(20);
        po.setEffectExperience(3);
        when(accessoryMapper.selectAllShopItems()).thenReturn(List.of(po));

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

        PetAccessoryPO food = new PetAccessoryPO();
        food.setId(1L);
        food.setName("小鱼干");
        food.setPrice(10);
        food.setType("FOOD");
        food.setEffectMood(5);
        food.setEffectHunger(20);
        food.setEffectExperience(3);
        when(accessoryMapper.selectById(1L)).thenReturn(food);

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

        PetAccessoryPO food = new PetAccessoryPO();
        food.setId(1L);
        food.setName("小鱼干");
        food.setPrice(10);
        when(accessoryMapper.selectById(1L)).thenReturn(food);

        assertThatThrownBy(() -> applicationService.purchase(1L, 1))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("专注币不足");
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
