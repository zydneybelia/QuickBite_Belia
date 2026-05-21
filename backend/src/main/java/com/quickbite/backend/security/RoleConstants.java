package com.quickbite.backend.security;

public final class RoleConstants {

    public static final String ADMIN = "ADMIN";
    public static final String RESTAURANT_MANAGER = "RESTAURANT_MANAGER";
    public static final String CUSTOMER = "CUSTOMER";

    private RoleConstants() {}

    public static String toAuthority(String role) {
        return role != null && role.startsWith("ROLE_") ? role : "ROLE_" + role;
    }
}
