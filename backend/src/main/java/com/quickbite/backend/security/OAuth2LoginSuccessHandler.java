package com.quickbite.backend.security;

import com.quickbite.backend.model.User;
import com.quickbite.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public OAuth2LoginSuccessHandler(JwtTokenProvider jwtTokenProvider,
                                     UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null) {
            response.sendRedirect("http://localhost:3000/login?error=no_email");
            return;
        }

        // Split name safely
        String firstname = "";
        String lastname = "";

        if (name != null && !name.isBlank()) {
            String[] parts = name.trim().split(" ", 2);
            firstname = parts[0];
            lastname = parts.length > 1 ? parts[1] : "";
        }

        final String fName = firstname;
        final String lName = lastname;

        // Find or create user
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setFirstname(fName);
                    newUser.setLastname(lName);
                    // Set a placeholder for OAuth2 users to satisfy DB constraints
                    newUser.setPassword("OAUTH2_USER_" + java.util.UUID.randomUUID().toString());
                    newUser.setRole("CUSTOMER");
                    return userRepository.save(newUser);
                });

        // Generate JWT (FIXED 4-PARAM METHOD)
        String token = jwtTokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                user.getEmail(),
                user.getRole()
        );

        // Redirect back to login page with JWT token in query string
        String redirectUrl = "http://localhost:3000/login?token=" + token;

        response.sendRedirect(redirectUrl);
    }
}