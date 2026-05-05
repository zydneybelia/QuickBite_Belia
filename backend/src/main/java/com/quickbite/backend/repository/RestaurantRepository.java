package com.quickbite.backend.repository;

import com.quickbite.backend.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, String> {
    List<Restaurant> findByOwnerId(String ownerId);
}