package com.dailyschedule.domain.pet;

public class PurchaseResult {
    private boolean success;
    private String itemName;
    private int quantity;
    private int totalCost;
    private int newCoins;
    private int newMood;
    private int newHunger;
    private int newExperience;

    public PurchaseResult() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getTotalCost() { return totalCost; }
    public void setTotalCost(int totalCost) { this.totalCost = totalCost; }
    public int getNewCoins() { return newCoins; }
    public void setNewCoins(int newCoins) { this.newCoins = newCoins; }
    public int getNewMood() { return newMood; }
    public void setNewMood(int newMood) { this.newMood = newMood; }
    public int getNewHunger() { return newHunger; }
    public void setNewHunger(int newHunger) { this.newHunger = newHunger; }
    public int getNewExperience() { return newExperience; }
    public void setNewExperience(int newExperience) { this.newExperience = newExperience; }
}
