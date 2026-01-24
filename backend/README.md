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

- `GET /` - Welcome message
- `GET /api/test` - Test API

## Authentication

The API uses JWT for authentication. Include the token in the Authorization header as `Bearer <token>`.

For refresh token, use `POST /Login/RefreshToken`.