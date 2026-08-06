package com.dailyschedule.domain.pet;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
public class PetDomainService {

    /** 心情每小时衰减量（配置化，默认 1.0/小时） */
    @Value("${pet.decay.moodPerHour:1.0}")
    private double moodPerHour = 1.0;

    /** 饱腹每小时衰减量（配置化，默认 1.5/小时） */
    @Value("${pet.decay.hungerPerHour:1.5}")
    private double hungerPerHour = 1.5;

    /**
     * 执行互动操作并返回结果。
     * FEED: 消耗专注币购买食物 → +hunger +mood +exp, -coins
     * PLAY: 免费玩耍 → -hunger(少量) +mood(多) +exp, coins 不变
     */
    public InteractionResult interact(Pet pet, InteractionType type, ShopItem item) {
        InteractionResult result = new InteractionResult();

        switch (type) {
            case FEED -> {
                if (item == null) {
                    throw new IllegalArgumentException("喂食需要指定食物");
                }
                if (pet.getCoins() < item.getPrice()) {
                    throw new IllegalArgumentException("专注币不足，需要 " + item.getPrice() + "，当前 " + pet.getCoins());
                }
                result.setMoodChange(item.getEffectMood());
                result.setHungerChange(item.getEffectHunger());
                result.setExperienceGain(item.getEffectExperience());
                result.setCoinChange(-item.getPrice());
            }
            case PLAY -> {
                result.setMoodChange(25);
                result.setHungerChange(-10);
                result.setExperienceGain(15);
                result.setCoinChange(0);
            }
        }

        return result;
    }

    /**
     * 计算时间衰减量。
     * mood/hunger 按配置的小时速率衰减（默认 1.0/1.5 每小时），均不得低于 0。
     */
    public void decay(Pet pet) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last = pet.getLastInteractedAt();
        if (last == null) return;

        long elapsedMinutes = Duration.between(last, now).toMinutes();
        if (elapsedMinutes < 1) return;

        double hours = elapsedMinutes / 60.0;
        int moodDecay = -(int) Math.floor(hours * moodPerHour);
        int hungerDecay = -(int) Math.floor(hours * hungerPerHour);

        pet.applyDecay(moodDecay, hungerDecay);
    }

    /**
     * 等级公式: level = min(50, floor(sqrt(experience / 100)) + 1)
     */
    public static int calculateLevel(int experience) {
        if (experience < 0) return 1;
        int level = (int) Math.floor(Math.sqrt(experience / 100.0)) + 1;
        return Math.min(50, level);
    }
}
