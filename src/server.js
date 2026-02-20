import app from './app.js';
import config from './config/index.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

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
