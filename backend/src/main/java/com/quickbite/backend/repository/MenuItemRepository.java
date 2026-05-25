package com.quickbite.backend.repository;

import com.quickbite.backend.model.MenuItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, String> {
    
    @EntityGraph(attributePaths = {"restaurant"})
    List<MenuItem> findByRestaurantId(String restaurantId);

    @EntityGraph(attributePaths = {"restaurant"})
    List<MenuItem> findAll();

    Optional<MenuItem> findByIdAndRestaurantId(String id, String restaurantId);
    long countByRestaurantId(String restaurantId);
}
