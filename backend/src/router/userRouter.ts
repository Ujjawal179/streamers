import { Router } from 'express';
import { login, register, verifyEmail } from '../controllers/userController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail); // Changed to use params instead of query

export default router;
