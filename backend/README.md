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
- `GET /api/v1/teachers` - Get all teachers (protected)
- `GET /api/v1/teachers/:id` - Get teacher by ID (protected)
- `POST /api/v1/teachers` - Create teacher (admin only)
- `PUT /api/v1/teachers/:id` - Update teacher (admin only)
- `DELETE /api/v1/teachers/:id` - Delete teacher (admin only)
- `GET /api/v1/parents` - Get all parents (protected)
- `GET /api/v1/parents/:id` - Get parent by ID (protected)
- `POST /api/v1/parents` - Create parent (admin only)
- `PUT /api/v1/parents/:id` - Update parent (admin only)
- `DELETE /api/v1/parents/:id` - Delete parent (admin only)
- `GET /api/v1/subjects` - Get all subjects (protected)
- `GET /api/v1/subjects/:id` - Get subject by ID (protected)
- `POST /api/v1/subjects` - Create subject (admin only)
- `PUT /api/v1/subjects/:id` - Update subject (admin only)
- `DELETE /api/v1/subjects/:id` - Delete subject (admin only)
- `GET /api/v1/classes` - Get all classes (protected)
- `GET /api/v1/classes/:id` - Get class by ID (protected)
- `POST /api/v1/classes` - Create class (admin only)
- `PUT /api/v1/classes/:id` - Update class (admin only)
- `DELETE /api/v1/classes/:id` - Delete class (admin only)
- `GET /api/v1/announcements` - Get all announcements (protected)
- `GET /api/v1/announcements/:id` - Get announcement by ID (protected)
- `POST /api/v1/announcements` - Create announcement (admin only)
- `PUT /api/v1/announcements/:id` - Update announcement (admin only)
- `DELETE /api/v1/announcements/:id` - Delete announcement (admin only)