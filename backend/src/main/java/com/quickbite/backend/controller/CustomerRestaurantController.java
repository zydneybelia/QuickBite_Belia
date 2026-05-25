package com.quickbite.backend.controller;

import com.quickbite.backend.dto.MenuItemDtos;
import com.quickbite.backend.dto.RestaurantDto;
import com.quickbite.backend.service.MenuService;
import com.quickbite.backend.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @GetMapping("/favorites")
    public ResponseEntity<List<String>> getFavoriteRestaurantIds() {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(restaurantService.getFavoriteRestaurantIds(userId));
    }

    @PostMapping("/{restaurantId}/favorite")
    public ResponseEntity<Map<String, Boolean>> toggleFavorite(@PathVariable String restaurantId) {
        String userId = getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).build();
        boolean isFavorite = restaurantService.toggleFavorite(userId, restaurantId);
        return ResponseEntity.ok(Map.of("favorite", isFavorite));
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

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        // In JwtAuthenticationFilter, we set the principal as a User object with userId as the username
        return auth.getName();
    }
}
