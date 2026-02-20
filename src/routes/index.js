import express from 'express';
import userRoutes from './user.routes.js';
import emailRoutes from './email.routes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/register', emailRoutes);

export default router;
