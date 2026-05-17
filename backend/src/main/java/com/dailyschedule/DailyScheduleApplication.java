package com.dailyschedule;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class DailyScheduleApplication {
    public static void main(String[] args) {
        SpringApplication.run(DailyScheduleApplication.class, args);
    }
}
