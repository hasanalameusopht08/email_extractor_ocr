import express from 'express';
const router = express.Router();

router.route('/')
    .post((req, res) => {
        console.log(`[Callback Route] Received callback: ${JSON.stringify(req.body)}`);
        res.status(200).json({ success: true, message: 'Callback received successfully' });
    });

export default router;
