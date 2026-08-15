package com.dailyschedule.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

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

    /**
     * @Scheduled 专用线程池：提醒扫描（30s）与宠物衰减（10min）独立线程运行，
     * 一个调度任务阻塞不拖住另一个。
     */
    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("scheduler-");
        scheduler.initialize();
        return scheduler;
    }
}
