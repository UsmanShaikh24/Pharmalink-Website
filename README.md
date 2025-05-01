<p align="left" style="font-size:30px;">
  <img src="https://i.postimg.cc/FRNv1Mdn/favicon-32x32.png" alt="PharmLink Logo" width="32" height="32">
  <strong>PharmLink - Connecting Patients with Local Pharmacies</strong>
</p>



## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Dependencies](#dependencies)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## 🔍 Overview

PharmLink is a comprehensive platform that connects patients with local pharmacies, enabling seamless medicine ordering, delivery tracking, and medication management. The application serves three main user types:

1. **Patients/Users**: Search for medicines, place orders, track deliveries, and manage personal medical information
2. **Pharmacies**: Manage inventory, process orders, handle deliveries, and track business metrics
3. **Administrators**: Monitor system usage, manage users and pharmacies, and oversee platform operations

With our AI-powered recommendation system, users can receive tailored medicine suggestions based on symptoms, making healthcare more accessible and convenient.

## ✨ Features

### For Users
- **User Authentication**: Secure signup, login, and account management
- **Medicine Search**: Find medicines by name, category, or symptoms
- **Pharmacy Discovery**: Locate nearby pharmacies based on geolocation
- **Order Management**: Place, track, and manage medicine orders
- **Prescription Management**: Upload and store prescriptions digitally
- **AI Recommendations**: Get personalized medicine recommendations based on symptoms
- **Order History**: View past orders and reorder with one click
- **Delivery Options**: Choose between pickup and delivery with real-time tracking
- **Shopping Cart**: Add multiple medicines to cart and checkout

### For Pharmacies
- **Inventory Management**: Add, update, and track medicine inventory
- **Order Processing**: Manage incoming orders with status updates
- **Low Stock Alerts**: Get notified when medicine stocks run low
- **Expiration Tracking**: Monitor medicine expiration dates
- **Business Analytics**: View sales data, popular products, and revenue reports
- **Delivery Management**: Track delivery personnel and delivery status

### For Administrators
- **User Management**: Monitor and manage all user accounts
- **Pharmacy Verification**: Verify pharmacies and review documentation
- **System Monitoring**: Track application usage and performance
- **Content Management**: Update system-wide content like medicine categories
- **Report Generation**: Generate and export system reports
- **Medicine Management**: Oversee medicine inventory across all pharmacies
- **Order Management**: Track and manage all orders in the system

## 🛠️ Technology Stack

### Frontend
- **React.js**: Frontend JavaScript library (v18.2.0)
- **Material-UI**: Component library for consistent UI (v5.15.10)
- **React Query**: Data fetching and state management (v5.17.19)
- **Axios**: HTTP client for API requests (v1.6.7)
- **React Router**: Client-side routing (v6.22.0)
- **Vite**: Build tool and development server (v5.1.0)
- **Google Maps API**: For location-based services

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework (v4.18.2)
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB (v7.6.3)
- **JWT**: Authentication with jsonwebtoken (v9.0.2)
- **Express Validator**: Input validation (v7.0.1)
- **Bcrypt**: Password hashing (v2.4.3)
- **Multer**: File upload handling (v1.4.5-lts.1)
- **Socket.io**: Real-time communication (v4.7.2)
- **Nodemailer**: Email service integration (v6.9.7)
- **Geolib**: Location-based calculations (v3.3.3)

### DevOps
- **Git**: Version control
- **Jest**: Testing framework (v29.7.0)
- **ESLint**: Code linting (v8.56.0)
- **Prettier**: Code formatting
- **Docker**: Containerization
- **MongoDB Atlas**: Database hosting

## 📦 Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.15.10",
    "@mui/material": "^5.15.10",
    "@mui/x-data-grid": "^8.0.0",
    "@react-google-maps/api": "^2.20.6",
    "@tanstack/react-query": "^5.17.19",
    "axios": "^1.6.7",
    "date-fns": "^4.1.0",
    "lodash": "^4.17.21",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.5.2",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vite": "^5.1.0"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "geolib": "^3.3.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.6.3",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.7",
    "socket.io": "^4.7.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.1"
  }
}
```

## 📂 Project Structure

### Actual Directory Structure

```
pharmalink/
├── pharmalink-backend/
│   ├── controllers/
│   │   ├── medicineController.js
│   │   ├── orderController.js
│   │   └── recommendationController.js
│   ├── middleware/
│   ├── models/
│   │   ├── Medicine.js
│   │   ├── Order.js
│   │   ├── Pharmacy.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── medicineRoutes.js
│   │   ├── orders.js
│   │   ├── pharmacies.js
│   │   ├── recommendationRoutes.js
│   │   └── users.js
│   ├── scripts/
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   ├── .env
│   └── package.json
└── pharmalink-frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── RecommendationSystem.jsx
    │   ├── contexts/
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── MedicineManagement.jsx
    │   │   │   ├── OrderManagement.jsx
    │   │   │   └── PharmacyManagement.jsx
    │   │   ├── AdminLogin.jsx
    │   │   ├── Cart.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Orders.jsx
    │   │   ├── Profile.jsx
    │   │   ├── Register.jsx
    │   │   └── Search.jsx
    │   ├── utils/
    │   ├── App.css
    │   ├── App.jsx
    │   ├── index.css
    │   ├── main.jsx
    │   └── theme.js
    ├── .env
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🚀 Installation

### Prerequisites
- Node.js (v14.x or higher)
- npm (v7.x or higher)
- MongoDB (v4.4 or higher)

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/pharmalink.git
   cd pharmalink
   ```

2. Install backend dependencies
   ```bash
   cd pharmalink-backend
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
   
   Required environment variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pharmalink
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

### 4. Start the Backend Server and Seed Initial Data

1. **Start the backend server:**
   ```bash
   npm start
   ```

2. **Seed the initial data:**

   - To create the default admin user, run:
     ```bash
     node scripts/createAdmin.js
     ```

   - To populate the database with initial data, run:
     ```bash
     node scripts/seeder.js
     ```



### Frontend Setup
1. Install frontend dependencies
   ```bash
   cd ../pharmalink-frontend
   npm install
   ```

2. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
   
   Required environment variables:
   ```
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

3. Start the frontend development server
   ```bash
   npm run dev
   ```
   
4. Open your browser and navigate to `http://localhost:5173`

## 📱 Usage

### Default Admin Credentials
```
Email: admin@pharmalink.com
Password: admin123
```

### User Workflow
1. Register or log in to your account
2. Search for medicines or browse nearby pharmacies
3. View medicine details, pricing, and availability
4. Add items to cart and proceed to checkout
5. Choose delivery options and payment method
6. Track order status and delivery

### Pharmacy Workflow
1. Log in to the pharmacy dashboard
2. Manage inventory (add/update medicines)
3. Process incoming orders
4. Update order status as they progress
5. Manage delivery assignments
6. View business analytics

### Admin Workflow
1. Log in to the admin dashboard using default credentials
2. Monitor user and pharmacy registrations
3. Verify new pharmacies
4. View system analytics
5. Manage system-wide settings

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and receive JWT token
- `POST /api/auth/forgot-password`: Reset password flow
- `GET /api/auth/profile`: Get authenticated user profile

### Medicine Endpoints
- `GET /api/medicines`: Get all medicines with filtering options
- `GET /api/medicines/:id`: Get specific medicine details
- `POST /api/medicines`: Add new medicine (pharmacy/admin)
- `PUT /api/medicines/:id`: Update medicine details
- `DELETE /api/medicines/:id`: Delete a medicine
- `GET /api/medicines/suggestions`: Get medicine name suggestions
- `GET /api/medicines/low-stock`: Get low stock medicines
- `GET /api/medicines/expiring`: Get expiring medicines

### Order Endpoints
- `POST /api/orders`: Create a new order
- `GET /api/orders`: Get user orders or all orders (admin)
- `GET /api/orders/:id`: Get order details
- `PATCH /api/orders/:id/status`: Update order status

### Pharmacy Endpoints
- `GET /api/pharmacies`: Get all pharmacies
- `GET /api/pharmacies/:id`: Get pharmacy details
- `POST /api/pharmacies`: Register a new pharmacy
- `PUT /api/pharmacies/:id`: Update pharmacy details
- `DELETE /api/pharmacies/:id`: Delete a pharmacy
- `GET /api/pharmacies/nearby`: Find nearby pharmacies

### User Endpoints
- `GET /api/users`: Get all users (admin only)
- `GET /api/users/:id`: Get user by ID
- `PUT /api/users/:id`: Update user profile
- `DELETE /api/users/:id`: Delete user (admin only)

### Recommendation Endpoints
- `POST /api/recommendations/medicines`: Get medicine recommendations
- `GET /api/recommendations/health-tips`: Get health tips

## 🏗️ Architecture

### Database Schema
The application uses MongoDB with the following main collections:
- **Users**: User account information
- **Pharmacies**: Pharmacy details and settings
- **Medicines**: Medicine inventory information
- **Orders**: Order details and status

### Key Models

#### User Model
- Authentication information (email, password)
- Personal details (name, address, phone)
- Order history
- Role-based access control (user, pharmacy, admin)

#### Medicine Model
- Basic details (name, generic name, manufacturer)
- Inventory information (stock, price, expiry)
- Categorization (category, dosage form)
- Pharmacy association

#### Order Model
- Order items and quantities
- Status tracking
- Delivery information
- Payment details
- User and Pharmacy references

#### Pharmacy Model
- Business information
- Location data
- Operating hours
- Contact details
- Medicine inventory references

### Authentication Flow
- JWT-based authentication
- Token expiration and refresh mechanisms
- Role-based access control for different user types

### Data Flow
1. Client makes API request with authentication token
2. Backend validates token and permissions
3. Controller processes the request
4. Database operations are performed
5. Response is sent back to client

## 🤝 Contributing

We welcome contributions to the PharmLink project! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Follow ES6+ JavaScript conventions
- Use proper JSDoc comments for functions
- Follow the existing code style
- Write tests for new features

## <img src="https://i.postimg.cc/FRNv1Mdn/favicon-32x32.png" alt="PharmLink Logo" width="32" height="32"> PharmLink Team 

- 👨‍💻 Member 1 — Usman Shaikh
- 👩‍💻 Member 2 — Rushikesh More
- 👨‍🔬 Member 3 — Aditya Parade
- 👨‍💼 Member 4 — Tushar Patil
---

Developed with ❤️ by the PharmLink Team 
