import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

export const storeEmail = async (callback, host, port, user, password, tls, ssl) => {
    try {
        const [result] = await pool.execute(
            `INSERT INTO email_accounts 
            (account_id, callback_url, host, port, user, password, tls, \`ssl\`) 
            VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
            [
                callback,
                host,
                port,
                user,
                password,
                tls ? 1 : 0,
                ssl ? 1 : 0
            ]
        );

        return result;

    } catch (error) {
        logger.error(`Error in storeEmail: ${error.message}`);
        throw error;
    }
};

export const getUserByEmail = async (email, callback) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM email_accounts WHERE status = "ACTIVE" AND user = ? AND callback_url = ?', [email, callback]);
        return rows;
    } catch (error) {
        logger.error(`Error in getUserByEmail: ${error.message}`);
        throw error;
    }
};

export const updateEmailAccountStatusToInactive = async (email, callback) => {
    try {
        const [result] = await pool.execute('UPDATE email_accounts SET status = "INACTIVE" WHERE user = ? AND callback_url = ?', [email, callback]);
        return result;
    } catch (error) {
        logger.error(`Error in updateEmailAccountStatusToInactive: ${error.message}`);
        throw error;
    }
};

export const getEmailAccountsForSync = async () => {
    try {
        const [rows] = await pool.execute('SELECT * FROM email_accounts WHERE status = "ACTIVE"');
        return rows;
    } catch (error) {
        logger.error(`Error in getEmailAccountsForSync: ${error.message}`);
        throw error;
    }
};