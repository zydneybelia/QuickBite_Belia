# QuickBite Setup Guide

## Quick Start

### Step 1: Setup MySQL Database

#### On Windows:
```sql
-- Open MySQL Workbench or MySQL Command Line Client
CREATE DATABASE quickbite;
CREATE USER 'quickbite_user'@'localhost' IDENTIFIED BY 'quickbite_password';
GRANT ALL PRIVILEGES ON quickbite.* TO 'quickbite_user'@'localhost';
FLUSH PRIVILEGES;
```

#### On macOS/Linux:
```bash
mysql -u root -p
# Enter your root password when prompted

# Then in MySQL prompt:
CREATE DATABASE quickbite;
CREATE USER 'quickbite_user'@'localhost' IDENTIFIED BY 'quickbite_password';
GRANT ALL PRIVILEGES ON quickbite.* TO 'quickbite_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2: Update Database Configuration

Edit `backend/backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/quickbite
spring.datasource.username=quickbite_user
spring.datasource.password=quickbite_password
```

### Step 3: Build and Run Backend

```bash
# Navigate to backend directory
cd backend/backend

# Clean build
mvn clean install -DskipTests

# Run the application
mvn spring-boot:run
```

The backend will start at `http://localhost:8080`

### Step 4: Access Web Interface

Open your browser and go to:
```
http://localhost:8080
```

## Creating Your First Data

### 1. Create a User
- Go to the "Users" tab
- Fill in Email, Username, and Password
- Click "Create User"

### 2. Create an Order
- Go to the "Orders" tab
- Enter the User ID (from step 1)
- Set Status to "pending"
- Enter Total Price (e.g., 25.99)
- Click "Create Order"

### 3. Create a Restaurant
- Go to the "Restaurants" tab
- Enter the Owner ID (same as User ID)
- Fill in Restaurant Name, Address, Phone, and Cuisine
- Click "Create Restaurant"

### 4. Create a Cart
- Go to the "Carts" tab
- Enter the User ID
- Set Item Count (e.g., 3)
- Set Total Amount (e.g., 45.50)
- Click "Create Cart"

### 5. Create a Refresh Token
- Go to the "Tokens" tab
- Enter the User ID
- Generate a Token (can be any random string)
- Set Expiry Date (e.g., 7 days from now)
- Click "Create Token"

## Testing API Endpoints

### Using cURL

#### Test User Creation:
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "username":"testuser",
    "password":"password123"
  }'
```

#### Get All Users:
```bash
curl http://localhost:8080/api/users
```

#### Create Order:
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "status":"pending",
    "totalPrice":29.99,
    "user":{"id":1}
  }'
```

#### Get Orders by User:
```bash
curl http://localhost:8080/api/orders/user/1
```

### Using Postman

1. Download and install [Postman](https://www.postman.com/downloads/)
2. Import the collection from the project (if available)
3. Set requests to `http://localhost:8080/api/[endpoint]`
4. Add request body as JSON for POST/PUT requests

## Environment Configuration

### Development Settings
Create `application-dev.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/quickbite_dev
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
logging.level.root=DEBUG
```

Run with:
```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

### Production Settings
Create `application-prod.properties`:
```properties
spring.datasource.url=jdbc:mysql://prod-server:3306/quickbite
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
logging.level.root=WARN
```

## Docker Setup (Optional)

### Docker Compose for MySQL
Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: quickbite
      MYSQL_USER: quickbite_user
      MYSQL_PASSWORD: quickbite_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Run with:
```bash
docker-compose up -d
```

## Troubleshooting

### Error: Unable to connect to database
- Check MySQL is running: `mysql -u root -p`
- Verify database exists: `SHOW DATABASES;`
- Check credentials in `application.properties`

### Error: Port 8080 already in use
Change port in `application.properties`:
```properties
server.port=8081
```

### Error: Table doesn't exist
- Check Hibernate DDL setting: `spring.jpa.hibernate.ddl-auto=update`
- Restart the application to auto-create tables

### CORS Issues
If web interface can't connect to API:
- Ensure backend is running on same port
- Check browser console for CORS errors
- Verify API URLs in `script.js`

### Web Interface Not Loading
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Check browser console (F12) for JavaScript errors
- Verify static files are in `src/main/resources/static/`

## IDE Setup

### IntelliJ IDEA
1. Open project
2. File → Project Structure → Project
3. Set Project SDK to Java 17+
4. Maven should auto-detect
5. Right-click pom.xml → Run Maven → Generate Sources and Update Folders

### VS Code
1. Install "Extension Pack for Java" (Microsoft)
2. Open project folder
3. Allow Maven to sync dependencies
4. Create run configuration in `.vscode/launch.json`

## Next Steps

After setup is complete:
1. Explore all tabs in the web interface
2. Create sample data to test relationships
3. Make API calls using cURL or Postman
4. Review the README.md for complete documentation
5. Check the code structure to understand the implementation

## Advanced Features

### Custom Queries
Add custom query methods to repositories:

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByEmailContaining(String email);
    User findByUsernameIgnoreCase(String username);
}
```

### Service Layer
Create service classes for business logic:

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    public User createUserWithCart(User user) {
        User savedUser = userRepository.save(user);
        // Create associated cart
        return savedUser;
    }
}
```

## Performance Optimization

### Database Indexing
Add indexes for frequently queried fields:
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_user_id ON orders(user_id);
CREATE INDEX idx_restaurant_owner_id ON restaurants(owner_id);
```

### Query Optimization
Use `@EntityGraph` for eager loading:
```java
@EntityGraph(attributePaths = {"orders", "restaurants", "cart"})
List<User> findAll();
```

## Support & Resources

- Spring Boot Documentation: https://spring.io/projects/spring-boot
- Spring Data JPA: https://spring.io/projects/spring-data-jpa
- MySQL Documentation: https://dev.mysql.com/doc/
- REST API Best Practices: https://restfulapi.net/

---
Last Updated: May 5, 2026
