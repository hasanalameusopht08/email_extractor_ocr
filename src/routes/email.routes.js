import { protect } from '../middlewares/auth.middleware.js';
import express from 'express';
import * as emailController from '../controllers/email.controller.js';
const router = express.Router();

router.route('/email-queue')
    .post(emailController.registerEmail)
    .delete(emailController.deleteEmail)

export default router;
