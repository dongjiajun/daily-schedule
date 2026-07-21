package com.dailyschedule.infrastructure.scheduled;

import com.dailyschedule.domain.pet.Pet;
import com.dailyschedule.domain.pet.PetDomainService;
import com.dailyschedule.domain.pet.PetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PetStatusScheduler {

    private static final Logger log = LoggerFactory.getLogger(PetStatusScheduler.class);

    private final PetRepository petRepository;
    private final PetDomainService domainService;

    public PetStatusScheduler(PetRepository petRepository, PetDomainService domainService) {
        this.petRepository = petRepository;
        this.domainService = domainService;
    }

    @Scheduled(fixedRateString = "${pet.decay.intervalMs:600000}")
    public void decayPets() {
        List<Pet> pets = petRepository.findAllForDecay();
        if (pets.isEmpty()) return;

        int decayed = 0;
        for (Pet pet : pets) {
            int beforeMood = pet.getMood();
            int beforeHunger = pet.getHunger();

            domainService.decay(pet);
            if (pet.getMood() != beforeMood || pet.getHunger() != beforeHunger) {
                petRepository.save(pet);
                decayed++;
            }
        }

        if (decayed > 0) {
            log.debug("Pet decay: {} of {} pets updated", decayed, pets.size());
        }
    }
}
