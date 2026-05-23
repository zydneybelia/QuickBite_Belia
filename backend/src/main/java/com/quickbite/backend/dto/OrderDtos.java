package com.quickbite.backend.dto;

import java.util.List;

public class OrderDtos {

    public record OrderStatusUpdateRequest(String status) {}

    public record OrderItemRequest(String menuItemId, Integer quantity) {}

    public record CreateOrderRequest(String userId, List<OrderItemRequest> items) {}

    public record OrderItemSummary(String menuItemName, Integer quantity, Double price) {}

    public record OrderResponse(
            String id,
            String status,
            Double totalAmount,
            String createdAt,
            String userId,
            List<OrderItemSummary> items
    ) {}

    public record OrderStatsResponse(
            String restaurantId,
            Long totalOrdersCount,
            Long placedCount,
            Long preparingCount,
            Long deliveredCount
    ) {}
}
