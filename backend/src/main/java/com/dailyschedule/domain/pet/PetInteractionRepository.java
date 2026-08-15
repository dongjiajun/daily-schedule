package com.dailyschedule.domain.pet;

/**
 * 宠物互动记录端口。
 */
public interface PetInteractionRepository {
    void save(PetInteraction interaction);
}
