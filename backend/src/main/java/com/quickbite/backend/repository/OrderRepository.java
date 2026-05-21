package com.quickbite.backend.repository;

import com.quickbite.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUserId(String userId);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi WHERE oi.menuItem.restaurant.id = :restaurantId")
    List<Order> findOrdersByRestaurantId(@Param("restaurantId") String restaurantId);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi WHERE o.id = :orderId AND oi.menuItem.restaurant.id = :restaurantId")
    Optional<Order> findDistinctByIdAndOrderItemsMenuItemRestaurantId(@Param("orderId") String orderId,
                                                                     @Param("restaurantId") String restaurantId);

    @Query("SELECT SUM(oi.quantity * oi.price) FROM OrderItem oi WHERE oi.menuItem.restaurant.id = :restaurantId")
    Double findTotalSalesByRestaurantId(@Param("restaurantId") String restaurantId);
}