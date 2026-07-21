package com.dailyschedule.domain.pet;

public class ShopItem {
    private Long id;
    private String name;
    private String type;
    private int price;
    private int effectMood;
    private int effectHunger;
    private int effectExperience;

    public ShopItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }
    public int getEffectMood() { return effectMood; }
    public void setEffectMood(int effectMood) { this.effectMood = effectMood; }
    public int getEffectHunger() { return effectHunger; }
    public void setEffectHunger(int effectHunger) { this.effectHunger = effectHunger; }
    public int getEffectExperience() { return effectExperience; }
    public void setEffectExperience(int effectExperience) { this.effectExperience = effectExperience; }
}
