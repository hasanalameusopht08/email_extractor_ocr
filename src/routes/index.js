import express from 'express';
import userRoutes from './user.routes.js';
import emailRoutes from './email.routes.js';
import callBackRoutes from './callback.test.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/register', emailRoutes);
router.use('/callback', callBackRoutes);

export default router;
