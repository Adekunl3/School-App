# School App Backend

This is the backend for the School App, built with Express.js.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret_here
   REFRESH_SECRET=your_refresh_secret_here
   ```

3. Run the server:
   ```
   npm start
   ```

   For development:
   ```
   npm run dev
   ```

## API Endpoints

All endpoints are prefixed with `/api/v1/`.

- `GET /api/v1/` - Welcome message
- `GET /api/v1/health` - Health check
- `GET /api/v1/test` - Test API
- `POST /api/v1/Login/login` - User login
- `POST /api/v1/Login/refresh` - Refresh access token
- `GET /api/v1/students` - Get all students (protected)
- `GET /api/v1/students/:id` - Get student by ID (protected)
- `POST /api/v1/students` - Create student (admin only)
- `PUT /api/v1/students/:id` - Update student (admin only)
- `DELETE /api/v1/students/:id` - Delete student (admin only)