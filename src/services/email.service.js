import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import logger from '../utils/logger.js';
import { pool } from '../config/db.js';

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


/**
 * Fetch unread emails and return attachments for OCR processing
 * @param {Object} emailConfig
 *  - host, port, user, password, tls, ssl
 * @param {number|string} accountId - for logging / identification
 * @param {number} maxEmails - max emails to process per run
 * @returns {Promise<Array>} - attachments [{ name, data: Buffer }]
 */
export const fetchUnreadEmails = async (emailConfig, accountId, maxEmails = 5) => {
    const attachments = [];
    const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

    const client = new ImapFlow({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.tls || emailConfig.ssl,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.password,
        },
        logger: false,
    });

    try {
        logger.info(`[EmailWorker] [Account ${accountId}] Connecting to email server...`);
        await client.connect();

        // Lock mailbox to safely fetch messages
        const lock = await client.getMailboxLock('INBOX');
        try {
            // Fetch unread emails
            const messages = await client.search({ seen: false }, { sort: ['UID'] });
            const latestMessages = messages.slice(-maxEmails);

            logger.info(
                `[EmailWorker] [Account ${accountId}] Found ${latestMessages.length} unread emails`
            );

            for (const msgId of latestMessages) {
                try {
                    const message = await client.fetchOne(msgId, { source: true });
                    const parsed = await simpleParser(message.source);

                    if (parsed.attachments.length > 0) {
                        for (const att of parsed.attachments) {
                            const filename = att.filename ? att.filename.toLowerCase() : '';
                            const isSupported = supportedExtensions.some(ext => filename.endsWith(ext));

                            if (!isSupported) {
                                logger.debug(`[EmailWorker] [Account ${accountId}] Skipping unsupported attachment: ${att.filename}`);
                                continue;
                            }

                            // Skip large files >10MB
                            if (att.size > 10 * 1024 * 1024) {
                                logger.warn(
                                    `[EmailWorker] [Account ${accountId}] Attachment too large: ${att.filename}`
                                );
                                continue;
                            }

                            attachments.push({
                                name: att.filename,
                                data: att.content,
                            });
                            logger.info(
                                `[EmailWorker] [Account ${accountId}] Queued attachment for OCR: ${att.filename},att.content.length: ${att.content.length} bytes`
                            );
                        }
                    }
                } catch (err) {
                    logger.error(
                        `[EmailWorker] [Account ${accountId}] Failed to process message ${msgId}: ${err.message}`
                    );
                }
            }
        } finally {
            lock.release();
        }
    } catch (err) {
        logger.error(`[EmailWorker] [Account ${accountId}] Email sync failed: ${err.message}`);
    } finally {
        if (!client.isClosed) {
            await client.logout();
        }
    }

    return attachments;
};
