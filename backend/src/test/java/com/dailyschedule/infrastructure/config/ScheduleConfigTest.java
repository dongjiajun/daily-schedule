package com.dailyschedule.infrastructure.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import static org.assertj.core.api.Assertions.assertThat;

class ScheduleConfigTest {

    private final ScheduleConfig config = new ScheduleConfig();

    @Test
    @DisplayName("taskScheduler → 池大小 2 且线程前缀 scheduler-")
    void taskScheduler_poolSizeAndPrefix() {
        ThreadPoolTaskScheduler scheduler = config.taskScheduler();

        assertThat(scheduler.getScheduledThreadPoolExecutor().getCorePoolSize()).isEqualTo(2);
        assertThat(scheduler.getThreadNamePrefix()).isEqualTo("scheduler-");

        scheduler.shutdown();
    }
}
