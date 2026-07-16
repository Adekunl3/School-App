import express from 'express';
import { login, refreshToken } from '../controllers/authController.js';

const router = express.Router();

// Login
router.post('/login', login);

// Refresh Token
router.post('/refresh', refreshToken);

export default router;