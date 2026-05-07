# 🍔 QuickBite

QuickBite is a food ordering and delivery system designed to provide users with a simple and convenient platform for browsing restaurants, viewing menu items, managing carts, and placing food orders online.

The system follows a modern full-stack architecture:

- **Frontend:** ReactJS  
- **Backend:** Spring Boot  
- **Database:** Supabase PostgreSQL  
- **Security:** Spring Security + JWT  
- **ORM:** Spring Data JPA  
- **Build Tool:** Maven  
- **API Testing:** Postman  

---

## ⚙️ Features

### 🛒 Cart & Orders
- Add items to cart  
- Update item quantities  
- Remove items from cart  
- Place food orders  

### 👤 User Profile
- View authenticated user profile  
- Logout functionality  

---

## 🛠️ Backend Setup (Spring Boot)

### Prerequisites
- Java 17  
- Maven  
- VS Code / IntelliJ IDEA  
- Supabase account  

---

### Configure Database

Update `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
spring.datasource.username=postgres.htapczsxcdljzpelmmgk
spring.datasource.password=YOUR_PASSWORD_HERE
spring.datasource.driver-class-name=org.postgresql.Driver