package com.quickbite.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    private Boolean revoked = false; // ✅ ADD THIS

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onCreate() {
        this.expiryDate = LocalDateTime.now().plusDays(7);
        this.revoked = false; // optional but safe
    }

    // Constructors
    public RefreshToken() {}

    public RefreshToken(String token, User user) {
        this.token = token;
        this.user = user;
        this.revoked = false;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }

    public Boolean getRevoked() { return revoked; } // ✅ ADD THIS
    public void setRevoked(Boolean revoked) { this.revoked = revoked; } // ✅ ADD THIS

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}