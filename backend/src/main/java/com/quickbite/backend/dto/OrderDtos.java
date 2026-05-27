package com.quickbite.backend.dto;

import java.util.List;

public class OrderDtos {

    public record OrderStatusUpdateRequest(String status) {}

    public record OrderItemRequest(String menuItemId, Integer quantity) {}

    public record CreateOrderRequest(
            String userId,
            String deliveryAddress,
            String paymentMethod,
            String paymentReference,
            List<OrderItemRequest> items
    ) {}

    public record OrderItemSummary(String menuItemName, Integer quantity, Double price) {}

    public record OrderResponse(
            String id,
            String status,
            Double totalAmount,
            String deliveryAddress,
            String paymentMethod,
            String paymentReference,
            String createdAt,
            String userId,
            String customerName,
            String restaurantName,
            List<OrderItemSummary> items
    ) {}

    public record OrderStatsResponse(
            String restaurantId,
            Long totalOrdersCount,
            Long placedCount,
            Long preparingCount,
            Long outForDeliveryCount,
            Long deliveredCount
    ) {}
}
