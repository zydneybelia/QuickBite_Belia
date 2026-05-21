package com.quickbite.backend.service;

import com.quickbite.backend.dto.RestaurantDto;
import com.quickbite.backend.repository.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    public List<RestaurantDto> getActiveRestaurants() {
        return restaurantRepository.findByStatusIgnoreCase("active")
                .stream()
                .map(RestaurantDto::fromEntity)
                .collect(Collectors.toList());
    }
}
