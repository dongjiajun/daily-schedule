package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.PetAssembler;
import com.dailyschedule.api.generated.api.PetsApi;
import com.dailyschedule.api.generated.api.ShopApi;
import com.dailyschedule.api.generated.dto.*;
import com.dailyschedule.application.pet.PetApplicationService;
import com.dailyschedule.domain.pet.InteractionType;
import com.dailyschedule.domain.pet.Pet;
import com.dailyschedule.domain.pet.PetSpecies;
import com.dailyschedule.domain.pet.RewardSource;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PetController implements PetsApi, ShopApi {

    private static final Logger log = LoggerFactory.getLogger(PetController.class);

    private final PetApplicationService petAppService;
    private final CurrentUserService currentUserService;

    public PetController(PetApplicationService petAppService, CurrentUserService currentUserService) {
        this.petAppService = petAppService;
        this.currentUserService = currentUserService;
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public PetProfile createPet(@Valid CreatePetRequest request) {
        log.info("createPet: species={} name={}", request.getSpecies(), request.getName());
        PetSpecies species = PetSpecies.valueOf(request.getSpecies().name());
        Pet pet = petAppService.create(species, request.getName());
        return PetAssembler.toPetProfile(pet);
    }

    @Override
    public PetProfile getMyPet() {
        log.info("getMyPet");
        Pet pet = petAppService.getMyPet();
        return PetAssembler.toPetProfile(pet);
    }

    @Override
    public PetProfile updatePet(@Valid UpdatePetRequest request) {
        log.info("updatePet: name={}", request.getName());
        Pet pet = petAppService.update(request.getName());
        return PetAssembler.toPetProfile(pet);
    }

    @Override
    public InteractionResult interactWithPet(@Valid InteractRequest request) {
        log.info("interactWithPet: type={} itemId={}", request.getType(), request.getItemId());
        InteractionType type = InteractionType.valueOf(request.getType().name());
        com.dailyschedule.domain.pet.InteractionResult domainResult =
            petAppService.interact(type, request.getItemId());
        return PetAssembler.toInteractionResultDto(domainResult);
    }

    @Override
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unequipAccessory() {
        log.info("unequipAccessory");
        petAppService.unequip();
    }

    @Override
    public RewardResult grantPetReward(@Valid GrantRewardRequest request) {
        log.info("grantPetReward: source={} refId={}", request.getSource(), request.getRefId());
        RewardSource source = RewardSource.valueOf(request.getSource().name());
        com.dailyschedule.domain.pet.RewardResult domainResult =
            petAppService.grantReward(source, request.getRefId());
        return PetAssembler.toRewardResultDto(domainResult);
    }

    @Override
    public List<ShopItem> getShopItems() {
        log.info("getShopItems");
        return petAppService.getShopItems()
            .stream()
            .map(PetAssembler::toShopItemDto)
            .toList();
    }

    @Override
    public PurchaseResult purchaseItem(@Valid PurchaseRequest request) {
        log.info("purchaseItem: itemId={} quantity={}", request.getItemId(), request.getQuantity());
        com.dailyschedule.domain.pet.PurchaseResult domainResult = petAppService.purchase(
            request.getItemId(), request.getQuantity() != null ? request.getQuantity() : 1);
        return PetAssembler.toPurchaseResultDto(domainResult);
    }
}
