package com.quickbite.backend.controller;

import com.quickbite.backend.dto.MenuItemDtos;
import com.quickbite.backend.dto.RestaurantDto;
import com.quickbite.backend.service.MenuService;
import com.quickbite.backend.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customer/restaurants")
@CrossOrigin(origins = "*")
public class CustomerRestaurantController {

    private final RestaurantService restaurantService;
    private final MenuService menuService;

    public CustomerRestaurantController(RestaurantService restaurantService, MenuService menuService) {
        this.restaurantService = restaurantService;
        this.menuService = menuService;
    }

    @GetMapping
    public ResponseEntity<List<RestaurantDto>> getActiveRestaurants() {
        List<RestaurantDto> restaurants = restaurantService.getActiveRestaurants();
        return ResponseEntity.ok(restaurants);
    }

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemDtos.MenuItemResponse>> getAllMenus() {
        List<MenuItemDtos.MenuItemResponse> menuItems = menuService.getAllMenuItems();
        return ResponseEntity.ok(menuItems);
    }

    @GetMapping("/{restaurantId}/menu")
    public ResponseEntity<List<MenuItemDtos.MenuItemResponse>> getRestaurantMenu(@PathVariable String restaurantId) {
        List<MenuItemDtos.MenuItemResponse> menuItems = menuService.getMenuItemsForRestaurant(restaurantId);
        return ResponseEntity.ok(menuItems);
    }
}
