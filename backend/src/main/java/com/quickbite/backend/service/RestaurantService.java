package com.quickbite.backend.service;

import com.quickbite.backend.dto.RestaurantDto;
import com.quickbite.backend.model.Restaurant;
import com.quickbite.backend.model.User;
import com.quickbite.backend.repository.RestaurantRepository;
import com.quickbite.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public RestaurantService(RestaurantRepository restaurantRepository, UserRepository userRepository) {
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    public List<RestaurantDto> getActiveRestaurants() {
        return restaurantRepository.findByStatusIgnoreCase("active")
                .stream()
                .map(RestaurantDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean toggleFavorite(String userId, String restaurantId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found with ID: " + restaurantId));
        
        List<Restaurant> favorites = user.getFavoriteRestaurants();
        boolean isFavorite;
        
        if (favorites.contains(restaurant)) {
            favorites.remove(restaurant);
            isFavorite = false;
        } else {
            favorites.add(restaurant);
            isFavorite = true;
        }
        
        userRepository.save(user);
        return isFavorite;
    }

    public List<String> getFavoriteRestaurantIds(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        return user.getFavoriteRestaurants().stream()
                .map(Restaurant::getId)
                .collect(Collectors.toList());
    }
}
