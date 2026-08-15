package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.pet.PetInteraction;
import com.dailyschedule.domain.pet.PetInteractionRepository;
import com.dailyschedule.infrastructure.persistence.mapper.PetInteractionMapper;
import com.dailyschedule.infrastructure.persistence.po.PetInteractionPO;
import org.springframework.stereotype.Repository;

@Repository
public class PetInteractionRepositoryImpl implements PetInteractionRepository {

    private final PetInteractionMapper interactionMapper;

    public PetInteractionRepositoryImpl(PetInteractionMapper interactionMapper) {
        this.interactionMapper = interactionMapper;
    }

    @Override
    public void save(PetInteraction interaction) {
        PetInteractionPO po = new PetInteractionPO();
        po.setPetId(interaction.getPetId());
        po.setType(interaction.getType() != null ? interaction.getType().name() : null);
        po.setQuantity(interaction.getQuantity());
        po.setMoodChange(interaction.getMoodChange());
        po.setHungerChange(interaction.getHungerChange());
        po.setExperienceGain(interaction.getExperienceGain());
        interactionMapper.insert(po);
        interaction.setId(po.getId());
        interaction.setCreatedAt(po.getCreatedAt());
    }
}
