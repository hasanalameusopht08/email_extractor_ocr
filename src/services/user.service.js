import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

export const getUsers = async () => {
    try {
        const [rows] = await pool.execute('SELECT id, name, email, role, createdAt, updatedAt FROM users');
        return rows;
    } catch (error) {
        logger.error(`Error in getUsers: ${error.message}`);
        throw error;
    }
};
