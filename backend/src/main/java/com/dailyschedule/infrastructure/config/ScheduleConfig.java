package com.dailyschedule.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
@EnableScheduling
public class ScheduleConfig {

    /**
     * 项目统一以亚洲/上海时区时钟驱动定时任务与时间断言，测试可通过 mock 该 Bean
     * 实现确定性的时间推进。
     */
    @Bean
    public Clock clock() {
        return Clock.system(ZoneId.of("Asia/Shanghai"));
    }
}
