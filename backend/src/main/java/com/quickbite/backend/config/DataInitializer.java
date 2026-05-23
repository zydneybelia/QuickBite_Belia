package com.quickbite.backend.config;

import com.quickbite.backend.model.User;
import com.quickbite.backend.model.Restaurant;
import com.quickbite.backend.repository.UserRepository;
import com.quickbite.backend.repository.RestaurantRepository;
import com.quickbite.backend.security.RoleConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    
    private static final String TEST_USER_EMAIL = "testuser@example.com";
    private static final String TEST_USER_PASSWORD = "Test@1234";
    
    private static final String ADMIN_EMAIL = "admin@gmail.com";
    private static final String ADMIN_PASSWORD = "admin123";
    
    private static final String RESTAURANT_MANAGER_EMAIL = "manager@example.com";
    private static final String RESTAURANT_MANAGER_PASSWORD = "Manager@1234";

    @Bean
    public CommandLineRunner seedTestUser(UserRepository userRepository, PasswordEncoder passwordEncoder, RestaurantRepository restaurantRepository) {
        return args -> {
            // Seed Customer User
            if (!userRepository.existsByEmail(TEST_USER_EMAIL)) {
                User testUser = new User();
                testUser.setFirstname("Test");
                testUser.setLastname("User");
                testUser.setEmail(TEST_USER_EMAIL);
                testUser.setPassword(passwordEncoder.encode(TEST_USER_PASSWORD));
                testUser.setRole("CUSTOMER");
                userRepository.save(testUser);
                logger.info("Seeded customer user: {} / {}", TEST_USER_EMAIL, TEST_USER_PASSWORD);
            } else {
                logger.info("Customer user already exists: {}", TEST_USER_EMAIL);
            }
            
            // Seed Admin User
            if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
                User adminUser = new User();
                adminUser.setFirstname("Admin");
                adminUser.setLastname("");
                adminUser.setEmail(ADMIN_EMAIL);
                adminUser.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                adminUser.setRole(RoleConstants.ADMIN);
                userRepository.save(adminUser);
                logger.info("Seeded admin user: {} / {}", ADMIN_EMAIL, ADMIN_PASSWORD);
            } else {
                logger.info("Admin user already exists: {}", ADMIN_EMAIL);
            }
            
            // Seed Restaurant Manager User
            if (!userRepository.existsByEmail(RESTAURANT_MANAGER_EMAIL)) {
                User managerUser = new User();
                managerUser.setFirstname("Restaurant");
                managerUser.setLastname("Manager");
                managerUser.setEmail(RESTAURANT_MANAGER_EMAIL);
                managerUser.setPassword(passwordEncoder.encode(RESTAURANT_MANAGER_PASSWORD));
                managerUser.setRole(RoleConstants.RESTAURANT_MANAGER);
                userRepository.save(managerUser);
                logger.info("Seeded restaurant manager user: {} / {}", RESTAURANT_MANAGER_EMAIL, RESTAURANT_MANAGER_PASSWORD);
            } else {
                logger.info("Restaurant manager user already exists: {}", RESTAURANT_MANAGER_EMAIL);
            }

            // Ensure manager has an assigned restaurant for development convenience
            userRepository.findByEmail(RESTAURANT_MANAGER_EMAIL).ifPresent(manager -> {
                if (restaurantRepository.findByOwnerId(manager.getId()).isEmpty()) {
                    Restaurant sample = new Restaurant();
                    sample.setName("Seeded Manager's Diner");
                    sample.setDescription("Sample restaurant assigned to seeded manager");
                    sample.setLocation("123 Demo St");
                    sample.setContactNumber("+1-555-0100");
                    sample.setCuisineType("International");
                    sample.setStatus("active");
                    sample.setOwner(manager);
                    restaurantRepository.save(sample);
                    logger.info("Seeded restaurant for manager {}: {}", RESTAURANT_MANAGER_EMAIL, sample.getName());
                } else {
                    logger.info("Manager {} already has a restaurant assigned", RESTAURANT_MANAGER_EMAIL);
                }
            });
        };
    }
}
