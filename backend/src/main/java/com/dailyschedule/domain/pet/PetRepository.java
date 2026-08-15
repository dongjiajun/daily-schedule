package com.dailyschedule.domain.pet;

import java.util.List;
import java.util.Optional;

public interface PetRepository {
    Optional<Pet> findByUserId(Long userId);
    Optional<Pet> findById(Long id);
    Pet save(Pet pet);
    List<Pet> findAllForDecay();
    /** 清空当前配饰（updateById 默认跳过 null 字段，需显式 SET NULL）。 */
    void clearCurrentAccessory(Long petId);
}
