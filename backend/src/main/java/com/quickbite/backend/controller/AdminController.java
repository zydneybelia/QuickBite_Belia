package com.quickbite.backend.controller;

import com.quickbite.backend.dto.AdminDtos.ManagerRequest;
import com.quickbite.backend.dto.AdminDtos.ManagerResponse;
import com.quickbite.backend.dto.AdminDtos.OnboardRestaurantRequest;
import com.quickbite.backend.dto.AdminDtos.OnboardRestaurantResponse;
import com.quickbite.backend.dto.RestaurantDtos.RestaurantRequest;
import com.quickbite.backend.dto.RestaurantDtos.RestaurantResponse;
import com.quickbite.backend.model.Restaurant;
import com.quickbite.backend.model.User;
import com.quickbite.backend.repository.RestaurantRepository;
import com.quickbite.backend.repository.UserRepository;
import com.quickbite.backend.security.RoleConstants;
import com.quickbite.backend.service.UserService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    private void requireAdminRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .noneMatch(role -> role.equals(RoleConstants.toAuthority(RoleConstants.ADMIN)))) {
            throw new AccessDeniedException("Only admins may access this endpoint");
        }
    }

    @GetMapping("/restaurants")
    public List<RestaurantResponse> getAllRestaurants() {
        requireAdminRole();
        return restaurantRepository.findAll().stream()
                .map(this::toRestaurantResponse)
                .collect(Collectors.toList());
    }

    @PostMapping("/restaurants")
    public RestaurantResponse createRestaurant(@RequestBody RestaurantRequest request) {
        requireAdminRole();
        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.name());
        restaurant.setDescription(request.description());
        restaurant.setLocation(request.location());
        restaurant.setContactNumber(request.contactNumber());
        restaurant.setCuisineType(request.cuisineType());
        restaurant.setStatus(request.status() != null ? request.status() : "active");
        restaurant.setOwner(null);
        return toRestaurantResponse(restaurantRepository.save(restaurant));
    }

    @Transactional
    @PostMapping("/onboard-restaurant")
    public OnboardRestaurantResponse onboardRestaurant(@RequestBody OnboardRestaurantRequest request) {
        requireAdminRole();
        validateOnboardRequest(request);

        User manager;
        if (request.existingManagerId() != null && !request.existingManagerId().isBlank()) {
            manager = userRepository.findById(request.existingManagerId())
                    .orElseThrow(() -> new RuntimeException("Selected manager not found"));
            if (!RoleConstants.RESTAURANT_MANAGER.equals(manager.getRole())) {
                throw new RuntimeException("Selected user is not a restaurant manager");
            }
        } else {
            if (userRepository.existsByEmail(request.managerEmail())) {
                throw new RuntimeException("Manager email is already in use");
            }
            manager = new User();
            manager.setFirstname(request.managerFirstname());
            manager.setLastname(request.managerLastname());
            manager.setEmail(request.managerEmail());
            manager.setPassword(request.managerPassword());
            manager.setRole(RoleConstants.RESTAURANT_MANAGER);
            manager = userService.createUser(manager);
        }

        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.name());
        restaurant.setDescription(request.description());
        restaurant.setLocation(request.location());
        restaurant.setContactNumber(request.contactNumber());
        restaurant.setCuisineType(request.cuisineType());
        restaurant.setStatus(request.status() != null ? request.status() : "active");
        restaurant.setOwner(manager);

        Restaurant savedRestaurant = restaurantRepository.save(restaurant);

        return new OnboardRestaurantResponse(
                toRestaurantResponse(savedRestaurant),
                toManagerResponse(manager)
        );
    }

    private void validateOnboardRequest(OnboardRestaurantRequest request) {
        requireNonEmpty("Restaurant name", request.name());
        requireNonEmpty("Restaurant location", request.location());
        requireNonEmpty("Contact number", request.contactNumber());
        requireNonEmpty("Cuisine type", request.cuisineType());

        if (request.existingManagerId() != null && !request.existingManagerId().isBlank()) {
            return;
        }

        requireNonEmpty("Manager first name", request.managerFirstname());
        requireNonEmpty("Manager last name", request.managerLastname());
        requireNonEmpty("Manager email", request.managerEmail());
        requireNonEmpty("Manager password", request.managerPassword());

        if (!isValidEmail(request.managerEmail())) {
            throw new RuntimeException("Manager email must be a valid email address");
        }
        if (!isStrongPassword(request.managerPassword())) {
            throw new RuntimeException("Password must be at least 8 characters and include letters and numbers");
        }
    }

    private void requireNonEmpty(String fieldName, String value) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(fieldName + " is required");
        }
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    }

    private boolean isStrongPassword(String password) {
        return password != null && password.length() >= 8
                && password.matches(".*[A-Za-z].*")
                && password.matches(".*\\d.*");
    }

    @PostMapping("/managers")
    public ManagerResponse createManager(@RequestBody ManagerRequest request) {
    requireAdminRole();

        requireNonEmpty("First name", request.firstname());
        requireNonEmpty("Last name", request.lastname());
        requireNonEmpty("Email", request.email());
         requireNonEmpty("Password", request.password());

        if (!isValidEmail(request.email())) {
            throw new RuntimeException("Manager email must be a valid email address");
        }

        if (!isStrongPassword(request.password())) {
        throw new RuntimeException(
                "Password must be at least 8 characters and include letters and numbers"
             );
        }

         if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already in use");
         }

        User manager = new User();
        manager.setFirstname(request.firstname());
        manager.setLastname(request.lastname());
        manager.setEmail(request.email());
        manager.setPassword(request.password());
        manager.setRole(RoleConstants.RESTAURANT_MANAGER);

        User saved = userService.createUser(manager);

        return toManagerResponse(saved);
    }

    @PutMapping("/restaurants/{restaurantId}/assign/{managerId}")
    public RestaurantResponse assignManagerToRestaurant(@PathVariable String restaurantId,
                                                        @PathVariable String managerId) {
        requireAdminRole();
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager user not found"));
        if (!RoleConstants.RESTAURANT_MANAGER.equals(manager.getRole())) {
            throw new RuntimeException("User is not a restaurant manager");
        }
        restaurant.setOwner(manager);
        return toRestaurantResponse(restaurantRepository.save(restaurant));
    }

    @GetMapping("/managers")
    public List<ManagerResponse> getAllManagers() {
        requireAdminRole();
        return userRepository.findAll().stream()
                .filter(user -> RoleConstants.RESTAURANT_MANAGER.equals(user.getRole()))
                .map(this::toManagerResponse)
                .collect(Collectors.toList());
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

    private ManagerResponse toManagerResponse(User user) {
        return new ManagerResponse(
                user.getId(),
                user.getFirstname(),
                user.getLastname(),
                user.getEmail(),
                user.getRole()
        );
    }
}
