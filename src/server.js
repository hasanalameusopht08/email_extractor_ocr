import app from './app.js';
import config from './config/index.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { startEmailCron } from './cron/emailCron.js';
import { startEmailWorker } from './workers/emailWorker.js';
import { startOCRWorker } from './workers/ocrWorker.js';
import { startCallbackWorker } from './workers/callbackWorker.js';

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        // Initialize RabbitMQ components
        logger.info("Initializing RabbitMQ Workers and Cron...");
        await startEmailCron();
        await startEmailWorker();
        await startOCRWorker();
        await startCallbackWorker();

        const PORT = config.port;

        app.listen(PORT, () => {
            logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
