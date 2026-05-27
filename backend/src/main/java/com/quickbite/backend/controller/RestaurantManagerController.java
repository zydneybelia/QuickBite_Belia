package com.quickbite.backend.controller;

import com.quickbite.backend.dto.MenuItemDtos.MenuItemRequest;
import com.quickbite.backend.dto.MenuItemDtos.MenuItemResponse;
import com.quickbite.backend.dto.OrderDtos.OrderItemSummary;
import com.quickbite.backend.dto.OrderDtos.OrderResponse;
import com.quickbite.backend.dto.OrderDtos.OrderStatsResponse;
import com.quickbite.backend.dto.OrderDtos.OrderStatusUpdateRequest;
import com.quickbite.backend.dto.AssignedRestaurantResponse;
import com.quickbite.backend.dto.RestaurantDtos.RestaurantRequest;
import com.quickbite.backend.dto.RestaurantDtos.RestaurantResponse;
import com.quickbite.backend.dto.RestaurantDtos.RestaurantSalesResponse;
import com.quickbite.backend.model.*;
import com.quickbite.backend.repository.MenuItemRepository;
import com.quickbite.backend.repository.OrderRepository;
import com.quickbite.backend.repository.RestaurantRepository;
import com.quickbite.backend.repository.UserRepository;
import com.quickbite.backend.security.RoleConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
public class RestaurantManagerController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.quickbite.backend.service.ManagerService managerService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        
        Object principal = auth.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.User) {
            return ((org.springframework.security.core.userdetails.User) principal).getUsername(); // This is the userId stored in JwtAuthenticationFilter
        }
        
        String identifier = auth.getName();
        return userRepository.findById(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .map(com.quickbite.backend.model.User::getId)
                .orElse(identifier);
    }

    private void requireManagerRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Authentication required");
        }
        
        // Check for ROLE_RESTAURANT_MANAGER or ROLE_ADMIN
        boolean hasPermission = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_RESTAURANT_MANAGER") || 
                               a.getAuthority().equals("ROLE_ADMIN"));
                
        if (!hasPermission) {
            throw new AccessDeniedException("Access denied: requires Manager or Admin role");
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

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals(RoleConstants.toAuthority(RoleConstants.ADMIN)));
    }

    private Restaurant getManagedRestaurant(String restaurantId) {
        if (isAdmin()) {
            return restaurantRepository.findById(restaurantId)
                    .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        }
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

    @GetMapping("/assigned-restaurant")
    public AssignedRestaurantResponse getAssignedRestaurant() {
        requireManagerRole();
        String managerId = getCurrentUserId();
        return managerService.getAssignedRestaurantForManager(managerId);
    }

    @PostMapping("/restaurants")
    public RestaurantResponse createRestaurant(@RequestBody RestaurantRequest request) {
        requireManagerRole();
        String managerId = getCurrentUserId();
        com.quickbite.backend.model.User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Current manager user not found"));

        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.name());
        restaurant.setDescription(request.description());
        restaurant.setLocation(request.location());
        restaurant.setContactNumber(request.contactNumber());
        restaurant.setCuisineType(request.cuisineType());
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
        restaurant.setContactNumber(request.contactNumber());
        restaurant.setCuisineType(request.cuisineType());
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
        menuItem.setCategory(request.category());
        menuItem.setAvailability(request.availability() != null ? request.availability() : true);
        menuItem.setRestaurant(restaurant);
        return toMenuItemResponse(menuItemRepository.save(menuItem));
    }

    @GetMapping("/restaurants/{id}/orders/stats")
    public OrderStatsResponse getRestaurantOrderStats(@PathVariable String id) {
        requireManagerRole();
        getManagedRestaurant(id);

        Long totalOrdersCount = orderRepository.countDistinctOrdersByRestaurantId(id);
        Long placedCount = orderRepository.countDistinctByStatusAndRestaurantId("PLACED", id);
        Long preparingCount = orderRepository.countDistinctByStatusAndRestaurantId("PREPARING", id);
        Long outForDeliveryCount = orderRepository.countDistinctByStatusAndRestaurantId("OUT_FOR_DELIVERY", id);
        Long deliveredCount = orderRepository.countDistinctByStatusAndRestaurantId("DELIVERED", id);

        return new OrderStatsResponse(
                id,
                totalOrdersCount != null ? totalOrdersCount : 0L,
                placedCount != null ? placedCount : 0L,
                preparingCount != null ? preparingCount : 0L,
                outForDeliveryCount != null ? outForDeliveryCount : 0L,
                deliveredCount != null ? deliveredCount : 0L
        );
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
        menuItem.setCategory(request.category());
        menuItem.setAvailability(request.availability() != null ? request.availability() : menuItem.getAvailability());
        return toMenuItemResponse(menuItemRepository.save(menuItem));
    }

    @PatchMapping("/restaurants/{id}/menu/{menuItemId}/availability")
    public ResponseEntity<?> toggleAvailability(@PathVariable String id,
                                               @PathVariable String menuItemId) {
        try {
            requireManagerRole();
            getManagedRestaurant(id);
            MenuItem menuItem = menuItemRepository.findByIdAndRestaurantId(menuItemId, id)
                    .orElseThrow(() -> new RuntimeException("Menu item not found for this restaurant"));
            menuItem.setAvailability(!menuItem.getAvailability());
            MenuItem savedItem = menuItemRepository.save(menuItem);
            return ResponseEntity.ok(toMenuItemResponse(savedItem));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new AuthController.ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthController.ErrorResponse("Failed to update availability: " + e.getMessage()));
        }
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

    @DeleteMapping("/restaurants/{id}/orders/{orderId}")
    public ResponseEntity<Void> deleteOrder(@PathVariable String id,
                                           @PathVariable String orderId) {
        requireManagerRole();
        getManagedRestaurant(id);
        Order order = orderRepository.findDistinctByIdAndOrderItemsMenuItemRestaurantId(orderId, id)
                .orElseThrow(() -> new RuntimeException("Order not found for this restaurant"));
        order.setDeleted(true);
        orderRepository.save(order);
        return ResponseEntity.ok().build();
    }

    private RestaurantResponse toRestaurantResponse(Restaurant restaurant) {
        String managerName = null;
        String managerId = null;
        if (restaurant.getOwner() != null) {
            managerId = restaurant.getOwner().getId();
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
                managerId,
                managerName
        );
    }

    private MenuItemResponse toMenuItemResponse(MenuItem item) {
        return MenuItemResponse.fromEntity(item);
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemSummary> items = order.getOrderItems() == null ? List.of() : order.getOrderItems().stream()
                .map(item -> new OrderItemSummary(item.getMenuItemName(), item.getQuantity(), item.getPrice()))
                .collect(Collectors.toList());

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

        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getDeliveryAddress(),
                order.getPaymentMethod(),
                order.getPaymentReference(),
                order.getCreatedAt() != null ? order.getCreatedAt().toString() : null,
                order.getUser() != null ? order.getUser().getId() : null,
                customerName,
                restaurantName,
                items
        );
    }
}
