package com.quickbite.backend.service;

import com.quickbite.backend.dto.AssignedRestaurantResponse;
import com.quickbite.backend.repository.RestaurantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ManagerService {

    private final RestaurantRepository restaurantRepository;

    public ManagerService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    public AssignedRestaurantResponse getAssignedRestaurantForManager(String managerId) {
        return restaurantRepository.findByOwnerId(managerId)
                .stream()
                .findFirst()
                .map(restaurant -> new AssignedRestaurantResponse(
                        restaurant.getId(),
                        restaurant.getName()
                ))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No restaurant assigned to this manager"));
    }
}
