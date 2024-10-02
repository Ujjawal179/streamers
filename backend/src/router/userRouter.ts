
import { Router } from 'express';
const router = Router();



import { testUser } from '../controllers/userController';
//userRouter youtber 


router.get('/', testUser)


export default router;
