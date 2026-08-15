package com.dailyschedule.domain.pet;

/**
 * 行为奖励来源与数值定义——全系统奖励数值的唯一来源。
 * 发放路径：任务/日程完成由后端应用服务挂钩发放；专注/签到/习惯由前端事件桥接调用奖励 API。
 */
public enum RewardSource {
    /** 任务完成：+10 币 +20 经验 */
    TASK_COMPLETED(10, 20, 0),
    /** 日程完成：+20 币 +30 经验 */
    EVENT_COMPLETED(20, 30, 0),
    /** 日程取消（删除未完成日程）：心情 -10 */
    EVENT_CANCELLED(0, 0, -10),
    /** 专注完成：+5 币 +10 经验 */
    FOCUS_COMPLETED(5, 10, 0),
    /** 每日签到：+15 币 +10 经验 */
    DAILY_CHECKIN(15, 10, 0),
    /** 习惯打卡：+5 币 +10 经验 */
    HABIT_CHECKED(5, 10, 0);

    private final int coinChange;
    private final int experienceGain;
    private final int moodChange;

    RewardSource(int coinChange, int experienceGain, int moodChange) {
        this.coinChange = coinChange;
        this.experienceGain = experienceGain;
        this.moodChange = moodChange;
    }

    public int getCoinChange() { return coinChange; }
    public int getExperienceGain() { return experienceGain; }
    public int getMoodChange() { return moodChange; }
}
