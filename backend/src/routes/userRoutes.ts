import { Router } from 'express';
const router = Router();
import { login, register} from '../controllers/userController';
router.post('/register', register);
router.post('/login', login
);

export default router;