package com.quickbite.backend.controller;

import com.quickbite.backend.dto.OrderDtos;
import com.quickbite.backend.model.Order;
import com.quickbite.backend.model.OrderItem;
import com.quickbite.backend.model.MenuItem;
import com.quickbite.backend.model.User;
import com.quickbite.backend.repository.OrderRepository;
import com.quickbite.backend.repository.MenuItemRepository;
import com.quickbite.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private UserRepository userRepository;

    private OrderDtos.OrderResponse toResponse(Order order) {
        List<OrderDtos.OrderItemSummary> items = (order.getOrderItems() == null) ? List.of() :
                order.getOrderItems().stream()
                        .map(oi -> new OrderDtos.OrderItemSummary(oi.getMenuItemName(), oi.getQuantity(), oi.getPrice()))
                        .collect(Collectors.toList());
        String created = order.getCreatedAt() == null ? null : order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        
        String customerName = "—";
        if (order.getUser() != null) {
            String fname = order.getUser().getFirstname() != null ? order.getUser().getFirstname() : "";
            String lname = order.getUser().getLastname() != null ? order.getUser().getLastname() : "";
            customerName = (fname + " " + lname).trim();
            if (customerName.isEmpty()) customerName = order.getUser().getEmail();
        }

        String restaurantName = "—";
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            OrderItem firstItem = order.getOrderItems().get(0);
            if (firstItem.getMenuItem() != null && firstItem.getMenuItem().getRestaurant() != null) {
                restaurantName = firstItem.getMenuItem().getRestaurant().getName();
            }
        }

        return new OrderDtos.OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getDeliveryAddress(),
                order.getPaymentMethod(),
                order.getPaymentReference(),
                created,
                order.getUser() == null ? null : order.getUser().getId(),
                customerName,
                restaurantName,
                items
        );
    }

    @GetMapping
    public List<OrderDtos.OrderResponse> getAllOrders() {
        return orderRepository.findByDeletedFalse().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/user/{userId}")
    public List<OrderDtos.OrderResponse> getOrdersByUserId(@PathVariable String userId) {              // ✅ String
        return orderRepository.findByUserIdAndDeletedFalse(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/me")
    public List<OrderDtos.OrderResponse> getMyOrders() {
        String userId = getCurrentAuthenticatedUserId();
        if (userId == null) {
            return List.of();
        }
        return orderRepository.findByUserIdAndDeletedFalse(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDtos.OrderResponse> getOrderById(@PathVariable String id) {             // ✅ String
        Optional<Order> order = orderRepository.findById(id);
        if (order.isPresent() && !order.get().isDeleted()) {
            return ResponseEntity.ok(toResponse(order.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String id, @RequestBody OrderDtos.OrderStatusUpdateRequest request) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Order order = orderOpt.get();
        order.setStatus(request.status());
        return ResponseEntity.ok(toResponse(orderRepository.save(order)));
    }

    private String getCurrentAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        return auth.getName();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createOrder(@RequestBody OrderDtos.CreateOrderRequest request) {
        System.out.println("Received order request: " + request);
        
        if (request.userId() == null || request.userId().isBlank()) {
            return ResponseEntity.badRequest().body("User ID is required.");
        }
        
        if (request.paymentMethod() == null || request.paymentMethod().isBlank()) {
            return ResponseEntity.badRequest().body("Payment method is required.");
        }

        // Validate and fetch user - try by ID first, then by email as fallback
        Optional<User> userOpt = userRepository.findById(request.userId());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(request.userId());
        }
        
        if (userOpt.isEmpty()) {
            System.err.println("User not found for ID/Email: " + request.userId());
            return ResponseEntity.badRequest().body("User not found with ID or Email: " + request.userId());
        }

        User user = userOpt.get();

        try {
            // Create new order
            Order order = new Order();
            order.setUser(user);
            order.setStatus("PLACED");
            order.setDeliveryAddress(request.deliveryAddress());
            order.setPaymentMethod(request.paymentMethod());
            order.setPaymentReference(request.paymentReference());
            order.setOrderItems(new ArrayList<>());

            // Process order items
            double totalAmount = 0;
            if (request.items() == null || request.items().isEmpty()) {
                return ResponseEntity.badRequest().body("Order must have at least one item.");
            }

            for (OrderDtos.OrderItemRequest itemRequest : request.items()) {
                Optional<MenuItem> menuItemOpt = menuItemRepository.findById(itemRequest.menuItemId());
                if (menuItemOpt.isEmpty()) {
                    System.err.println("MenuItem not found: " + itemRequest.menuItemId());
                    return ResponseEntity.badRequest().body("MenuItem not found: " + itemRequest.menuItemId());
                }

                MenuItem menuItem = menuItemOpt.get();
                double itemTotal = menuItem.getPrice() * itemRequest.quantity();
                totalAmount += itemTotal;

                // Create OrderItem
                OrderItem orderItem = new OrderItem(order, menuItem, itemRequest.quantity(), menuItem.getPrice());
                order.getOrderItems().add(orderItem);
            }

            order.setTotalAmount(totalAmount);

            // Save order (cascade will persist OrderItems)
            Order savedOrder = orderRepository.save(order);
            System.out.println("Order saved successfully with ID: " + savedOrder.getId());

            return ResponseEntity.ok(toResponse(savedOrder));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to place order: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(
            @PathVariable String id,                                                  // ✅ String
            @RequestBody Order orderDetails) {
        Optional<Order> order = orderRepository.findById(id);
        if (order.isPresent()) {
            Order existing = order.get();
            existing.setStatus(orderDetails.getStatus());
            existing.setTotalAmount(orderDetails.getTotalAmount());                  // ✅ totalAmount
            return ResponseEntity.ok(orderRepository.save(existing));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable String id) {               // ✅ String
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setDeleted(true);
            orderRepository.save(order);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}