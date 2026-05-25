package com.quickbite.backend.service;

import com.quickbite.backend.dto.MenuItemDtos;
import com.quickbite.backend.model.Restaurant;
import com.quickbite.backend.repository.MenuItemRepository;
import com.quickbite.backend.repository.RestaurantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;

    public MenuService(MenuItemRepository menuItemRepository, RestaurantRepository restaurantRepository) {
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public List<MenuItemDtos.MenuItemResponse> getMenuItemsForRestaurant(String restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        // Allow customers to view menu items from any restaurant, regardless of status
        // This enables managers to add items and customers to immediately see them
        // Status filtering (if needed) should be done at query level, not here

        return menuItemRepository.findByRestaurantId(restaurantId)
                .stream()
                .map(MenuItemDtos.MenuItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MenuItemDtos.MenuItemResponse> getAllMenuItems() {
        return menuItemRepository.findAll()
                .stream()
                .map(MenuItemDtos.MenuItemResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
