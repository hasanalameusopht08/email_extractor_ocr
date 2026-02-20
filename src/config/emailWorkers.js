import { ImapFlow } from 'imapflow';
import logger from '../utils/logger.js';
import { addLog, createLogFile } from '../utils/logFile.js';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getEmailAccountsForSync } from '../services/email.service.js';

dotenv.config();

const processMessage = async (client, msgId, userId, logPath) => {
    try {
        const message = await client.fetchOne(msgId, { envelope: true, source: true });

        await addLog(logPath, `Processing message: [${message.envelope.subject}]`, {
            from: message.envelope.from[0]?.address,
            date: message.envelope.date
        });

        const parsed = await simpleParser(message.source);

        // storage/{userId}/{emailUid}
        const attachmentsDir = path.join(
            'storage',
            userId.toString(),
            msgId.toString()
        );

        await fs.promises.mkdir(attachmentsDir, { recursive: true });

        if (parsed.attachments.length > 0) {
            for (const att of parsed.attachments) {

                // Basic size validation (10MB limit example)
                if (att.size > 10 * 1024 * 1024) {
                    await addLog(logPath, `Attachment too large: ${att.filename}`, null, 'WARN');
                    continue;
                }

                // const ext = path.extname(att.filename || '');
                // const storedName = crypto.randomUUID() + '_' + att.filename;
                const storedName = att.filename;
                const filePath = path.join(attachmentsDir, storedName);
                // Prevent duplicate files
                if (fs.existsSync(filePath)) {
                    await addLog(logPath, `Skipped duplicate attachment: ${att.filename}`, null, 'WARN');
                    continue;
                }

                await fs.promises.writeFile(filePath, att.content);

                await addLog(logPath, `Saved attachment`, {
                    originalName: att.filename,
                    storedName,
                    size: att.size
                });
            }
        } else {
            await addLog(logPath, 'No attachments found in this email');
        }

    } catch (error) {
        await addLog(logPath, `Failed to process message ID ${msgId}`, error, 'ERROR');
    }
};

/**
 * Fetch emails for a single account
 */
export const fetchEmailsForAccount = async (account) => {
    const logPath = createLogFile(`Email_Worker_User_${account.userId}`);

    const client = new ImapFlow({
        host: account.host,
        port: account.port,
        secure: true,
        auth: {
            user: account.user,
            pass: account.pass
        },
        logger: false
    });

    try {
        await addLog(logPath, 'Connecting to email server');
        await client.connect();

        const lock = await client.getMailboxLock('INBOX');
        try {
            const allMessages = await client.search({}, { sort: ['UID'] });

            const latestFive = allMessages.slice(-5);

            await addLog(logPath, `Processing ${latestFive.length} messages`);

            for (const msgId of latestFive) {
                await processMessage(client, msgId, account.userId, logPath);
            }

        } finally {
            lock.release();
        }

    } catch (error) {
        await addLog(logPath, 'Critical error during sync', error, 'ERROR');
        logger.error(`Email Sync Failed: ${error.stack || error}`);
    } finally {
        try {
            if (!client.isClosed) {
                await client.logout();
                await addLog(logPath, 'Safe logout performed');
            }
        } catch (err) {
            await addLog(logPath, 'Logout error encountered', err, 'ERROR');
        }
    }
};

/**
 * Main Worker – handles multiple email accounts
 */
export const fetchEmails = async () => {
    const masterLogPath = createLogFile('Email_Worker_Master');

    try {
        const EMAIL_ACCOUNTS = await getEmailAccountsForSync();

        await addLog(masterLogPath, `Found ${EMAIL_ACCOUNTS.length} accounts to sync`);

        for (const account of EMAIL_ACCOUNTS) {
            const accountForProcess = {
                userId: account.account_id,
                host: account.host,
                port: parseInt(account.port, 10) || 993,
                user: account.user,
                pass: account.password
            };

            await fetchEmailsForAccount(accountForProcess);
        }

        // ✅ SUCCESS LOG
        await addLog(masterLogPath, 'All email accounts processed successfully ✅');

        console.log('All emails processed successfully. Exiting...');

    } catch (error) {
        await addLog(masterLogPath, 'Fatal error in Email Worker', error, 'ERROR');
        console.error('Email worker failed:', error);
    }
};

