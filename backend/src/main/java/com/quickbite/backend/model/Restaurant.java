package com.quickbite.backend.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "restaurants")
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;                          // ✅ String not Long

    @Column(nullable = false)
    private String name;

    private String description;                 // ✅ matches ERD

    private String location;                    // ✅ renamed from address (matches ERD)

    @Column(nullable = false)
    private String status = "active";           // ✅ active/inactive (matches ERD)

    // Many-to-One: Multiple restaurants belong to one user/owner
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // One-to-Many: One restaurant can have multiple menu items
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MenuItem> menuItems;

    // Constructors
    public Restaurant() {}

    public Restaurant(String name, String description, String location, User owner) {
        this.name = name;
        this.description = description;
        this.location = location;
        this.owner = owner;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public List<MenuItem> getMenuItems() { return menuItems; }
    public void setMenuItems(List<MenuItem> menuItems) { this.menuItems = menuItems; }
}