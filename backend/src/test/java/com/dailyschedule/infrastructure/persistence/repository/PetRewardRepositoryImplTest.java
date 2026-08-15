package com.dailyschedule.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.dailyschedule.domain.pet.PetReward;
import com.dailyschedule.domain.pet.RewardSource;
import com.dailyschedule.infrastructure.persistence.mapper.PetRewardMapper;
import com.dailyschedule.infrastructure.persistence.po.PetRewardPO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetRewardRepositoryImplTest {

    @Mock
    private PetRewardMapper rewardMapper;

    private PetRewardRepositoryImpl repository;

    @BeforeEach
    void setUp() {
        repository = new PetRewardRepositoryImpl(rewardMapper);
    }

    @Test
    @DisplayName("existsBySourceAndRefId → 已存在记录 → true")
    void exists_true() {
        when(rewardMapper.selectCount(any(Wrapper.class))).thenReturn(1L);

        assertThat(repository.existsBySourceAndRefId(1L, RewardSource.TASK_COMPLETED, "42")).isTrue();
    }

    @Test
    @DisplayName("existsBySourceAndRefId → 无记录 → false")
    void exists_false() {
        when(rewardMapper.selectCount(any(Wrapper.class))).thenReturn(0L);

        assertThat(repository.existsBySourceAndRefId(1L, RewardSource.TASK_COMPLETED, "42")).isFalse();
    }

    @Test
    @DisplayName("save → PO 映射正确并回填 id")
    void save_mapsAndBackfills() {
        when(rewardMapper.insert(any(PetRewardPO.class))).thenAnswer(inv -> {
            PetRewardPO po = inv.getArgument(0);
            po.setId(7L);
            po.setCreatedAt(LocalDateTime.now());
            return 1;
        });

        PetReward reward = new PetReward();
        reward.setPetId(1L);
        reward.setSource(RewardSource.EVENT_COMPLETED);
        reward.setRefId("e9");
        reward.setCoinChange(20);
        reward.setExperienceGain(30);
        reward.setMoodChange(0);

        repository.save(reward);

        ArgumentCaptor<PetRewardPO> captor = ArgumentCaptor.forClass(PetRewardPO.class);
        verify(rewardMapper).insert(captor.capture());
        PetRewardPO po = captor.getValue();
        assertThat(po.getPetId()).isEqualTo(1L);
        assertThat(po.getSource()).isEqualTo("EVENT_COMPLETED");
        assertThat(po.getRefId()).isEqualTo("e9");
        assertThat(po.getCoinChange()).isEqualTo(20);
        assertThat(po.getExperienceGain()).isEqualTo(30);
        assertThat(po.getMoodChange()).isEqualTo(0);
        assertThat(reward.getId()).isEqualTo(7L);
        assertThat(reward.getCreatedAt()).isNotNull();
    }
}
