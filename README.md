QuickBite 🍔🚀

QuickBite is a food ordering and delivery system developed for the System Integration and Architecture course. The project aims to provide users with a simple and convenient platform for browsing restaurants, viewing menu items, managing carts, and placing food orders online.

The system follows a modern full-stack architecture using:

Frontend: ReactJS
Backend: Spring Boot
Database: Supabase PostgreSQL
Authentication: JWT + Spring Security

📌 Features
User Authentication
User Registration
User Login
Secure Password Encryption using BCrypt

JWT Authentication
Protected Routes
Restaurant & Menu
View available restaurants
Browse restaurant menu items
View food details and prices

Cart & Orders
Add items to cart
Update item quantities
Remove items from cart
Place food orders
User Profile
View authenticated user profile
Logout functionality

🛠️ Technology Stack
Layer	Technology
Frontend	ReactJS
Backend	Spring Boot 3
Database	Supabase PostgreSQL
Security	Spring Security + JWT
ORM	Spring Data JPA
Build Tool	Maven
API Testing	Postman

⚙️ Backend Setup (Spring Boot)
Prerequisites
Java 17
Maven
VS Code / IntelliJ
Supabase Account
Configure Database

Update application.properties:

# Database Configuration
spring.datasource.url=jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
spring.datasource.username=postgres.htapczsxcdljzpelmmgk
spring.datasource.password=Zyd09286061150
spring.datasource.driver-class-name=org.postgresql.Driver
