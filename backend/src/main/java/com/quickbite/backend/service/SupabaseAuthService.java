package com.quickbite.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class SupabaseAuthService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void validateCustomerToken(String jwt) {
        if (!StringUtils.hasText(jwt)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authorization token");
        }

        String url = supabaseUrl + "/auth/v1/user";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwt);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, Map.class);
            Map<String, Object> userPayload = response.getBody();
            if (userPayload == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unable to validate Supabase token");
            }

            String role = extractRole(userPayload);
            if (!"CUSTOMER".equalsIgnoreCase(role)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not authorized as CUSTOMER");
            }
        } catch (HttpClientErrorException.Unauthorized ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Supabase token", ex);
        }
    }

    private String extractRole(Map<String, Object> userPayload) {
        Object roleValue = userPayload.get("role");
        if (roleValue instanceof String) {
            return (String) roleValue;
        }

        Object appMetadata = userPayload.get("app_metadata");
        if (appMetadata instanceof Map) {
            Object nestedRole = ((Map<?, ?>) appMetadata).get("role");
            if (nestedRole instanceof String) {
                return (String) nestedRole;
            }
        }

        Object userMetadata = userPayload.get("user_metadata");
        if (userMetadata instanceof Map) {
            Object nestedRole = ((Map<?, ?>) userMetadata).get("role");
            if (nestedRole instanceof String) {
                return (String) nestedRole;
            }
        }

        return null;
    }
}
