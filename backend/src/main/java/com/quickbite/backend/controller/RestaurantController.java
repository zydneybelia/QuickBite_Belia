package com.quickbite.backend.controller;

import com.quickbite.backend.model.Restaurant;
import com.quickbite.backend.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/restaurants")
@CrossOrigin(origins = "*")
public class RestaurantController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @GetMapping
    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }

    @GetMapping("/owner/{ownerId}")
    public List<Restaurant> getRestaurantsByOwnerId(@PathVariable String ownerId) {  // ✅ String
        return restaurantRepository.findByOwnerId(ownerId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@PathVariable String id) {  // ✅ String
        Optional<Restaurant> restaurant = restaurantRepository.findById(id);
        return restaurant.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Restaurant> createRestaurant(@RequestBody Restaurant restaurant) {
        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        return ResponseEntity.ok(savedRestaurant);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(
            @PathVariable String id,                                                  // ✅ String
            @RequestBody Restaurant restaurantDetails) {
        Optional<Restaurant> restaurant = restaurantRepository.findById(id);
        if (restaurant.isPresent()) {
            Restaurant existing = restaurant.get();
            existing.setName(restaurantDetails.getName());
            existing.setDescription(restaurantDetails.getDescription());             // ✅ description
            existing.setLocation(restaurantDetails.getLocation());                   // ✅ location
            existing.setStatus(restaurantDetails.getStatus());                       // ✅ status
            return ResponseEntity.ok(restaurantRepository.save(existing));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable String id) {          // ✅ String
        if (restaurantRepository.existsById(id)) {
            restaurantRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}