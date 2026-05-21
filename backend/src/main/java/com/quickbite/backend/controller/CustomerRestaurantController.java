package com.quickbite.backend.controller;

import com.quickbite.backend.dto.RestaurantDto;
import com.quickbite.backend.service.RestaurantService;
import com.quickbite.backend.service.SupabaseAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/customer/restaurants")
@CrossOrigin(origins = "*")
public class CustomerRestaurantController {

    private final SupabaseAuthService authService;
    private final RestaurantService restaurantService;

    public CustomerRestaurantController(SupabaseAuthService authService, RestaurantService restaurantService) {
        this.authService = authService;
        this.restaurantService = restaurantService;
    }

    @GetMapping
    public ResponseEntity<List<RestaurantDto>> getActiveRestaurants(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {

        String token = extractBearerToken(authorizationHeader);
        authService.validateCustomerToken(token);
        List<RestaurantDto> restaurants = restaurantService.getActiveRestaurants();
        return ResponseEntity.ok(restaurants);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header must contain a Bearer token");
        }
        return authorizationHeader.substring(7);
    }
}
