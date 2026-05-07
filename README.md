# 🍔 QuickBite

QuickBite is a food ordering and delivery system that aims to provide users with a simple and convenient platform for browsing restaurants, viewing menu items, managing carts, and placing food orders online.

---

# 📌 Features

## 🔐 User Authentication
- User Registration
- User Login
- BCrypt Password Encryption
- JWT Authentication
- Protected Routes

## 🍽️ Restaurant & Menu
- View available restaurants
- Browse menu items
- View food details and prices

## 🛒 Cart & Orders
- Add items to cart
- Update quantities
- Remove items
- Place food orders

## 👤 User Profile
- View authenticated user profile
- Logout functionality

---

# 🛠️ Technology Stack

| Layer | Technology |
|------|-------------|
| Frontend | ReactJS |
| Backend | Spring Boot |
| Database | Supabase PostgreSQL |
| Security | Spring Security + JWT |
| ORM | Spring Data JPA |
| Build Tool | Maven |
| API Testing | Postman |

---

# ⚙️ Backend Setup

## Prerequisites
- Java 17
- Maven
- VS Code / IntelliJ
- Supabase Account

## Database Configuration

```properties
spring.datasource.url=jdbc:postgresql://YOUR_HOST:5432/postgres
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driver-class-name=org.postgresql.Driver