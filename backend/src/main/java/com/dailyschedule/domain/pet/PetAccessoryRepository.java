package com.dailyschedule.domain.pet;

import java.util.List;
import java.util.Optional;

/**
 * 宠物物品目录端口。PO↔领域转换收口在基础设施实现。
 */
public interface PetAccessoryRepository {
    List<ShopItem> findAllShopItems();
    Optional<ShopItem> findById(Long id);
}
