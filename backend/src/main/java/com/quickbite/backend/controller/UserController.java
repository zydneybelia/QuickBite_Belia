package com.quickbite.backend.controller;

import com.quickbite.backend.model.User;
import com.quickbite.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

        @GetMapping("/managers")
        public List<Map<String, String>> getManagers() {
        return userService.getAllUsers().stream()
            .filter(u -> "RESTAURANT_MANAGER".equals(u.getRole()) || u.getRole() != null && u.getRole().contains("MANAGER"))
            .map(u -> Map.of(
                "id", u.getId(),
                "name", (u.getFirstname() == null ? "" : u.getFirstname()) + (u.getLastname() == null ? "" : " " + u.getLastname()),
                "email", u.getEmail()
            ))
            .collect(Collectors.toList());
        }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}