package com.dailyschedule.infrastructure.scheduled;

import com.dailyschedule.domain.pet.Pet;
import com.dailyschedule.domain.pet.PetDomainService;
import com.dailyschedule.domain.pet.PetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetStatusSchedulerTest {

    @Mock
    private PetRepository petRepository;

    @Mock
    private PetDomainService domainService;

    private PetStatusScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new PetStatusScheduler(petRepository, domainService);
    }

    @Test
    @DisplayName("衰减 → 有宠物 → 执行衰减并保存")
    void decayPets_withPets_executesDecay() {
        Pet pet = new Pet();
        pet.setId(1L);
        pet.setMood(100);
        pet.setHunger(100);
        pet.setLastInteractedAt(LocalDateTime.now().minusHours(2));

        when(petRepository.findAllForDecay()).thenReturn(List.of(pet));
        doAnswer(inv -> {
            Pet p = inv.getArgument(0);
            p.setMood(96);
            p.setHunger(94);
            return null;
        }).when(domainService).decay(pet);

        scheduler.decayPets();

        verify(domainService).decay(pet);
        verify(petRepository).save(pet);
    }

    @Test
    @DisplayName("衰减 → 无宠物 → 不执行任何操作")
    void decayPets_noPets_doesNothing() {
        when(petRepository.findAllForDecay()).thenReturn(List.of());

        scheduler.decayPets();

        verify(domainService, never()).decay(any());
        verify(petRepository, never()).save(any());
    }
}
