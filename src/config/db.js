import mysql from 'mysql2/promise';
import config from './index.js';
import logger from '../utils/logger.js';

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info(`MySQL Connected: ${config.db.database}`);
    connection.release();
  } catch (error) {
    logger.error(`MySQL Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export { pool };
export default connectDB;
