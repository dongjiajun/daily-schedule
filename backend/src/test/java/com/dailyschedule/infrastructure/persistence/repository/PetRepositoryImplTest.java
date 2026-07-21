package com.dailyschedule.infrastructure.persistence.repository;

import com.dailyschedule.domain.pet.Pet;
import com.dailyschedule.domain.pet.PetSpecies;
import com.dailyschedule.infrastructure.persistence.mapper.PetMapper;
import com.dailyschedule.infrastructure.persistence.po.PetPO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetRepositoryImplTest {

    @Mock
    private PetMapper petMapper;

    private PetRepositoryImpl repository;

    @BeforeEach
    void setUp() {
        repository = new PetRepositoryImpl(petMapper);
    }

    @Test
    @DisplayName("findByUserId → 找到 → 返回 Pet")
    void findByUserId_found_returnsPet() {
        PetPO po = samplePO(1L, 100L, "ORANGE_CAT", "大橘");
        when(petMapper.selectByUserId(100L)).thenReturn(po);

        Optional<Pet> result = repository.findByUserId(100L);
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("大橘");
        assertThat(result.get().getUserId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("findByUserId → 未找到 → Optional.empty()")
    void findByUserId_notFound_returnsEmpty() {
        when(petMapper.selectByUserId(999L)).thenReturn(null);
        assertThat(repository.findByUserId(999L)).isEmpty();
    }

    @Test
    @DisplayName("save → insert → 设置 id 和时间戳")
    void save_insert_setsIdAndTimestamps() {
        Pet pet = new Pet();
        pet.setUserId(100L);
        pet.setSpecies(PetSpecies.ORANGE_CAT);
        pet.setName("小橘");
        pet.setMood(100);
        pet.setHunger(100);
        pet.setCoins(100);
        pet.setLastInteractedAt(LocalDateTime.now());

        doAnswer(inv -> {
            PetPO po = inv.getArgument(0);
            po.setId(1L);
            po.setCreatedAt(LocalDateTime.now());
            po.setUpdatedAt(LocalDateTime.now());
            return 1;
        }).when(petMapper).insert(any(PetPO.class));

        Pet saved = repository.save(pet);
        assertThat(saved.getId()).isEqualTo(1L);
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("save → update → 调用 updateById")
    void save_update_callsUpdateById() {
        Pet pet = new Pet();
        pet.setId(1L);
        pet.setUserId(100L);
        pet.setSpecies(PetSpecies.SHIBA_INU);
        pet.setName("柴柴");
        pet.setMood(80);
        pet.setHunger(90);
        pet.setCoins(50);

        repository.save(pet);
        verify(petMapper).updateById(any(PetPO.class));
        verify(petMapper, never()).insert(any(PetPO.class));
    }

    @Test
    @DisplayName("PO↔Domain 转换正确")
    void conversion_roundTrip() {
        PetPO po = samplePO(1L, 200L, "SHIBA_INU", "旺财");
        po.setExperience(500);
        po.setLevel(3);
        po.setCoins(200);
        po.setMood(90);
        po.setHunger(85);

        when(petMapper.selectByUserId(200L)).thenReturn(po);
        Optional<Pet> result = repository.findByUserId(200L);
        assertThat(result).isPresent();
        Pet p = result.get();
        assertThat(p.getSpecies()).isEqualTo(PetSpecies.SHIBA_INU);
        assertThat(p.getExperience()).isEqualTo(500);
        assertThat(p.getLevel()).isEqualTo(3);
    }

    private PetPO samplePO(Long id, Long userId, String species, String name) {
        PetPO po = new PetPO();
        po.setId(id);
        po.setUserId(userId);
        po.setSpecies(species);
        po.setName(name);
        po.setExperience(0);
        po.setLevel(1);
        po.setMood(100);
        po.setHunger(100);
        po.setCoins(100);
        po.setLastInteractedAt(LocalDateTime.now());
        po.setCreatedAt(LocalDateTime.now());
        po.setUpdatedAt(LocalDateTime.now());
        return po;
    }
}
