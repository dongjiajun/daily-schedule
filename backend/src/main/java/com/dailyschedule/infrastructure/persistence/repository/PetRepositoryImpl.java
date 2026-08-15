package com.dailyschedule.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.dailyschedule.domain.pet.Pet;
import com.dailyschedule.domain.pet.PetRepository;
import com.dailyschedule.domain.pet.PetSpecies;
import com.dailyschedule.infrastructure.persistence.mapper.PetMapper;
import com.dailyschedule.infrastructure.persistence.po.PetPO;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class PetRepositoryImpl implements PetRepository {

    private final PetMapper petMapper;

    public PetRepositoryImpl(PetMapper petMapper) {
        this.petMapper = petMapper;
    }

    @Override
    public Optional<Pet> findByUserId(Long userId) {
        PetPO po = petMapper.selectByUserId(userId);
        if (po == null) return Optional.empty();
        return Optional.of(toDomain(po));
    }

    @Override
    public Optional<Pet> findById(Long id) {
        PetPO po = petMapper.selectById(id);
        if (po == null) return Optional.empty();
        return Optional.of(toDomain(po));
    }

    @Override
    public Pet save(Pet pet) {
        PetPO po = toPO(pet);
        if (pet.getId() == null) {
            petMapper.insert(po);
            pet.setId(po.getId());
            pet.setCreatedAt(po.getCreatedAt());
            pet.setUpdatedAt(po.getUpdatedAt());
        } else {
            petMapper.updateById(po);
        }
        return pet;
    }

    @Override
    public List<Pet> findAllForDecay() {
        List<PetPO> pos = petMapper.selectList(null);
        return pos.stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public void clearCurrentAccessory(Long petId) {
        // updateById 默认跳过 null 字段，须显式 SET NULL
        petMapper.update(null, new LambdaUpdateWrapper<PetPO>()
            .eq(PetPO::getId, petId)
            .set(PetPO::getCurrentAccessory, null));
    }

    private Pet toDomain(PetPO po) {
        Pet pet = new Pet();
        pet.setId(po.getId());
        pet.setUserId(po.getUserId());
        pet.setSpecies(PetSpecies.valueOf(po.getSpecies()));
        pet.setName(po.getName());
        pet.setExperience(po.getExperience() != null ? po.getExperience() : 0);
        pet.setLevel(po.getLevel() != null ? po.getLevel() : 1);
        pet.setMood(po.getMood() != null ? po.getMood() : 100);
        pet.setHunger(po.getHunger() != null ? po.getHunger() : 100);
        pet.setCoins(po.getCoins() != null ? po.getCoins() : 100);
        pet.setCurrentAccessory(po.getCurrentAccessory());
        pet.setLastInteractedAt(po.getLastInteractedAt());
        pet.setCreatedAt(po.getCreatedAt());
        pet.setUpdatedAt(po.getUpdatedAt());
        return pet;
    }

    private PetPO toPO(Pet pet) {
        PetPO po = new PetPO();
        po.setId(pet.getId());
        po.setUserId(pet.getUserId());
        po.setSpecies(pet.getSpecies() != null ? pet.getSpecies().name() : null);
        po.setName(pet.getName());
        po.setExperience(pet.getExperience());
        po.setLevel(pet.getLevel());
        po.setMood(pet.getMood());
        po.setHunger(pet.getHunger());
        po.setCoins(pet.getCoins());
        po.setCurrentAccessory(pet.getCurrentAccessory());
        po.setLastInteractedAt(pet.getLastInteractedAt());
        return po;
    }
}
