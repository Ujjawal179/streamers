import { Router } from 'express';
const router = Router();
import { login, register,verifyEmail} from '../controllers/userController';
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);

;

export default router;