package com.quickbite.backend.dto;

public class RestaurantDtos {

    public record RestaurantRequest(
            String name,
            String description,
            String location,
            String contactNumber,
            String cuisineType,
            String status
    ) {}

    public record RestaurantResponse(
            String id,
            String name,
            String description,
            String location,
            String contactNumber,
            String cuisineType,
            String status,
            String managerName
    ) {}

    public record RestaurantSalesResponse(
            String restaurantId,
            Double totalSales,
            Long orderCount,
            Long menuItemCount
    ) {}
}
