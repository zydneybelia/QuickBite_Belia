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
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
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
        return new OrderDtos.OrderResponse(order.getId(), order.getStatus(), order.getTotalAmount(), created, order.getUser() == null ? null : order.getUser().getId(), items);
    }

    @GetMapping
    public List<OrderDtos.OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/user/{userId}")
    public List<OrderDtos.OrderResponse> getOrdersByUserId(@PathVariable String userId) {              // ✅ String
        return orderRepository.findByUserId(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDtos.OrderResponse> getOrderById(@PathVariable String id) {             // ✅ String
        Optional<Order> order = orderRepository.findById(id);
        return order.map(o -> ResponseEntity.ok(toResponse(o)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderDtos.CreateOrderRequest request) {
        // Validate and fetch user
        Optional<User> userOpt = userRepository.findById(request.userId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found: " + request.userId());
        }

        User user = userOpt.get();

        // Create new order
        Order order = new Order();
        order.setUser(user);
        order.setStatus("PLACED");
        order.setOrderItems(new ArrayList<>());

        // Process order items
        double totalAmount = 0;
        for (OrderDtos.OrderItemRequest itemRequest : request.items()) {
            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(itemRequest.menuItemId());
            if (menuItemOpt.isEmpty()) {
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

        return ResponseEntity.ok(toResponse(savedOrder));
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
        if (orderRepository.existsById(id)) {
            orderRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}