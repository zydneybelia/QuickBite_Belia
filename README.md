# 🍔 QuickBite

QuickBite is a food ordering and delivery system developed for the System Integration and Architecture course.

It provides a simple platform for:
- Browsing restaurants
- Viewing menus
- Managing cart
- Placing food orders


---

## ⚙️ Features

## 🔐 User Authentication
- User Registration
- User Login
- BCrypt Password Encryption
- JWT Authentication
- Protected Routes

## 🍽️ Restaurant & Menu
- View restaurants
- Browse menu items
- View food details & prices

## 🛒 Cart & Orders
- Add items to cart
- Update quantities
- Remove items
- Place orders

## 👤 User Profile
- View profile
- Logout

---

# 🛠️ Tech Stack


### Prerequisites
- Java 17  
- Maven  
- VS Code / IntelliJ IDEA  
- Supabase account  

---
# ⚙️ Backend Setup

## Prerequisites
- Java 17
- Maven
- Supabase Account

## Database Config (`application.properties`)
```properties
spring.datasource.url=jdbc:postgresql://YOUR_HOST:5432/postgres
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
>>>>>>> fc03c35 (modified README)
spring.datasource.driver-class-name=org.postgresql.Driver