package com.dailyschedule.api.controller;

import com.dailyschedule.api.assembler.PetAssembler;
import com.dailyschedule.api.generated.api.PetsApi;
import com.dailyschedule.api.generated.api.ShopApi;
import com.dailyschedule.api.generated.dto.*;
import com.dailyschedule.application.pet.PetApplicationService;
import com.dailyschedule.domain.pet.InteractionType;
import com.dailyschedule.domain.pet.Pet;
import com.dailyschedule.domain.pet.PetSpecies;
import com.dailyschedule.infrastructure.security.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PetController implements PetsApi, ShopApi {

    private final PetApplicationService petAppService;
    private final CurrentUserService currentUserService;

    public PetController(PetApplicationService petAppService, CurrentUserService currentUserService) {
        this.petAppService = petAppService;
        this.currentUserService = currentUserService;
    }

    @Override
    @ResponseStatus(HttpStatus.CREATED)
    public PetProfile createPet(@Valid CreatePetRequest request) {
        PetSpecies species = PetSpecies.valueOf(request.getSpecies().name());
        Pet pet = petAppService.create(species, request.getName());
        return PetAssembler.toPetProfile(pet);
    }

    @Override
    public PetProfile getMyPet() {
        Pet pet = petAppService.getMyPet();
        return PetAssembler.toPetProfile(pet);
    }

    @Override
    public PetProfile updatePet(@Valid UpdatePetRequest request) {
        Pet pet = petAppService.update(request.getName());
        return PetAssembler.toPetProfile(pet);
    }

    @Override
    public InteractionResult interactWithPet(@Valid InteractRequest request) {
        InteractionType type = InteractionType.valueOf(request.getType().name());
        com.dailyschedule.domain.pet.InteractionResult domainResult =
            petAppService.interact(type, request.getItemId());
        return PetAssembler.toInteractionResultDto(domainResult);
    }

    @Override
    public List<ShopItem> getShopItems() {
        return petAppService.getShopItems()
            .stream()
            .map(PetAssembler::toShopItemDto)
            .toList();
    }

    @Override
    public PurchaseResult purchaseItem(@Valid PurchaseRequest request) {
        com.dailyschedule.domain.pet.PurchaseResult domainResult = petAppService.purchase(
            request.getItemId(), request.getQuantity() != null ? request.getQuantity() : 1);
        return PetAssembler.toPurchaseResultDto(domainResult);
    }
}
