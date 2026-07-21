package com.dailyschedule.domain.pet;

import java.util.List;
import java.util.Optional;

public interface PetRepository {
    Optional<Pet> findByUserId(Long userId);
    Optional<Pet> findById(Long id);
    Pet save(Pet pet);
    List<Pet> findAllForDecay();
}
