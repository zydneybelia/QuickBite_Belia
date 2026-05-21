package com.quickbite.backend.controller;

import com.quickbite.backend.dto.MenuItemDtos.MenuItemRequest;
import com.quickbite.backend.dto.MenuItemDtos.MenuItemResponse;
import com.quickbite.backend.dto.OrderDtos.OrderItemSummary;
import com.quickbite.backend.dto.OrderDtos.OrderResponse;
import com.quickbite.backend.dto.OrderDtos.OrderStatusUpdateRequest;
import com.quickbite.backend.dto.RestaurantDtos.RestaurantRequest;
import com.quickbite.backend.dto.RestaurantDtos.RestaurantResponse;
import com.quickbite.backend.dto.RestaurantDtos.RestaurantSalesResponse;
import com.quickbite.backend.model.MenuItem;
import com.quickbite.backend.model.Order;
import com.quickbite.backend.model.Restaurant;
import com.quickbite.backend.model.User;
import com.quickbite.backend.repository.MenuItemRepository;
import com.quickbite.backend.repository.OrderRepository;
import com.quickbite.backend.repository.RestaurantRepository;
import com.quickbite.backend.repository.UserRepository;
import com.quickbite.backend.security.RoleConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "*")
public class RestaurantManagerController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        return auth.getName();
    }

    private void requireManagerRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .noneMatch(role -> role.equals(RoleConstants.toAuthority(RoleConstants.RESTAURANT_MANAGER)))) {
            throw new AccessDeniedException("Only restaurant managers may access this endpoint");
        }
    }

    private void requireAdminRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .noneMatch(role -> role.equals(RoleConstants.toAuthority(RoleConstants.ADMIN)))) {
            throw new AccessDeniedException("Only admins may access this endpoint");
        }
    }

    private Restaurant getManagedRestaurant(String restaurantId) {
        String managerId = getCurrentUserId();
        return restaurantRepository.findById(restaurantId)
                .filter(r -> r.getOwner() != null && managerId.equals(r.getOwner().getId()))
                .orElseThrow(() -> new RuntimeException("Restaurant not found or not assigned to current manager"));
    }

    @GetMapping("/restaurants")
    public List<RestaurantResponse> getMyRestaurants() {
        requireManagerRole();
        String managerId = getCurrentUserId();
        return restaurantRepository.findByOwnerId(managerId)
                .stream()
                .map(this::toRestaurantResponse)
                .collect(Collectors.toList());
    }

    @PostMapping("/restaurants")
    public RestaurantResponse createRestaurant(@RequestBody RestaurantRequest request) {
        requireManagerRole();
        String managerId = getCurrentUserId();
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Current manager user not found"));

        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.name());
        restaurant.setDescription(request.description());
        restaurant.setLocation(request.location());
        restaurant.setStatus(request.status() != null ? request.status() : "active");
        restaurant.setOwner(manager);

        return toRestaurantResponse(restaurantRepository.save(restaurant));
    }

    @PutMapping("/restaurants/{id}")
    public RestaurantResponse updateRestaurant(@PathVariable String id,
                                               @RequestBody RestaurantRequest request) {
        requireManagerRole();
        Restaurant restaurant = getManagedRestaurant(id);
        restaurant.setName(request.name());
        restaurant.setDescription(request.description());
        restaurant.setLocation(request.location());
        restaurant.setStatus(request.status() != null ? request.status() : restaurant.getStatus());
        return toRestaurantResponse(restaurantRepository.save(restaurant));
    }

    @GetMapping("/restaurants/{id}/menu")
    public List<MenuItemResponse> getMenuItems(@PathVariable String id) {
        requireManagerRole();
        getManagedRestaurant(id);
        return menuItemRepository.findByRestaurantId(id)
                .stream()
                .map(this::toMenuItemResponse)
                .collect(Collectors.toList());
    }

    @PostMapping("/restaurants/{id}/menu")
    public MenuItemResponse addMenuItem(@PathVariable String id,
                                       @RequestBody MenuItemRequest request) {
        requireManagerRole();
        Restaurant restaurant = getManagedRestaurant(id);
        MenuItem menuItem = new MenuItem();
        menuItem.setName(request.name());
        menuItem.setDescription(request.description());
        menuItem.setPrice(request.price());
        menuItem.setAvailability(request.availability() != null ? request.availability() : true);
        menuItem.setRestaurant(restaurant);
        return toMenuItemResponse(menuItemRepository.save(menuItem));
    }

    @PutMapping("/restaurants/{id}/menu/{menuItemId}")
    public MenuItemResponse updateMenuItem(@PathVariable String id,
                                           @PathVariable String menuItemId,
                                           @RequestBody MenuItemRequest request) {
        requireManagerRole();
        getManagedRestaurant(id);
        MenuItem menuItem = menuItemRepository.findByIdAndRestaurantId(menuItemId, id)
                .orElseThrow(() -> new RuntimeException("Menu item not found for this restaurant"));

        menuItem.setName(request.name());
        menuItem.setDescription(request.description());
        menuItem.setPrice(request.price());
        menuItem.setAvailability(request.availability() != null ? request.availability() : menuItem.getAvailability());
        return toMenuItemResponse(menuItemRepository.save(menuItem));
    }

    @DeleteMapping("/restaurants/{id}/menu/{menuItemId}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable String id,
                                               @PathVariable String menuItemId) {
        requireManagerRole();
        getManagedRestaurant(id);
        MenuItem menuItem = menuItemRepository.findByIdAndRestaurantId(menuItemId, id)
                .orElseThrow(() -> new RuntimeException("Menu item not found for this restaurant"));
        menuItemRepository.delete(menuItem);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/restaurants/{id}/orders")
    public List<OrderResponse> getRestaurantOrders(@PathVariable String id) {
        requireManagerRole();
        getManagedRestaurant(id);
        return orderRepository.findOrdersByRestaurantId(id)
                .stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    @PutMapping("/restaurants/{id}/orders/{orderId}/status")
    public OrderResponse updateOrderStatus(@PathVariable String id,
                                           @PathVariable String orderId,
                                           @RequestBody OrderStatusUpdateRequest request) {
        requireManagerRole();
        getManagedRestaurant(id);
        Order order = orderRepository.findDistinctByIdAndOrderItemsMenuItemRestaurantId(orderId, id)
                .orElseThrow(() -> new RuntimeException("Order not found for this restaurant"));
        order.setStatus(request.status());
        return toOrderResponse(orderRepository.save(order));
    }

    @GetMapping("/restaurants/{id}/sales")
    public RestaurantSalesResponse getSales(@PathVariable String id) {
        requireManagerRole();
        getManagedRestaurant(id);
        Double totalSales = orderRepository.findTotalSalesByRestaurantId(id);
        Long orderCount = orderRepository.findOrdersByRestaurantId(id).stream().count();
        Long menuItemCount = menuItemRepository.countByRestaurantId(id);
        return new RestaurantSalesResponse(id, totalSales == null ? 0.0 : totalSales, orderCount, menuItemCount);
    }

    private RestaurantResponse toRestaurantResponse(Restaurant restaurant) {
        String managerName = null;
        if (restaurant.getOwner() != null) {
            managerName = (restaurant.getOwner().getFirstname() == null ? "" : restaurant.getOwner().getFirstname())
                + (restaurant.getOwner().getLastname() == null ? "" : " " + restaurant.getOwner().getLastname());
            managerName = managerName.trim();
            if (managerName.isEmpty()) managerName = null;
        }
        return new RestaurantResponse(
            restaurant.getId(),
            restaurant.getName(),
            restaurant.getDescription(),
            restaurant.getLocation(),
            restaurant.getContactNumber(),
            restaurant.getCuisineType(),
            restaurant.getStatus(),
            managerName
        );
    }

    private MenuItemResponse toMenuItemResponse(MenuItem item) {
        return new MenuItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getAvailability()
        );
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemSummary> items = order.getOrderItems() == null ? List.of() : order.getOrderItems().stream()
                .map(item -> new OrderItemSummary(item.getMenuItemName(), item.getQuantity(), item.getPrice()))
                .collect(Collectors.toList());

        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCreatedAt() != null ? order.getCreatedAt().toString() : null,
                order.getUser() != null ? order.getUser().getId() : null,
                items
        );
    }
}
