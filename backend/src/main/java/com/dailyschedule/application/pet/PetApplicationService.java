package com.dailyschedule.application.pet;

import com.dailyschedule.api.exception.BusinessException;
import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.pet.*;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PetApplicationService {

    private final PetRepository petRepository;
    private final PetDomainService domainService;
    private final PetAccessoryRepository accessoryRepository;
    private final PetInteractionRepository interactionRepository;
    private final PetRewardRepository rewardRepository;
    private final CurrentUserService currentUserService;

    public PetApplicationService(PetRepository petRepository,
                                 PetDomainService domainService,
                                 PetAccessoryRepository accessoryRepository,
                                 PetInteractionRepository interactionRepository,
                                 PetRewardRepository rewardRepository,
                                 CurrentUserService currentUserService) {
        this.petRepository = petRepository;
        this.domainService = domainService;
        this.accessoryRepository = accessoryRepository;
        this.interactionRepository = interactionRepository;
        this.rewardRepository = rewardRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public Pet create(PetSpecies species, String name) {
        Long userId = currentUserService.getCurrentUserId();

        if (petRepository.findByUserId(userId).isPresent()) {
            throw new BusinessException("已有宠物，不可重复创建");
        }

        Pet pet = new Pet();
        pet.setUserId(userId);
        pet.setSpecies(species);
        pet.setName(name);
        pet.setMood(100);
        pet.setHunger(100);
        pet.setCoins(100);
        pet.setExperience(0);
        pet.setLevel(1);
        pet.setLastInteractedAt(LocalDateTime.now());

        if (!pet.isValid()) {
            throw new IllegalArgumentException("宠物数据不合法：名称不能为空且不超过30字符");
        }

        return petRepository.save(pet);
    }

    @Transactional(readOnly = true)
    public Pet getMyPet() {
        Long userId = currentUserService.getCurrentUserId();
        return petRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("请先创建宠物"));
    }

    @Transactional
    public Pet update(String name) {
        Pet pet = getMyPet();
        pet.setName(name);
        if (!pet.isValid()) {
            throw new IllegalArgumentException("宠物名称不合法：不能为空且不超过30字符");
        }
        return petRepository.save(pet);
    }

    @Transactional
    public InteractionResult interact(InteractionType type, Long itemId) {
        Pet pet = getMyPet();

        ShopItem item = null;
        if (type == InteractionType.FEED) {
            if (itemId == null) {
                // 默认使用第一个可用食物（最便宜的）
                List<ShopItem> foods = accessoryRepository.findAllShopItems()
                    .stream()
                    .filter(a -> "FOOD".equals(a.getType()))
                    .toList();
                if (foods.isEmpty()) {
                    throw new BusinessException("商店中没有可用的食物");
                }
                item = foods.get(0);
            } else {
                item = accessoryRepository.findById(itemId)
                    .orElseThrow(() -> new ResourceNotFoundException("物品不存在: " + itemId));
            }
        }

        InteractionResult result = domainService.interact(pet, type, item);
        pet.applyInteraction(result);

        // 记录互动
        interactionRepository.save(PetInteraction.of(pet.getId(), type, result));

        petRepository.save(pet);
        return result;
    }

    @Transactional(readOnly = true)
    public List<ShopItem> getShopItems() {
        return accessoryRepository.findAllShopItems();
    }

    @Transactional
    public PurchaseResult purchase(Long itemId, int quantity) {
        Pet pet = getMyPet();

        ShopItem item = accessoryRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("物品不存在: " + itemId));

        int totalCost = item.getPrice() * quantity;
        if (pet.getCoins() < totalCost) {
            throw new IllegalArgumentException("专注币不足，需要 " + totalCost + "，当前 " + pet.getCoins());
        }

        boolean isAccessory = "ACCESSORY".equals(item.getType());
        // 数值计算收口领域层（含 ACCESSORY quantity==1 校验），钳制/等级由 applyInteraction 统一应用
        InteractionResult purchaseResult = domainService.purchase(pet, item, quantity);
        if (isAccessory) {
            // 购买即装备：覆盖旧装备（无库存概念）
            pet.setCurrentAccessory(item.getId());
        }
        pet.applyInteraction(purchaseResult);

        petRepository.save(pet);

        PurchaseResult result = new PurchaseResult();
        result.setSuccess(true);
        result.setItemName(item.getName());
        result.setQuantity(quantity);
        result.setTotalCost(totalCost);
        result.setNewCoins(pet.getCoins());
        result.setNewMood(pet.getMood());
        result.setNewHunger(pet.getHunger());
        result.setNewExperience(pet.getExperience());
        if (isAccessory) {
            result.setEquippedAccessoryId(item.getId());
        }
        return result;
    }

    /** 取下当前配饰（幂等：未装备时同样成功）。 */
    @Transactional
    public void unequip() {
        Pet pet = getMyPet();
        // updateById 默认跳过 null 字段，需走仓储显式 SET NULL
        petRepository.clearCurrentAccessory(pet.getId());
        pet.setCurrentAccessory(null);
    }

    /**
     * 幂等发放行为奖励（完成日程/任务/专注/签到/习惯 → +币+经验；取消 → 心情负面）。
     * 幂等键 (pet_id, source, refId)：重复发放返回 granted=false，不抛异常；
     * 无宠物时同样返回 granted=false，不阻断调用方（如任务/日程主流程）。
     */
    @Transactional
    public RewardResult grantReward(RewardSource source, String refId) {
        Long userId = currentUserService.getCurrentUserId();
        Pet pet = petRepository.findByUserId(userId).orElse(null);
        if (pet == null) {
            return RewardResult.notGranted(source);
        }
        if (rewardRepository.existsBySourceAndRefId(pet.getId(), source, refId)) {
            return RewardResult.notGranted(source);
        }

        InteractionResult interaction = domainService.grant(pet, source);
        pet.applyInteraction(interaction);

        petRepository.save(pet);
        rewardRepository.save(PetReward.of(pet.getId(), source, refId, interaction));
        return RewardResult.granted(source, interaction);
    }
}
