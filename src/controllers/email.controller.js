import * as emailService from '../services/email.service.js';

export const registerEmail = async (req, res) => {
    try {

        const { callback, email_account } = req.body;
        if (!callback || !email_account) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request body'
            });
        }

        const { host, port, user, password, tls, ssl } = email_account;
        if (!host || !port || !user || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required email fields'
            });
        }

        const emailExists = await emailService.getUserByEmail(email_account.user, callback);
        if (emailExists.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const storedEmail = await emailService.storeEmail(callback, email_account.host, email_account.port, email_account.user, email_account.password, email_account.tls, email_account.ssl);
        if (!storedEmail) {
            return res.status(500).json({ success: false, message: 'Failed to store email account' });
        }

        res.status(200).json({
            success: true,
            message: "Email account registered successfully. Emails will be processed shortly.",
            status: "ACTIVE"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteEmail = async (req, res) => {
    try {
        const { callback, email_account } = req.body;
        if (!callback || !email_account) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request body'
            });
        }

        const { user } = email_account;
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Missing required email fields'
            });
        }

        const emailExists = await emailService.getUserByEmail(email_account.user, callback);
        if (!emailExists || emailExists.length === 0) {
            return res.status(400).json({ success: false, message: 'User does not exist' });
        }

        const updateStatusToInactive = await emailService.updateEmailAccountStatusToInactive(email_account.user, callback);
        if (!updateStatusToInactive) {
            return res.status(500).json({ success: false, message: 'Failed to delete email account' });
        }

        res.status(200).json({
            success: true,
            message: "Email account unregistered successfully. No further invoices will be processed.",
            status: "INACTIVE"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};