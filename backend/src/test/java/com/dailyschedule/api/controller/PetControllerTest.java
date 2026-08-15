package com.dailyschedule.api.controller;

import com.dailyschedule.application.pet.PetApplicationService;
import com.dailyschedule.domain.pet.*;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class PetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PetApplicationService petAppService;

    @MockitoBean
    private CurrentUserService currentUserService;

    private Pet samplePet() {
        Pet pet = new Pet();
        pet.setId(1L);
        pet.setUserId(1L);
        pet.setSpecies(PetSpecies.ORANGE_CAT);
        pet.setName("大橘");
        pet.setExperience(100);
        pet.setLevel(2);
        pet.setMood(80);
        pet.setHunger(90);
        pet.setCoins(50);
        pet.setLastInteractedAt(LocalDateTime.now());
        pet.setCreatedAt(LocalDateTime.now());
        return pet;
    }

    @Test
    @DisplayName("POST /api/v1/pets/me → 创建成功 201")
    void createPet_shouldReturn201() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(petAppService.create(any(), any())).thenReturn(samplePet());

        mockMvc.perform(post("/api/v1/pets/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"species\":\"ORANGE_CAT\",\"name\":\"大橘\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("大橘"))
            .andExpect(jsonPath("$.species").value("ORANGE_CAT"));
    }

    @Test
    @DisplayName("GET /api/v1/pets/me → 成功 200")
    void getMyPet_shouldReturn200() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(petAppService.getMyPet()).thenReturn(samplePet());

        mockMvc.perform(get("/api/v1/pets/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.mood").value(80))
            .andExpect(jsonPath("$.hunger").value(90));
    }

    @Test
    @DisplayName("PUT /api/v1/pets/me → 改名成功 200")
    void updatePet_shouldReturn200() throws Exception {
        Pet updated = samplePet();
        updated.setName("二橘");
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(petAppService.update("二橘")).thenReturn(updated);

        mockMvc.perform(put("/api/v1/pets/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"二橘\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("二橘"));
    }

    @Test
    @DisplayName("POST /api/v1/pets/me/interact → 玩耍成功 200")
    void interact_shouldReturn200() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        InteractionResult result = new InteractionResult();
        result.setMoodChange(25);
        result.setHungerChange(-10);
        result.setExperienceGain(15);
        when(petAppService.interact(any(), any())).thenReturn(result);

        mockMvc.perform(post("/api/v1/pets/me/interact")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"PLAY\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.moodChange").value(25));
    }

    @Test
    @DisplayName("GET /api/v1/shop/items → 返回列表")
    void getShopItems_shouldReturn200() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        ShopItem item = new ShopItem();
        item.setId(1L);
        item.setName("小鱼干");
        item.setPrice(10);
        when(petAppService.getShopItems()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/shop/items"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("小鱼干"));
    }

    @Test
    @DisplayName("POST /api/v1/shop/purchase → 购买成功")
    void purchase_shouldReturn200() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        PurchaseResult result = new PurchaseResult();
        result.setSuccess(true);
        result.setItemName("小鱼干");
        result.setTotalCost(10);
        result.setNewCoins(90);
        when(petAppService.purchase(anyLong(), any(Integer.class))).thenReturn(result);

        mockMvc.perform(post("/api/v1/shop/purchase")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"itemId\":1,\"quantity\":1}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/shop/purchase → 购买配饰回传 equippedAccessoryId")
    void purchase_accessory_shouldReturnEquippedId() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        PurchaseResult result = new PurchaseResult();
        result.setSuccess(true);
        result.setItemName("巫师帽");
        result.setTotalCost(40);
        result.setNewCoins(60);
        result.setEquippedAccessoryId(7L);
        when(petAppService.purchase(anyLong(), any(Integer.class))).thenReturn(result);

        mockMvc.perform(post("/api/v1/shop/purchase")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"itemId\":7,\"quantity\":1}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.equippedAccessoryId").value(7));
    }

    @Test
    @DisplayName("DELETE /api/v1/pets/me/accessory → 取下成功 204")
    void unequipAccessory_shouldReturn204() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        doNothing().when(petAppService).unequip();

        mockMvc.perform(delete("/api/v1/pets/me/accessory"))
            .andExpect(status().isNoContent());
        verify(petAppService).unequip();
    }

    @Test
    @DisplayName("POST /api/v1/pets/me/rewards → 首次领取 granted=true")
    void grantPetReward_shouldReturnGranted() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        RewardResult result = new RewardResult();
        result.setGranted(true);
        result.setCoinChange(10);
        result.setExperienceGain(20);
        result.setMoodChange(0);
        result.setNewCoins(110);
        result.setNewExperience(20);
        result.setNewMood(80);
        when(petAppService.grantReward(any(), any())).thenReturn(result);

        mockMvc.perform(post("/api/v1/pets/me/rewards")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"source\":\"TASK_COMPLETED\",\"refId\":\"42\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.granted").value(true))
            .andExpect(jsonPath("$.coinChange").value(10))
            .andExpect(jsonPath("$.newCoins").value(110));
    }

    @Test
    @DisplayName("POST /api/v1/pets/me/rewards → 重复领取 granted=false")
    void grantPetReward_duplicate_shouldReturnNotGranted() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        RewardResult result = new RewardResult();
        result.setGranted(false);
        when(petAppService.grantReward(any(), any())).thenReturn(result);

        mockMvc.perform(post("/api/v1/pets/me/rewards")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"source\":\"TASK_COMPLETED\",\"refId\":\"42\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.granted").value(false))
            .andExpect(jsonPath("$.coinChange").value(0));
    }

    @Test
    @DisplayName("POST /api/v1/pets/me/rewards → 非法 source → 400")
    void grantPetReward_invalidSource_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/v1/pets/me/rewards")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"source\":\"NOPE\",\"refId\":\"x\"}"))
            .andExpect(status().isBadRequest());
    }
}
