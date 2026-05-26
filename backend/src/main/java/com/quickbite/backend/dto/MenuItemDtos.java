package com.quickbite.backend.dto;

import com.quickbite.backend.model.MenuItem;

public class MenuItemDtos {

    public record MenuItemRequest(
            String name,
            String description,
            Double price,
            String category,
            Boolean availability
    ) {}

    public record MenuItemResponse(
            String id,
            String name,
            String description,
            Double price,
            String category,
            Boolean availability,
            String restaurantId,
            String restaurantName
    ) {
        public static MenuItemResponse fromEntity(MenuItem item) {
            return new MenuItemResponse(
                    item.getId(),
                    item.getName(),
                    item.getDescription(),
                    item.getPrice(),
                    item.getCategory(),
                    item.getAvailability(),
                    item.getRestaurant() != null ? item.getRestaurant().getId() : null,
                    item.getRestaurant() != null ? item.getRestaurant().getName() : null
            );
        }
    }
}
