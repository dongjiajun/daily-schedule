package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.pet.PetAccessoryRepository;
import com.dailyschedule.domain.pet.ShopItem;
import com.dailyschedule.infrastructure.persistence.mapper.PetAccessoryMapper;
import com.dailyschedule.infrastructure.persistence.po.PetAccessoryPO;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class PetAccessoryRepositoryImpl implements PetAccessoryRepository {

    private final PetAccessoryMapper accessoryMapper;

    public PetAccessoryRepositoryImpl(PetAccessoryMapper accessoryMapper) {
        this.accessoryMapper = accessoryMapper;
    }

    @Override
    public List<ShopItem> findAllShopItems() {
        return accessoryMapper.selectAllShopItems()
            .stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public Optional<ShopItem> findById(Long id) {
        PetAccessoryPO po = accessoryMapper.selectById(id);
        if (po == null) return Optional.empty();
        return Optional.of(toDomain(po));
    }

    private ShopItem toDomain(PetAccessoryPO po) {
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
