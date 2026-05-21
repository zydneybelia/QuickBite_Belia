package com.quickbite.backend.repository;

import com.quickbite.backend.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, String> {
    List<MenuItem> findByRestaurantId(String restaurantId);
    Optional<MenuItem> findByIdAndRestaurantId(String id, String restaurantId);
    long countByRestaurantId(String restaurantId);
}
