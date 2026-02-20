import express from 'express';
import { getAllUsers } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getAllUsers)

export default router;
