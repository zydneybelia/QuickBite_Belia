package com.quickbite.backend.dto;

public class MenuItemDtos {

    public record MenuItemRequest(
            String name,
            String description,
            Double price,
            Boolean availability
    ) {}

    public record MenuItemResponse(
            String id,
            String name,
            String description,
            Double price,
            Boolean availability
    ) {}
}
