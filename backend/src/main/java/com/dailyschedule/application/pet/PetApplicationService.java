package com.dailyschedule.application.pet;

import com.dailyschedule.api.exception.ResourceNotFoundException;
import com.dailyschedule.domain.pet.*;
import com.dailyschedule.infrastructure.persistence.mapper.PetAccessoryMapper;
import com.dailyschedule.infrastructure.persistence.mapper.PetInteractionMapper;
import com.dailyschedule.infrastructure.persistence.po.PetAccessoryPO;
import com.dailyschedule.infrastructure.persistence.po.PetInteractionPO;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PetApplicationService {

    private final PetRepository petRepository;
    private final PetDomainService domainService;
    private final PetAccessoryMapper accessoryMapper;
    private final PetInteractionMapper interactionMapper;
    private final CurrentUserService currentUserService;

    public PetApplicationService(PetRepository petRepository,
                                 PetDomainService domainService,
                                 PetAccessoryMapper accessoryMapper,
                                 PetInteractionMapper interactionMapper,
                                 CurrentUserService currentUserService) {
        this.petRepository = petRepository;
        this.domainService = domainService;
        this.accessoryMapper = accessoryMapper;
        this.interactionMapper = interactionMapper;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public Pet create(PetSpecies species, String name) {
        Long userId = currentUserService.getCurrentUserId();

        if (petRepository.findByUserId(userId).isPresent()) {
            throw new IllegalStateException("已有宠物，不可重复创建");
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
                List<PetAccessoryPO> foods = accessoryMapper.selectAllShopItems()
                    .stream()
                    .filter(a -> "FOOD".equals(a.getType()))
                    .toList();
                if (foods.isEmpty()) {
                    throw new IllegalStateException("商店中没有可用的食物");
                }
                item = toShopItem(foods.get(0));
            } else {
                PetAccessoryPO po = accessoryMapper.selectById(itemId);
                if (po == null) {
                    throw new ResourceNotFoundException("物品不存在: " + itemId);
                }
                item = toShopItem(po);
            }
        }

        InteractionResult result = domainService.interact(pet, type, item);
        pet.applyInteraction(result);

        // 记录互动
        PetInteractionPO record = new PetInteractionPO();
        record.setPetId(pet.getId());
        record.setType(type.name());
        record.setQuantity(1);
        record.setMoodChange(result.getMoodChange());
        record.setHungerChange(result.getHungerChange());
        record.setExperienceGain(result.getExperienceGain());
        interactionMapper.insert(record);

        petRepository.save(pet);
        return result;
    }

    @Transactional(readOnly = true)
    public List<ShopItem> getShopItems() {
        return accessoryMapper.selectAllShopItems()
            .stream()
            .map(this::toShopItem)
            .collect(Collectors.toList());
    }

    @Transactional
    public PurchaseResult purchase(Long itemId, int quantity) {
        Pet pet = getMyPet();

        PetAccessoryPO po = accessoryMapper.selectById(itemId);
        if (po == null) {
            throw new ResourceNotFoundException("物品不存在: " + itemId);
        }

        int totalCost = po.getPrice() * quantity;
        if (pet.getCoins() < totalCost) {
            throw new IllegalArgumentException("专注币不足，需要 " + totalCost + "，当前 " + pet.getCoins());
        }

        // 即时消费模式：购买即使用，效果立即应用
        int moodGain = po.getEffectMood() * quantity;
        int hungerGain = po.getEffectHunger() * quantity;
        int expGain = po.getEffectExperience() * quantity;

        pet.setCoins(pet.getCoins() - totalCost);
        pet.setMood(Math.min(100, pet.getMood() + moodGain));
        pet.setHunger(Math.min(100, pet.getHunger() + hungerGain));
        pet.setExperience(pet.getExperience() + expGain);
        pet.setLevel(PetDomainService.calculateLevel(pet.getExperience()));
        pet.setLastInteractedAt(LocalDateTime.now());

        petRepository.save(pet);

        PurchaseResult result = new PurchaseResult();
        result.setSuccess(true);
        result.setItemName(po.getName());
        result.setQuantity(quantity);
        result.setTotalCost(totalCost);
        result.setNewCoins(pet.getCoins());
        result.setNewMood(pet.getMood());
        result.setNewHunger(pet.getHunger());
        result.setNewExperience(pet.getExperience());
        return result;
    }

    private ShopItem toShopItem(PetAccessoryPO po) {
        ShopItem item = new ShopItem();
        item.setId(po.getId());
        item.setName(po.getName());
        item.setType(po.getType());
        item.setPrice(po.getPrice());
        item.setEffectMood(po.getEffectMood());
        item.setEffectHunger(po.getEffectHunger());
        item.setEffectExperience(po.getEffectExperience());
        return item;
    }
}
