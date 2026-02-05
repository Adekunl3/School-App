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

## Authentication

The API uses JWT for authentication with role-based access control (RBAC). Include the token in the Authorization header as `Bearer <token>`.

### Login Credentials (Demo)

- **Admin**: username: `admin`, password: `admin123`
- **Teacher**: username: `teacher`, password: `teacher123`
- **Parent**: username: `parent`, password: `parent123`
- **Student**: username: `student`, password: `student123`

For refresh token, use `POST /api/v1/Login/refresh`.

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
- `GET /api/v1/assignments` - Get all assignments (protected)
- `GET /api/v1/assignments/:id` - Get assignment by ID (protected)
- `POST /api/v1/assignments` - Create assignment (admin only)
- `PUT /api/v1/assignments/:id` - Update assignment (admin only)
- `DELETE /api/v1/assignments/:id` - Delete assignment (admin only)
- `GET /api/v1/events` - Get all events (protected)
- `GET /api/v1/events/:id` - Get event by ID (protected)
- `POST /api/v1/events` - Create event (admin only)
- `PUT /api/v1/events/:id` - Update event (admin only)
- `DELETE /api/v1/events/:id` - Delete event (admin only)
- `GET /api/v1/exams` - Get all exams (protected)
- `GET /api/v1/exams/:id` - Get exam by ID (protected)
- `POST /api/v1/exams` - Create exam (admin only)
- `PUT /api/v1/exams/:id` - Update exam (admin only)
- `DELETE /api/v1/exams/:id` - Delete exam (admin only)
- `GET /api/v1/lessons` - Get all lessons (protected)
- `GET /api/v1/lessons/:id` - Get lesson by ID (protected)
- `POST /api/v1/lessons` - Create lesson (admin only)
- `PUT /api/v1/lessons/:id` - Update lesson (admin only)
- `DELETE /api/v1/lessons/:id` - Delete lesson (admin only)
- `GET /api/v1/results` - Get all results (protected)
- `GET /api/v1/results/:id` - Get result by ID (protected)
- `POST /api/v1/results` - Create result (admin only)
- `PUT /api/v1/results/:id` - Update result (admin only)
- `DELETE /api/v1/results/:id` - Delete result (admin only)