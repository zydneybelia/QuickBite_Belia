package com.quickbite.backend.controller;

import com.quickbite.backend.model.Cart;
import com.quickbite.backend.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartRepository cartRepository;

    @GetMapping
    public List<Cart> getAllCarts() {
        return cartRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Cart> getCartByUserId(@PathVariable String userId) {       // ✅ String
        Optional<Cart> cart = cartRepository.findByUserId(userId);
        return cart.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<Cart> getMyCart() {
        String userId = getCurrentAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        Optional<Cart> cart = cartRepository.findByUserId(userId);
        return cart.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cart> getCartById(@PathVariable String id) {               // ✅ String
        Optional<Cart> cart = cartRepository.findById(id);
        return cart.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Cart> createCart(@RequestBody Cart cart) {
        Cart savedCart = cartRepository.save(cart);
        return ResponseEntity.ok(savedCart);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cart> updateCart(
            @PathVariable String id,                                                  // ✅ String
            @RequestBody Cart cartDetails) {
        Optional<Cart> cart = cartRepository.findById(id);
        if (cart.isPresent()) {
            Cart existing = cart.get();
            // ✅ Only update fields that exist in Cart model
            existing.setUser(cartDetails.getUser());
            return ResponseEntity.ok(cartRepository.save(existing));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCart(@PathVariable String id) {                // ✅ String
        if (cartRepository.existsById(id)) {
            cartRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private String getCurrentAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        return auth.getName();
    }
}