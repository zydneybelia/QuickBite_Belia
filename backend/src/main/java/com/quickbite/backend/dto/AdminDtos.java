package com.quickbite.backend.dto;

import com.quickbite.backend.dto.RestaurantDtos.RestaurantResponse;

public class AdminDtos {

    public record ManagerRequest(
            String firstname,
            String lastname,
            String email,
            String password
    ) {}

    public record ManagerResponse(
            String id,
            String firstname,
            String lastname,
            String email,
            String role,
            boolean active
    ) {}

    public record OnboardRestaurantRequest(
            String name,
            String description,
            String location,
            String contactNumber,
            String cuisineType,
            String status,
            String managerFirstname,
            String managerLastname,
            String managerEmail,
            String managerPassword,
            String existingManagerId
    ) {}

    public record OnboardRestaurantResponse(
            RestaurantResponse restaurant,
            ManagerResponse manager
    ) {}
}
