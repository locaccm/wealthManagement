# 🏠 Wealth Management

## Overview

The **Wealth Management Microservice** is a dedicated backend service for managing accommodations in a property rental platform. It allows authenticated **OWNER** users to create, update, delete, and retrieve housing listings. This microservice is designed to integrate within a broader microservices architecture and supports **JWT authentication** and **Cloud SQL**.

## ✨ Features

- **Create Accommodation**: Register a new housing listing with complete details
- **Read Accommodation(s)**: Retrieve user-specific housing, with optional filtering (e.g., availability)
- **Update Accommodation**: Edit key details of existing housing (address, name, description, etc.)
- **Delete Accommodation**: Fully remove a housing listing and related data
- **Authorization**: Only users with the `OWNER` role can perform actions
- **Swagger API Documentation**: Explore and test endpoints via Swagger UI
- **Token Verification**: Verifies JWT token via an external authentication microservice
- **Test Coverage > 80%**: All routes and edge cases are unit tested

## 🧱 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)

## ⚙️ Installation

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (local or Cloud SQL instance)
- Prisma ORM
- Docker (optional for containerization)

### Steps

Clone the repository:

```bash
git clone https://github.com/your-org/accommodation-microservice.git
cd accommodation-microservice
````

Install dependencies:

```bash
npm install
```

Generate Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Start the development server:

```bash
npm run dev
```

## ⚙️ Configuration

Create a `.env` file at the root of the project with the following variables:

```dotenv
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"

# External auth microservice
AUTH_SERVICE_URL="http://localhost:3001"
```

| Variable           | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string used by Prisma               |
| `AUTH_SERVICE_URL` | URL of the authentication microservice for JWT validation |

## 🧪 Usage

### Base URL

```http
http://localhost:3000
```

### Headers (for protected routes)

```http
Authorization: Bearer <JWT_token>
user-id: <OWNER_user_id>
```

### Available Routes

| Method | Endpoint                     | Description                       |
| ------ | ---------------------------- | --------------------------------- |
| POST   | `/accommodations/create`     | Create new accommodation          |
| GET    | `/accommodations/read`       | Get accommodations (with filters) |
| PUT    | `/accommodations/update/:id` | Update accommodation info         |
| DELETE | `/accommodations/delete/:id` | Delete accommodation and related  |

#### 📝 Example Request

```json
POST /accommodations/create
Content-Type: application/json

{
  "ACCC_NAME": "Villa Soleil",
  "ACCC_TYPE": "House",
  "ACCC_ADDRESS": "123 Beach Road",
  "ACCC_DESC": "A sunny seaside villa",
  "ACCB_AVAILABLE": true,
  "USEN_ID": 2
}
```

## 📄 API Documentation

Once the server is running, access the Swagger UI:

```
http://localhost:3000/api-docs
```

You can interact with all routes, inspect schemas, and test queries directly from the interface.

Swagger is defined in `swagger.yaml`.

## ✅ Testing

All endpoints are tested using **Jest**.

To run the test suite and see the coverage:

```bash
npm run test
```

Minimum coverage required: **80%**

> Note: Coverage is checked in CI and must be maintained to pass pipeline validations.

## 🐳 Docker Support

Build and run the Docker container:

```bash
docker build -t accommodation-service .
docker run -p 3000:3000 accommodation-service
```

## 🤝 Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: [ACC-123] Add something cool'`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a pull request

### 🧹 Coding Standards

* Use `ESLint` rules from `.eslintrc`
* Add tests for all new routes or logic
* Update Swagger documentation if applicable

## 👥 Acknowledgments

* Project carried out in the context of the **CCM Master (1st year)**
* Backend lead: \[Karmaaxel]
* Part of a multi-microservice system with separate services for authentication, frontend, and document management and many others.